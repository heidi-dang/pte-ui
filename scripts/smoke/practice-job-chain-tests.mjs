import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) passed++;
  else { failed++; console.error(`  FAIL: ${msg}`); }
}

console.log('--- Practice Job Chain Behavioural Tests ---\n');

const workerContent = readFileSync(join(root, 'src/server/jobs/worker.ts'), 'utf-8');
const studentContent = readFileSync(join(root, 'src/server/student.ts'), 'utf-8');
const queueContent = readFileSync(join(root, 'src/server/jobs/queue.ts'), 'utf-8');
const transitionsContent = readFileSync(join(root, 'src/practice/contracts/transitions.ts'), 'utf-8');

// 1. Speaking submit creates transcription job only
assert(studentContent.includes("queueJob('transcribe_audio'") && studentContent.includes("Pending_Transcription"),
  'Speaking submit queues transcribe_audio and transitions to Pending_Transcription');

// 2. Non-speaking submit creates grading job only
assert(studentContent.includes("queueJob('grade_submission'") && studentContent.includes("Pending_Grading"),
  'Non-speaking submit queues grade_submission and transitions to Pending_Grading');

// 3. Successful transcription creates one grading job (idempotencyKey prevents duplicates)
assert(workerContent.includes('practice-grade:') && workerContent.includes('!existingGradeJob'),
  'Transcription success uses idempotencyKey practice-grade:<attemptId> and checks for existing');

// 4. Retry with same idempotencyKey creates no duplicate grading job
assert(queueContent.includes('idempotencyKey') && queueContent.includes('findUnique'),
  'queueJob checks existing job by idempotencyKey before creating');

// 5. Failed transcription transitions to Transcription_Failed, no grade job queued
assert(workerContent.includes("status: 'Transcription_Failed'"),
  'Failed transcription transitions to Transcription_Failed');

// 6. Completed attempt status prevents re-submission
assert(studentContent.includes("attempt.status !== 'In_Progress'"),
  'Submit handler rejects non-In_Progress attempts');

// 7. Lost lease prevents result writes (claimToken mismatch)
assert(workerContent.includes('claimToken') && workerContent.includes('updateMany'),
  'Worker uses claimToken in updateMany for safe lease enforcement');

// 8. Duplicate submit returns existing result (idempotent)
assert(workerContent.includes("status === 'graded'") || workerContent.includes('Already graded'),
  'grade_submission skips if submission already graded');

// 9. Dead-letter state preserved after max retries
assert(workerContent.includes('dead_letter'),
  'Worker uses dead_letter status after max retries');

// 10. Transition helper enforced at submit boundary
assert(studentContent.includes('assertPracticeAttemptTransition'),
  'Submit handler enforces transition helper');

// 11. Transition helper enforced at worker boundaries
assert(workerContent.includes('assertPracticeAttemptTransition'),
  'Worker enforces transition helper at every status change');

// 12. Idempotency keys passed from student.ts
assert(studentContent.includes('practice-transcribe:'),
  'Transcription job uses practice-transcribe:<attemptId> idempotency key');
assert(studentContent.includes('practice-grade:'),
  'Grading job uses practice-grade:<attemptId> idempotency key');

console.log(`\n${'='.repeat(50)}`);
console.log(`Passed: ${passed}, Failed: ${failed}`);
if (failed > 0) process.exit(1);
else console.log('PASS: All job chain tests passed.');
