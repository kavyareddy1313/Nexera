import { z } from 'zod';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { LlmFactory } from '../llm/llmFactory.js';
import { CourseRagService } from './courseRagService.js';

/**
 * Stage B+C — RAG Retrieval + Lesson Content Generation
 * For each lesson: optionally retrieves relevant reference chunks,
 * then generates structured lesson content (markdown + key takeaways).
 */

const LessonContentSchema = z.object({
  contentMarkdown: z.string().describe('Full lesson content in Markdown format with headers, paragraphs, code examples, and bullet points'),
  keyTakeaways: z.array(z.string()).describe('3-5 key takeaways from this lesson'),
});

/**
 * Generate content for a single lesson
 * @param {Object} params
 * @param {string} params.courseTitle
 * @param {string} params.moduleName
 * @param {string} params.lessonTitle
 * @param {string[]} params.lessonObjectives
 * @param {string} params.difficulty
 * @param {string} params.language
 * @param {string} [params.jobId] - For RAG retrieval scoping
 * @param {boolean} [params.hasReferenceDoc=false]
 * @returns {Promise<z.infer<typeof LessonContentSchema>>}
 */
export async function generateLessonContent(params) {
  const {
    courseTitle,
    moduleName,
    lessonTitle,
    lessonObjectives = [],
    difficulty = 'Beginner',
    language = 'English',
    jobId,
    hasReferenceDoc = false,
  } = params;

  // Stage B: RAG retrieval (if reference doc was uploaded)
  let referenceContext = '';
  if (hasReferenceDoc && jobId) {
    referenceContext = await CourseRagService.retrieveForLesson(
      lessonTitle,
      lessonObjectives,
      jobId,
      4
    );
  }

  const hasContext = referenceContext && referenceContext.trim().length > 0;

  const chainFactory = (llm) => {
    const systemMessage = hasContext
      ? `You are an expert educator creating detailed lesson content for an online course.
You have been provided REFERENCE MATERIAL from the instructor's uploaded documents.
Use this reference material to ground your content — ensure factual accuracy by drawing from it.
If the reference material doesn't cover something, you may use your own knowledge but mark uncertain claims with [Needs Review].

REFERENCE MATERIAL:
---
{referenceContext}
---

You MUST return ONLY a valid JSON object with this structure:
{{
  "contentMarkdown": "Full lesson in Markdown with ## headers, paragraphs, examples, bullet points",
  "keyTakeaways": ["takeaway1", "takeaway2", "takeaway3"]
}}

RULES:
- Write in {language}
- Content should be appropriate for {difficulty} level
- Include practical examples and code snippets where relevant
- Use proper Markdown formatting with headers (##, ###), lists, bold, code blocks
- Content should be 600-1200 words
- Return ONLY JSON, no markdown fences or extra text`
      : `You are an expert educator creating detailed lesson content for an online course.
You MUST return ONLY a valid JSON object with this structure:
{{
  "contentMarkdown": "Full lesson in Markdown with ## headers, paragraphs, examples, bullet points",
  "keyTakeaways": ["takeaway1", "takeaway2", "takeaway3"]
}}

RULES:
- Write in {language}
- Content should be appropriate for {difficulty} level
- Include practical examples and code snippets where relevant
- Use proper Markdown formatting with headers (##, ###), lists, bold, code blocks
- Content should be 600-1200 words
- If you're uncertain about a factual claim, mark it with [Needs Review]
- Return ONLY JSON, no markdown fences or extra text`;

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', systemMessage],
      ['human', `Generate lesson content for:

Course: {courseTitle}
Module: {moduleName}
Lesson: {lessonTitle}
Learning Objectives: {objectives}

Write comprehensive, engaging content that covers all the learning objectives.`],
    ]);

    return prompt.pipe(llm);
  };

  const result = await LlmFactory.invokeStructured(
    chainFactory,
    {
      courseTitle,
      moduleName,
      lessonTitle,
      objectives: lessonObjectives.join(', '),
      difficulty,
      language,
      referenceContext: referenceContext || '',
    },
    LessonContentSchema,
    { jobId, stage: 'content' }
  );

  return result;
}
