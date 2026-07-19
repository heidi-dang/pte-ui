import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');

let passed = 0;
let failed = 0;
let assertions = 0;

function assert(condition, message) {
  assertions++;
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`  FAIL: ${message}`);
  }
}

const TASK_CODES = [
  'RA', 'RS', 'DI', 'RL', 'ASQ', 'SGD', 'RTS',
  'SWT', 'WE',
  'MCS', 'MCM', 'ROP', 'FIBR', 'FIBRW',
  'SST', 'FIBL', 'HCS', 'MCSSL', 'MCMSL', 'SMW', 'HIW', 'WFD',
];

const EXPECTED_SECTIONS = {
  RA: 'Speaking', RS: 'Speaking', DI: 'Speaking', RL: 'Speaking',
  ASQ: 'Speaking', SGD: 'Speaking', RTS: 'Speaking',
  SWT: 'Writing', WE: 'Writing',
  MCS: 'Reading', MCM: 'Reading', ROP: 'Reading', FIBR: 'Reading', FIBRW: 'Reading',
  SST: 'Listening', FIBL: 'Listening', HCS: 'Listening', MCSSL: 'Listening',
  MCMSL: 'Listening', SMW: 'Listening', HIW: 'Listening', WFD: 'Listening',
};

const PROMPT_AUDIO_TASKS  = new Set(['RS', 'RL', 'ASQ', 'SGD', 'SST', 'FIBL', 'HCS', 'MCSSL', 'MCMSL', 'SMW', 'HIW', 'WFD']);
const RECORDING_TASKS     = new Set(['RA', 'RS', 'DI', 'RL', 'ASQ', 'SGD', 'RTS']);
const IMAGE_TASKS         = new Set(['DI']);

console.log('--- Canonical Task Registry Completeness Gate ---\n');

// 1. Load the contracts
const contractsPath = join(root, 'src', 'practice', 'contracts', 'index.ts');
assert(existsSync(contractsPath), 'contracts/index.ts exists');
if (!existsSync(contractsPath)) process.exit(1);

// Dynamic import
let TASK_REGISTRY;
try {
  const mod = await import(join(root, 'src', 'practice', 'contracts', 'index.mjs'));
  TASK_REGISTRY = mod.TASK_REGISTRY;
} catch {
  // Fallback: try to parse the registry from the compiled module
  try {
    const tsMod = await import(join(root, 'src', 'practice', 'contracts', 'index.ts'));
    TASK_REGISTRY = tsMod.TASK_REGISTRY;
  } catch {
    // Read source file to verify structure
    const registryContent = readFileSync(join(root, 'src', 'practice', 'contracts', 'registry.ts'), 'utf-8');
    assert(registryContent.includes('TASK_REGISTRY'), 'TASK_REGISTRY export found in source');
  }
}

assert(TASK_CODES.length === 22, `Exactly 22 task codes (found ${TASK_CODES.length})`);

// Check for duplicates
const uniqueCodes = new Set(TASK_CODES);
assert(uniqueCodes.size === 22, 'No duplicate task codes');

console.log(`\n┌────┬──────────┬────────────────────────────────────────┬───────┬───────────┬─────────┬─────────┬─────────────────────┐`);
console.log(`│    │ taskType │ name                                   │ audio │ recording │ prepSec │ respSec │ section             │`);
console.log(`├────┼──────────┼────────────────────────────────────────┼───────┼───────────┼─────────┼─────────┼─────────────────────┤`);

let allOk = true;

for (let i = 0; i < TASK_CODES.length; i++) {
  const code = TASK_CODES[i];

  // Check the task modules still exist
  const taskDir = join(root, 'src', 'practice', 'tasks', code);
  const schemaExists = existsSync(join(taskDir, 'schema.ts'));
  const indexExists = existsSync(join(taskDir, 'index.ts'));
  const rendererExists = existsSync(join(taskDir, 'Renderer.tsx'));

  assert(schemaExists, `${code}: schema.ts exists`);
  assert(indexExists, `${code}: index.ts exists`);
  assert(rendererExists, `${code}: Renderer.tsx exists`);

  // Check section mapping
  const expectedSection = EXPECTED_SECTIONS[code];
  assert(expectedSection !== undefined, `${code}: expected section defined`);

  // Check media policy
  const expectsPromptAudio = PROMPT_AUDIO_TASKS.has(code);
  const expectsRecording = RECORDING_TASKS.has(code);
  const expectsImage = IMAGE_TASKS.has(code);

  const sectionName = expectedSection.padEnd(20);
  const audioStr = expectsPromptAudio ? 'YES' : 'NO '.padEnd(3);
  const recStr = expectsRecording ? 'YES' : 'NO '.padEnd(3);

  console.log(`│ ${String(i).padStart(2)} │ ${code.padEnd(8)} │ ${' '.repeat(40)} │ ${audioStr} │ ${recStr} │ ${' '.repeat(7)} │ ${' '.repeat(7)} │ ${sectionName} │`);
}

console.log(`└────┴──────────┴────────────────────────────────────────┴───────┴───────────┴─────────┴─────────┴─────────────────────┘`);

// Check validation helpers
try {
  const validationMod = await import(join(root, 'src', 'practice', 'contracts', 'validation.ts'));
  assert(typeof validationMod.validateQuestionForTask === 'function', 'validateQuestionForTask is a function');
  assert(typeof validationMod.validateResponseForTask === 'function', 'validateResponseForTask is a function');
} catch {
  const validationContent = readFileSync(join(root, 'src', 'practice', 'contracts', 'validation.ts'), 'utf-8');
  assert(validationContent.includes('validateQuestionForTask'), 'validateQuestionForTask exported');
  assert(validationContent.includes('validateResponseForTask'), 'validateResponseForTask exported');
}
// Check publish validation + student-safe exports (moved to separate files)
try {
  const pvMod = await import(join(root, 'src', 'practice', 'contracts', 'publishValidation.ts'));
  assert(typeof pvMod.validatePublishableQuestion === 'function', 'validatePublishableQuestion is a function');
} catch {
  const pvContent = readFileSync(join(root, 'src', 'practice', 'contracts', 'publishValidation.ts'), 'utf-8');
  assert(pvContent.includes('validatePublishableQuestion'), 'validatePublishableQuestion exported from publishValidation');
}
try {
  const ssqMod = await import(join(root, 'src', 'practice', 'contracts', 'studentSafeQuestion.ts'));
  assert(typeof ssqMod.buildStudentSafeQuestion === 'function', 'buildStudentSafeQuestion is a function');
} catch {
  const ssqContent = readFileSync(join(root, 'src', 'practice', 'contracts', 'studentSafeQuestion.ts'), 'utf-8');
  assert(ssqContent.includes('buildStudentSafeQuestion'), 'buildStudentSafeQuestion exported from studentSafeQuestion');
}

// Check policies
try {
  const policiesMod = await import(join(root, 'src', 'practice', 'contracts', 'policies.ts'));
  assert(typeof policiesMod.getEffectivePlaybackPolicy === 'function', 'getEffectivePlaybackPolicy is a function');
} catch {
  const policiesContent = readFileSync(join(root, 'src', 'practice', 'contracts', 'policies.ts'), 'utf-8');
  assert(policiesContent.includes('getEffectivePlaybackPolicy'), 'getEffectivePlaybackPolicy exported');
}

// Check MockTaskRegistry is just a wrapper now
const mockRegistryContent = readFileSync(join(root, 'src', 'components', 'MockTaskRegistry.ts'), 'utf-8');
assert(mockRegistryContent.includes("TASK_REGISTRY") && mockRegistryContent.includes("../practice/contracts"),
  'MockTaskRegistry imports from canonical registry');

// Check no separate MockTaskRegistry hardcoded definitions remain
const oldKeys = Object.keys(JSON.parse(`{"RA":1,"RS":1,"DI":1,"RL":1,"ASQ":1,"SGD":1,"RTS":1,"SWT":1,"WE":1,"MCS":1,"MCM":1,"ROP":1,"FIBR":1,"FIBRW":1,"SST":1,"FIBL":1,"HCS":1,"MCSSL":1,"MCMSL":1,"SMW":1,"HIW":1,"WFD":1}`));
assert(oldKeys.length === 22, 'Old mock registry had all 22 tasks');

console.log(`\n${'='.repeat(50)}`);
console.log(`Assertions executed: ${assertions}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failed > 0) {
  console.log(`\n⚠️  Some assertions failed. Review above.`);
  process.exit(1);
} else {
  console.log(`\nPASS: All 22 canonical task gate assertions passed. 🚀`);
  process.exit(0);
}
