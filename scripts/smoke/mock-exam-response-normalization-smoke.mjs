/**
 * Smoke test: mock exam answer normalization.
 * Verifies every task response shape parses correctly.
 */

import { NormalizedMockResponse, createEmptyResponse } from '../../src/shared/mockExamResponses.ts';
import { normalizeMockResponse, parseStoredMockResponse } from '../../src/utils/mockExamResponseNormalizer.ts';

const ALL_TASK_CODES = [
  'RA', 'RS', 'DI', 'RL', 'ASQ', 'SGD', 'RTS',
  'SWT', 'WE',
  'MCS', 'MCM', 'ROP', 'FIBR', 'FIBRW',
  'SST', 'MCMSL', 'FIBL', 'HCS', 'MCSSL', 'SMW', 'HIW', 'WFD',
];

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { passed++; console.log(`  PASS: ${label}`); }
  else { failed++; console.error(`  FAIL: ${label}`); }
}

function main() {
  console.log('=== Mock Exam Answer Normalization Smoke ===\n');

  // 1. Every task code creates an empty response
  console.log('--- Test 1: createEmptyResponse per task ---');
  for (const code of ALL_TASK_CODES) {
    const resp = createEmptyResponse(code);
    assert(resp.kind !== undefined, `${code} creates response with kind`);
    assert(typeof resp === 'object', `${code} creates object response`);
    const parsed = NormalizedMockResponse.safeParse(resp);
    assert(parsed.success, `${code} empty response passes schema`);
  }

  // 2. Audio tasks
  console.log('\n--- Test 2: Audio task responses ---');
  for (const code of ['RA', 'RS', 'DI', 'RL', 'ASQ', 'SGD', 'RTS']) {
    const resp = normalizeMockResponse(code, { kind: 'audio', transcript: 'hello' });
    assert(resp.kind === 'audio', `${code} audio response is kind=audio`);
    const parsed = NormalizedMockResponse.safeParse(resp);
    assert(parsed.success, `${code} audio response passes schema`);

    const legacy = normalizeMockResponse(code, 'spoken answer text');
    assert(legacy.kind === 'audio', `${code} legacy string -> kind=audio`);
    assert(legacy.transcript === 'spoken answer text', `${code} legacy string has transcript`);
  }

  // 3. Text tasks
  console.log('\n--- Test 3: Text task responses ---');
  for (const code of ['SWT', 'WE', 'SST', 'WFD']) {
    const resp = normalizeMockResponse(code, { kind: 'text', text: 'my essay' });
    assert(resp.kind === 'text', `${code} text response`);
    assert('text' in resp && resp.text === 'my essay', `${code} has text`);
    const parsed = NormalizedMockResponse.safeParse(resp);
    assert(parsed.success, `${code} text passes schema`);

    const legacy = normalizeMockResponse(code, 'legacy text answer');
    assert(legacy.kind === 'text', `${code} legacy string -> text`);
    assert('text' in legacy && legacy.text === 'legacy text answer', `${code} legacy text preserved`);
  }

  // 4. Single choice tasks
  console.log('\n--- Test 4: Single choice responses ---');
  for (const code of ['MCS', 'MCSSL', 'HCS', 'SMW']) {
    const resp = normalizeMockResponse(code, { kind: 'single_choice', selected: 'A' });
    assert(resp.kind === 'single_choice', `${code} single_choice`);
    assert('selected' in resp && resp.selected === 'A', `${code} selected correct`);
    const parsed = NormalizedMockResponse.safeParse(resp);
    assert(parsed.success, `${code} single_choice passes schema`);

    const legacy = normalizeMockResponse(code, 'B');
    assert(legacy.kind === 'single_choice', `${code} legacy string -> single_choice`);
    assert('selected' in legacy && legacy.selected === 'B', `${code} legacy selection`);
  }

  // 5. Multi choice tasks
  console.log('\n--- Test 5: Multi choice responses ---');
  for (const code of ['MCM', 'MCMSL']) {
    const resp = normalizeMockResponse(code, { kind: 'multi_choice', selected: ['A', 'C'] });
    assert(resp.kind === 'multi_choice', `${code} multi_choice`);
    assert(Array.isArray(resp.selected) && resp.selected.length === 2, `${code} has 2 selections`);
    const parsed = NormalizedMockResponse.safeParse(resp);
    assert(parsed.success, `${code} multi_choice passes schema`);

    const legacy = normalizeMockResponse(code, JSON.stringify(['B', 'D']));
    assert(legacy.kind === 'multi_choice', `${code} legacy JSON -> multi_choice`);
    assert(Array.isArray(legacy.selected) && legacy.selected[0] === 'B', `${code} legacy parsed`);
  }

  // 6. Ordered list task (ROP)
  console.log('\n--- Test 6: Ordered list (ROP) ---');
  const opResp = normalizeMockResponse('ROP', { kind: 'ordered_list', ordered: ['C', 'A', 'B'] });
  assert(opResp.kind === 'ordered_list', 'ROP ordered_list');
  assert(Array.isArray(opResp.ordered) && opResp.ordered[0] === 'C', 'ROP order preserved');
  const opParsed = NormalizedMockResponse.safeParse(opResp);
  assert(opParsed.success, 'ROP passes schema');

  const opLegacy = normalizeMockResponse('ROP', JSON.stringify(['B', 'A', 'C']));
  assert(opLegacy.kind === 'ordered_list', 'ROP legacy JSON -> ordered_list');

  // 7. Blanks tasks
  console.log('\n--- Test 7: Blanks responses ---');
  for (const code of ['FIBR', 'FIBRW', 'FIBL']) {
    const resp = normalizeMockResponse(code, { kind: 'blanks', blanks: { '1': 'answer', '2': 'text' } });
    assert(resp.kind === 'blanks', `${code} blanks`);
    assert(resp.blanks['1'] === 'answer', `${code} blank content`);
    const parsed = NormalizedMockResponse.safeParse(resp);
    assert(parsed.success, `${code} blanks passes schema`);

    const legacy = normalizeMockResponse(code, JSON.stringify({ '1': 'legacy' }));
    assert(legacy.kind === 'blanks', `${code} legacy JSON -> blanks`);
    assert(legacy.blanks['1'] === 'legacy', `${code} legacy blanks`);
  }

  // 8. HIW
  console.log('\n--- Test 8: Highlight words ---');
  const hiwResp = normalizeMockResponse('HIW', { kind: 'highlight_words', words: ['incorrect', 'wrong'] });
  assert(hiwResp.kind === 'highlight_words', 'HIW highlight_words');
  assert(Array.isArray(hiwResp.words) && hiwResp.words.length === 2, 'HIW words count');
  const hiwParsed = NormalizedMockResponse.safeParse(hiwResp);
  assert(hiwParsed.success, 'HIW passes schema');

  // 9. Null/undefined
  console.log('\n--- Test 9: Null/undefined handling ---');
  const nullResp = normalizeMockResponse('WE', null);
  assert(nullResp.kind === 'text', 'Null WE -> text empty');
  assert('text' in nullResp && nullResp.text === '', 'Null WE -> empty string');

  // 10. Stored response parsing
  console.log('\n--- Test 10: Stored response parsing ---');
  const stored = JSON.stringify({ kind: 'text', text: 'stored essay' });
  const parsedStored = parseStoredMockResponse('WE', stored);
  assert(parsedStored.kind === 'text', 'Stored text response parsed');
  assert('text' in parsedStored && parsedStored.text === 'stored essay', 'Stored text content');

  const staleStored = parseStoredMockResponse('WE', 'old plain string');
  assert(staleStored.kind === 'text', 'Stale plain string -> text');
  assert('text' in staleStored && staleStored.text === 'old plain string', 'Stale text preserved');

  const total = passed + failed;
  console.log(`\n=== Results: ${passed}/${total} passed, ${failed}/${total} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Smoke test crashed:', err);
  process.exit(1);
});
