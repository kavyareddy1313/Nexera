import { BaseRetriever } from '@langchain/core/retrievers';
import { Document } from '@langchain/core/documents';
import { getVectorStore } from '../vectorstores/supabaseVectorStore.js';
import { supabaseAdmin } from '../../../config/supabaseClient.js';
import { aiConfig } from '../../../config/ai.config.js';

/**
 * RetrieverService
 * High-performance hybrid search (Dense Vector + Sparse Keyword FTS + RRF Re-ranking).
 */
export class RetrieverService {
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
      return await this.searchDense(query, options);
    }

    // Execute Dense and Sparse retrieval in parallel
    const [denseDocs, sparseDocs] = await Promise.all([
      this.searchDense(query, { ...options, k: k * 2 }),
      this.searchSparse(query, { ...options, k: k * 2 }),
    ]);

    // If one method returned no results, fallback to the other
    if (denseDocs.length === 0) return sparseDocs.slice(0, k);
    if (sparseDocs.length === 0) return denseDocs.slice(0, k);

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
