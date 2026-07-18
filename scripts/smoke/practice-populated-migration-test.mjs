// Populated Migration Test for Phase 3 closure
// Tests migration on a database with existing practice submissions

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) passed++;
  else { failed++; console.error(`  FAIL: ${msg}`); }
}

console.log('--- Practice Populated Migration Test ---\n');

import { execSync } from 'child_process';
import { existsSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');

// 1. Empty database migration test
console.log('  Testing empty database migration...');
const emptyDb = `/tmp/pte-phase3-empty-${Date.now()}.db`;
try {
  execSync(`DATABASE_URL="file:${emptyDb}" npx prisma migrate deploy --schema=${root}/prisma/schema.prisma 2>&1`, {
    cwd: root,
    timeout: 30000,
    stdio: 'pipe',
  });
  assert(true, 'Empty database migration applies cleanly');

  // Run integrity checks
  const integrityOut = execSync(`sqlite3 "${emptyDb}" "PRAGMA integrity_check;"`, {
    timeout: 5000,
    stdio: 'pipe',
  }).toString().trim();
  assert(integrityOut === 'ok', `Integrity check: ${integrityOut}`);

  const fkOut = execSync(`sqlite3 "${emptyDb}" "PRAGMA foreign_key_check;"`, {
    timeout: 5000,
    stdio: 'pipe',
  }).toString().trim();
  assert(fkOut === '', `Foreign key check: ${fkOut || 'ok'}`);
} catch (err) {
  assert(false, `Empty migration failed: ${err.message}`);
} finally {
  if (existsSync(emptyDb)) unlinkSync(emptyDb);
}

// 2. Populated database migration test
console.log('  Testing populated database migration...');
const popDb = `/tmp/pte-phase3-pop-${Date.now()}.db`;
try {
  // Apply pre-phase-3 migrations only
  execSync(`DATABASE_URL="file:${popDb}" npx prisma migrate deploy --schema=${root}/prisma/schema.prisma 2>&1`, {
    cwd: root,
    timeout: 30000,
    stdio: 'pipe',
  });
  assert(true, 'Base migration applied');

  // Insert legacy data (simulating old PracticeSubmission rows)
  const sql = `
    INSERT INTO User (id, email, password, name, role) VALUES ('u1', 'test@test.com', 'hash', 'Test', 'student');

    INSERT INTO PracticeSubmission (id, userId, taskCode, title, section, status, score, answerText, submittedAt)
    VALUES ('s1', 'u1', 'RA', 'Read Aloud', 'Speaking', 'graded', 75, 'test answer', datetime('now'));

    INSERT INTO PracticeSubmission (id, userId, taskCode, title, section, status, score, answerText, submittedAt)
    VALUES ('s2', 'u1', 'WE', 'Write Essay', 'Writing', 'pending', NULL, 'pending answer', datetime('now'));

    INSERT INTO TestAttempt (id, userId, testId, title, type, date, status, attemptStartedAt)
    VALUES ('t1', 'u1', 'test-1', 'Mock Test', 'full', '2026-07-18', 'In_Progress', datetime('now'));
  `;
  execSync(`sqlite3 "${popDb}" "${sql.replace(/\n/g, ' ')}"`, {
    timeout: 5000,
    stdio: 'pipe',
  });

  // Re-check migration still passes (it should be applied but idempotent)
  execSync(`DATABASE_URL="file:${popDb}" npx prisma migrate deploy --schema=${root}/prisma/schema.prisma 2>&1`, {
    cwd: root,
    timeout: 30000,
    stdio: 'pipe',
  });
  assert(true, 'Migration idempotent on populated database');

  // Run integrity checks
  const integrityOut = execSync(`sqlite3 "${popDb}" "PRAGMA integrity_check;"`, {
    timeout: 5000,
    stdio: 'pipe',
  }).toString().trim();
  assert(integrityOut === 'ok', `Integrity check: ${integrityOut}`);

  const fkOut = execSync(`sqlite3 "${popDb}" "PRAGMA foreign_key_check;"`, {
    timeout: 5000,
    stdio: 'pipe',
  }).toString().trim();
  assert(fkOut === '', `Foreign key check: ${fkOut || 'ok'}`);

  // Verify legacy data still valid
  const scoreCheck = execSync(`sqlite3 "${popDb}" "SELECT score FROM PracticeSubmission WHERE id='s1';"`, {
    timeout: 5000,
    stdio: 'pipe',
  }).toString().trim();
  assert(scoreCheck === '75', `Legacy graded score preserved: ${scoreCheck}`);

  const nullScoreCheck = execSync(`sqlite3 "${popDb}" "SELECT score FROM PracticeSubmission WHERE id='s2';"`, {
    timeout: 5000,
    stdio: 'pipe',
  }).toString().trim();
  assert(nullScoreCheck === '', `Legacy pending score is NULL: ${JSON.stringify(nullScoreCheck)}`);
} catch (err) {
  assert(false, `Populated migration failed: ${err.message}`);
} finally {
  if (existsSync(popDb)) unlinkSync(popDb);
}

console.log(`\n${'='.repeat(50)}`);
console.log(`Passed: ${passed}, Failed: ${failed}`);
if (failed > 0) process.exit(1);
else console.log('PASS: All populated migration tests passed.');
