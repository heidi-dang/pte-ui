import { buildGenerationPrompt } from '../src/server/questionGeneration/prompts';

const tasks = ['RA', 'WFD', 'FIBR', 'DI', 'MCS', 'HIW'];

for (const t of tasks) {
  try {
    const prompt = buildGenerationPrompt(t as any, 'hard', 2, 'Biology');
    console.log(`\n\n=== PROMPT FOR ${t} ===`);
    console.log(prompt);
  } catch (err) {
    console.error(`Error building prompt for ${t}:`, err);
  }
}
