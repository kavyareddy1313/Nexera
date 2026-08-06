import path from 'path';
import { PdfLoader } from './pdfLoader.js';
import { DocxLoader } from './docxLoader.js';
import { TextLoader } from './textLoader.js';
import { CsvLoader } from './csvLoader.js';
import { JsonLoader } from './jsonLoader.js';
import { BaseLoader } from './baseLoader.js';

export { BaseLoader, PdfLoader, DocxLoader, TextLoader, CsvLoader, JsonLoader };

/**
 * MIME type and file extension mapping to appropriate loader class
 */
const LOADER_REGISTRY = {
  // PDF
  'application/pdf': PdfLoader,
  '.pdf': PdfLoader,

  // Word (.docx)
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': DocxLoader,
  '.docx': DocxLoader,

  // Text & Markdown
  'text/plain': TextLoader,
  'text/markdown': TextLoader,
  '.txt': TextLoader,
  '.md': TextLoader,
  '.log': TextLoader,

  // CSV
  'text/csv': CsvLoader,
  'application/vnd.ms-excel': CsvLoader,
  '.csv': CsvLoader,

  // JSON
  'application/json': JsonLoader,
  '.json': JsonLoader,
};

/**
 * Resolves the appropriate loader based on MIME type or file extension
 * @param {Object} params
 * @param {string} [params.mimeType]
 * @param {string} [params.fileName]
 * @param {string} [params.filePath]
 * @returns {BaseLoader}
 */
export function getLoaderForFile({ mimeType, fileName, filePath }) {
  let LoaderClass = null;

  if (mimeType && LOADER_REGISTRY[mimeType]) {
    LoaderClass = LOADER_REGISTRY[mimeType];
  } else {
    const targetName = fileName || filePath || '';
    const ext = path.extname(targetName).toLowerCase();
    if (ext && LOADER_REGISTRY[ext]) {
      LoaderClass = LOADER_REGISTRY[ext];
    }
  }

  if (!LoaderClass) {
    const identified = mimeType || path.extname(fileName || filePath || '');
    throw new Error(
      `Unsupported file type "${identified}". Supported formats: PDF, DOCX, TXT, MD, CSV, JSON.`
    );
  }

  return new LoaderClass();
}

/**
 * High-level helper to load any supported document into standard LangChain Document array
 * @param {Object} options
 * @param {string|Buffer} options.source - File path or Buffer
 * @param {string} [options.mimeType]
 * @param {string} [options.fileName]
 * @param {Object} [options.metadata] - Extra metadata to attach
 * @returns {Promise<import('@langchain/core/documents').Document[]>}
 */
export async function loadDocument({ source, mimeType, fileName, metadata = {} }) {
  const filePath = typeof source === 'string' ? source : null;
  const effectiveFileName = fileName || (filePath ? path.basename(filePath) : 'unknown_document');

  const loader = getLoaderForFile({
    mimeType,
    fileName: effectiveFileName,
    filePath,
  });

  const mergedMetadata = {
    fileName: effectiveFileName,
    source: filePath || effectiveFileName,
    ...metadata,
  };

  return await loader.load(source, mergedMetadata);
}
