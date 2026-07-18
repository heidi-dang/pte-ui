import { TaskCode } from '../../shared/questionTaskRegistry';
import { getAiProvider } from '../aiService';
import { buildGenerationPrompt } from './prompts';
import { GeneratorResult } from './types';

export async function generateQuestionChunk(taskCode: TaskCode, difficulty: string, count: number, topic?: string): Promise<GeneratorResult> {
  const provider = getAiProvider();
  const prompt = buildGenerationPrompt(taskCode, difficulty, count, topic);

  // We rely on the existing getAiProvider which supports structured output/JSON mode.
  // Assuming it returns a JSON string that we can parse.
  try {
    const responseText = await provider.generateCompletion(prompt, { 
      temperature: 0.7,
      // If the provider supports jsonMode or format, it should be configured there. 
      // We will enforce the JSON block extraction here as a fallback.
    });

    let cleaned = responseText;
    const match = responseText.match(/```json\n([\s\S]*?)\n```/);
    if (match) {
      cleaned = match[1];
    }

    const parsed = JSON.parse(cleaned);
    
    return {
      questions: Array.isArray(parsed) ? parsed : (parsed.questions || []),
      provider: 'DeepSeek',
      model: 'deepseek-chat',
      promptTokens: 0, // Mock token count since aiService might not expose it yet
      completionTokens: 0
    };
  } catch (err: any) {
    throw new Error(`AI Generation failed: ${err.message}`);
  }
}
