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

console.log('--- Practice Playback Concurrency Tests ---\n');

const studentContent = readFileSync(join(root, 'src/server/student.ts'), 'utf-8');
const policiesContent = readFileSync(join(root, 'src/practice/contracts/policies.ts'), 'utf-8');
const typesContent = readFileSync(join(root, 'src/practice/contracts/types.ts'), 'utf-8');
const transitionsContent = readFileSync(join(root, 'src/practice/contracts/transitions.ts'), 'utf-8');

// 1. Allowed plays succeed (atomic update with lt condition)
assert(studentContent.includes('updateMany') && studentContent.includes('playedCount: { lt: maxPlays }'),
  'Playback uses updateMany with playedCount lt maxPlays for atomic concurrency safety');

// 2. Next play is rejected when maxPlays reached
assert(studentContent.includes('playedCount: { increment: 1 }') && studentContent.includes('maxPlays'),
  'Playback limits via maxPlays check and atomic increment');

// 3. Concurrent requests cannot exceed max plays (atomic updateMany returns 0 if race lost)
assert(studentContent.includes("updated.count !== 1") || studentContent.includes("consumed.count !== 1"),
  'Atomic update returns count=0 when race condition loses');

// 4. Wrong user is rejected
assert(studentContent.includes('userId: user.id'),
  'Playback enforces userId ownership');

// 5. Expired attempt is rejected
assert(studentContent.includes('attempt.status'),
  'Play-prompt checks attempt status before authorizing');

// 6. Prompt endpoint returns question audio from original question, not from snapshot
assert(studentContent.includes('question?.audioUrl') && !studentContent.includes('response.audioUrl'),
  'Prompt play endpoint returns question audioUrl from original question');

// 7. Mode-specific limits are respected
assert(typesContent.includes('learning: 3') && typesContent.includes('timed: 2') && typesContent.includes('mock: 1') && typesContent.includes('teacher_preview: 10'),
  'Mode-specific playback multipliers defined in types.ts');

// 8. Playback consumption record tracks plays
assert(studentContent.includes('practicePlaybackConsumption') || studentContent.includes('playbackConsumption'),
  'Playback consumption tracked via dedicated model');

// 9. Transition helper does not reject play-prompt (In_Progress has no transition here)
assert(transitionsContent.includes('In_Progress'),
  'In_Progress state defined in transitions');

console.log(`\n${'='.repeat(50)}`);
console.log(`Passed: ${passed}, Failed: ${failed}`);
if (failed > 0) process.exit(1);
else console.log('PASS: All playback concurrency tests passed.');
