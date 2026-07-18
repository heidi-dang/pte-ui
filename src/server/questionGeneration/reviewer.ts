import { TaskCode } from '../../shared/questionTaskRegistry';
import { getAiProvider } from '../aiService';
import { ReviewScore } from './types';

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

Provide a single JSON object (no markdown) with two fields:
{
  "score": number (0-100),
  "reasoning": "string"
}
  `;

  try {
    const resultText = await provider.generateCompletion(prompt, { temperature: 0.1 });
    let parsed: ReviewScore;
    try {
      parsed = JSON.parse(resultText);
    } catch {
      // If it has markdown, try to strip
      const stripped = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(stripped);
    }
    
    return {
      score: parsed.score || 0,
      reasoning: parsed.reasoning || 'Failed to parse reasoning'
    };
  } catch (err: any) {
    return {
      score: 0,
      reasoning: 'Reviewer exception: ' + err.message
    };
  }
}
