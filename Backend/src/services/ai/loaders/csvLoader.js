import fs from 'fs/promises';
import { parse } from 'csv-parse/sync';
import { BaseLoader } from './baseLoader.js';

/**
 * CsvLoader
 * Parses CSV spreadsheets and formats tabular data into contextual semantic text representations.
 */
export class CsvLoader extends BaseLoader {
  /**
   * Load CSV from file path or Buffer
   * @param {string|Buffer} source
   * @param {Object} metadata
   * @returns {Promise<Document[]>}
   */
  async load(source, metadata = {}) {
    let rawCsv;
    let filePath = null;

    if (typeof source === 'string') {
      filePath = source;
      rawCsv = await fs.readFile(source, 'utf-8');
    } else if (Buffer.isBuffer(source)) {
      rawCsv = source.toString('utf-8');
    } else {
      throw new Error('Invalid source for CsvLoader: Expected file path or Buffer.');
    }

    try {
      const records = parse(rawCsv, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      if (!records || records.length === 0) {
        throw new Error('CSV file contains no records.');
      }

      // Convert rows into readable structured text blocks
      const rowStrings = records.map((record, index) => {
        const fields = Object.entries(record)
          .map(([key, val]) => `${key}: ${val}`)
          .join(', ');
        return `[Row ${index + 1}] ${fields}`;
      });

      const formattedContent = rowStrings.join('\n');

      const docMetadata = {
        ...metadata,
        source: filePath || metadata.fileName || 'csv-document',
        fileType: 'csv',
        rowCount: records.length,
        columnHeaders: Object.keys(records[0] || {}),
      };

      return [this.createDocument(formattedContent, docMetadata)];
    } catch (error) {
      throw new Error(`Failed to parse CSV document: ${error.message}`);
    }
  }
}
