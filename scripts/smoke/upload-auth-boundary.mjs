#!/usr/bin/env node

/**
 * Regression smoke test: upload router auth boundary.
 * Proves that the upload router's authenticateToken middleware is applied
 * only to POST /upload — NOT globally to all /api/* routes.
 *
 * Usage:
 *   PRODUCTION_BASE_URL=http://localhost:3000 \
 *   SMOKE_TEST_USER_EMAIL=student@example.com \
 *   SMOKE_TEST_USER_PASSWORD=password123 \
 *   bun run scripts/smoke/upload-auth-boundary.mjs
 */

const BASE_URL = process.env.PRODUCTION_BASE_URL || 'http://localhost:3000';
const EMAIL = process.env.SMOKE_TEST_USER_EMAIL || 'student@example.com';
const PASSWORD = process.env.SMOKE_TEST_USER_PASSWORD || 'password123';

function bail(msg) {
  console.error('FAIL:', msg);
  process.exit(1);
}

async function fetchJson(url, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (opts.token) headers['Authorization'] = `Bearer ${opts.token}`;
  const res = await fetch(`${BASE_URL}${url}`, { ...opts, headers });
  try { return { status: res.status, body: await res.json() }; }
  catch { bail(`Non-JSON response at ${url}: ${res.status}`); }
}

(async () => {
  try {
    // 1 — Login must NOT require auth
    console.log('[1] Login (public route) should return token without auth header...');
    let r = await fetchJson('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    });
    if (r.status !== 200) bail(`Login failed with ${r.status}: ${r.body.error}`);
    if (!r.body.token) bail('No token in login response');
    const token = r.body.token;
    console.log('  PASS: login returned token');

    // 2 — Forgot-password must NOT require auth
    console.log('[2] Forgot-password (public route) should return 200 without auth header...');
    r = await fetchJson('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'nobody@example.com' }),
    });
    if (r.status !== 200) bail(`Forgot-password failed with ${r.status}: ${r.body.error}`);
    console.log('  PASS: forgot-password returned 200');

    // 3 — /me must require auth (returns 401 without token)
    console.log('[3] /me should return 401 without auth header...');
    r = await fetchJson('/api/auth/me');
    if (r.status !== 401) bail(`/me should return 401 without auth, got ${r.status}`);
    console.log('  PASS: /me rejected unauthenticated request');

    // 4 — POST /upload without auth must return 401
    console.log('[4] POST /upload should return 401 without auth header...');
    r = await fetchJson('/api/upload', { method: 'POST' });
    if (r.status !== 401) bail(`POST /upload should return 401 without auth, got ${r.status}`);
    console.log('  PASS: POST /upload rejected unauthenticated request');

    // 5 — POST /upload with valid token must pass auth (400 for no file is expected)
    console.log('[5] POST /upload with valid token should pass auth...');
    r = await fetchJson('/api/upload', { method: 'POST', token });
    // Expect 400 (no file uploaded) — this proves auth passed and Multer handled the request
    if (r.status !== 400) bail(`POST /upload with token should return 400 (no file), got ${r.status}: ${r.body?.error}`);
    if (r.body?.error !== 'No file uploaded') bail(`Expected 'No file uploaded' error, got: ${r.body?.error}`);
    console.log('  PASS: POST /upload auth accepted, Multer returned expected error');

    // 6 — GET /api/health must never require auth
    console.log('[6] Health check should return ok without auth...');
    r = await fetchJson('/api/health');
    if (r.status !== 200 || r.body?.status !== 'ok') bail('Health check failed');
    console.log('  PASS: health check returned ok');

    console.log('\nPASS: Upload router auth boundary is correct.');
    console.log('Public routes are public. Only POST /upload requires authenticateToken.');
    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
})();
