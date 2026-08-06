import { StringOutputParser } from '@langchain/core/output_parsers';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { ragChatPromptTemplate } from './prompts.js';
import { LlmFactory } from '../llm/llmFactory.js';
import { RetrieverService } from '../retrievers/retrieverService.js';

/**
 * RagChainService
 * Orchestrates Retrieval-Augmented Generation with real-time token streaming,
 * multi-turn conversation memory, and citation extraction.
 */
export class RagChainService {
  /**
   * Normalize chat history into LangChain BaseMessage instances
   * @param {Array<{ role: string, content: string }>} history
   * @returns {Array<HumanMessage|AIMessage>}
   */
  static formatChatHistory(history = []) {
    if (!Array.isArray(history)) return [];
    return history.map((msg) => {
      if (msg.role === 'user' || msg.role === 'human') {
        return new HumanMessage(msg.content);
      }
      return new AIMessage(msg.content);
    });
  }

  /**
   * Extract clean citation objects from retrieved documents
   * @param {import('@langchain/core/documents').Document[]} docs
   * @returns {Array<{ fileName: string, fileType: string, chunkIndex: number, score?: number }>}
   */
  static extractCitations(docs = []) {
    const seen = new Set();
    const citations = [];

    docs.forEach((doc, idx) => {
      const fileName = doc.metadata?.fileName || doc.metadata?.source || `Document-${idx + 1}`;
      const chunkIndex = doc.metadata?.chunkIndex ?? 0;
      const key = `${fileName}_${chunkIndex}`;

      if (!seen.has(key)) {
        seen.add(key);
        citations.push({
          sourceNumber: idx + 1,
          fileName,
          fileType: doc.metadata?.fileType || 'unknown',
          chunkIndex,
          totalChunks: doc.metadata?.totalChunks || 1,
          similarityScore: doc.metadata?.similarityScore || doc.metadata?.rrfScore || null,
          preview: doc.pageContent.slice(0, 150) + '...',
        });
      }
    });

    return citations;
  }

  /**
   * Execute full non-streaming RAG query
   * @param {Object} params
   * @param {string} params.question - User question
   * @param {Array} [params.chatHistory=[]] - Conversation history
   * @param {Object} [params.filter={}] - Metadata filter (userId, workspaceId, fileName)
   * @param {Object} [params.llmOptions={}] - LLM overrides (provider, temperature)
   * @returns {Promise<{ answer: string, citations: Array }>}
   */
  static async execute({
    question,
    chatHistory = [],
    filter = {},
    llmOptions = {},
  }) {
    if (!question || typeof question !== 'string') {
      throw new Error('Question must be a non-empty string.');
    }

    // 1. Retrieve relevant documents via hybrid search
    const docs = await RetrieverService.hybridSearch(question, {
      filter,
      k: 5,
    });

    // 2. Format context string & citations
    const context = RetrieverService.formatContext(docs);
    const citations = this.extractCitations(docs);
    const formattedHistory = this.formatChatHistory(chatHistory);

    // 3. Initialize Chat LLM & Pipeline
    const llm = LlmFactory.getModel({ ...llmOptions, streaming: false });
    const chain = ragChatPromptTemplate.pipe(llm).pipe(new StringOutputParser());

    // 4. Run chain
    const answer = await chain.invoke({
      context,
      chat_history: formattedHistory,
      question,
    });

    return { answer, citations };
  }

  /**
   * Stream RAG tokens and citations in real time
   * @param {Object} params
   * @param {string} params.question
   * @param {Array} [params.chatHistory=[]]
   * @param {Object} [params.filter={}]
   * @param {Object} [params.llmOptions={}]
   * @returns {AsyncGenerator<{ type: 'citations'|'token'|'done', data?: any }>}
   */
  static async *stream({
    question,
    chatHistory = [],
    filter = {},
    llmOptions = {},
  }) {
    if (!question || typeof question !== 'string') {
      throw new Error('Question must be a non-empty string.');
    }

    // 1. Retrieve relevant documents via hybrid search
    const docs = await RetrieverService.hybridSearch(question, {
      filter,
      k: 5,
    });

    // 2. Extract citations & format context
    const context = RetrieverService.formatContext(docs);
    const citations = this.extractCitations(docs);
    const formattedHistory = this.formatChatHistory(chatHistory);

    // 3. Yield citations immediately before LLM generation starts
    yield { type: 'citations', data: citations };

    // 4. Initialize streaming Chat LLM & Pipeline
    const llm = LlmFactory.getModel({ ...llmOptions, streaming: true });
    const chain = ragChatPromptTemplate.pipe(llm).pipe(new StringOutputParser());

    // 5. Stream LLM tokens
    const stream = await chain.stream({
      context,
      chat_history: formattedHistory,
      question,
    });

    for await (const chunk of stream) {
      if (chunk) {
        yield { type: 'token', data: chunk };
      }
    }

    yield { type: 'done' };
  }
}
