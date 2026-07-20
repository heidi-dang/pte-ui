import { z } from 'zod';
import { TaskCode } from '../../shared/questionTaskRegistry';
import { getAiProvider } from '../ai/provider';
import { ReviewScore } from './types';

const ReviewResponseSchema = z.object({
  score: z.number().min(0).max(100),
  reasoning: z.string(),
});

export async function runReviewerPass(candidate: any, taskCode: TaskCode): Promise<ReviewScore> {
  const provider = getAiProvider();
  const prompt = `
You are an expert reviewer for PTE Academic. Review this generated ${taskCode} question candidate.
Evaluate on:
1. Task authenticity
2. Answer correctness
3. Distractor quality (if applicable)
4. Academic clarity
5. Difficulty accuracy
6. Originality
7. Ambiguity
8. Student usability

Candidate JSON:
${JSON.stringify(candidate, null, 2)}

Provide a single JSON object with two fields:
{
  "score": number (0-100),
  "reasoning": "string"
}
  `;

  try {
    const result = await provider.generateStructured({
      systemPrompt: 'You are a PTE Academic question quality reviewer. Return only valid JSON.',
      prompt,
      temperature: 0.1,
      schema: ReviewResponseSchema,
    });

    const data = result.data as { score: number; reasoning: string };
    return {
      score: data.score || 0,
      reasoning: data.reasoning || 'Failed to parse reasoning',
    };
  } catch (err: any) {
    return {
      score: 0,
      reasoning: 'Reviewer exception: ' + err.message,
    };
  }
}
