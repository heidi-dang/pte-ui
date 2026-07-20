import { z } from 'zod';
import { TaskCode } from '../../shared/questionTaskRegistry';
import { getAiProvider } from '../ai/provider';
import { buildGenerationPrompt } from './prompts';
import { GeneratorResult } from './types';

const QuestionArraySchema = z.array(z.object({
  taskCode: z.string(),
  title: z.string(),
  instruction: z.string(),
  promptText: z.string(),
  optionsJson: z.string().optional(),
  answerKeyJson: z.string().optional(),
  sampleAnswer: z.string().optional(),
  explanation: z.string().optional(),
  difficulty: z.string(),
  passageText: z.string().optional(),
}).passthrough());

const GenerationResponseSchema = z.object({
  questions: QuestionArraySchema,
}).or(z.array(z.record(z.string(), z.unknown())));

export async function generateQuestionChunk(taskCode: TaskCode, difficulty: string, count: number, topic?: string): Promise<GeneratorResult> {
  const provider = getAiProvider();
  const prompt = buildGenerationPrompt(taskCode, difficulty, count, topic);

  try {
    const result = await provider.generateStructured({
      systemPrompt: 'You are a PTE Academic question generation assistant. Generate valid JSON output.',
      prompt,
      temperature: 0.7,
      schema: GenerationResponseSchema,
    });

    const parsed = result.data as any;
    const questions = Array.isArray(parsed) ? parsed : parsed?.questions || [];

    return {
      questions,
      provider: 'DeepSeek',
      model: 'deepseek-chat',
      promptTokens: 0,
      completionTokens: 0,
    };
  } catch (err: any) {
    throw new Error(`AI Generation failed: ${err.message}`);
  }
}
