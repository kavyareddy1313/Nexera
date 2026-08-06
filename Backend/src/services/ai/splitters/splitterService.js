import { Document } from '@langchain/core/documents';
import {
  RecursiveCharacterTextSplitter,
  CharacterTextSplitter,
  MarkdownTextSplitter,
} from '@langchain/textsplitters';
import { aiConfig } from '../../../config/ai.config.js';

/**
 * SplitterService
 * Handles document chunking and text splitting with configurable strategies,
 * chunk sizes, overlaps, and enriched chunk-level metadata.
 */
export class SplitterService {
  /**
   * Instantiate an appropriate LangChain TextSplitter
   * @param {Object} options
   * @param {string} [options.strategy='recursive'] - 'recursive' | 'fixed' | 'sentence' | 'paragraph' | 'markdown'
   * @param {number} [options.chunkSize] - Max characters per chunk
   * @param {number} [options.chunkOverlap] - Overlap between adjacent chunks
   * @returns {import('@langchain/textsplitters').TextSplitter}
   */
  static getSplitter({
    strategy = aiConfig.chunking.defaultStrategy,
    chunkSize = aiConfig.chunking.chunkSize,
    chunkOverlap = aiConfig.chunking.chunkOverlap,
  } = {}) {
    // Validate overlap is less than chunk size
    const effectiveChunkSize = Math.max(100, Number(chunkSize) || 1000);
    const effectiveOverlap = Math.min(
      Math.max(0, Number(chunkOverlap) || 200),
      effectiveChunkSize - 1
    );

    switch (strategy.toLowerCase()) {
      case 'fixed':
        return new CharacterTextSplitter({
          separator: '',
          chunkSize: effectiveChunkSize,
          chunkOverlap: effectiveOverlap,
        });

      case 'sentence':
        return new RecursiveCharacterTextSplitter({
          separators: ['. ', '? ', '! ', '.\n', '?\n', '!\n', '\n\n', '\n', ' '],
          chunkSize: effectiveChunkSize,
          chunkOverlap: effectiveOverlap,
        });

      case 'paragraph':
        return new RecursiveCharacterTextSplitter({
          separators: ['\n\n', '\r\n\r\n'],
          chunkSize: effectiveChunkSize,
          chunkOverlap: effectiveOverlap,
        });

      case 'markdown':
        return new MarkdownTextSplitter({
          chunkSize: effectiveChunkSize,
          chunkOverlap: effectiveOverlap,
        });

      case 'recursive':
      default:
        return new RecursiveCharacterTextSplitter({
          separators: ['\n\n', '\n', '. ', '? ', '! ', ' ', ''],
          chunkSize: effectiveChunkSize,
          chunkOverlap: effectiveOverlap,
        });
    }
  }

  /**
   * Split an array of LangChain Document objects into smaller chunks
   * @param {Document[]} documents - Array of loaded LangChain documents
   * @param {Object} [options] - Chunking configuration options
   * @returns {Promise<Document[]>} - Array of chunked Document instances with enriched metadata
   */
  static async splitDocuments(documents, options = {}) {
    if (!Array.isArray(documents) || documents.length === 0) {
      return [];
    }

    const splitter = this.getSplitter(options);
    const minSize = options.minChunkSize || aiConfig.chunking.minChunkSize;
    const allChunks = [];

    for (let docIdx = 0; docIdx < documents.length; docIdx++) {
      const doc = documents[docIdx];
      const rawChunks = await splitter.splitDocuments([doc]);

      // Filter out empty or trivial chunks
      const validChunks = rawChunks.filter(
        (chunk) => chunk.pageContent && chunk.pageContent.trim().length >= minSize
      );

      const totalChunks = validChunks.length;

      validChunks.forEach((chunk, chunkIdx) => {
        allChunks.push(
          new Document({
            pageContent: chunk.pageContent.trim(),
            metadata: {
              ...doc.metadata,
              chunkIndex: chunkIdx,
              totalChunks,
              chunkCharCount: chunk.pageContent.trim().length,
              strategy: options.strategy || aiConfig.chunking.defaultStrategy,
            },
          })
        );
      });
    }

    return allChunks;
  }

  /**
   * Split raw text string into Document chunks
   * @param {string} text - Raw string content
   * @param {Object} [metadata={}] - Custom metadata to attach
   * @param {Object} [options={}] - Chunking options
   * @returns {Promise<Document[]>}
   */
  static async splitText(text, metadata = {}, options = {}) {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return [];
    }

    const doc = new Document({
      pageContent: text,
      metadata: {
        ...metadata,
        charCount: text.length,
      },
    });

    return await this.splitDocuments([doc], options);
  }
}
