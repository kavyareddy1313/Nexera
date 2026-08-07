import { Course, CourseModule, CourseLesson, CourseQuiz, CourseGenerationJob } from '../../../models/index.js';

/**
 * Stage F+G — Bundle Assembly + Draft Save
 * Persists the generated course data into the database as a draft.
 */

/**
 * Assemble and persist the full course bundle
 * @param {Object} params
 * @param {string} params.jobId
 * @param {string} params.instructorId
 * @param {Object} params.outline - Generated outline from Stage A
 * @param {Object} params.lessonsData - Map of `moduleIdx_lessonIdx` → { contentMarkdown, keyTakeaways }
 * @param {Object} params.quizzesData - Map of `moduleIdx_lessonIdx` → { quizzes: [...] }
 * @param {Object} params.resourcesData - Map of `moduleIdx_lessonIdx` → { youtubeVideoId, youtubeVideoTitle, extraResources }
 * @param {Object} params.inputParams - Original form input for metadata
 * @returns {Promise<{ courseId: string }>}
 */
export async function assembleCourseBundle(params) {
  const {
    jobId,
    instructorId,
    outline,
    lessonsData,
    quizzesData,
    resourcesData,
    inputParams,
  } = params;

  // 1. Create Course record (draft status)
  const course = await Course.create({
    generationJobId: jobId,
    instructorId,
    title: outline.title,
    description: outline.description,
    category: outline.category,
    duration: outline.duration,
    level: inputParams.difficulty || 'Beginner',
    language: inputParams.language || 'English',
    tags: inputParams.tags || [],
    status: 'draft',
    price: 0,
  });

  // 2. Create Modules + Lessons + Quizzes
  for (let mIdx = 0; mIdx < outline.modules.length; mIdx++) {
    const mod = outline.modules[mIdx];

    const courseModule = await CourseModule.create({
      courseId: course.id,
      title: mod.title,
      description: mod.description,
      orderIndex: mIdx,
      learningObjectives: mod.learningObjectives || [],
    });

    for (let lIdx = 0; lIdx < mod.lessons.length; lIdx++) {
      const lesson = mod.lessons[lIdx];
      const lessonKey = `${mIdx}_${lIdx}`;
      const lessonData = lessonsData[lessonKey] || {};
      const resourceData = resourcesData[lessonKey] || {};

      const courseLesson = await CourseLesson.create({
        moduleId: courseModule.id,
        title: lesson.title,
        orderIndex: lIdx,
        contentMarkdown: lessonData.contentMarkdown || '',
        keyTakeaways: lessonData.keyTakeaways || [],
        youtubeVideoId: resourceData.youtubeVideoId || null,
        youtubeVideoTitle: resourceData.youtubeVideoTitle || null,
        extraResources: resourceData.extraResources || [],
        generationStatus: lessonData.contentMarkdown ? 'completed' : 'pending',
      });

      // Create quizzes for this lesson
      const quizData = quizzesData[lessonKey] || {};
      const quizzes = quizData.quizzes || [];

      for (const quiz of quizzes) {
        await CourseQuiz.create({
          lessonId: courseLesson.id,
          question: quiz.question,
          options: quiz.options,
          correctOptionIndex: quiz.correctOptionIndex,
          explanation: quiz.explanation || '',
        });
      }
    }
  }

  // 3. Update the generation job
  await CourseGenerationJob.update(
    { status: 'draft_ready', currentStage: 'completed', progressDetail: 'Course bundle assembled' },
    { where: { id: jobId } }
  );

  return { courseId: course.id };
}
