import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import {
  Course, CourseGenerationJob, CourseModule, CourseLesson, CourseQuiz
} from '../../models/index.js';
import { runPipeline } from '../../services/ai/courseGeneration/orchestrator.js';

export class CourseGeneratorController {

  /**
   * POST /generate
   * Kick off the AI course generation pipeline.
   * Returns immediately with a jobId; pipeline runs asynchronously.
   */
  static generateCourse = asyncHandler(async (req, res) => {
    const {
      topic,
      targetAudience,
      difficulty,
      moduleCount,
      lessonsPerModule,
      language,
      quizCount,
      additionalInstructions,
      category,
      tags,
    } = req.body;

    if (!topic || typeof topic !== 'string' || topic.trim().length < 3) {
      throw ApiError.badRequest('Topic is required (minimum 3 characters).');
    }

    const instructorId = req.user.id;

    // Build input params
    const inputParams = {
      topic: topic.trim(),
      targetAudience: targetAudience || 'General Audience',
      difficulty: difficulty || 'Beginner',
      moduleCount: Math.min(Math.max(parseInt(moduleCount) || 4, 2), 8),
      lessonsPerModule: Math.min(Math.max(parseInt(lessonsPerModule) || 3, 2), 6),
      language: language || 'English',
      quizCount: Math.min(Math.max(parseInt(quizCount) || 3, 1), 5),
      additionalInstructions: additionalInstructions || '',
      category: category || '',
      tags: Array.isArray(tags) ? tags : [],
      referenceDocPath: req.file?.path || null,
    };

    // Create job record
    const job = await CourseGenerationJob.create({
      instructorId,
      inputParams,
      status: 'pending',
      currentStage: 'queued',
      progressDetail: 'Job created, pipeline starting...',
    });

    // Kick off the pipeline asynchronously (non-blocking)
    setTimeout(async () => {
      try {
        await runPipeline(job.id, inputParams, instructorId);
      } catch (err) {
        console.error(`[CourseGenerator] Pipeline error for job ${job.id}: ${err.message}`);
        // Status is already updated to 'failed' by the orchestrator
      }
    }, 0);

    res.status(202).json(ApiResponse.ok(
      { jobId: job.id },
      'Course generation started. Poll /generate/:jobId for progress.'
    ));
  });

  /**
   * GET /generate/:jobId
   * Poll the generation job status and progress.
   */
  static getJobStatus = asyncHandler(async (req, res) => {
    const { jobId } = req.params;
    const job = await CourseGenerationJob.findByPk(jobId);

    if (!job) {
      throw ApiError.notFound('Generation job not found.');
    }

    // If the job is draft_ready, also find the generated course ID
    let courseId = null;
    if (job.status === 'draft_ready' || job.status === 'published') {
      const course = await Course.findOne({
        where: { generationJobId: jobId },
        attributes: ['id'],
      });
      courseId = course?.id || null;
    }

    res.json(ApiResponse.ok({
      jobId: job.id,
      status: job.status,
      currentStage: job.currentStage,
      progressDetail: job.progressDetail,
      errorMessage: job.errorMessage,
      courseId,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    }));
  });

  /**
   * POST /generate/:jobId/retry
   * Retry a failed generation job.
   */
  static retryJob = asyncHandler(async (req, res) => {
    const { jobId } = req.params;
    const job = await CourseGenerationJob.findByPk(jobId);

    if (!job) throw ApiError.notFound('Generation job not found.');
    if (job.status !== 'failed') throw ApiError.badRequest('Can only retry failed jobs.');

    // Reset job status
    await job.update({
      status: 'pending',
      errorMessage: null,
      progressDetail: 'Retrying pipeline...',
    });

    // Re-run pipeline
    setTimeout(async () => {
      try {
        await runPipeline(job.id, job.inputParams, job.instructorId);
      } catch (err) {
        console.error(`[CourseGenerator] Retry failed for job ${job.id}: ${err.message}`);
      }
    }, 0);

    res.json(ApiResponse.ok({ jobId: job.id }, 'Retry started.'));
  });

  /**
   * GET /courses/:courseId/draft
   * Get the full course bundle for review UI.
   */
  static getDraft = asyncHandler(async (req, res) => {
    const { courseId } = req.params;

    const course = await Course.findByPk(courseId, {
      include: [
        {
          model: CourseModule,
          as: 'modules',
          include: [
            {
              model: CourseLesson,
              as: 'lessons',
              include: [
                { model: CourseQuiz, as: 'quizzes' },
              ],
              order: [['order_index', 'ASC']],
            },
          ],
          order: [['order_index', 'ASC']],
        },
      ],
      order: [
        [{ model: CourseModule, as: 'modules' }, 'order_index', 'ASC'],
        [{ model: CourseModule, as: 'modules' }, { model: CourseLesson, as: 'lessons' }, 'order_index', 'ASC'],
      ],
    });

    if (!course) throw ApiError.notFound('Course not found.');

    res.json(ApiResponse.ok({ course }));
  });

  /**
   * PATCH /courses/:courseId/lessons/:lessonId
   * Update a lesson's content, quiz, or YouTube link.
   */
  static updateLesson = asyncHandler(async (req, res) => {
    const { lessonId } = req.params;
    const {
      title,
      contentMarkdown,
      keyTakeaways,
      youtubeVideoId,
      youtubeVideoTitle,
      extraResources,
      quizzes,
    } = req.body;

    const lesson = await CourseLesson.findByPk(lessonId);
    if (!lesson) throw ApiError.notFound('Lesson not found.');

    // Update lesson fields
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (contentMarkdown !== undefined) updates.contentMarkdown = contentMarkdown;
    if (keyTakeaways !== undefined) updates.keyTakeaways = keyTakeaways;
    if (youtubeVideoId !== undefined) updates.youtubeVideoId = youtubeVideoId;
    if (youtubeVideoTitle !== undefined) updates.youtubeVideoTitle = youtubeVideoTitle;
    if (extraResources !== undefined) updates.extraResources = extraResources;

    if (Object.keys(updates).length > 0) {
      await lesson.update(updates);
    }

    // Update quizzes if provided
    if (Array.isArray(quizzes)) {
      // Delete existing quizzes and recreate
      await CourseQuiz.destroy({ where: { lessonId } });
      for (const quiz of quizzes) {
        await CourseQuiz.create({
          lessonId,
          question: quiz.question,
          options: quiz.options,
          correctOptionIndex: quiz.correctOptionIndex,
          explanation: quiz.explanation || '',
        });
      }
    }

    // Fetch updated lesson with quizzes
    const updated = await CourseLesson.findByPk(lessonId, {
      include: [{ model: CourseQuiz, as: 'quizzes' }],
    });

    res.json(ApiResponse.ok({ lesson: updated }, 'Lesson updated.'));
  });

  /**
   * POST /courses/:courseId/publish
   * Validate and publish the course.
   */
  static publishCourse = asyncHandler(async (req, res) => {
    const { courseId } = req.params;

    const course = await Course.findByPk(courseId, {
      include: [
        {
          model: CourseModule,
          as: 'modules',
          include: [
            {
              model: CourseLesson,
              as: 'lessons',
              include: [{ model: CourseQuiz, as: 'quizzes' }],
            },
          ],
        },
      ],
    });

    if (!course) throw ApiError.notFound('Course not found.');
    if (course.status === 'published') throw ApiError.badRequest('Course is already published.');

    // Validation: ensure completeness
    const missingItems = [];

    if (!course.modules || course.modules.length === 0) {
      missingItems.push('Course has no modules.');
    }

    for (const mod of (course.modules || [])) {
      if (!mod.lessons || mod.lessons.length === 0) {
        missingItems.push(`Module "${mod.title}" has no lessons.`);
        continue;
      }

      for (const lesson of mod.lessons) {
        if (!lesson.contentMarkdown || lesson.contentMarkdown.trim().length < 50) {
          missingItems.push(`Lesson "${lesson.title}" in module "${mod.title}" has insufficient content.`);
        }
        if (!lesson.quizzes || lesson.quizzes.length === 0) {
          missingItems.push(`Lesson "${lesson.title}" in module "${mod.title}" has no quiz questions.`);
        }
      }
    }

    if (missingItems.length > 0) {
      throw ApiError.badRequest('Course is not ready for publishing.', missingItems);
    }

    // Publish
    await course.update({
      status: 'published',
      publishedAt: new Date(),
    });

    // Update job status if linked
    if (course.generationJobId) {
      await CourseGenerationJob.update(
        { status: 'published' },
        { where: { id: course.generationJobId } }
      );
    }

    res.json(ApiResponse.ok({ courseId: course.id }, 'Course published successfully!'));
  });
}
