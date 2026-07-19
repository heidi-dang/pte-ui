/**
 * Smoke test: mock exam canonical 22-task registry.
 * Verifies all critical modules agree on exactly 22 task codes.
 */

const EXPECTED_CODES = [
  'RA', 'RS', 'DI', 'RL', 'ASQ', 'SGD', 'RTS',
  'SWT', 'WE',
  'MCS', 'MCM', 'ROP', 'FIBR', 'FIBRW',
  'SST', 'MCMSL', 'FIBL', 'HCS', 'MCSSL', 'SMW', 'HIW', 'WFD',
];

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    passed++;
    console.log(`  PASS: ${label}`);
  } else {
    failed++;
    console.error(`  FAIL: ${label}`);
  }
}

function getCodes(registry) {
  return Object.keys(registry).sort();
}

async function main() {
  console.log('=== Mock Exam 22-Task Registry Smoke ===\n');

  // 1. PTE_TASK_REGISTRY
  console.log('--- Registry: PTE_TASK_REGISTRY ---');
  const { PTE_TASK_REGISTRY, PTE_TASK_CODES } = await import('../../src/shared/pteTaskRegistry.ts');
  const pteCodes = getCodes(PTE_TASK_REGISTRY);
  assert(pteCodes.length === 22, `PTE_TASK_REGISTRY has 22 codes, got ${pteCodes.length}`);
  for (const code of EXPECTED_CODES) {
    assert(pteCodes.includes(code), `PTE_TASK_REGISTRY includes ${code}`);
  }
  for (const code of pteCodes) {
    assert(EXPECTED_CODES.includes(code), `No unknown code in PTE_TASK_REGISTRY: ${code}`);
    assert(PTE_TASK_REGISTRY[code].section !== undefined, `${code} has section`);
    assert(PTE_TASK_REGISTRY[code].scoringKind !== undefined, `${code} has scoringKind`);
    assert(PTE_TASK_REGISTRY[code].maxCredit > 0, `${code} has maxCredit > 0`);
  }

  // 2. mockExamTypes.ts PTETaskCodeSchema
  console.log('\n--- Registry: mockExamTypes PTETaskCodeSchema ---');
  const { PTETaskCodeSchema } = await import('../../src/shared/mockExamTypes.ts');
  const schemaCodes = PTETaskCodeSchema._def?.entries ? Object.keys(PTETaskCodeSchema._def.entries).sort() : [];
  assert(schemaCodes.length > 0, 'Schema codes array is not empty');
  assert(schemaCodes.length === 22, `PTETaskCodeSchema has 22 options, got ${schemaCodes.length}`);
  for (const code of EXPECTED_CODES) {
    assert(schemaCodes.includes(code), `PTETaskCodeSchema includes ${code}`);
  }

  // 3. TASK_SCORING_REGISTRY
  console.log('\n--- Registry: TASK_SCORING_REGISTRY ---');
  const { TASK_SCORING_REGISTRY } = await import('../../src/utils/mockScoringPolicy.ts');
  const scoringCodes = getCodes(TASK_SCORING_REGISTRY);
  assert(scoringCodes.length === 22, `TASK_SCORING_REGISTRY has 22 codes, got ${scoringCodes.length}`);
  for (const code of EXPECTED_CODES) {
    assert(scoringCodes.includes(code), `TASK_SCORING_REGISTRY includes ${code}`);
  }

  // 4. mockTestGenerator — module exports exist
  console.log('\n--- Generator: generateMockTest ---');
  const gen = await import('../../src/utils/mockTestGenerator.ts');

  // 5. Types.ts PTETaskCode — skip runtime check, type-only
  console.log('\n--- Types: SKIP (type-only export) ---');

  console.log(`\n=== Results: ${passed}/${passed + failed} passed, ${failed}/${passed + failed} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Smoke test crashed:', err);
  process.exit(1);
});
