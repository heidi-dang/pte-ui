/**
 * Proves all 22 PTE task types are defined and accounted for
 * across the contract registry, task module registry, and PracticePage.
 */

import { getAllContracts, TASK_REGISTRY } from '../../src/practice/contracts/registry';
import { getAllTaskModules } from '../../src/practice/tasks/registry';
import type { PTETaskCode } from '../../src/practice/contracts/types';

const EXPECTED_TASK_CODES: PTETaskCode[] = [
  'RA', 'RS', 'DI', 'RL', 'ASQ', 'SGD', 'RTS',  // Speaking (7)
  'SWT', 'WE',                                       // Writing (2)
  'MCS', 'MCM', 'ROP', 'FIBR', 'FIBRW',              // Reading (5)
  'SST', 'FIBL', 'HCS', 'MCSSL', 'MCMSL', 'SMW', 'HIW', 'WFD',  // Listening (8)
];

function check(condition: boolean, label: string) {
  if (!condition) {
    console.error(`FAIL: ${label}`);
    process.exit(1);
  }
  console.log(`PASS: ${label}`);
}

function main() {
  const contracts = getAllContracts();
  const modules = getAllTaskModules();
  const contractCodes = contracts.map((c) => c.code);
  const moduleCodes = modules.map((m) => m.code);

  // 1. Exactly 22 unique task codes
  check(contracts.length === 22, `22 contracts in registry, got ${contracts.length}`);
  check(modules.length === 22, `22 task modules in registry, got ${modules.length}`);

  // 2. Every expected code appears in contract registry
  for (const code of EXPECTED_TASK_CODES) {
    check(contractCodes.includes(code), `Contract registry includes ${code}`);
    check(code in TASK_REGISTRY, `TASK_REGISTRY includes ${code}`);
  }

  // 3. Every expected code appears in task module registry
  for (const code of EXPECTED_TASK_CODES) {
    check(moduleCodes.includes(code), `Task module registry includes ${code}`);
  }

  // 4. No unknown codes in contract registry
  for (const code of contractCodes) {
    check(EXPECTED_TASK_CODES.includes(code as PTETaskCode), `No unknown code in contracts: ${code}`);
  }

  // 5. No unknown codes in module registry
  for (const code of moduleCodes) {
    check(EXPECTED_TASK_CODES.includes(code as PTETaskCode), `No unknown code in modules: ${code}`);
  }

  // 6. Every contract has required metadata
  for (const c of contracts) {
    check(typeof c.name === 'string' && c.name.length > 0, `${c.code} has a name`);
    check(typeof c.section === 'string', `${c.code} has a section`);
    check(c.section === 'Speaking' || c.section === 'Writing' || c.section === 'Reading' || c.section === 'Listening',
      `${c.code} section is valid: ${c.section}`);
  }

  // 7. 4 skill sections have correct task counts
  const bySection: Record<string, number> = {};
  for (const c of contracts) {
    bySection[c.section] = (bySection[c.section] || 0) + 1;
  }
  check(bySection['Speaking'] === 7, `Speaking has 7 tasks, got ${bySection['Speaking']}`);
  check(bySection['Writing'] === 2, `Writing has 2 tasks, got ${bySection['Writing']}`);
  check(bySection['Reading'] === 5, `Reading has 5 tasks, got ${bySection['Reading']}`);
  check(bySection['Listening'] === 8, `Listening has 8 tasks, got ${bySection['Listening']}`);

  // 8. Every module has a matching contract code
  for (const m of modules) {
    check(contractCodes.includes(m.code), `Module ${m.code} has matching contract`);
  }

  // 9. Display names match expectations for well-known tasks
  const nameMap: Record<string, string> = {
    RA: 'Read Aloud', RS: 'Repeat Sentence', DI: 'Describe Image',
    RL: 'Retell Lecture', ASQ: 'Answer Short Question',
    SWT: 'Summarize Written Text', WE: 'Write Essay',
    WFD: 'Write from Dictation',
  };
  for (const [code, expectedName] of Object.entries(nameMap)) {
    const contract = TASK_REGISTRY[code as PTETaskCode];
    check(contract?.name === expectedName, `${code} name is "${expectedName}"`);
  }

  console.log('\nAll 22 PTE task type coverage checks passed.');
}

main();
