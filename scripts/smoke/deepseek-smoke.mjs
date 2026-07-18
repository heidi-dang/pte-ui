import { getAiProvider } from '../../src/server/ai/provider.js';
import { aiGradingSchema } from '../../src/server/aiService.js';

async function run() {
  console.log('--- DeepSeek AI Provider Smoke Test ---');
  
  const provider = getAiProvider();
  console.log(`Resolved Provider client: ${provider.constructor.name}`);

  if (process.env.AI_PROVIDER === 'deepseek' && !process.env.DEEPSEEK_API_KEY) {
    console.log('Skipping live DeepSeek smoke check (DEEPSEEK_API_KEY is not configured).');
    return;
  }

  try {
    const systemPrompt = 'Evaluate the user text and return a JSON matching the grading schema.';
    const prompt = 'The quick brown fox jumps over the lazy dog.';

    console.log('Sending structured text request to AI provider...');
    const start = Date.now();
    const result = await provider.generateStructured({
      systemPrompt,
      prompt,
      schema: aiGradingSchema,
    });
    const duration = Date.now() - start;

    console.log(`  Duration: ${duration}ms`);
    console.log(`  RequestId: ${result.requestId}`);
    console.log(`  Tokens: Prompt=${result.promptTokens}, Completion=${result.completionTokens}, Total=${result.totalTokens}`);
    console.log('  PASS: DeepSeek Structured Schema Completion succeeds.');
  } catch (err) {
    console.error('FAIL: DeepSeek smoke request failed:', err);
    process.exit(1);
  }
}

run();
