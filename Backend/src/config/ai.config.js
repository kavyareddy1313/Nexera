/**
 * Nexera AI Configuration Defaults
 */
export const aiConfig = {
  llm: {
    provider: process.env.AI_LLM_PROVIDER || 'gemini', // 'openai' | 'gemini'
    openai: {
      model: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
      temperature: 0.2,
      maxTokens: 2048,
    },
    gemini: {
      model: process.env.GEMINI_CHAT_MODEL || 'gemini-1.5-flash',
      temperature: 0.2,
      maxTokens: 2048,
    },
  },
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
    chunkSize: parseInt(process.env.CHUNK_SIZE, 10) || 1000,
    chunkOverlap: parseInt(process.env.CHUNK_OVERLAP, 10) || 200,
    minChunkSize: 50,
  },
  vectorStore: {
    provider: process.env.VECTOR_STORE_PROVIDER || 'supabase_pgvector',
    tableName: 'documents',
    queryName: 'match_documents',
    topK: 5,
    similarityThreshold: 0.65,
  },
};
