import { OpenAIEmbeddings } from '@langchain/openai';
import { BaseEmbeddingsProvider } from './baseEmbeddings.js';
import { aiConfig } from '../../../config/ai.config.js';

/**
 * OpenAiEmbeddingsProvider
 * Wraps OpenAI embedding models (default: text-embedding-3-small, 1536 dims).
 */
export class OpenAiEmbeddingsProvider extends BaseEmbeddingsProvider {
  constructor(options = {}) {
    const apiKey = options.apiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'OpenAI API key is missing. Set OPENAI_API_KEY in your environment variables.'
      );
    }

    const modelName =
      options.modelName ||
      aiConfig.embeddings.openai.model ||
      'text-embedding-3-small';

    super({
      ...options,
      dimensions: options.dimensions || aiConfig.embeddings.openai.dimensions || 1536,
    });

    this.model = new OpenAIEmbeddings({
      openAIApiKey: apiKey,
      modelName,
      dimensions: this.options.dimensions,
      stripNewLines: true,
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
