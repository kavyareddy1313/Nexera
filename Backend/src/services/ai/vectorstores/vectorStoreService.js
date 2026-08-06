import { Document } from '@langchain/core/documents';

/**
 * BaseVectorStoreService
 * Abstract contract for Nexera AI vector databases.
 * Allows swapping Supabase pgvector with alternative vector stores without touching calling code.
 */
export class BaseVectorStoreService {
  /**
   * Add chunked LangChain Documents to vector store
   * @param {Document[]} documents - Array of LangChain Document objects
   * @param {Object} [options]
   * @returns {Promise<string[]|number[]>} - Array of inserted document IDs
   */
  async addDocuments(documents, options = {}) {
    throw new Error('Method "addDocuments()" must be implemented by subclass.');
  }

  /**
   * Perform similarity search on vector store using text query
   * @param {string} query - Natural language search query
   * @param {number} [k=5] - Number of top results to return
   * @param {Object} [filter={}] - Metadata filter (e.g. { userId, workspaceId })
   * @returns {Promise<Document[]>} - Top matching Document instances
   */
  async similaritySearch(query, k = 5, filter = {}) {
    throw new Error('Method "similaritySearch()" must be implemented by subclass.');
  }

  /**
   * Perform similarity search returning Documents with similarity scores [doc, score]
   * @param {string} query - Natural language search query
   * @param {number} [k=5] - Number of top results to return
   * @param {Object} [filter={}] - Metadata filter
   * @returns {Promise<Array<[Document, number]>>}
   */
  async similaritySearchWithScore(query, k = 5, filter = {}) {
    throw new Error('Method "similaritySearchWithScore()" must be implemented by subclass.');
  }

  /**
   * Delete documents from vector store matching a filter or array of IDs
   * @param {Object} params - { ids, filter }
   * @returns {Promise<boolean>}
   */
  async deleteDocuments(params = {}) {
    throw new Error('Method "deleteDocuments()" must be implemented by subclass.');
  }
}
