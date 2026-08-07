import fs from 'fs';
import path from 'path';
import { BaseRetriever } from '@langchain/core/retrievers';
import { Document } from '@langchain/core/documents';
import { getVectorStore } from '../vectorstores/supabaseVectorStore.js';
import { supabaseAdmin } from '../../../config/supabaseClient.js';
import { aiConfig } from '../../../config/ai.config.js';
import AiDocument from '../../../models/AiDocument.js';
import { loadDocument } from '../loaders/index.js';

/**
 * RetrieverService
 * High-performance hybrid search (Dense Vector + Sparse Keyword FTS + RRF Re-ranking).
 */
export class RetrieverService {
  /**
   * Helper to load document directly from disk when vector search returns 0 results
   */
  static async loadDirectDocumentFallback(filter = {}) {
    const documentId = typeof filter === 'string' ? filter : filter?.documentId;
    const directFileUrl = typeof filter === 'object' ? filter?.fileUrl : null;
    const directFileName = typeof filter === 'object' ? filter?.fileName : null;

    try {
      let filePath = null;
      let fileName = directFileName || 'document.pdf';
      let mimeType = 'application/pdf';

      if (directFileUrl) {
        const cleanPath = directFileUrl.replace(/^\//, '').replace(/^api\/v1\//, '');
        const candidate = path.join(process.cwd(), cleanPath);
        if (fs.existsSync(candidate)) filePath = candidate;
      }

      if (!filePath && documentId) {
        try {
          const aiDoc = await AiDocument.findByPk(documentId);
          if (aiDoc && aiDoc.fileUrl) {
            const cleanPath = aiDoc.fileUrl.replace(/^\//, '').replace(/^api\/v1\//, '');
            const candidate = path.join(process.cwd(), cleanPath);
            if (fs.existsSync(candidate)) {
              filePath = candidate;
              fileName = aiDoc.filename || fileName;
              mimeType = aiDoc.fileType || mimeType;
            }
          }
        } catch (_) {}
      }

      // If still not found, search uploads/ai-docs for matching files
      if (!filePath) {
        const aiDocsDir = path.join(process.cwd(), 'uploads', 'ai-docs');
        if (fs.existsSync(aiDocsDir)) {
          const files = fs.readdirSync(aiDocsDir).filter(f => !f.startsWith('.'));
          if (files.length > 0) {
            const matched = (documentId && files.find(f => f.includes(documentId))) || files[files.length - 1];
            filePath = path.join(aiDocsDir, matched);
            fileName = fileName || matched;
          }
        }
      }

      if (!filePath || !fs.existsSync(filePath)) return [];

      const fileBuffer = fs.readFileSync(filePath);
      const loaded = await loadDocument({
        source: fileBuffer,
        fileName,
        mimeType,
        metadata: { documentId: documentId || 'doc_1', fileName },
      });

      return loaded || [];
    } catch (err) {
      console.warn('[RetrieverService] Direct document fallback failed:', err.message);
      return [];
    }
  }

  /**
   * Reciprocal Rank Fusion (RRF) algorithm
   * @param {Array<Document[]>} rankedLists - Array of ranked document arrays from different search methods
   * @param {number} [k=60] - RRF smoothing parameter
   * @returns {Array<{ document: Document, rrfScore: number }>}
   */
  static applyRRF(rankedLists, k = 60) {
    const docMap = new Map();

    rankedLists.forEach((list) => {
      list.forEach((doc, rank) => {
        // Unique key per chunk based on source & chunk index or content snippet
        const key =
          doc.metadata?.id ||
          `${doc.metadata?.fileName || 'doc'}_${doc.metadata?.chunkIndex ?? doc.pageContent.slice(0, 40)}`;

        const rrfContribution = 1 / (k + rank + 1);

        if (docMap.has(key)) {
          const existing = docMap.get(key);
          existing.rrfScore += rrfContribution;
        } else {
          docMap.set(key, {
            document: doc,
            rrfScore: rrfContribution,
          });
        }
      });
    });

    return Array.from(docMap.values()).sort((a, b) => b.rrfScore - a.rrfScore);
  }

  /**
   * Dense semantic vector similarity search
   * @param {string} query
   * @param {Object} [options]
   * @returns {Promise<Document[]>}
   */
  static async searchDense(query, options = {}) {
    const k = options.k || aiConfig.vectorStore.topK || 5;
    const filter = options.filter || {};
    const minScore = options.minScore || aiConfig.vectorStore.similarityThreshold || 0.6;
    const vectorStore = getVectorStore();

    try {
      const resultsWithScore = await vectorStore.similaritySearchWithScore(query, k * 2, filter);
      
      // Filter by minimum similarity score
      const filtered = resultsWithScore
        .filter(([, score]) => score >= minScore)
        .slice(0, k)
        .map(([doc, score]) => {
          return new Document({
            pageContent: doc.pageContent,
            metadata: {
              ...doc.metadata,
              similarityScore: score,
              retrievalType: 'dense_vector',
            },
          });
        });

      return filtered;
    } catch (error) {
      console.warn(`[RetrieverService] Dense search warning: ${error.message}`);
      return [];
    }
  }

  /**
   * Sparse keyword search (Postgres Full-Text Search)
   * @param {string} query
   * @param {Object} [options]
   * @returns {Promise<Document[]>}
   */
  static async searchSparse(query, options = {}) {
    const k = options.k || aiConfig.vectorStore.topK || 5;
    const filter = options.filter || {};

    try {
      const { data, error } = await supabaseAdmin.rpc('keyword_search_documents', {
        search_query: query,
        match_count: k,
        filter,
      });

      if (error || !data) {
        return [];
      }

      return data.map((item) => {
        return new Document({
          pageContent: item.content,
          metadata: {
            ...item.metadata,
            id: item.id,
            ftsRank: item.rank,
            retrievalType: 'sparse_keyword',
          },
        });
      });
    } catch (error) {
      console.warn(`[RetrieverService] Sparse search warning: ${error.message}`);
      return [];
    }
  }

  /**
   * Hybrid Search: Combines Dense Vector + Sparse Keyword search using RRF
   * @param {string} query - Natural language search query
   * @param {Object} [options]
   * @param {number} [options.k=5] - Number of top documents to return
   * @param {Object} [options.filter={}] - JSONB metadata filter
   * @param {boolean} [options.useHybrid=true] - If false, uses dense search only
   * @returns {Promise<Document[]>}
   */
  static async hybridSearch(query, options = {}) {
    const k = options.k || aiConfig.vectorStore.topK || 5;
    const useHybrid = options.useHybrid !== false;

    if (!useHybrid) {
      const dense = await this.searchDense(query, options);
      if (dense.length > 0) return dense;
      return await this.loadDirectDocumentFallback(options.filter);
    }

    // Execute Dense and Sparse retrieval in parallel
    const [denseDocs, sparseDocs] = await Promise.all([
      this.searchDense(query, { ...options, k: k * 2 }),
      this.searchSparse(query, { ...options, k: k * 2 }),
    ]);

    // If one method returned no results, fallback to the other
    if (denseDocs.length === 0 && sparseDocs.length > 0) return sparseDocs.slice(0, k);
    if (sparseDocs.length === 0 && denseDocs.length > 0) return denseDocs.slice(0, k);

    // If both returned no results, fallback directly to disk document loader
    if (denseDocs.length === 0 && sparseDocs.length === 0) {
      return await this.loadDirectDocumentFallback(options.filter);
    }

    // Apply Reciprocal Rank Fusion
    const fusedResults = this.applyRRF([denseDocs, sparseDocs]);

    return fusedResults.slice(0, k).map(({ document, rrfScore }) => {
      return new Document({
        pageContent: document.pageContent,
        metadata: {
          ...document.metadata,
          rrfScore,
        },
      });
    });
  }

  /**
   * Format retrieved Document array into an LLM-ready context block with citations
   * @param {Document[]} documents
   * @returns {string}
   */
  static formatContext(documents) {
    if (!Array.isArray(documents) || documents.length === 0) {
      return 'No relevant document context found.';
    }

    return documents
      .map((doc, idx) => {
        const sourceName = doc.metadata?.fileName || doc.metadata?.source || `Document-${idx + 1}`;
        const chunkIndex = doc.metadata?.chunkIndex !== undefined ? ` (Chunk ${doc.metadata.chunkIndex + 1})` : '';
        return `[Source ${idx + 1}: ${sourceName}${chunkIndex}]\n${doc.pageContent}`;
      })
      .join('\n\n---\n\n');
  }

  /**
   * Returns a LangChain-compatible BaseRetriever for seamless RAG chain pipelines
   * @param {Object} [options]
   * @returns {BaseRetriever}
   */
  static asLangChainRetriever(options = {}) {
    const retrieverService = this;

    class NexeraHybridRetriever extends BaseRetriever {
      static lc_name() {
        return 'NexeraHybridRetriever';
      }
      lc_namespace = ['nexera', 'retrievers'];

      async _getRelevantDocuments(query) {
        return await retrieverService.hybridSearch(query, options);
      }
    }

    return new NexeraHybridRetriever();
  }
}
