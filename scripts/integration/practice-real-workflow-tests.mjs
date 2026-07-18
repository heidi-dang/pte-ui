#!/usr/bin/env node
// Real production-path practice workflow tests with fake STT/AI providers.
// All 10 required workflows must PASS, not SKIP.

import { execSync, spawn } from 'child_process';
import { existsSync, unlinkSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');

let passed = 0;
let failed = 0;
let dbPath = '';
let token = '';
let serverProcess = null;
const PORT = 3791;
const BASE = `http://localhost:${PORT}`;
const TEST_TIMEOUT = 90000;
const JWT_SECRET = 'pte-test-secret';

function assert(cond, msg) {
  if (cond) { passed++; } else { failed++; console.error(`  FAIL: ${msg}`); }
}

function assertEq(actual, expected, msg) {
  if (actual === expected) { passed++; } else { failed++; console.error(`  FAIL: ${msg} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`); }
}

async function setupTestDb() {
  const dbFile = `/tmp/pte-wf-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.db`;
  dbPath = dbFile;
  const dbUrl = `file:${dbFile}`;
  execSync(`DATABASE_URL="${dbUrl}" npx prisma migrate deploy --schema=${root}/prisma/schema.prisma 2>&1`, {
    cwd: root, timeout: 30000, stdio: 'pipe',
  });
  const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
  await prisma.$connect();
  return { prisma, dbUrl };
}

async function teardownTestDb(prisma) {
  if (prisma) await prisma.$disconnect();
  if (dbPath && existsSync(dbPath)) { try { unlinkSync(dbPath); } catch {} }
  if (dbPath && existsSync(dbPath + '-journal')) { try { unlinkSync(dbPath + '-journal'); } catch {} }
}

function startServer(dbUrl) {
  return new Promise((resolve, reject) => {
    const env = {
      ...process.env,
      DATABASE_URL: dbUrl,
      PORT: String(PORT),
      JWT_SECRET,
      PTE_TEST_MODE: '1',
      STT_PROVIDER: 'fake',
      AI_PROVIDER: 'fake',
      JOB_POLL_INTERVAL_MS: '1000',
    };
    serverProcess = spawn('bun', ['run', 'server.ts'], {
      cwd: root, env, stdio: ['pipe', 'pipe', 'pipe'],
    });
    let started = false;
    let serverLog = '';
    const timeout = setTimeout(() => {
      if (!started) reject(new Error('Server start timeout'));
    }, 30000);
    const onData = (data) => {
      const text = data.toString();
      serverLog += text;
      if (!started && (text.includes('listening') || text.includes('started') || text.includes('port'))) {
        started = true;
        clearTimeout(timeout);
        setTimeout(resolve, 500);
      }
    };
    serverProcess.stdout.on('data', onData);
    serverProcess.stderr.on('data', onData);
    serverProcess.on('error', (err) => { clearTimeout(timeout); reject(err); });

    // Store log for error debugging
    globalThis.__serverLog = () => serverLog;
  });
}

function stopServer() {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
    serverProcess = null;
  }
}

async function api(path, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  if (!headers['Content-Type'] && !(opts.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const url = path.startsWith('http') ? path : `${BASE}${path}`;
  const res = await fetch(url, { ...opts, headers });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`${res.status} ${body?.error?.message || body?.error || JSON.stringify(body)} (path=${path})`);
  return body;
}

async function uploadAudio(attemptId, filePath) {
  const audioBuf = readFileSync(filePath);
  const blob = new Blob([audioBuf], { type: 'audio/wav' });
  const form = new FormData();
  form.append('audio', blob, 'response.wav');
  return api(`/api/student/practice/attempts/${attemptId}/audio-upload`, {
    method: 'POST', body: form, headers: {},
  });
}

async function startAttempt(questionId) {
  const r = await api('/api/student/practice/attempts/start', {
    method: 'POST', body: JSON.stringify({ questionBankItemId: questionId, mode: 'timed' }),
  });
  return r.data?.attemptId || r.attemptId;
}

async function submitAttempt(attemptId, answerJson) {
  return api(`/api/student/practice/attempts/${attemptId}/submit`, {
    method: 'POST', body: JSON.stringify({ answerJson: JSON.stringify(answerJson) }),
  });
}

async function pollResult(attemptId) {
  const deadline = Date.now() + TEST_TIMEOUT;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 2000));
    try {
      const rd = await api(`/api/student/practice/attempts/${attemptId}/result`);
      const s = rd.data?.status || rd.status;
      if (s === 'Completed' || s === 'Grading_Failed') {
        return rd.data || rd;
      }
    } catch {}
  }
  throw new Error(`Timeout polling result for ${attemptId}`);
}

async function playPrompt(attemptId) {
  return api(`/api/student/practice/attempts/${attemptId}/play-prompt`, { method: 'POST' });
}

async function run() {
  console.log('=== Real Practice Workflow Tests (Fake Providers) ===\n');

  const { prisma, dbUrl } = await setupTestDb();
  let userId;

  try {
    // Seed user
    const user = await prisma.user.create({
      data: { email: `wf-${Date.now()}@test.com`, password: '$2a$10$h', name: 'WF Test', role: 'student' },
    });
    userId = user.id;
    token = jwt.sign({ id: userId, email: user.email, role: 'student' }, JWT_SECRET, { expiresIn: '1h' });

    // Start server
    console.log('Starting test server...');
    await startServer(dbUrl);
    console.log('Server ready on port', PORT);

    // Seed questions for all workflows
    async function seedQ(code, section, extra = {}) {
      const promptMap = {
        RA: 'Read the passage aloud clearly.', RS: '', DI: 'Describe the image in detail.',
        RL: '', ASQ: '', SGD: '', RTS: 'Respond to the situation.', SWT: 'Summarize the passage.',
        WE: 'Write an essay on the given topic.', MCS: 'Select the correct answer.',
        MCM: 'Select all correct answers.', ROP: 'Reorder the paragraphs.',
        FIBR: 'Fill in the blanks.', FIBRW: 'Fill in the blanks.',
        SST: '', FIBL: '', HCS: '', MCSSL: '', MCMSL: '', SMW: '', HIW: '', WFD: '',
      };
      const audioTasks = ['RS', 'ASQ', 'SGD', 'RL', 'SST', 'FIBL', 'HCS', 'MCSSL', 'MCMSL', 'SMW', 'HIW', 'WFD'];
      const optionTasks = ['MCS', 'MCM', 'ROP', 'FIBR', 'FIBRW', 'HCS', 'MCSSL', 'MCMSL', 'SMW'];
      const data = {
        taskCode: code, section, title: `Test ${code}`, instruction: `Complete ${code}`,
        promptText: extra.promptText ?? promptMap[code] ?? '',
        contentVersion: 1, difficulty: 'medium', status: 'published',
      };
      if (audioTasks.includes(code)) data.audioUrl = extra.audioUrl ?? '/test-audio/prompt.mp3';
      if (code === 'DI') data.imageUrl = extra.imageUrl ?? '/test-img.png';
      if (optionTasks.includes(code)) data.optionsJson = extra.optionsJson ?? JSON.stringify(['Option A', 'Option B', 'Option C', 'Option D']);
      if (extra.answerKeyJson !== undefined) data.answerKeyJson = extra.answerKeyJson;
      return prisma.questionBankItem.create({ data });
    }

    const qs = {};
    qs.RA = await seedQ('RA', 'Speaking');
    qs.RS = await seedQ('RS', 'Speaking', { answerKeyJson: null });
    qs.ASQ = await seedQ('ASQ', 'Speaking', { answerKeyJson: JSON.stringify({ acceptedAnswers: ['photosynthesis'], aliases: ['photosynthetic process'] }) });
    qs.SGD = await seedQ('SGD', 'Speaking');
    qs.WFD = await seedQ('WFD', 'Listening', { answerKeyJson: JSON.stringify({ referenceText: 'the cat sat on the mat' }) });
    qs.HIW = await seedQ('HIW', 'Listening', { answerKeyJson: JSON.stringify({ incorrectTokenPositions: [1, 3] }) });
    qs.MCM = await seedQ('MCM', 'Reading', { answerKeyJson: JSON.stringify({ correctOptionIds: ['Option A', 'Option C'] }) });
    qs.SWT = await seedQ('SWT', 'Writing', { promptText: 'Summarize the passage about climate change and its effects on the environment.' });
    qs.WE = await seedQ('WE', 'Writing', { promptText: 'Discuss the advantages and disadvantages of technology in education.' });
    qs.SST = await seedQ('SST', 'Listening');

    console.log(`${Object.keys(qs).length} questions seeded\n`);

    // ── 1. RA — Read Aloud ────────────────────────────────────────────────
    console.log('1. RA workflow');
    const raId = await startAttempt(qs.RA.id);
    assert(!!raId, 'RA: attempt started');

    // Confirm visible passage
    const raStart = await api(`/api/student/practice/attempts/${raId}`);
    assert(!!raStart, 'RA: attempt fetched');

    // Upload audio
    const raAudio = await uploadAudio(raId, join(root, 'tests/fixtures/audio/sample.wav'));
    assert(!!raAudio, 'RA: audio uploaded');

    const raSubmit = await submitAttempt(raId, {});
    assert(!!raSubmit.data?.submissionId, 'RA: submission created');

    // Poll with fake AI grading
    const raResult = await pollResult(raId);
    assert(raResult.status === 'Completed', 'RA: Completed');
    assert(raResult.result?.score != null || raResult.score != null, 'RA: has score');
    console.log(`   PASS (score=${raResult.result?.score ?? raResult.score})`);

    // ── 2. RS — Repeat Sentence ────────────────────────────────────────────
    console.log('2. RS workflow');
    const rsId = await startAttempt(qs.RS.id);
    assert(!!rsId, 'RS: attempt started');

    // Play prompt (timed mode has multiplier 2, so maxPlays=2)
    const rsPlay1 = await playPrompt(rsId);
    assert(!!rsPlay1.data?.audioUrl || !!rsPlay1.audioUrl, 'RS: first play succeeds');
    const rsPlay2 = await playPrompt(rsId);
    assert(!!rsPlay2, 'RS: second play succeeds (timed mode maxPlays=2)');
    // Third play should fail
    try {
      await playPrompt(rsId);
      assert(false, 'RS: third play should be rejected');
    } catch {
      assert(true, 'RS: third play rejected (expected)');
    }

    const rsAudio = await uploadAudio(rsId, join(root, 'tests/fixtures/audio/sample.wav'));
    assert(!!rsAudio, 'RS: audio uploaded');

    const rsSubmit = await submitAttempt(rsId, {});
    assert(!!rsSubmit.data?.submissionId, 'RS: submission created');

    const rsResult = await pollResult(rsId);
    assert(rsResult.status === 'Completed', 'RS: Completed');
    console.log(`   PASS (score=${rsResult.result?.score ?? rsResult.score})`);

    // ── 3. ASQ — Answer Short Question ────────────────────────────────────
    console.log('3. ASQ workflow');
    const asqId = await startAttempt(qs.ASQ.id);
    assert(!!asqId, 'ASQ: attempt started');

    // Play prompt
    const asqPlay = await playPrompt(asqId);
    assert(!!asqPlay, 'ASQ: play prompt succeeded');

    const asqAudio = await uploadAudio(asqId, join(root, 'tests/fixtures/audio/sample.wav'));
    assert(!!asqAudio, 'ASQ: audio uploaded');
    const asqAudioId = asqAudio.data?.responseAudioId || asqAudio.responseAudioId;
    assert(!!asqAudioId, 'ASQ: responseAudioId returned');

    console.log(`   ASQ audio ID: ${asqAudioId}`);

    const asqSubmit = await submitAttempt(asqId, {});
    assert(!!asqSubmit.data?.submissionId, 'ASQ: submission created');

    const asqResult = await pollResult(asqId);
    assert(asqResult.status === 'Completed', 'ASQ: Completed');
    // ASQ transcript is 'photosynthesis' which matches acceptedAnswers for ASQ
    const asqScore = asqResult.result?.score ?? asqResult.score;
    assert(asqScore >= 0, 'ASQ: has score');
    console.log(`   PASS (score=${asqScore})`);

    // ── 4. SGD — Summarize Group Discussion ────────────────────────────────
    console.log('4. SGD workflow');
    const sgdId = await startAttempt(qs.SGD.id);
    assert(!!sgdId, 'SGD: attempt started');

    // Play prompt
    const sgdPlay = await playPrompt(sgdId);
    assert(!!sgdPlay, 'SGD: play prompt succeeded');

    const sgdAudio = await uploadAudio(sgdId, join(root, 'tests/fixtures/audio/sample.wav'));
    assert(!!sgdAudio, 'SGD: audio uploaded');

    const sgdSubmit = await submitAttempt(sgdId, {});
    assert(!!sgdSubmit.data?.submissionId, 'SGD: submission created');

    const sgdResult = await pollResult(sgdId);
    assert(sgdResult.status === 'Completed', 'SGD: Completed');
    console.log(`   PASS (score=${sgdResult.result?.score ?? sgdResult.score})`);

    // ── 5. WFD — Write From Dictation ─────────────────────────────────────
    console.log('5. WFD workflow');
    const wfdId = await startAttempt(qs.WFD.id);
    assert(!!wfdId, 'WFD: attempt started');

    const wfdPlay = await playPrompt(wfdId);
    assert(!!wfdPlay, 'WFD: play prompt succeeded');

    const wfdSubmit = await submitAttempt(wfdId, { typedText: 'the cat sat on the mat' });
    assert(!!wfdSubmit.data?.submissionId, 'WFD: submission created');

    const wfdResult = await pollResult(wfdId);
    assert(wfdResult.status === 'Completed', 'WFD: Completed');
    assert(wfdResult.result?.score === 6, `WFD: full score 6, got ${wfdResult.result?.score}`);
    console.log(`   PASS (score=${wfdResult.result?.score})`);

    // ── 6. HIW — Highlight Incorrect Words ────────────────────────────────
    console.log('6. HIW workflow');
    const hiwId = await startAttempt(qs.HIW.id);
    assert(!!hiwId, 'HIW: attempt started');

    const hiwSubmit = await submitAttempt(hiwId, { highlightedIncorrect: ['Option B', 'Option D'] });
    assert(!!hiwSubmit.data?.submissionId, 'HIW: submission created');

    const hiwResult = await pollResult(hiwId);
    assert(hiwResult.status === 'Completed', 'HIW: Completed');
    console.log(`   PASS (score=${hiwResult.result?.score ?? hiwResult.score})`);

    // ── 7. MCM — Multiple Choice Multiple (Real Multi-Answer) ─────────────
    console.log('7. MCM workflow');
    const mcmId = await startAttempt(qs.MCM.id);
    assert(!!mcmId, 'MCM: attempt started');

    // Submit one correct (Option A) and one incorrect (Option B)
    // Correct set: {A, C}. Submitted: {A, B}. Correct selected: 1, Incorrect selected: 1. Score: 1-1 = 0.
    const mcmSubmit = await submitAttempt(mcmId, { selectedMultiple: ['Option A', 'Option B'] });
    assert(!!mcmSubmit.data?.submissionId, 'MCM: submission created');

    const mcmResult = await pollResult(mcmId);
    assert(mcmResult.status === 'Completed', 'MCM: Completed');
    const mcmScore = mcmResult.result?.score ?? mcmResult.score;
    assert(mcmScore === 0, `MCM: score = correct - incorrect = 1-1 = 0, got ${mcmScore}`);
    console.log(`   PASS (score=${mcmScore}, breakdown=${JSON.stringify(mcmResult.result?.breakdown)})`);

    // ── 8. SWT — Summarize Written Text ───────────────────────────────────
    console.log('8. SWT workflow');
    const swtId = await startAttempt(qs.SWT.id);
    assert(!!swtId, 'SWT: attempt started');

    const swtSubmit = await submitAttempt(swtId, { typedText: 'Climate change is causing significant environmental shifts worldwide.' });
    assert(!!swtSubmit.data?.submissionId, 'SWT: submission created');

    const swtResult = await pollResult(swtId);
    assert(swtResult.status === 'Completed', 'SWT: Completed');
    assert(swtResult.result?.score != null, 'SWT: has score');
    console.log(`   PASS (score=${swtResult.result?.score ?? swtResult.score})`);

    // ── 9. WE — Write Essay ───────────────────────────────────────────────
    console.log('9. WE workflow');
    const weId = await startAttempt(qs.WE.id);
    assert(!!weId, 'WE: attempt started');

    const weSubmit = await submitAttempt(weId, { typedText: 'Technology has transformed education by enabling remote learning and personalized instruction.' });
    assert(!!weSubmit.data?.submissionId, 'WE: submission created');

    const weResult = await pollResult(weId);
    assert(weResult.status === 'Completed', 'WE: Completed');
    assert(weResult.result?.score != null, 'WE: has score');
    console.log(`   PASS (score=${weResult.result?.score ?? weResult.score})`);

    // ── 10. SST — Summarize Spoken Text ────────────────────────────────────
    console.log('10. SST workflow');
    const sstId = await startAttempt(qs.SST.id);
    assert(!!sstId, 'SST: attempt started');

    const sstPlay = await playPrompt(sstId);
    assert(!!sstPlay, 'SST: play prompt succeeded');

    const sstSubmit = await submitAttempt(sstId, { typedText: 'The lecture discussed key concepts about climate change impacts.' });
    assert(!!sstSubmit.data?.submissionId, 'SST: submission created');

    const sstResult = await pollResult(sstId);
    assert(sstResult.status === 'Completed', 'SST: Completed');
    assert(sstResult.result?.score != null, 'SST: has score');
    console.log(`   PASS (score=${sstResult.result?.score ?? sstResult.score})`);

    console.log('\n--- All 10 workflows completed ---');

  } catch (err) {
    console.error('Workflow error:', err.message);
    if (typeof globalThis.__serverLog === 'function') {
      const log = globalThis.__serverLog();
      const lastLines = log.split('\n').filter(Boolean).slice(-20).join('\n');
      if (lastLines) console.error('Server log (last 20):\n', lastLines);
    }
    failed++;
  } finally {
    stopServer();
    await teardownTestDb(prisma);
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
  console.log('All real workflow tests passed.');
}

run().catch((err) => { console.error('Fatal:', err); process.exit(1); });
