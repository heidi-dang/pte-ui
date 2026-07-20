import fs from 'fs';

let passed = 0; let failed = 0;
function assert(cond, label) { if (cond) { passed++; console.log(`  PASS: ${label}`); } else { failed++; console.error(`  FAIL: ${label}`); } }

function countLinesWith(content, pattern) {
  return content.split('\n').filter(l => l.match(pattern)).length;
}

function main() {
  console.log('=== Mock Exam + Practice Deep Audit Smoke ===\n');

  const taskReg = fs.readFileSync('src/practice/tasks/registry.ts', 'utf8');
  const rendererReg = fs.readFileSync('src/components/mock-exam/renderers/registry.ts', 'utf8');
  const contractReg = fs.readFileSync('src/practice/contracts/registry.ts', 'utf8');
  const mepSource = fs.readFileSync('src/components/student/pages/MockExamsPage.tsx', 'utf8');
  const peSource = fs.readFileSync('src/components/PracticeEngine.tsx', 'utf8');
  const genSource = fs.readFileSync('src/utils/mockTestGenerator.ts', 'utf8');
  const studentSource = fs.readFileSync('src/server/student.ts', 'utf8');
  const safeSource = fs.readFileSync('src/practice/contracts/studentSafeQuestion.ts', 'utf8');
  const ciSource = fs.readFileSync('.github/workflows/ci-cd.yml', 'utf8');

  assert(countLinesWith(taskReg, /^\s+\[/) >= 22, '22 practice task modules registered');
  assert(countLinesWith(rendererReg, /^\s+[A-Z]{2,5}:/) >= 22, '22 mock renderers registered');
  assert(countLinesWith(contractReg, /\w+:\s*\{/) >= 22, '22 contracts registered');
  assert(mepSource.includes('<MockTestEngine'), 'MockExamsPage renders MockTestEngine');

  if (!mepSource.includes('initialTest') && !mepSource.includes('resumeAttempt')) {
    console.log('  WARN: MockTestEngine rendered without initial/resume props');
  }

  if (peSource.includes('search') && !peSource.match(/, search\]/)) {
    console.log('  WARN: search not in PracticeEngine effect deps');
  }

  assert(genSource.includes("source: 'fallback'"), 'Fallback source exists');
  if (!genSource.includes('NODE_ENV') && genSource.includes('fallback')) {
    console.log('  WARN: Fallback questions not blocked in production');
  }

  assert(studentSource.includes('normalizedAnswers'), 'normalizedAnswers map built');
  if (studentSource.includes('rawAns')) {
    console.log('  WARN: Raw answers used in questionResults');
  }

  assert(safeSource.includes('answerKey'), 'Student-safe filter handles answerKey');
  assert(ciSource.includes('mock-exam-entry-flow'), 'Entry E2E in CI');
  assert(ciSource.includes('mock-exam-full-flow'), 'Full flow E2E in CI');
  assert(ciSource.includes('mock-exam-mobile'), 'Mobile E2E in CI');
  assert(ciSource.includes('mock-exam-renderers'), 'Renderer E2E in CI');
  assert(ciSource.includes('mock-exam-results'), 'Results E2E in CI');

  const total = passed + failed;
  console.log(`\n=== Results: ${passed}/${total} passed, ${failed}/${total} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
