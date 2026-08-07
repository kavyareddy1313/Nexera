import { StringOutputParser } from '@langchain/core/output_parsers';
import { summarizerPromptTemplate, whiteboardPromptTemplate } from './prompts.js';
import { LlmFactory } from '../llm/llmFactory.js';

/**
 * SummarizerChainService
 * Handles meeting notes summarization, chat digest generation,
 * and whiteboard canvas AI assistance.
 */
export class SummarizerChainService {
  /**
   * Summarize meeting or chat transcripts
   * @param {string} transcript - Full transcript or chat text
   * @param {Object} [options] - LLM options
   * @returns {Promise<string>}
   */
  static async summarizeTranscript(transcript, options = {}) {
    if (!transcript || typeof transcript !== 'string' || transcript.trim().length === 0) {
      throw new Error('Transcript text is required for summarization.');
    }

    const llm = LlmFactory.getModel({ ...options, streaming: false });
    const chain = summarizerPromptTemplate.pipe(llm).pipe(new StringOutputParser());

    return await chain.invoke({ transcript });
  }

  /**
   * Assist whiteboard canvas with brainstorming and diagram generation
   * @param {string} request - User prompt for whiteboard
   * @param {Object} [options]
   * @returns {Promise<string>}
   */
  static async assistWhiteboard(request, options = {}) {
    if (!request || typeof request !== 'string' || request.trim().length === 0) {
      throw new Error('Request prompt is required for whiteboard assistant.');
    }

    const llm = LlmFactory.getModel({ ...options, streaming: false });
    const chain = whiteboardPromptTemplate.pipe(llm).pipe(new StringOutputParser());

    return await chain.invoke({ request });
  }
}
