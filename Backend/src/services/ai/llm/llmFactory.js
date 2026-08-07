import { ChatOpenAI } from '@langchain/openai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { aiConfig } from '../../../config/ai.config.js';

/**
 * LlmFactory
 * Manages Chat LLM instances (OpenAI GPT-4o-mini & Google Gemini 1.5 Flash)
 * with streaming, fallback retry, and token constraints.
 */
export class LlmFactory {
  static instances = new Map();

  /**
   * Create or return a cached Chat model
   * @param {Object} [options]
   * @param {string} [options.provider] - 'gemini' | 'openai'
   * @param {string} [options.modelName]
   * @param {number} [options.temperature]
   * @param {number} [options.maxTokens]
   * @param {boolean} [options.streaming=true]
   * @returns {ChatOpenAI|ChatGoogleGenerativeAI}
   */
  static getModel(options = {}) {
    const provider = (
      options.provider ||
      aiConfig.llm.provider ||
      'gemini'
    ).toLowerCase();

    const streaming = options.streaming !== false;
    const temperature = options.temperature ?? aiConfig.llm[provider]?.temperature ?? 0.2;
    const maxTokens = options.maxTokens ?? aiConfig.llm[provider]?.maxTokens ?? 2048;

    const cacheKey = `${provider}_${options.modelName || 'default'}_${temperature}_${streaming}`;

    if (this.instances.has(cacheKey) && !options.forceNew) {
      return this.instances.get(cacheKey);
    }

    let model;
    switch (provider) {
      case 'openai': {
        const apiKey = options.apiKey || process.env.OPENAI_API_KEY;
        if (!apiKey) {
          throw new Error('OPENAI_API_KEY is required to initialize ChatOpenAI.');
        }
        model = new ChatOpenAI({
          openAIApiKey: apiKey,
          modelName: options.modelName || aiConfig.llm.openai.model || 'gpt-4o-mini',
          temperature,
          maxTokens,
          streaming,
          maxRetries: 3,
        });
        break;
      }

      case 'gemini':
      case 'google': {
        const apiKey =
          options.apiKey ||
          process.env.GEMINI_API_KEY ||
          process.env.GOOGLE_API_KEY;
        if (!apiKey) {
          throw new Error('GEMINI_API_KEY is required to initialize ChatGoogleGenerativeAI.');
        }
        model = new ChatGoogleGenerativeAI({
          apiKey,
          modelName: options.modelName || aiConfig.llm.gemini.model || 'gemini-1.5-flash',
          temperature,
          maxOutputTokens: maxTokens,
          streaming,
          maxRetries: 3,
        });
        break;
      }

      default:
        throw new Error(
          `Unsupported LLM provider: "${provider}". Choose "gemini" or "openai".`
        );
    }

    this.instances.set(cacheKey, model);
    return model;
  }
}
