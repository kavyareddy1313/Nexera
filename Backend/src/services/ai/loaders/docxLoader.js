import fs from 'fs/promises';
import mammoth from 'mammoth';
import { BaseLoader } from './baseLoader.js';

/**
 * DocxLoader
 * Extracts structured text from Microsoft Word .docx documents using mammoth.
 */
export class DocxLoader extends BaseLoader {
  /**
   * Load DOCX from file path or Buffer
   * @param {string|Buffer} source
   * @param {Object} metadata
   * @returns {Promise<Document[]>}
   */
  async load(source, metadata = {}) {
    let dataBuffer;
    let filePath = null;

    if (typeof source === 'string') {
      filePath = source;
      dataBuffer = await fs.readFile(source);
    } else if (Buffer.isBuffer(source)) {
      dataBuffer = source;
    } else {
      throw new Error('Invalid source for DocxLoader: Expected file path or Buffer.');
    }

    try {
      const result = await mammoth.extractRawText({ buffer: dataBuffer });
      const text = result.value;

      if (!text || text.trim().length === 0) {
        throw new Error('DOCX document contains no readable text.');
      }

      const docMetadata = {
        ...metadata,
        source: filePath || metadata.fileName || 'docx-document',
        fileType: 'docx',
        warnings: result.messages?.length > 0 ? result.messages.map((m) => m.message) : [],
      };

      return [this.createDocument(text, docMetadata)];
    } catch (error) {
      throw new Error(`Failed to parse DOCX document: ${error.message}`);
    }
  }
}
