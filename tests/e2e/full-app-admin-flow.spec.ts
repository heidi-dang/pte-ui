import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'password123';

test.describe('Full App Admin Flow', () => {
  let adminToken = '';
  const errors: string[] = [];

  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/login`, {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    const body = await res.json();
    adminToken = body.token;
    expect(adminToken).toBeTruthy();
    expect(body.user.role).toBe('admin');
  });

  test.beforeEach(async ({ page }) => {
    errors.length = 0;
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`[${msg.type()}] ${msg.text()}`);
    });
    page.on('pageerror', (err) => errors.push(`[PAGE ERROR] ${err.message}`));
  });

  test.afterEach(async () => {
    const critical = errors.filter(e =>
      e.includes('TypeError') || e.includes('undefined') || e.includes('null')
      || e.includes('500') || e.includes('403') || e.includes('401'));
    expect(critical).toHaveLength(0);
  });

  test('admin dashboard metrics load', async ({ request }) => {
    const res = await request.get(`${BASE}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBe(true);
    const data = await res.json();
    expect(data.totalUsers).toBeDefined();
    expect(data.activeStudents).toBeDefined();
  });

  test('users list loads', async ({ request }) => {
    const res = await request.get(`${BASE}/api/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBe(true);
    const users = await res.json();
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBeGreaterThan(0);
    // Verify no user passwords leaked
    const first = users[0];
    expect(first.password).toBeUndefined();
  });

  test('question bank lists items', async ({ request }) => {
    const res = await request.get(`${BASE}/api/admin/question-bank?pageSize=10`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBe(true);
    const items = await res.json();
    expect(Array.isArray(items)).toBe(true);
  });

  test('generation batches accessible', async ({ request }) => {
    const res = await request.get(`${BASE}/api/admin/question-bank/batches`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBe(true);
    const batches = await res.json();
    expect(Array.isArray(batches)).toBe(true);
  });

  test('system metrics load', async ({ request }) => {
    const res = await request.get(`${BASE}/api/admin/system-metrics`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBe(true);
    const data = await res.json();
    expect(data.totalUsers).toBeDefined();
  });

  test('runtime health accessible', async ({ request }) => {
    const res = await request.get(`${BASE}/api/admin/runtime-health`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBe(true);
    const data = await res.json();
    expect(data.dbReachable).toBe(true);
  });

  test('admin reports overview loads', async ({ request }) => {
    const res = await request.get(`${BASE}/api/admin/reports/overview`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBe(true);
    const data = await res.json();
    expect(data.practiceVolume).toBeDefined();
  });

  test('admin submissions list loads', async ({ request }) => {
    const res = await request.get(`${BASE}/api/admin/submissions`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBe(true);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test('admin mock tests list loads', async ({ request }) => {
    const res = await request.get(`${BASE}/api/admin/mock-tests`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBe(true);
    const data = await res.json();
    expect(data.attempts).toBeDefined();
    expect(data.counts).toBeDefined();
  });

  test('admin jobs list loads', async ({ request }) => {
    const res = await request.get(`${BASE}/api/admin/jobs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.ok()).toBe(true);
    const data = await res.json();
    expect(data.jobs).toBeDefined();
    expect(data.total).toBeDefined();
  });
});
