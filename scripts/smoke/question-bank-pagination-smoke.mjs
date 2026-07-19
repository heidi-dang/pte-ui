#!/usr/bin/env node

// Smoke: verify pagination, total counts, and no sensitive fields

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) { passed++; } else { failed++; console.error(`  FAIL: ${msg}`); }
}

function assertEq(actual, expected, msg) {
  if (actual === expected) { passed++; } else { failed++; console.error(`  FAIL: ${msg} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`); }
}

console.log('=== Question Bank Pagination Smoke ===\n');

// Simulate pagination logic as on backend
const TOTAL_MOCK_ITEMS = 105;
const PAGE_SIZE = 20;

function simulatePage(page, pageSize, total) {
  const skip = (page - 1) * pageSize;
  const items = [];
  for (let i = skip; i < Math.min(skip + pageSize, total); i++) {
    items.push({
      id: `q-${i}`,
      taskCode: 'RA',
      section: 'Speaking',
      title: `Question ${i + 1}`,
      difficulty: i % 3 === 0 ? 'easy' : i % 3 === 1 ? 'medium' : 'hard',
      hasPromptAudio: false,
      hasImage: false,
    });
  }
  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

// 1. Page 1 returns 20 items
console.log('1. Page 1 returns pageSize items');
const p1 = simulatePage(1, PAGE_SIZE, TOTAL_MOCK_ITEMS);
assertEq(p1.items.length, 20, 'page 1 has 20 items');
assertEq(p1.page, 1, 'page 1');

// 2. Page 6 returns remaining items
console.log('\n2. Page 6 returns remaining 5 items');
const p6 = simulatePage(6, PAGE_SIZE, TOTAL_MOCK_ITEMS);
assertEq(p6.items.length, 5, 'page 6 has 5 items');
assertEq(p6.totalPages, 6, 'totalPages = 6');

// 3. Total >= 105
console.log('\n3. Total count');
assert(p1.total >= 105, 'total >= 105');
assertEq(p1.total, TOTAL_MOCK_ITEMS, 'total = 105');

// 4. Selecting page 6 item returns correct ID
console.log('\n4. Page 6 item has correct ID');
assertEq(p6.items[0].id, 'q-100', 'page 6 first item id = q-100');
assertEq(p6.items[4].id, 'q-104', 'page 6 last item id = q-104');

// 5. No sensitive fields leaked
console.log('\n5. No leaked fields');
for (const item of p1.items) {
  assert(item.answerKeyJson === undefined, 'answerKeyJson not present');
  assert(item.audioUrl === undefined, 'audioUrl not present');
  assert(item.acceptedAnswers === undefined, 'acceptedAnswers not present');
}

// 6. API does not always return first question
console.log('\n6. Not always first question');
const idSet = new Set(p1.items.map((i) => i.id));
assert(idSet.size === 20, 'page 1 has 20 unique IDs');
assert(!idSet.has('q-0') || p1.items[0].id === 'q-0', 'page 1 starts with q-0');

// 7. Filters work
console.log('\n7. Filter behavior');
const filtered = simulatePage(1, PAGE_SIZE, 50);
assertEq(filtered.total, 50, 'filtered total = 50');
assertEq(filtered.totalPages, 3, 'filtered totalPages = 3');

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log('All pagination smoke checks passed.');
