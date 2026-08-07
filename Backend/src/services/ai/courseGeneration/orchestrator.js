import { CourseGenerationJob } from '../../../models/index.js';
import { generateOutline } from './outlineChain.js';
import { generateLessonContent } from './contentChain.js';
import { generateQuizzes } from './quizChain.js';
import { linkResources, clearResourceCache } from './resourceLinker.js';
import { assembleCourseBundle } from './bundleAssembler.js';
import { CourseRagService } from './courseRagService.js';

/**
 * Course Generation Orchestrator
 * Runs the multi-stage AI pipeline as a background job.
 * Updates job status at each stage for frontend progress tracking.
 */

/**
 * Update job status in the database
 */
async function updateJobStatus(jobId, updates) {
  try {
    const safeUpdates = { ...updates };
    
    // Truncate fields that are VARCHAR(255) in the database to prevent insertion errors
    if (safeUpdates.errorMessage && safeUpdates.errorMessage.length > 250) {
      safeUpdates.errorMessage = safeUpdates.errorMessage.substring(0, 247) + '...';
    }
    if (safeUpdates.progressDetail && safeUpdates.progressDetail.length > 250) {
      safeUpdates.progressDetail = safeUpdates.progressDetail.substring(0, 247) + '...';
    }

    await CourseGenerationJob.update(safeUpdates, { where: { id: jobId } });
  } catch (err) {
    console.error(`[Orchestrator] Failed to update job ${jobId}: ${err.message}`);
  }
}

/**
 * Sleep helper for retries
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Run a stage with retry logic
 * @param {string} stageName
 * @param {Function} fn - async function to execute
 * @param {string} jobId
 * @param {number} [maxRetries=3]
 */
async function runStageWithRetry(stageName, fn, jobId, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      console.warn(`[Orchestrator] Stage "${stageName}" attempt ${attempt}/${maxRetries} failed: ${err.message}`);
      if (attempt === maxRetries) {
        throw err;
      }
      // Exponential backoff: 2s, 4s, 8s
      await sleep(2000 * Math.pow(2, attempt - 1));
    }
  }
}

/**
 * Run the full course generation pipeline
 * @param {string} jobId - CourseGenerationJob ID
 * @param {Object} inputParams - Form data from instructor
 * @param {string} instructorId
 */
export async function runPipeline(jobId, inputParams, instructorId) {
  const {
    topic,
    targetAudience,
    difficulty,
    moduleCount,
    lessonsPerModule,
    language,
    quizCount,
    additionalInstructions,
    referenceDocPath,
  } = inputParams;

  const hasReferenceDoc = !!referenceDocPath;

  // Load existing job state for resume capability
  const job = await CourseGenerationJob.findByPk(jobId);
  if (!job) throw new Error(`Job ${jobId} not found`);

  let outline = job.generatedOutline;
  let intermediateState = job.intermediateState || { lessonsData: {}, quizzesData: {}, resourcesData: {} };
  
  // Ensure intermediateState has the correct structure
  if (!intermediateState.lessonsData) intermediateState.lessonsData = {};
  if (!intermediateState.quizzesData) intermediateState.quizzesData = {};
  if (!intermediateState.resourcesData) intermediateState.resourcesData = {};

  // Helper to save intermediate state progressively
  const saveProgress = async () => {
    await updateJobStatus(jobId, { intermediateState });
  };

  try {
    // ═══════════════════════════════════════════════════════════
    // STAGE A — Outline Generation
    // ═══════════════════════════════════════════════════════════
    if (!outline) {
      await updateJobStatus(jobId, {
        status: 'generating',
        currentStage: 'outline',
        progressDetail: 'Generating course outline...',
      });

      outline = await runStageWithRetry('outline', () =>
        generateOutline({
          topic,
          targetAudience,
          difficulty,
          moduleCount: moduleCount || 4,
          lessonsPerModule: lessonsPerModule || 3,
          language: language || 'English',
          additionalInstructions,
          jobId,
        }),
        jobId
      );

      // Cache outline for retry support
      await updateJobStatus(jobId, {
        generatedOutline: outline,
        progressDetail: `Outline generated: ${outline.modules.length} modules`,
      });
      console.log(`[Orchestrator] Stage A complete: ${outline.title} — ${outline.modules.length} modules`);
    } else {
      console.log(`[Orchestrator] Stage A skipped (resuming from cached outline)`);
    }

    // ═══════════════════════════════════════════════════════════
    // STAGE B — RAG Ingestion (if reference doc provided)
    // ═══════════════════════════════════════════════════════════
    if (hasReferenceDoc) {
      await updateJobStatus(jobId, {
        currentStage: 'rag_ingestion',
        progressDetail: 'Processing reference document...',
      });

      try {
        await CourseRagService.ingestReferenceDoc(referenceDocPath, jobId);
      } catch (err) {
        console.warn(`[Orchestrator] RAG ingestion failed (non-fatal): ${err.message}`);
        // Continue without RAG — it's optional
      }
    }

    // ═══════════════════════════════════════════════════════════
    // STAGE C — Lesson Content Generation
    // ═══════════════════════════════════════════════════════════
    await updateJobStatus(jobId, {
      currentStage: 'content',
      progressDetail: 'Generating lesson content...',
    });

    const lessonsData = intermediateState.lessonsData;
    const totalLessons = outline.modules.reduce((sum, m) => sum + m.lessons.length, 0);
    let lessonsDone = 0;

    for (let mIdx = 0; mIdx < outline.modules.length; mIdx++) {
      const mod = outline.modules[mIdx];

      for (let lIdx = 0; lIdx < mod.lessons.length; lIdx++) {
        const lesson = mod.lessons[lIdx];
        const lessonKey = `${mIdx}_${lIdx}`;

        if (lessonsData[lessonKey]) {
          console.log(`[Orchestrator] Content skipped (resuming from cache): ${lesson.title}`);
          lessonsDone++;
          continue;
        }

        await updateJobStatus(jobId, {
          progressDetail: `Generating content: Module ${mIdx + 1}/${outline.modules.length}, Lesson ${lIdx + 1}/${mod.lessons.length} — "${lesson.title}"`,
        });

        const content = await runStageWithRetry(`content_${lessonKey}`, () =>
          generateLessonContent({
            courseTitle: outline.title,
            moduleName: mod.title,
            lessonTitle: lesson.title,
            lessonObjectives: lesson.objectives || [],
            difficulty,
            language: language || 'English',
            jobId,
            hasReferenceDoc,
          }),
          jobId,
          2 // Fewer retries per lesson since there are many
        );

        lessonsData[lessonKey] = content;
        await saveProgress(); // Save intermediate state immediately
        
        lessonsDone++;
        console.log(`[Orchestrator] Content generated: ${lessonsDone}/${totalLessons} — ${lesson.title}`);
      }
    }

    // ═══════════════════════════════════════════════════════════
    // STAGE D — Quiz Generation
    // ═══════════════════════════════════════════════════════════
    await updateJobStatus(jobId, {
      currentStage: 'quiz',
      progressDetail: 'Generating quizzes...',
    });

    const quizzesData = intermediateState.quizzesData;
    let quizzesDone = 0;

    for (let mIdx = 0; mIdx < outline.modules.length; mIdx++) {
      const mod = outline.modules[mIdx];

      for (let lIdx = 0; lIdx < mod.lessons.length; lIdx++) {
        const lesson = mod.lessons[lIdx];
        const lessonKey = `${mIdx}_${lIdx}`;
        
        if (quizzesData[lessonKey]) {
          console.log(`[Orchestrator] Quizzes skipped (resuming from cache): ${lesson.title}`);
          quizzesDone++;
          continue;
        }

        const lessonContent = lessonsData[lessonKey]?.contentMarkdown || '';

        await updateJobStatus(jobId, {
          progressDetail: `Creating quizzes: Module ${mIdx + 1}, Lesson ${lIdx + 1} — "${lesson.title}"`,
        });

        const quizResult = await runStageWithRetry(`quiz_${lessonKey}`, () =>
          generateQuizzes({
            lessonTitle: lesson.title,
            lessonContent,
            quizCount: quizCount || 3,
            difficulty,
            language: language || 'English',
            jobId,
          }),
          jobId,
          2
        );

        quizzesData[lessonKey] = quizResult;
        await saveProgress();

        quizzesDone++;
        console.log(`[Orchestrator] Quizzes generated: ${quizzesDone}/${totalLessons}`);
      }
    }

    // ═══════════════════════════════════════════════════════════
    // STAGE E — Resource Linking
    // ═══════════════════════════════════════════════════════════
    await updateJobStatus(jobId, {
      currentStage: 'resources',
      progressDetail: 'Linking YouTube videos and resources...',
    });

    clearResourceCache();
    const resourcesData = intermediateState.resourcesData;

    for (let mIdx = 0; mIdx < outline.modules.length; mIdx++) {
      const mod = outline.modules[mIdx];

      for (let lIdx = 0; lIdx < mod.lessons.length; lIdx++) {
        const lesson = mod.lessons[lIdx];
        const lessonKey = `${mIdx}_${lIdx}`;

        if (resourcesData[lessonKey]) continue;

        try {
          resourcesData[lessonKey] = await linkResources({
            lessonTitle: lesson.title,
            courseTitle: outline.title,
            moduleName: mod.title,
          });
          await saveProgress();
        } catch (err) {
          console.warn(`[Orchestrator] Resource linking failed for ${lessonKey}: ${err.message}`);
          resourcesData[lessonKey] = { youtubeVideoId: null, youtubeVideoTitle: null, extraResources: [] };
          await saveProgress();
        }
      }
    }

    // ═══════════════════════════════════════════════════════════
    // STAGE F+G — Bundle Assembly + Draft Save
    // ═══════════════════════════════════════════════════════════
    await updateJobStatus(jobId, {
      currentStage: 'assembling',
      progressDetail: 'Assembling course bundle and saving to database...',
    });

    const { courseId } = await assembleCourseBundle({
      jobId,
      instructorId,
      outline,
      lessonsData,
      quizzesData,
      resourcesData,
      inputParams,
    });

    console.log(`[Orchestrator] ✅ Pipeline complete! Course ${courseId} saved as draft.`);

    // Clean up RAG chunks (they're no longer needed)
    if (hasReferenceDoc) {
      await CourseRagService.cleanup(jobId);
    }

    return { courseId };

  } catch (err) {
    console.error(`[Orchestrator] ❌ Pipeline failed for job ${jobId}: ${err.message}`);
    await updateJobStatus(jobId, {
      status: 'failed',
      errorMessage: err.message,
      progressDetail: `Failed: ${err.message}`,
    });
    throw err;
  }
}
