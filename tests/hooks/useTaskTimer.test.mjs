#!/usr/bin/env node

function msUntil(iso) {
  return new Date(iso).getTime() - Date.now();
}

function clampSeconds(ms) {
  return Math.max(0, Math.floor(ms / 1000));
}

function computePhase(phase, prepDeadline, respDeadline, expiredFired) {
  const now = Date.now();

  if (phase === 'preparing' && prepDeadline) {
    const remaining = clampSeconds(msUntil(prepDeadline));
    if (remaining <= 0) {
      const respRemaining = respDeadline ? clampSeconds(msUntil(respDeadline)) : 0;
      return { phase: 'answering', prepRemaining: 0, respRemaining, shouldExpire: false };
    }
    return { phase: 'preparing', prepRemaining: remaining, respRemaining: 0, shouldExpire: false };
  }

  if ((phase === 'answering' || phase === 'recording') && respDeadline) {
    const remaining = clampSeconds(msUntil(respDeadline));
    if (remaining <= 0 && !expiredFired) {
      return { phase: 'completed', prepRemaining: 0, respRemaining: 0, shouldExpire: true };
    }
    return { phase, prepRemaining: 0, respRemaining: remaining, shouldExpire: false };
  }

  return { phase, prepRemaining: 0, respRemaining: 0, shouldExpire: false };
}

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) { passed++; } else { failed++; console.error(`  FAIL: ${msg}`); }
}

// ── Tests ─────────────────────────────────────────────────────────────

// clampSeconds
assert(clampSeconds(-5000) === 0, 'clampSeconds returns 0 for negative values');
assert(clampSeconds(-1) === 0, 'clampSeconds returns 0 for -1');
assert(clampSeconds(5000) === 5, 'clampSeconds floors 5000ms to 5s');
assert(clampSeconds(9999) === 9, 'clampSeconds floors 9999ms to 9s');
assert(clampSeconds(0) === 0, 'clampSeconds returns 0 for 0');

// Prep → answering transition
{
  const now = Date.now();
  const prepPast = new Date(now - 100).toISOString();
  const respFuture = new Date(now + 10000).toISOString();
  const r = computePhase('preparing', prepPast, respFuture, false);
  assert(r.phase === 'answering', 'prep expires → answering');
  assert(r.prepRemaining === 0, 'prepRemaining is 0 after expiry');
  assert(r.respRemaining >= 9, `respRemaining ≈ 10s, got ${r.respRemaining}`);
}

// Answering shows remaining
{
  const now = Date.now();
  const respFuture = new Date(now + 15000).toISOString();
  const r = computePhase('answering', null, respFuture, false);
  assert(r.phase === 'answering', 'answering stays answering');
  assert(r.respRemaining >= 14 && r.respRemaining <= 15, `respRemaining ≈ 15s, got ${r.respRemaining}`);
}

// Expiry fires once only
{
  const now = Date.now();
  const respPast = new Date(now - 1000).toISOString();

  const r1 = computePhase('answering', null, respPast, false);
  assert(r1.phase === 'completed', 'first call: phase → completed');
  assert(r1.shouldExpire === true, 'first call: shouldExpire true');

  const r2 = computePhase('answering', null, respPast, true);
  assert(r2.phase === 'answering', 'second call: phase stays (expiry already fired)');
  assert(r2.shouldExpire === false, 'second call: shouldExpire false');
}

// Recording phase expires
{
  const now = Date.now();
  const respPast = new Date(now - 1).toISOString();
  const r = computePhase('recording', null, respPast, false);
  assert(r.phase === 'completed', 'recording expires → completed');
  assert(r.shouldExpire === true, 'recording expiry fires');
}

// Completed stays completed
{
  const r = computePhase('completed', null, null, true);
  assert(r.phase === 'completed', 'completed stays completed');
}

// Prep with future deadline stays in prep
{
  const now = Date.now();
  const prepFuture = new Date(now + 5000).toISOString();
  const r = computePhase('preparing', prepFuture, null, false);
  assert(r.phase === 'preparing', 'prep with future deadline stays preparing');
  assert(r.prepRemaining === 5, `prepRemaining is 5, got ${r.prepRemaining}`);
}

// Simulate delay: recompute from Date.now()
{
  // Store actual Date.now before overriding
  const origNow = Date.now();
  const respDead = new Date(origNow + 30000).toISOString();

  let r = computePhase('answering', null, respDead, false);
  assert(r.respRemaining === 30, `t0: remaining 30, got ${r.respRemaining}`);

  // Simulate 5s passing by re-evaluating with a later base time
  // We can't fake Date.now without vitest, but we can test with a past deadline
  const laterDead = new Date(origNow - 5000).toISOString();
  r = computePhase('answering', null, laterDead, false);
  assert(r.shouldExpire === true, 'past deadline triggers expiry regardless of wall clock');
}

console.log(`\nuseTaskTimer unit tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log('All tests passed.');
