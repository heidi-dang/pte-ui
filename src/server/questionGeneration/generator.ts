import { z } from 'zod';
import { TaskCode } from '../../shared/questionTaskRegistry';
import { getAiProvider } from '../ai/provider';
import { buildGenerationPrompt } from './prompts';
import { GeneratorResult } from './types';

// Pass-through schema that accepts any shape; all validation happens downstream
const PassthroughSchema = z.object({}).passthrough();

export async function generateQuestionChunk(taskCode: TaskCode, difficulty: string, count: number, topic?: string): Promise<GeneratorResult> {
  const provider = getAiProvider();
  const prompt = buildGenerationPrompt(taskCode, difficulty, count, topic);

  try {
    const result = await provider.generateStructured({
      systemPrompt: 'You are a PTE Academic question generation assistant. Generate valid JSON output.',
      prompt,
      temperature: 0.7,
      schema: PassthroughSchema,
    });

    const parsed = result.data as any;
    let rawQuestions: any[] = Array.isArray(parsed) ? parsed : parsed?.questions || [];

    // Normalize each question: inject taskCode from context if missing
    const questions = rawQuestions.map((q: any) => ({
      taskCode,
      title: q.title || '',
      instruction: q.instruction || '',
      promptText: q.promptText || '',
      difficulty: q.difficulty || difficulty,
      passageText: q.passageText || '',
      sampleAnswer: q.sampleAnswer || '',
      explanation: q.explanation || '',
      tags: q.tags || [],
      taskPayload: q.taskPayload || {},
      ...q,
    }));

    if (questions.length === 0) {
      throw new Error('AI returned empty question array');
    }

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
