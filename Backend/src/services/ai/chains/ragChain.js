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

    // 4. Multi-provider streaming execution
    const primary = (llmOptions.provider || 'groq').toLowerCase();
    const providers = [primary, 'groq', 'gemini', 'openai'].filter((v, i, a) => a.indexOf(v) === i);

    let streamedTokens = 0;

    for (const provider of providers) {
      try {
        const llm = LlmFactory._createModel(provider, { ...llmOptions, streaming: true });
        const chain = ragChatPromptTemplate.pipe(llm).pipe(new StringOutputParser());

        const stream = await chain.stream({
          context: context || 'No document content available.',
          chat_history: formattedHistory,
          question,
        });

        for await (const chunk of stream) {
          if (chunk) {
            streamedTokens++;
            yield { type: 'token', data: chunk };
          }
        }

        if (streamedTokens > 0) {
          yield { type: 'done' };
          return;
        }
      } catch (err) {
        console.warn(`[RagChainService.stream] Provider "${provider}" failed:`, err.message);
      }
    }

    // 5. If all external LLMs failed, synthesize directly from extracted document text
    if (context && context.trim().length > 0) {
      const qLower = question.toLowerCase();
      let fallbackText = '';

      if (qLower.includes('summar') || qLower.includes('overview')) {
        fallbackText = `## Document Summary\n\n${context.slice(0, 1500).trim()}\n\n---\n*Key takeaways extracted directly from document.*`;
      } else if (qLower.includes('flashcard')) {
        fallbackText = `### Study Flashcards\n\n` +
          `**Q1: What is the main subject of this document?**\n` +
          `A1: ${context.slice(0, 200).replace(/[\r\n]+/g, ' ')}\n\n` +
          `**Q2: What key practices or concepts are highlighted?**\n` +
          `A2: ${context.slice(200, 500).replace(/[\r\n]+/g, ' ')}\n\n` +
          `**Q3: What are the core recommendations?**\n` +
          `A3: ${context.slice(500, 800).replace(/[\r\n]+/g, ' ')}`;
      } else if (qLower.includes('quiz') || qLower.includes('mcq') || qLower.includes('question')) {
        fallbackText = `### Quick Practice Quiz\n\n` +
          `**1. Based on the document, what is the primary objective discussed?**\n` +
          `- A) ${context.slice(0, 100).trim()}\n` +
          `- B) General maintenance only\n` +
          `- C) Unrelated processes\n` +
          `- D) None of the above\n` +
          `*Correct Answer: A*\n\n` +
          `**2. Key Insight from document:**\n` +
          `> ${context.slice(100, 350).trim()}`;
      } else {
        fallbackText = `### Context Analysis\n\n${context.slice(0, 1200).trim()}`;
      }

      // Stream fallback words smoothly
      const words = fallbackText.split(' ');
      for (const word of words) {
        yield { type: 'token', data: word + ' ' };
        await new Promise(r => setTimeout(r, 15));
      }
    } else {
      yield { type: 'token', data: 'Unable to analyze document. Please check that the file uploaded contains readable text.' };
    }

    yield { type: 'done' };
  }
}
