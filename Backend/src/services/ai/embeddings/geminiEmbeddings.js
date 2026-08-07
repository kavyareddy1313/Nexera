import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { BaseEmbeddingsProvider } from './baseEmbeddings.js';
import { aiConfig } from '../../../config/ai.config.js';

/**
 * GeminiEmbeddingsProvider
 * Wraps Google Gemini embedding models (default: text-embedding-004, 768 dims).
 */
export class GeminiEmbeddingsProvider extends BaseEmbeddingsProvider {
  constructor(options = {}) {
    const apiKey =
      options.apiKey ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      throw new Error(
        'Gemini API key is missing. Set GEMINI_API_KEY in your environment variables.'
      );
    }

    const modelName =
      options.modelName ||
      aiConfig.embeddings.gemini.model ||
      'text-embedding-004';

    super({
      ...options,
      dimensions: options.dimensions || aiConfig.embeddings.gemini.dimensions || 768,
    });

    this.model = new GoogleGenerativeAIEmbeddings({
      apiKey,
      modelName,
      maxRetries: 3,
    });
  }

  getInstance() {
    return this.model;
  }

  async embedDocuments(texts) {
    if (!texts || texts.length === 0) return [];
    return await this.model.embedDocuments(texts);
  }

  async embedQuery(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('Search query for embedding must be a non-empty string.');
    }
    return await this.model.embedQuery(text);
  }
}
