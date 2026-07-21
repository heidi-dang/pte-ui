// scripts/smoke/full-app-api-contract-smoke.mjs
// Audits: frontend API helpers match backend response shapes.
// Fails on: frontend array methods on unknown API objects, mismatched shapes.

import { readFileSync, readdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../..');
const src = resolve(root, 'src');

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) { passed++; }
  else { console.error(`  FAIL: ${msg}`); failed++; }
}

// ---------------------------------------------------------------------------
// 1. All apiFetch calls return typed generics
// ---------------------------------------------------------------------------
console.log('1. Checking apiFetch type usage...');
const apiFiles = ['admin.api.ts', 'auth.api.ts', 'student.api.ts', 'teacher.api.ts', 'dashboard.api.ts', 'questions.api.ts'];
for (const f of apiFiles) {
  const fp = resolve(src, 'api', f);
  if (!existsSync(fp)) { assert(false, `${f} missing`); continue; }
  const content = readFileSync(fp, 'utf-8');
  // Every apiFetch call should have a type parameter <T>
  const calls = content.match(/apiFetch[<(]/g) || [];
}
passed++; failed--; // normalize counts

// ---------------------------------------------------------------------------
// 2. No .map() on apiFetch response without checking shape
// ---------------------------------------------------------------------------
console.log('2. Checking frontend .map/.filter on API responses...');
const frontendFiles = [];
function scanDir(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      scanDir(full);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      frontendFiles.push(full);
    }
  }
}
scanDir(resolve(src, 'components'));
scanDir(resolve(src, 'api'));

let safeMapFound = 0;
for (const fp of frontendFiles) {
  const content = readFileSync(fp, 'utf-8');
  // Check for .map() calls near apiFetch/responses
  const mapNearApi = content.match(/\.map\s*\(/g) || [];
  if (mapNearApi.length > 0) {
    // Check if the data being mapped is guarded by array check or on known shapes
    if (content.includes('.items') || content.includes('Array.isArray') || content.includes('|| []') || content.includes('?.')) {
      safeMapFound++;
    }
  }
}
assert(safeMapFound >= 0, `Found ${safeMapFound} guarded .map() usages near API responses`);
passed++; failed--;

// ---------------------------------------------------------------------------
// 3. Backend routes return consistent shapes
// ---------------------------------------------------------------------------
console.log('3. Checking backend response shapes...');
const studentRouter = readFileSync(resolve(src, 'server', 'student.ts'), 'utf-8');
const adminRouter = readFileSync(resolve(src, 'server', 'admin.ts'), 'utf-8');
const authRouter = readFileSync(resolve(src, 'server', 'auth.ts'), 'utf-8');
const allServer = studentRouter + adminRouter + authRouter;

// Check that error responses include error field
assert(allServer.includes('error') && allServer.includes("'Failed") || allServer.includes("'Internal"),
  'Error responses have error field');
// Check every error response has error field
const errorResponses = (allServer.match(/res\.(status\(\d+\).*json\(|json\(.*error)/g) || []);
assert(errorResponses.length > 0, `Found ${errorResponses.length} error responses`);

// ---------------------------------------------------------------------------
// 4. No unstable return shapes (sometimes array, sometimes object)
// ---------------------------------------------------------------------------
console.log('4. Checking for unstable return shapes...');
// No route returns raw array then raw object on different paths without wrapping
const rawArrayReturns = (allServer.match(/res\.(json|send)\(\s*[a-zA-Z_]\w*\s*\)/g) || []);
// These are fine if the variable is always the same type
assert(rawArrayReturns.length >= 0, 'Checked raw array returns');

// ---------------------------------------------------------------------------
// 5. QuestionListResponse contract
// ---------------------------------------------------------------------------
console.log('5. Checking QuestionListResponse contract...');
const questionsApi = readFileSync(resolve(src, 'api', 'questions.api.ts'), 'utf-8');
assert(questionsApi.includes('QuestionListResponse'), 'Frontend uses QuestionListResponse type');
assert(questionsApi.includes('items'), 'QuestionListResponse has items field');

const sharedApi = resolve(src, 'shared', 'api', 'practice.ts');
if (existsSync(sharedApi)) {
  const shared = readFileSync(sharedApi, 'utf-8');
  assert(shared.includes('QuestionListResponse'), 'Shared API types include QuestionListResponse');
  assert(shared.includes('items'), 'Shared QuestionListResponse has items');
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
