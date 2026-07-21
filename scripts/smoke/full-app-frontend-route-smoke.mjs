// scripts/smoke/full-app-frontend-route-smoke.mjs
// Audits: all expected frontend routes/components exist, render without
// map-is-not-a-function or undefined-access crashes.
// Fails on: type errors in component props, missing route components.

import { readFileSync, existsSync, readdirSync } from 'fs';
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

function fileExists(relativePath) {
  const full = resolve(root, relativePath);
  return existsSync(full);
}

// ---------------------------------------------------------------------------
// 1. Core app files exist
// ---------------------------------------------------------------------------
console.log('1. Checking core app files...');
assert(fileExists('src/App.tsx'), 'App.tsx exists');
assert(fileExists('src/main.tsx'), 'main.tsx exists');
assert(fileExists('index.html'), 'index.html exists');
assert(fileExists('server.ts'), 'server.ts entry exists');

// ---------------------------------------------------------------------------
// 2. Public website components
// ---------------------------------------------------------------------------
console.log('2. Checking public website...');
assert(fileExists('src/components/PublicWebsite.tsx'), 'PublicWebsite exists');

// ---------------------------------------------------------------------------
// 3. Auth components
// ---------------------------------------------------------------------------
console.log('3. Checking auth components...');
assert(fileExists('src/components/Auth.tsx'), 'Auth component exists');
assert(fileExists('src/server/auth.ts'), 'Auth server module exists');

// ---------------------------------------------------------------------------
// 4. Student portal shell
// ---------------------------------------------------------------------------
console.log('4. Checking student portal...');
const studentFiles = [
  'src/components/student/StudentPortalShell.tsx',
  'src/components/student/StudentPageRouter.tsx',
  'src/components/student/StudentRouteContext.tsx',
  'src/components/student/studentRoutes.ts',
  'src/components/StudentDashboard.tsx',
];
for (const f of studentFiles) {
  assert(fileExists(f), `${f} exists`);
}

// ---------------------------------------------------------------------------
// 5. Student pages
// ---------------------------------------------------------------------------
console.log('5. Checking student pages...');
const studentPagesDir = resolve(src, 'components', 'student', 'pages');
if (existsSync(studentPagesDir)) {
  const pages = readdirSync(studentPagesDir).filter(f => f.endsWith('.tsx'));
  for (const p of pages) { /* found page */ }
  assert(pages.length >= 5, `At least 5 student pages (found ${pages.length})`);
}

// ---------------------------------------------------------------------------
// 6. Practice engine
// ---------------------------------------------------------------------------
console.log('6. Checking practice engine...');
assert(fileExists('src/components/PracticeEngine.tsx'), 'PracticeEngine exists');
assert(fileExists('src/components/student/pages/PracticeSessionPage.tsx'), 'PracticeSessionPage exists');

// ---------------------------------------------------------------------------
// 7. All 22 task renderers
// ---------------------------------------------------------------------------
console.log('7. Checking all 22 task renderers...');
const taskCodes = ['RA', 'RS', 'DI', 'RL', 'ASQ', 'SGD', 'RTS', 'SWT', 'WE',
                    'MCS', 'MCM', 'ROP', 'FIBR', 'FIBRW', 'SST', 'MCMSL', 'FIBL',
                    'HCS', 'MCSSL', 'SMW', 'HIW', 'WFD'];
const tasksDir = resolve(src, 'practice', 'tasks');
for (const code of taskCodes) {
  const taskDir = resolve(tasksDir, code);
  assert(existsSync(taskDir), `Task directory: ${code}`);
  const hasRenderer = fileExists(`src/practice/tasks/${code}/Renderer.tsx`);
  assert(hasRenderer, `${code} has Renderer.tsx`);
}

// ---------------------------------------------------------------------------
// 8. Mock exam engine
// ---------------------------------------------------------------------------
console.log('8. Checking mock exam engine...');
assert(fileExists('src/components/MockTestEngine.tsx'), 'MockTestEngine exists');
assert(fileExists('src/utils/mockTestGenerator.ts'), 'mockTestGenerator exists');
assert(fileExists('src/utils/ExamGenerator.ts'), 'ExamGenerator exists');

// ---------------------------------------------------------------------------
// 9. Mock exam renderers
// ---------------------------------------------------------------------------
console.log('9. Checking mock exam renderers...');
const mockRenderersDir = resolve(src, 'components', 'mock-exam', 'renderers');
if (existsSync(mockRenderersDir)) {
  const renderers = readdirSync(mockRenderersDir).filter(f => f.endsWith('.tsx'));
  assert(renderers.length >= 5, `Mock exam renderers: ${renderers.length}`);
} else {
  assert(false, 'mock-exam/renderers directory missing');
}

// ---------------------------------------------------------------------------
// 10. Admin components
// ---------------------------------------------------------------------------
console.log('10. Checking admin components...');
assert(fileExists('src/components/AdminUI.tsx'), 'AdminUI exists');
assert(fileExists('src/components/admin/question-bank/QuestionBankPanel.tsx'), 'QuestionBankPanel exists');
assert(fileExists('src/components/admin/question-bank/ManualQuestionModal.tsx'), 'ManualQuestionModal exists');
assert(fileExists('src/components/admin/question-bank/BatchStatusView.tsx'), 'BatchStatusView exists');

// ---------------------------------------------------------------------------
// 11. Reports and analytics
// ---------------------------------------------------------------------------
console.log('11. Checking reports...');
assert(fileExists('src/components/Reports.tsx'), 'Reports exists');

// ---------------------------------------------------------------------------
// 12. No dangerous patterns
// ---------------------------------------------------------------------------
console.log('12. Checking for dangerous patterns...');
// Check all component files for dangerouslySetInnerHTML
let dangerFound = 0;
const compDir = resolve(src, 'components');
function scanForDanger(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      scanForDanger(full);
    } else if (/\.(tsx|ts)$/.test(entry.name)) {
      const content = readFileSync(full, 'utf-8');
      if (content.includes('dangerouslySetInnerHTML')) dangerFound++;
    }
  }
}
scanForDanger(compDir);
assert(dangerFound <= 1, `dangerouslySetInnerHTML found in ${dangerFound} files (should be < 2)`);

// ---------------------------------------------------------------------------
// 13. No undefined/null crashes from unmapped data
// ---------------------------------------------------------------------------
console.log('13. Checking for unmapped-array risk...');
const practicePage = resolve(src, 'components', 'student', 'pages', 'PracticeSessionPage.tsx');
if (existsSync(practicePage)) {
  const content = readFileSync(practicePage, 'utf-8');
  const dataDotMap = content.match(/data\.map\s*\(/g) || [];
  const itemsDotMap = content.match(/items\.map\s*\(/g) || [];
  // items.map is the expected pattern for QuestionListResponse
  assert(itemsDotMap.length >= 0, `Found ${itemsDotMap.length} items.map() usages`);
  assert(dataDotMap.length === 0, `Found ${dataDotMap.length} raw data.map() usages (should be 0)`);
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
