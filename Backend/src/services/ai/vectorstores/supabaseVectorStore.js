import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { Document } from '@langchain/core/documents';
import { BaseVectorStoreService } from './vectorStoreService.js';
import { supabaseAdmin } from '../../../config/supabaseClient.js';
import { EmbeddingService } from '../embeddings/embeddingService.js';
import { aiConfig } from '../../../config/ai.config.js';

/**
 * SupabasePgVectorStore
 * Production vector store implementation using Supabase pgvector and LangChain.
 */
export class SupabasePgVectorStore extends BaseVectorStoreService {
  constructor(options = {}) {
    super();
    this.client = options.client || supabaseAdmin;
    this.tableName = options.tableName || aiConfig.vectorStore.tableName || 'documents';
    this.queryName = options.queryName || aiConfig.vectorStore.queryName || 'match_documents';
    this.embeddings = options.embeddings || EmbeddingService.getLangChainModel();

    this.vectorStore = new SupabaseVectorStore(this.embeddings, {
      client: this.client,
      tableName: this.tableName,
      queryName: this.queryName,
    });
  }

  /**
   * Add chunked documents to Supabase pgvector
   * @param {Document[]} documents
   * @param {Object} [options]
   * @returns {Promise<string[]|number[]>}
   */
  async addDocuments(documents, options = {}) {
    if (!Array.isArray(documents) || documents.length === 0) {
      return [];
    }

    // Attach user_id and workspace_id to each document's metadata
    const preparedDocs = documents.map((doc) => {
      const metadata = {
        ...doc.metadata,
        userId: options.userId || doc.metadata.userId || null,
        workspaceId: options.workspaceId || doc.metadata.workspaceId || null,
        indexedAt: new Date().toISOString(),
      };

      return new Document({
        pageContent: doc.pageContent,
        metadata,
      });
    });

    try {
      return await this.vectorStore.addDocuments(preparedDocs);
    } catch (error) {
      console.warn(`[VectorStore] Supabase vector insert skipped/failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Similarity search using natural language query
   * @param {string} query
   * @param {number} [k=5]
   * @param {Object} [filter={}]
   * @returns {Promise<Document[]>}
   */
  async similaritySearch(query, k = 5, filter = {}) {
    try {
      return await this.vectorStore.similaritySearch(query, k, filter);
    } catch (error) {
      throw new Error(`Vector similarity search failed: ${error.message}`);
    }
  }

  /**
   * Similarity search returning documents paired with similarity score [doc, score]
   * @param {string} query
   * @param {number} [k=5]
   * @param {Object} [filter={}]
   * @returns {Promise<Array<[Document, number]>>}
   */
  async similaritySearchWithScore(query, k = 5, filter = {}) {
    try {
      return await this.vectorStore.similaritySearchWithScore(query, k, filter);
    } catch (error) {
      throw new Error(`Vector similarity search with score failed: ${error.message}`);
    }
  }

  /**
   * Convert vector store into a LangChain Retriever
   * @param {Object} [options]
   * @param {number} [options.k=5]
   * @param {Object} [options.filter]
   * @returns {import('@langchain/core/retrievers').BaseRetriever}
   */
  asRetriever(options = {}) {
    const k = options.k || aiConfig.vectorStore.topK || 5;
    const filter = options.filter || {};
    return this.vectorStore.asRetriever({ k, filter });
  }

  /**
   * Delete documents matching a filter (e.g. by documentId, fileName, or userId)
   * @param {Object} params - { documentId, fileName, userId, ids }
   * @returns {Promise<boolean>}
   */
  async deleteDocuments({ documentId, fileName, userId, ids } = {}) {
    try {
      let query = this.client.from(this.tableName).delete();

      if (ids && Array.isArray(ids) && ids.length > 0) {
        query = query.in('id', ids);
      } else if (documentId && userId) {
        query = query
          .eq('user_id', userId)
          .contains('metadata', { documentId });
      } else if (fileName && userId) {
        query = query
          .eq('user_id', userId)
          .contains('metadata', { fileName });
      } else if (documentId) {
        query = query.contains('metadata', { documentId });
      } else if (fileName) {
        query = query.contains('metadata', { fileName });
      } else if (userId) {
        query = query.eq('user_id', userId);
      } else {
        throw new Error('Deletion requires either ids, documentId, fileName, or userId.');
      }

      const { error } = await query;
      if (error) throw error;
      return true;
    } catch (error) {
      throw new Error(`Failed to delete vectors from Supabase: ${error.message}`);
    }
  }
}

/**
 * Singleton factory for default VectorStore
 */
let defaultVectorStoreInstance = null;

export function getVectorStore(options = {}) {
  if (!defaultVectorStoreInstance || options.forceNew) {
    defaultVectorStoreInstance = new SupabasePgVectorStore(options);
  }
  return defaultVectorStoreInstance;
}
