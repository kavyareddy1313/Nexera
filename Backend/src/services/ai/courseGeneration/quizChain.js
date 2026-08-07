import { z } from 'zod';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { LlmFactory } from '../llm/llmFactory.js';

/**
 * Stage D — Quiz Generation
 * Generates MCQ quizzes for each lesson, grounded in that lesson's content.
 */

const QuizItemSchema = z.object({
  question: z.string(),
  options: z.array(z.string()).length(4).describe('Exactly 4 answer options'),
  correctOptionIndex: z.number().min(0).max(3),
  explanation: z.string().describe('Why the correct answer is correct'),
});

const QuizBatchSchema = z.object({
  quizzes: z.array(QuizItemSchema),
});

/**
 * Generate quiz questions for a single lesson
 * @param {Object} params
 * @param {string} params.lessonTitle
 * @param {string} params.lessonContent - The generated markdown content
 * @param {number} [params.quizCount=3]
 * @param {string} [params.difficulty='Beginner']
 * @param {string} [params.language='English']
 * @param {string} [params.jobId]
 * @returns {Promise<z.infer<typeof QuizBatchSchema>>}
 */
export async function generateQuizzes(params) {
  const {
    lessonTitle,
    lessonContent,
    quizCount = 3,
    difficulty = 'Beginner',
    language = 'English',
    jobId,
  } = params;

  const chainFactory = (llm) => {
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', `You are an expert educator creating quiz questions.
Generate exactly {quizCount} multiple-choice questions based on the lesson content provided.

CRITICAL RULES:
- Each question MUST be directly answerable from the lesson content — do NOT hallucinate questions about topics not covered
- Each question must have exactly 4 options (A, B, C, D)
- correctOptionIndex is 0-based (0=A, 1=B, 2=C, 3=D)
- Include a clear explanation for each correct answer
- Questions should test understanding, not just memorization
- Difficulty: {difficulty}
- Language: {language}

You MUST return ONLY valid JSON matching this structure:
{{
  "quizzes": [
    {{
      "question": "string",
      "options": ["A answer", "B answer", "C answer", "D answer"],
      "correctOptionIndex": 0,
      "explanation": "string"
    }}
  ]
}}`],
      ['human', `Lesson Title: {lessonTitle}

Lesson Content:
{lessonContent}

Generate {quizCount} quiz questions based on this lesson content.`],
    ]);

    return prompt.pipe(llm);
  };

  const result = await LlmFactory.invokeStructured(
    chainFactory,
    {
      lessonTitle,
      lessonContent: lessonContent.slice(0, 3000), // Trim to avoid token limits
      quizCount: String(quizCount),
      difficulty,
      language,
    },
    QuizBatchSchema,
    { jobId, stage: 'quiz' }
  );

  return result;
}
