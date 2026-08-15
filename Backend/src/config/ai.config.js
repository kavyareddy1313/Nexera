/**
 * Nexera AI Configuration Defaults
 */
export const aiConfig = {
  llm: {
    provider: process.env.AI_LLM_PROVIDER || process.env.LLM_PROVIDER || 'gemini', // 'openai' | 'gemini' | 'groq'
    openai: {
      model: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
      temperature: 0.2,
      maxTokens: 2048,
    },
    gemini: {
      model: process.env.GEMINI_CHAT_MODEL || process.env.GEMINI_MODEL || 'gemini-2.0-flash',
      temperature: 0.2,
      maxTokens: 2048,
    },
    groq: {
      model: process.env.GROQ_CHAT_MODEL || process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
      temperature: 0.2,
      maxTokens: 1024,
    },
  },
  // Structured output retries (JSON parsing + Zod validation)
  structuredOutputMaxRetries: 3,
  embeddings: {
    provider: process.env.AI_EMBEDDING_PROVIDER || 'gemini', // 'openai' | 'gemini'
    openai: {
      model: process.env.AI_EMBEDDING_MODEL || 'text-embedding-3-small',
      dimensions: 1536,
    },
    gemini: {
      model: process.env.AI_EMBEDDING_MODEL || 'text-embedding-004',
      dimensions: 768,
    },
  },
  chunking: {
    defaultStrategy: 'recursive', // 'recursive' | 'fixed' | 'sentence' | 'paragraph'
    chunkSize: parseInt(process.env.CHUNK_SIZE, 10) || 800,
    chunkOverlap: parseInt(process.env.CHUNK_OVERLAP, 10) || 100,
    minChunkSize: 50,
  },
  vectorStore: {
    provider: process.env.VECTOR_STORE_PROVIDER || 'supabase_pgvector',
    tableName: 'documents',
    queryName: 'match_documents',
    topK: 5,
    similarityThreshold: 0.65,
  },
  courseGeneration: {
    defaultModuleCount: 4,
    defaultLessonsPerModule: 3,
    defaultQuizzesPerLesson: 3,
    defaultLanguage: 'English',
  },
};
