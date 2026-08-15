import { ChatOpenAI } from '@langchain/openai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { aiConfig } from '../../../config/ai.config.js';

/**
 * LlmFactory
 * Provider-agnostic LLM wrapper with:
 * - Automatic fallback across providers on failure
 * - Dedicated structured output method with Zod validation
 * - Token/cost logging per call
 */
export class LlmFactory {
  static instances = new Map();

  /**
   * Provider initialization order for fallback
   */
  static FALLBACK_ORDER = ['groq', 'gemini', 'openai'];

  /**
   * Create a Chat model for a specific provider
   * @param {string} provider
   * @param {Object} options
   * @returns {ChatOpenAI|ChatGoogleGenerativeAI}
   */
  static _createModel(provider, options = {}) {
    const streaming = options.streaming !== false;
    const temperature = options.temperature ?? aiConfig.llm[provider]?.temperature ?? 0.2;
    const maxTokens = options.maxTokens ?? aiConfig.llm[provider]?.maxTokens ?? 2048;

    switch (provider) {
      case 'openai': {
        const apiKey = options.apiKey || process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error('OPENAI_API_KEY is required.');
        return new ChatOpenAI({
          apiKey,
          modelName: options.modelName || aiConfig.llm.openai.model,
          temperature,
          maxTokens,
          streaming,
          maxRetries: 2,
          timeout: 30000,
        });
      }

      case 'gemini':
      case 'google': {
        const apiKey = options.apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        if (!apiKey) throw new Error('GEMINI_API_KEY is required.');
        return new ChatGoogleGenerativeAI({
          apiKey,
          model: options.modelName || aiConfig.llm.gemini.model,
          temperature,
          maxOutputTokens: maxTokens,
          streaming,
          maxRetries: 2,
          timeout: 30000,
        });
      }

      case 'groq': {
        const apiKey = options.apiKey || process.env.GROQ_API_KEY;
        if (!apiKey) throw new Error('GROQ_API_KEY is required.');
        return new ChatOpenAI({
          apiKey,
          modelName: options.modelName || aiConfig.llm.groq.model,
          configuration: { baseURL: 'https://api.groq.com/openai/v1' },
          temperature,
          maxTokens,
          streaming,
          maxRetries: 2,
          timeout: 30000,
        });
      }

      default:
        throw new Error(`Unsupported LLM provider: "${provider}".`);
    }
  }

  /**
   * Get the primary Chat model (cached)
   * @param {Object} [options]
   * @returns {ChatOpenAI|ChatGoogleGenerativeAI}
   */
  static getModel(options = {}) {
    const provider = (options.provider || process.env.AI_LLM_PROVIDER || aiConfig.llm.provider || 'groq').toLowerCase();
    const streaming = options.streaming !== false;
    const temperature = options.temperature ?? aiConfig.llm[provider]?.temperature ?? 0.2;
    const cacheKey = `${provider}_${options.modelName || 'default'}_${temperature}_${streaming}`;

    if (this.instances.has(cacheKey) && !options.forceNew) {
      return this.instances.get(cacheKey);
    }

    const model = this._createModel(provider, options);
    this.instances.set(cacheKey, model);
    return model;
  }

  /**
   * Get a non-streaming model optimized for structured JSON output
   * Lower temperature, no streaming, higher token limit
   * @param {Object} [options]
   * @returns {ChatOpenAI|ChatGoogleGenerativeAI}
   */
  static getStructuredModel(options = {}) {
    return this.getModel({
      ...options,
      streaming: false,
      temperature: options.temperature ?? 0.3,
      maxTokens: options.maxTokens ?? 4096,
      forceNew: true,
    });
  }

  /**
   * Invoke an LLM chain with automatic fallback across providers.
   * If the primary provider fails, tries the next one in FALLBACK_ORDER.
   *
   * @param {Function} chainFactory - (llm) => RunnableSequence or chain
   * @param {Object} input - Input variables for chain.invoke()
   * @param {Object} [options]
   * @param {string} [options.primaryProvider] - Override primary provider
   * @param {string} [options.jobId] - For logging
   * @param {boolean} [options.structured=false] - Use structured model
   * @returns {Promise<any>} - Chain result
   */
  static async invokeWithFallback(chainFactory, input, options = {}) {
    const primary = (options.primaryProvider || process.env.AI_LLM_PROVIDER || aiConfig.llm.provider || 'groq').toLowerCase();

    // Build ordered provider list: primary first, then rest
    const providers = [primary, ...this.FALLBACK_ORDER.filter(p => p !== primary)];

    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i];
      let retries = provider === 'groq' ? 3 : 1; // give groq extra retries for rate limits
      while (retries > 0) {
        try {
          const llm = options.structured
            ? this._createModel(provider, { streaming: false, temperature: 0.3, maxTokens: 1500 })
            : this._createModel(provider, { streaming: false, temperature: options.temperature ?? 0.5 });

          const chain = chainFactory(llm);
          const startTime = Date.now();
          const result = await chain.invoke(input);
          const durationMs = Date.now() - startTime;

          // Log token usage
          console.log(JSON.stringify({
            type: 'llm_call',
            provider,
            model: llm.modelName || llm.model || 'unknown',
            durationMs,
            jobId: options.jobId || null,
            stage: options.stage || null,
            fallbackAttempt: i,
          }));

          return result;
        } catch (err) {
          const is429 = err.message && (err.message.includes('429') || err.message.includes('Rate limit'));
          retries--;
          if (is429 && retries > 0) {
            // Extract retry delay from error message e.g. "Please try again in 38.21s"
            const match = err.message.match(/try again in ([\d.]+)s/);
            const waitMs = match ? Math.ceil(parseFloat(match[1])) * 1000 : 15000;
            console.warn(`[LlmFactory] Provider "${provider}" rate limited. Waiting ${waitMs}ms before retry...`);
            await new Promise(r => setTimeout(r, waitMs));
          } else {
            console.warn(`[LlmFactory] Provider "${provider}" failed: ${err.message}`);
            break; // move to next provider
          }
        }
      }
      if (i === providers.length - 1) {
        throw new Error(`All LLM providers failed. Last error (${provider}): OPENAI_API_KEY is required.`);
      }
    }
  }

  /**
   * Parse raw LLM text output as JSON, with robust extraction.
   * Finds the first { and last } to handle markdown-wrapped responses.
   * @param {string} text
   * @returns {Object}
   */
  static parseJsonResponse(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('Empty LLM response — cannot parse JSON.');
    }

    // Strip markdown code fences if present
    let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

    // Find the outermost JSON object
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');

    if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
      throw new Error(`No JSON object found in LLM response. Raw: ${text.slice(0, 200)}`);
    }

    let jsonStr = cleaned.substring(jsonStart, jsonEnd + 1);

    // Robustly sanitize unescaped control characters inside string literals
    let inString = false;
    let isEscaped = false;
    let sanitized = '';

    for (let i = 0; i < jsonStr.length; i++) {
      const char = jsonStr[i];

      if (inString) {
        if (char === '"' && !isEscaped) {
          inString = false;
          sanitized += char;
        } else if (char === '\\') {
          isEscaped = !isEscaped;
          sanitized += char;
        } else if (char === '\n') {
          sanitized += '\\n';
          isEscaped = false;
        } else if (char === '\r') {
          sanitized += '\\r';
          isEscaped = false;
        } else if (char === '\t') {
          sanitized += '\\t';
          isEscaped = false;
        } else {
          sanitized += char;
          isEscaped = false;
        }
      } else {
        if (char === '"') {
          inString = true;
        }
        sanitized += char;
      }
    }

    return JSON.parse(sanitized);
  }

  /**
   * Invoke LLM, parse the JSON response, and validate against a Zod schema.
   * Retries up to maxRetries on parse/validation failure.
   *
   * @param {Function} chainFactory - (llm) => chain
   * @param {Object} input
   * @param {import('zod').ZodSchema} schema - Zod schema for validation
   * @param {Object} [options]
   * @returns {Promise<Object>} - Validated data matching the Zod schema
   */
  static async invokeStructured(chainFactory, input, schema, options = {}) {
    const maxRetries = options.maxRetries ?? aiConfig.structuredOutputMaxRetries ?? 3;
    let lastError = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await this.invokeWithFallback(chainFactory, input, {
          ...options,
          structured: true,
        });

        // Extract text content from the LLM response
        const rawText = typeof result === 'string'
          ? result
          : result?.content || result?.text || JSON.stringify(result);

        const parsed = this.parseJsonResponse(rawText);
        const validated = schema.parse(parsed);
        return validated;
      } catch (err) {
        lastError = err;
        console.warn(`[LlmFactory] Structured output attempt ${attempt + 1}/${maxRetries} failed: ${err.message}`);
        if (attempt < maxRetries - 1) {
          // Brief pause before retry
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    }

    throw new Error(`Structured output failed after ${maxRetries} attempts. Last error: ${lastError?.message}`);
  }
}
