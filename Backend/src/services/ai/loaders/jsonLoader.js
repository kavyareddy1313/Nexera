import fs from 'fs/promises';
import { BaseLoader } from './baseLoader.js';

/**
 * JsonLoader
 * Parses JSON documents and transforms JSON structures into readable documents with path keys.
 */
export class JsonLoader extends BaseLoader {
  /**
   * Load JSON from file path or Buffer
   * @param {string|Buffer} source
   * @param {Object} metadata
   * @returns {Promise<Document[]>}
   */
  async load(source, metadata = {}) {
    let rawContent;
    let filePath = null;

    if (typeof source === 'string') {
      filePath = source;
      rawContent = await fs.readFile(source, 'utf-8');
    } else if (Buffer.isBuffer(source)) {
      rawContent = source.toString('utf-8');
    } else {
      throw new Error('Invalid source for JsonLoader: Expected file path or Buffer.');
    }

    try {
      const parsed = JSON.parse(rawContent);

      let formattedText;
      let itemCount = 1;

      if (Array.isArray(parsed)) {
        itemCount = parsed.length;
        formattedText = parsed
          .map((item, index) => `[Item ${index + 1}]\n${JSON.stringify(item, null, 2)}`)
          .join('\n\n');
      } else if (typeof parsed === 'object' && parsed !== null) {
        itemCount = Object.keys(parsed).length;
        formattedText = JSON.stringify(parsed, null, 2);
      } else {
        formattedText = String(parsed);
      }

      const docMetadata = {
        ...metadata,
        source: filePath || metadata.fileName || 'json-document',
        fileType: 'json',
        itemCount,
      };

      return [this.createDocument(formattedText, docMetadata)];
    } catch (error) {
      throw new Error(`Failed to parse JSON document: ${error.message}`);
    }
  }
}
