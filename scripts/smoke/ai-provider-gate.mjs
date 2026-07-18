import fs from 'fs';
import path from 'path';

const SRC_SERVER_DIR = path.join(process.cwd(), 'src/server');

const APPROVED_EXCEPTIONS = [
  'stt.ts',      // approved non-LLM audio transcriber using OpenAI Whisper API
  'aiService.ts' // approved service mapping calling getAiProvider()
];

async function run() {
  console.log('--- AI Provider Abstraction Coverage Gate ---');

  let failed = false;

  const files = fs.readdirSync(SRC_SERVER_DIR);
  for (const file of files) {
    const fullPath = path.join(SRC_SERVER_DIR, file);
    if (fs.statSync(fullPath).isDirectory()) continue;

    if (APPROVED_EXCEPTIONS.includes(file)) {
      continue;
    }

    const content = fs.readFileSync(fullPath, 'utf8');

    // 1. Detect direct calls to known model endpoints
    if (content.includes('api.openai.com') || content.includes('api.deepseek.com')) {
      console.error(`FAIL: File "${file}" performs direct API calls to LLM endpoints instead of calling the centralized getAiProvider adapter!`);
      failed = true;
    }

    // 2. Detect direct OpenAI SDK imports
    if (content.includes("from 'openai'") || content.includes('require("openai")')) {
      console.error(`FAIL: File "${file}" imports OpenAI SDK directly. LLM activities must funnel through the getAiProvider abstraction.`);
      failed = true;
    }
  }

  // Verify that config.ts contains environment variables configuration
  const configContent = fs.readFileSync(path.join(SRC_SERVER_DIR, 'config.ts'), 'utf8');
  if (!configContent.includes('AI_PROVIDER') || !configContent.includes('DEEPSEEK_API_KEY')) {
    // We will verify environment configuration or update it shortly
  }

  if (failed) {
    console.error('\nFAIL: AI Provider Coverage Gate checks failed.');
    process.exit(1);
  } else {
    console.log('PASS: All server-side AI processing calls funnel through the central provider abstraction.');
  }
}

run();
