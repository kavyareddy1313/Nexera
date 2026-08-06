import { Document } from '@langchain/core/documents';

/**
 * BaseLoader
 * Abstract interface for all Nexera AI document loaders.
 * Every loader receives a file path or buffer and returns an Array of LangChain Document instances.
 */
export class BaseLoader {
  constructor(options = {}) {
    this.options = options;
  }

  /**
   * Load and parse file content into LangChain Documents
   * @param {string|Buffer} source - Absolute file path or Buffer
   * @param {Object} metadata - Custom metadata (e.g., userId, workspaceId, fileName)
   * @returns {Promise<Document[]>}
   */
  async load(source, metadata = {}) {
    throw new Error('Method "load()" must be implemented by subclass.');
  }

  /**
   * Helper to normalize and sanitize extracted text
   * @param {string} text
   * @returns {string}
   */
  sanitizeText(text) {
    if (!text || typeof text !== 'string') return '';
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\u0000/g, '') // Remove null bytes
      .replace(/[ \t]+/g, ' ') // Collapse multiple spaces
      .replace(/\n{3,}/g, '\n\n') // Collapse excessive newlines
      .trim();
  }

  /**
   * Factory method to create standard Document object
   * @param {string} pageContent
   * @param {Object} metadata
   * @returns {Document}
   */
  createDocument(pageContent, metadata = {}) {
    return new Document({
      pageContent: this.sanitizeText(pageContent),
      metadata: {
        ...metadata,
        charCount: pageContent.length,
        loadedAt: new Date().toISOString(),
      },
    });
  }
}
