-- ==========================================================
-- Migration: 006_hybrid_search.sql
-- Description: Add Full-Text Search (tsvector) index and
--              keyword_search_documents RPC function for hybrid RAG
-- ==========================================================

-- 1. Create GIN index on documents content for full-text search
CREATE INDEX IF NOT EXISTS idx_documents_content_fts 
ON public.documents 
USING gin (to_tsvector('english', content));

-- 2. Create RPC function for sparse keyword search
CREATE OR REPLACE FUNCTION public.keyword_search_documents (
    search_query TEXT,
    match_count INT DEFAULT 5,
    filter JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (
    id BIGINT,
    content TEXT,
    metadata JSONB,
    rank REAL
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
        ts_rank_cd(to_tsvector('english', d.content), websearch_to_tsquery('english', search_query)) AS rank
    FROM public.documents d
    WHERE 
        to_tsvector('english', d.content) @@ websearch_to_tsquery('english', search_query)
        AND (filter = '{}'::jsonb OR d.metadata @> filter)
    ORDER BY rank DESC
    LIMIT match_count;
END;
$$;
