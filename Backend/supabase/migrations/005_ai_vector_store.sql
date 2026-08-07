-- ==========================================================
-- Migration: 005_ai_vector_store.sql
-- Description: Enable pgvector, documents table, HNSW indexes,
--              and match_documents similarity search function
-- ==========================================================

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create documents table for chunked knowledge base vectors
-- Note: vector(768) matches Gemini text-embedding-004. If using OpenAI (1536), vector(1536) can be used.
CREATE TABLE IF NOT EXISTS public.documents (
    id BIGSERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    embedding VECTOR(768),
    user_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create HNSW index for ultra-fast approximate nearest neighbor (ANN) cosine search
CREATE INDEX IF NOT EXISTS idx_documents_embedding_hnsw 
ON public.documents 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 4. Create GIN index on metadata for fast JSONB metadata filtering (by user, workspace, file)
CREATE INDEX IF NOT EXISTS idx_documents_metadata_gin 
ON public.documents 
USING gin (metadata);

-- 5. Create B-Tree index on user_id for tenant segmentation
CREATE INDEX IF NOT EXISTS idx_documents_user_id 
ON public.documents (user_id);

-- 6. Create RPC function for cosine similarity search with JSONB metadata filtering
CREATE OR REPLACE FUNCTION public.match_documents (
    query_embedding VECTOR,
    match_count INT DEFAULT 5,
    filter JSONB DEFAULT '{}'::jsonb
) 
RETURNS TABLE (
    id BIGINT,
    content TEXT,
    metadata JSONB,
    similarity FLOAT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id,
        d.content,
        d.metadata,
        1 - (d.embedding <=> query_embedding) AS similarity
    FROM public.documents d
    WHERE 
        -- If filter is empty JSON ({}), match all; otherwise require metadata containment
        (filter = '{}'::jsonb OR d.metadata @> filter)
    ORDER BY d.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- 7. Enable Row Level Security (RLS)
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 8. Policy: Users can read their own documents or public documents
CREATE POLICY "Users can read their own documents"
ON public.documents
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()::text 
    OR (metadata->>'isPublic')::boolean = true
);

-- 9. Policy: Users can insert their own documents
CREATE POLICY "Users can insert their own documents"
ON public.documents
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid()::text);

-- 10. Policy: Users can delete their own documents
CREATE POLICY "Users can delete their own documents"
ON public.documents
FOR DELETE
TO authenticated
USING (user_id = auth.uid()::text);
