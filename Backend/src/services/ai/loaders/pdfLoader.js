import fs from 'fs/promises';
import { createRequire } from 'module';
import { BaseLoader } from './baseLoader.js';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

/**
 * PdfLoader
 * Extracts text and metadata from PDF files using pdf-parse.
 */
export class PdfLoader extends BaseLoader {
  /**
   * Load PDF from file path or Buffer
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
      throw new Error('Invalid source for PdfLoader: Expected file path or Buffer.');
    }

    try {
      const data = await pdfParse(dataBuffer, {
        version: 'default',
      });

      if (!data.text || data.text.trim().length === 0) {
        throw new Error('PDF file appears to be empty or contains scanned images without text layer.');
      }

      const docMetadata = {
        ...metadata,
        source: filePath || metadata.fileName || 'pdf-document',
        fileType: 'pdf',
        totalPages: data.numpages || 1,
        pdfInfo: {
          title: data.info?.Title || null,
          author: data.info?.Author || null,
          creator: data.info?.Creator || null,
        },
      };

      return [this.createDocument(data.text, docMetadata)];
    } catch (error) {
      throw new Error(`Failed to parse PDF document: ${error.message}`);
    }
  }
}
