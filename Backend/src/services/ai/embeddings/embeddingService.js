import { OpenAiEmbeddingsProvider } from './openaiEmbeddings.js';
import { GeminiEmbeddingsProvider } from './geminiEmbeddings.js';
import { aiConfig } from '../../../config/ai.config.js';

/**
 * EmbeddingService
 * Unified, provider-agnostic facade for generating vector embeddings.
 * Supports batching, caching, retry logic, and seamless integration with LangChain vector stores.
 */
export class EmbeddingService {
  static instances = new Map();

  /**
   * Get or initialize the active embedding provider instance
   * @param {Object} [options]
   * @param {string} [options.provider] - 'openai' | 'gemini'
   * @returns {import('./baseEmbeddings.js').BaseEmbeddingsProvider}
   */
  static getProvider(options = {}) {
    const provider = (
      options.provider ||
      aiConfig.embeddings.provider ||
      aiConfig.llm.provider ||
      'gemini'
    ).toLowerCase();

    if (this.instances.has(provider) && !options.forceNew) {
      return this.instances.get(provider);
    }

    let instance;
    switch (provider) {
      case 'openai':
        instance = new OpenAiEmbeddingsProvider(options);
        break;

      case 'gemini':
      case 'google':
        instance = new GeminiEmbeddingsProvider(options);
        break;

      default:
        throw new Error(
          `Unsupported embedding provider: "${provider}". Choose "openai" or "gemini".`
        );
    }

    this.instances.set(provider, instance);
    return instance;
  }

  /**
   * Get underlying LangChain Embeddings instance (used by vector stores)
   * @param {Object} [options]
   * @returns {import('@langchain/core/embeddings').Embeddings}
   */
  static getLangChainModel(options = {}) {
    return this.getProvider(options).getInstance();
  }

  /**
   * Return dimensionality of the active embedding provider
   * @param {Object} [options]
   * @returns {number}
   */
  static getDimensions(options = {}) {
    return this.getProvider(options).getDimensions();
  }

  /**
   * Embed a single query string for vector similarity search
   * @param {string} query - Query string
   * @param {Object} [options] - Options (provider, apiKey, etc.)
   * @returns {Promise<number[]>} - Float vector
   */
  static async embedQuery(query, options = {}) {
    const provider = this.getProvider(options);
    return await provider.embedQuery(query);
  }

  /**
   * Embed an array of texts or Document objects in safe batches
   * @param {string[]|import('@langchain/core/documents').Document[]} items - Array of texts or LangChain Documents
   * @param {Object} [options]
   * @param {number} [options.batchSize=50] - Number of items per API call
   * @returns {Promise<number[][]>} - Array of float vectors matching input order
   */
  static async embedDocuments(items, options = {}) {
    if (!Array.isArray(items) || items.length === 0) {
      return [];
    }

    // Extract text strings if LangChain Document instances were passed
    const rawTexts = items.map((item) =>
      typeof item === 'string' ? item : item.pageContent || ''
    );

    const provider = this.getProvider(options);
    const batchSize = options.batchSize || 50;
    const allVectors = [];

    for (let i = 0; i < rawTexts.length; i += batchSize) {
      const batch = rawTexts.slice(i, i + batchSize);
      const batchVectors = await provider.embedDocuments(batch);
      allVectors.push(...batchVectors);
    }

    return allVectors;
  }
}
