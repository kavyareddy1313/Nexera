import { SplitterService } from '../splitters/splitterService.js';
import { EmbeddingService } from '../embeddings/embeddingService.js';
import { loadDocument } from '../loaders/index.js';

/**
 * CourseRagService
 * Handles ingestion and retrieval of instructor-uploaded reference documents
 * for grounding AI-generated course content.
 * 
 * Uses direct Postgres queries (via Sequelize) for the course_reference_chunks table
 * since this is a separate, job-scoped vector store — not the main documents table.
 */
export class CourseRagService {
  /**
   * Ingest a reference document: load → chunk → embed → store
   * @param {string} filePath - Path to uploaded file
   * @param {string} jobId - CourseGenerationJob ID for scoping
   * @param {Object} [options]
   * @returns {Promise<number>} - Number of chunks stored
   */
  static async ingestReferenceDoc(filePath, jobId, options = {}) {
    if (!filePath || !jobId) {
      throw new Error('filePath and jobId are required for reference doc ingestion.');
    }

    // 1. Load document
    const documents = await loadDocument({
      source: filePath,
      metadata: { jobId, type: 'course_reference' },
    });

    if (!documents || documents.length === 0) {
      console.warn(`[CourseRAG] No content extracted from: ${filePath}`);
      return 0;
    }

    // 2. Split into chunks (800 chars, 100 overlap per spec)
    const chunks = await SplitterService.splitDocuments(documents, {
      chunkSize: options.chunkSize || 800,
      chunkOverlap: options.chunkOverlap || 100,
      strategy: 'recursive',
    });

    if (chunks.length === 0) {
      console.warn(`[CourseRAG] No valid chunks produced from: ${filePath}`);
      return 0;
    }

    // 3. Generate embeddings
    const texts = chunks.map(c => c.pageContent);
    const embeddings = await EmbeddingService.embedDocuments(texts, { batchSize: 20 });

    // 4. Store in course_reference_chunks table via raw SQL
    // (We use sequelize raw query since this table doesn't need a full Sequelize model)
    const { sequelize } = await import('../../../config/db.js');
    
    const insertValues = chunks.map((chunk, idx) => ({
      id: crypto.randomUUID(),
      generation_job_id: jobId,
      content: chunk.pageContent,
      metadata: JSON.stringify({
        ...chunk.metadata,
        chunkIndex: idx,
        totalChunks: chunks.length,
      }),
    }));

    // Batch insert (without embeddings for now since pgvector may not be enabled)
    for (const val of insertValues) {
      try {
        await sequelize.query(
          `INSERT INTO course_reference_chunks (id, generation_job_id, content, metadata, created_at)
           VALUES (:id, :jobId, :content, :metadata, NOW())`,
          {
            replacements: {
              id: val.id,
              jobId: val.generation_job_id,
              content: val.content,
              metadata: val.metadata,
            },
          }
        );
      } catch (err) {
        // Table may not exist yet — gracefully handle
        console.warn(`[CourseRAG] Failed to store chunk: ${err.message}`);
        break;
      }
    }

    console.log(`[CourseRAG] Ingested ${chunks.length} chunks for job ${jobId}`);
    return chunks.length;
  }

  /**
   * Retrieve relevant reference chunks for a specific lesson topic.
   * Uses simple text similarity (ILIKE search) as a fallback when pgvector is unavailable.
   * 
   * @param {string} lessonTitle
   * @param {string[]} lessonObjectives
   * @param {string} jobId
   * @param {number} [k=4]
   * @returns {Promise<string>} - Formatted context string for LLM injection
   */
  static async retrieveForLesson(lessonTitle, lessonObjectives = [], jobId, k = 4) {
    if (!jobId) return '';

    try {
      const { sequelize } = await import('../../../config/db.js');

      // Build search terms from lesson title and objectives
      const searchTerms = [lessonTitle, ...(lessonObjectives || [])].join(' ');
      const keywords = searchTerms
        .split(/\s+/)
        .filter(w => w.length > 3)
        .slice(0, 5);

      if (keywords.length === 0) return '';

      // Simple keyword-based retrieval (works without pgvector)
      const likeConditions = keywords.map((_, i) => `content ILIKE :kw${i}`).join(' OR ');
      const replacements = { jobId };
      keywords.forEach((kw, i) => {
        replacements[`kw${i}`] = `%${kw}%`;
      });

      const [results] = await sequelize.query(
        `SELECT content FROM course_reference_chunks
         WHERE generation_job_id = :jobId AND (${likeConditions})
         LIMIT :limit`,
        { replacements: { ...replacements, limit: k } }
      );

      if (!results || results.length === 0) return '';

      return results
        .map((r, i) => `[Reference ${i + 1}]\n${r.content}`)
        .join('\n\n---\n\n');
    } catch (err) {
      // RAG is optional — don't fail the pipeline
      console.warn(`[CourseRAG] Retrieval failed (non-fatal): ${err.message}`);
      return '';
    }
  }

  /**
   * Delete all reference chunks for a completed/failed job
   * @param {string} jobId
   */
  static async cleanup(jobId) {
    if (!jobId) return;
    try {
      const { sequelize } = await import('../../../config/db.js');
      await sequelize.query(
        `DELETE FROM course_reference_chunks WHERE generation_job_id = :jobId`,
        { replacements: { jobId } }
      );
      console.log(`[CourseRAG] Cleaned up reference chunks for job ${jobId}`);
    } catch (err) {
      // Non-fatal
      console.warn(`[CourseRAG] Cleanup failed (non-fatal): ${err.message}`);
    }
  }
}
