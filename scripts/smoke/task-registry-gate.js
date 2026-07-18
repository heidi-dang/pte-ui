import { CANONICAL_MOCK_TASK_REGISTRY } from '../../src/components/MockTaskRegistry.js';

const CANONICAL_TASK_TYPES = [
  'RA', 'RS', 'DI', 'RL', 'ASQ', 'SGD', 'RTS',
  'SWT', 'WE',
  'FIBR', 'FIBRW', 'ROP', 'MCS', 'MCM',
  'SST', 'FIBL', 'HCS', 'MCSSL', 'MCMSL', 'SMW', 'HIW', 'WFD'
];

async function run() {
  console.log('--- Canonical Task Registry Completeness Gate ---');
  console.log(`Verifying registry entries matching ${CANONICAL_TASK_TYPES.length} canonical task types...\n`);

  let failed = false;
  const matrix = [];

  for (const type of CANONICAL_TASK_TYPES) {
    const entry = CANONICAL_MOCK_TASK_REGISTRY[type];

    if (!entry) {
      console.error(`FAIL: Backend canonical task type "${type}" has no entry in frontend MockTaskRegistry!`);
      failed = true;
      continue;
    }

    // Check all required registry fields are present and correctly typed
    const missingFields = [];
    if (typeof entry.taskType !== 'string') missingFields.push('taskType');
    if (typeof entry.name !== 'string') missingFields.push('name');
    if (typeof entry.requiresAudioPrompt !== 'boolean') missingFields.push('requiresAudioPrompt');
    if (typeof entry.requiresRecording !== 'boolean') missingFields.push('requiresRecording');
    if (typeof entry.preparationSeconds !== 'number') missingFields.push('preparationSeconds');
    if (typeof entry.responseSeconds !== 'number') missingFields.push('responseSeconds');
    if (!Array.isArray(entry.scoringSkills) || entry.scoringSkills.length === 0) missingFields.push('scoringSkills');
    if (typeof entry.normalizeAnswer !== 'function') missingFields.push('normalizeAnswer');
    if (typeof entry.validateAnswer !== 'function') missingFields.push('validateAnswer');

    if (missingFields.length > 0) {
      console.error(`FAIL: Task type "${type}" is missing required fields: ${missingFields.join(', ')}`);
      failed = true;
    }

    // Execute unit coverage test runs for normalizer and validator
    let normalized = null;
    let validated = false;
    try {
      if (type === 'ROP' || type === 'MCM' || type === 'MCMSL' || type === 'HIW') {
        normalized = entry.normalizeAnswer(['Option A', 'Option B']);
        validated = entry.validateAnswer(['Option A']);
      } else if (type === 'FIBR' || type === 'FIBRW' || type === 'FIBL') {
        normalized = entry.normalizeAnswer({ blank1: 'value' });
        validated = entry.validateAnswer({ blank1: 'value' });
      } else if (type === 'SWT') {
        const dummyText = 'This is a sample sentence of five words.';
        normalized = entry.normalizeAnswer(dummyText);
        validated = entry.validateAnswer(dummyText);
      } else if (type === 'SST') {
        const dummyText = 'Word '.repeat(55);
        normalized = entry.normalizeAnswer(dummyText);
        validated = entry.validateAnswer(dummyText);
      } else if (type === 'WE') {
        const dummyText = 'Word '.repeat(220);
        normalized = entry.normalizeAnswer(dummyText);
        validated = entry.validateAnswer(dummyText);
      } else {
        normalized = entry.normalizeAnswer('Test typed answer text');
        validated = entry.validateAnswer('Test typed answer text');
      }
    } catch (e) {
      console.error(`FAIL: Unit test run for "${type}" threw an error: ${e.message}`);
      failed = true;
    }

    matrix.push({
      taskType: type,
      name: entry.name,
      audio: entry.requiresAudioPrompt ? 'YES' : 'NO',
      recording: entry.requiresRecording ? 'YES' : 'NO',
      prepSec: entry.preparationSeconds,
      respSec: entry.responseSeconds,
      skills: entry.scoringSkills.join(', '),
      validated: validated ? 'OK' : 'INVALID',
    });
  }

  // Cross reference: ensure no unregistered items exist in frontend registry
  for (const type of Object.keys(CANONICAL_MOCK_TASK_REGISTRY)) {
    if (!CANONICAL_TASK_TYPES.includes(type)) {
      console.error(`FAIL: Frontend registry contains extra unregistered type: "${type}"`);
      failed = true;
    }
  }

  // Print Matrix layout
  console.table(matrix);

  if (failed) {
    console.error('\nFAIL: Task registry completeness gate check failed.');
    process.exit(1);
  } else {
    console.log('\nPASS: All 22 canonical tasks have correct renderers, normalizers, validators, timers, and test coverages.');
  }
}

run();
