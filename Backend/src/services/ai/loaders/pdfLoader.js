import fs from 'fs/promises';
import { createRequire } from 'module';
import { BaseLoader } from './baseLoader.js';

const require = createRequire(import.meta.url);
const pdfModule = require('pdf-parse');

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
    } else if (source instanceof Uint8Array) {
      dataBuffer = Buffer.from(source);
    } else {
      throw new Error('Invalid source for PdfLoader: Expected file path or Buffer.');
    }

    try {
      let extractedText = '';
      let totalPages = 1;
      let pdfInfo = {};

      if (typeof pdfModule === 'function') {
        const data = await pdfModule(dataBuffer);
        extractedText = data.text;
        totalPages = data.numpages || 1;
        pdfInfo = {
          title: data.info?.Title || null,
          author: data.info?.Author || null,
          creator: data.info?.Creator || null,
        };
      } else if (pdfModule.PDFParse) {
        const parser = new pdfModule.PDFParse({ data: dataBuffer });
        const textResult = await parser.getText();
        extractedText = textResult?.text || '';
        try {
          const infoResult = await parser.getInfo();
          totalPages = infoResult?.total || 1;
          pdfInfo = {
            title: infoResult?.info?.Title || null,
            author: infoResult?.info?.Author || null,
            creator: infoResult?.info?.Creator || null,
          };
        } catch (_) {}
      } else if (typeof pdfModule.default === 'function') {
        const data = await pdfModule.default(dataBuffer);
        extractedText = data.text;
        totalPages = data.numpages || 1;
      }

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('PDF file appears to be empty or contains scanned images without text layer.');
      }

      const docMetadata = {
        ...metadata,
        source: filePath || metadata.fileName || 'pdf-document',
        fileType: 'pdf',
        totalPages,
        pdfInfo,
      };

      return [this.createDocument(extractedText, docMetadata)];
    } catch (error) {
      throw new Error(`Failed to parse PDF document: ${error.message}`);
    }
  }
}
