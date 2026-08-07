/**
 * BaseEmbeddingsProvider
 * Abstract interface for Nexera AI embedding models.
 */
export class BaseEmbeddingsProvider {
  constructor(options = {}) {
    this.options = options;
  }

  /**
   * Get underlying LangChain Embeddings instance
   * @returns {import('@langchain/core/embeddings').Embeddings}
   */
  getInstance() {
    throw new Error('Method "getInstance()" must be implemented by subclass.');
  }

  /**
   * Embed multiple document texts in batch
   * @param {string[]} texts - Array of string chunks
   * @returns {Promise<number[][]>} - Array of float vector embeddings
   */
  async embedDocuments(texts) {
    throw new Error('Method "embedDocuments()" must be implemented by subclass.');
  }

  /**
   * Embed a single search query string
   * @param {string} text - User query
   * @returns {Promise<number[]>} - Float vector embedding
   */
  async embedQuery(text) {
    throw new Error('Method "embedQuery()" must be implemented by subclass.');
  }

  /**
   * Return vector dimensionality
   * @returns {number}
   */
  getDimensions() {
    return this.options.dimensions || 768;
  }
}
