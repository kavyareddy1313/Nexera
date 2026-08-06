-- Migration 008: AI Conversational Memory and Sessions Table

CREATE TABLE IF NOT EXISTS public.ai_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indices for fast session lookups and chronology
CREATE INDEX IF NOT EXISTS idx_ai_chat_session ON public.ai_chat_messages (session_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_ai_chat_user ON public.ai_chat_messages (user_id);

-- Enable RLS
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;

-- Service role full access policy
CREATE POLICY "Allow service role full access to ai_chat_messages"
    ON public.ai_chat_messages
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Authenticated users access their own conversation records
CREATE POLICY "Users can access their own AI messages"
    ON public.ai_chat_messages
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
