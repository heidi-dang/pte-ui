import { TaskCode, QUESTION_REGISTRY } from '../../shared/questionTaskRegistry';

export const PROMPT_VERSION = '1.0.0';

export function buildGenerationPrompt(taskCode: TaskCode, difficulty: string, count: number, topic?: string): string {
  const taskDef = QUESTION_REGISTRY[taskCode];
  return `
You are an expert curriculum designer for PTE (Pearson Test of English) Academic.
Your task is to generate exactly ${count} original practice question(s) for the task type: ${taskDef.name} (${taskCode}).

STRICT CONSTRAINTS:
1. Content must be original.
2. Do not reproduce official Pearson questions.
3. Do not copy known online practice questions.
4. Produce the exact selected task type.
5. Use Australian/British academic English consistently.
6. Produce plausible distractors rather than obviously incorrect options.
7. Include sufficient answer justification.
8. Keep the questions topically varied (unless a specific topic is requested).
${topic ? `\nTarget Topic/Domain: ${topic}` : ''}
Target Difficulty: ${difficulty}

You must return ONLY a JSON object that satisfies the requested schema.
Each question must include: title, instruction, promptText, difficulty, tags, and explanation (if applicable).
For task payload and asset requirements, closely follow the schema for ${taskCode}.
`;
}
