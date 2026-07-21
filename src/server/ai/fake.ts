import { AiProvider, AiTextRequest, AiStructuredRequest, AiCompletionResult, AiStructuredResult } from './types';

export class FakeProvider implements AiProvider {
  async generateText(request: AiTextRequest): Promise<AiCompletionResult> {
    return {
      provider: 'fake',
      model: 'mock-deepseek-chat',
      content: 'This is a mocked deterministic AI response.',
      finishReason: 'stop',
      promptTokens: 10,
      completionTokens: 20,
      totalTokens: 30,
      requestId: 'mock-request-id-123',
    };
  }

  async generateStructured<T>(request: AiStructuredRequest<T>): Promise<AiStructuredResult<T>> {
    // Check if the system prompt hints at grading or study plan generation
    const isStudyPlan = request.systemPrompt.includes('Pedagogical Consultant');
    const isQuestionGen = request.systemPrompt.includes('generation');

    let responseData: any;

    if (isStudyPlan) {
      responseData = {
        estimatedScores: {
          speaking: 68,
          writing: 62,
          reading: 65,
          listening: 70,
        },
        studyPlan: `### PTE Master Personalized Study Plan (Mocked AI Model)
- **Speaking Estimated**: 68/90
- **Writing Estimated**: 62/90
- **Reading Estimated**: 65/90
- **Listening Estimated**: 70/90`,
      };
    } else if (isQuestionGen) {
      const match = request.prompt.match(/exactly (\d+) .* \(([A-Z]+)\)/i);
      const count = match ? parseInt(match[1], 10) : 1;
      const taskCode = match ? match[2] : 'MCS';

      const { TASK_TEMPLATES } = require('../questionGeneration/prompts');
      const template = TASK_TEMPLATES[taskCode] || TASK_TEMPLATES['MCS'];

      responseData = {
        questions: Array.from({ length: count }, (_, i) => ({
          ...template,
          title: `${template.title} (Mock ${i + 1})`,
        }))
      };
    } else {
      // Mock Grading Response matching standard grading Zod schema
      responseData = {
        content: 4.5,
        form: 2.0,
        grammar: 4.0,
        vocabulary: 4.5,
        coherence: 4.0,
        pronunciation: 4.0,
        oralFluency: 4.5,
        feedback: '### PTE Evaluation Feedback\nExcellent presentation and structure.',
        evidence: ['excellent presentation', 'structure'],
      };
    }

    // Validate using Zod schema if available
    if (request.schema) {
      const result = request.schema.safeParse(responseData);
      if (!result.success) {
        throw new Error(`Fake response failed schema validation: ${result.error.message}`);
      }
      responseData = result.data;
    }

    return {
      provider: 'fake',
      model: 'mock-deepseek-chat',
      data: responseData as T,
      finishReason: 'stop',
      promptTokens: 15,
      completionTokens: 25,
      totalTokens: 40,
      requestId: 'mock-request-id-456',
    };
  }
}
