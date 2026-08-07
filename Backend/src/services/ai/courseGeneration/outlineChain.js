import { z } from 'zod';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { LlmFactory } from '../llm/llmFactory.js';

/**
 * Stage A — Outline Generation
 * Generates a structured course outline (modules → lessons → objectives)
 * without full content. Keeps token usage low and output reliable.
 */

// Zod schema for the outline
export const OutlineSchema = z.object({
  title: z.string().describe('Catchy, professional course title'),
  description: z.string().describe('Compelling 2-3 paragraph course description'),
  category: z.string().describe('Category: Programming, Design, Business, etc.'),
  duration: z.string().describe('Estimated total duration, e.g. "6 Weeks" or "20 Hours"'),
  modules: z.array(z.object({
    title: z.string(),
    description: z.string(),
    learningObjectives: z.array(z.string()).describe('3-5 learning objectives for this module'),
    lessons: z.array(z.object({
      title: z.string(),
      objectives: z.array(z.string()).describe('2-4 learning objectives for this lesson'),
      estimatedMinutes: z.number().describe('Estimated lesson duration in minutes'),
    })),
  })),
});

/**
 * Generate a course outline from instructor input parameters
 * @param {Object} params
 * @param {string} params.topic
 * @param {string} params.targetAudience
 * @param {string} params.difficulty
 * @param {number} params.moduleCount
 * @param {number} params.lessonsPerModule
 * @param {string} params.language
 * @param {string} [params.additionalInstructions]
 * @param {string} [params.jobId]
 * @returns {Promise<z.infer<typeof OutlineSchema>>}
 */
export async function generateOutline(params) {
  const {
    topic,
    targetAudience = 'General Audience',
    difficulty = 'Beginner',
    moduleCount = 4,
    lessonsPerModule = 3,
    language = 'English',
    additionalInstructions = '',
    jobId,
  } = params;

  const chainFactory = (llm) => {
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', `You are an expert curriculum designer and educator.
Your task is to design a comprehensive, structured course outline.
You MUST return ONLY a valid JSON object — no markdown, no backticks, no explanation text.

The JSON must match this exact structure:
{{
  "title": "string",
  "description": "string (2-3 paragraphs)",
  "category": "string",
  "duration": "string",
  "modules": [
    {{
      "title": "string",
      "description": "string",
      "learningObjectives": ["string", "string", "string"],
      "lessons": [
        {{
          "title": "string",
          "objectives": ["string", "string"],
          "estimatedMinutes": 30
        }}
      ]
    }}
  ]
}}

RULES:
- Generate exactly {moduleCount} modules
- Each module must have exactly {lessonsPerModule} lessons
- All content must be in {language}
- Ensure progressive difficulty across modules
- Learning objectives must be specific and measurable`],
      ['human', `Create a course outline about: {topic}

Target Audience: {targetAudience}
Difficulty Level: {difficulty}
Additional Instructions: {additionalInstructions}

Remember: Return ONLY the JSON object, nothing else.`],
    ]);

    return prompt.pipe(llm);
  };

  const outline = await LlmFactory.invokeStructured(
    chainFactory,
    {
      topic,
      targetAudience,
      difficulty,
      moduleCount: String(moduleCount),
      lessonsPerModule: String(lessonsPerModule),
      language,
      additionalInstructions: additionalInstructions || 'None',
    },
    OutlineSchema,
    { jobId, stage: 'outline' }
  );

  return outline;
}
