import fs from 'fs/promises';
import { BaseLoader } from './baseLoader.js';

/**
 * TextLoader
 * Handles raw plaintext files (.txt, .md, .log, code files).
 */
export class TextLoader extends BaseLoader {
  /**
   * Load text file from file path or Buffer
   * @param {string|Buffer} source
   * @param {Object} metadata
   * @returns {Promise<Document[]>}
   */
  async load(source, metadata = {}) {
    let content;
    let filePath = null;

    if (typeof source === 'string') {
      filePath = source;
      content = await fs.readFile(source, 'utf-8');
    } else if (Buffer.isBuffer(source)) {
      content = source.toString('utf-8');
    } else {
      throw new Error('Invalid source for TextLoader: Expected file path or Buffer.');
    }

    if (!content || content.trim().length === 0) {
      throw new Error('Text document is empty.');
    }

    const docMetadata = {
      ...metadata,
      source: filePath || metadata.fileName || 'text-document',
      fileType: metadata.fileType || 'txt',
      lineCount: content.split('\n').length,
    };

    return [this.createDocument(content, docMetadata)];
  }
}
