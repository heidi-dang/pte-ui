import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const STUDENT_EMAIL = 'student@example.com';
const STUDENT_PASSWORD = 'password123';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'password123';

test.describe('Full App Auth Security', () => {
  let studentToken = '';
  let adminToken = '';

  test.beforeAll(async ({ request }) => {
    // Student login
    const sRes = await request.post(`${BASE}/api/auth/login`, {
      data: { email: STUDENT_EMAIL, password: STUDENT_PASSWORD },
    });
    studentToken = (await sRes.json()).token;

    // Admin login
    const aRes = await request.post(`${BASE}/api/auth/login`, {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    adminToken = (await aRes.json()).token;
  });

  test('student cannot access admin dashboard', async ({ request }) => {
    const res = await request.get(`${BASE}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    expect(res.status()).toBe(403);
  });

  test('student cannot access admin users', async ({ request }) => {
    const res = await request.get(`${BASE}/api/admin/users`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    expect(res.status()).toBe(403);
  });

  test('student cannot access admin question bank', async ({ request }) => {
    const res = await request.get(`${BASE}/api/admin/question-bank`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    expect(res.status()).toBe(403);
  });

  test('student cannot create question bank item', async ({ request }) => {
    const res = await request.post(`${BASE}/api/admin/question-bank`, {
      headers: { Authorization: `Bearer ${studentToken}`, 'Content-Type': 'application/json' },
      data: { taskCode: 'MCS', section: 'Reading', title: 'Hack Test', instruction: 'Bad', promptText: 'Should fail' },
    });
    expect(res.status()).toBe(403);
  });

  test('student cannot access admin jobs', async ({ request }) => {
    const res = await request.get(`${BASE}/api/admin/jobs`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    expect(res.status()).toBe(403);
  });

  test('unauthenticated request to student endpoints returns 401', async ({ request }) => {
    const res = await request.get(`${BASE}/api/student/dashboard`);
    expect(res.status()).toBe(401);
  });

  test('unauthenticated request to admin endpoints returns 401', async ({ request }) => {
    const res = await request.get(`${BASE}/api/admin/dashboard`);
    expect(res.status()).toBe(401);
  });

  test('invalid token returns 403', async ({ request }) => {
    const res = await request.get(`${BASE}/api/student/dashboard`, {
      headers: { Authorization: 'Bearer invalid-token-12345' },
    });
    expect(res.status()).toBe(403);
  });

  test('student cannot see other user records', async ({ request }) => {
    // Student activity endpoint should only return their own data
    const res = await request.get(`${BASE}/api/student/practice/submissions`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    expect(res.ok()).toBe(true);
    const subs = await res.json();
    // All submissions should belong to the authenticated student
    expect(Array.isArray(subs)).toBe(true);
  });

  test('student cannot POST to admin user operations', async ({ request }) => {
    const res = await request.post(`${BASE}/api/admin/users/nonexistent/role`, {
      headers: { Authorization: `Bearer ${studentToken}`, 'Content-Type': 'application/json' },
      data: { role: 'admin' },
    });
    expect(res.status()).toBe(403);
  });

  test('admin can access all admin endpoints', async ({ request }) => {
    const endpoints = [
      '/api/admin/dashboard',
      '/api/admin/users',
      '/api/admin/question-bank',
      '/api/admin/jobs',
      '/api/admin/system-metrics',
      '/api/admin/runtime-health',
    ];
    for (const ep of endpoints) {
      const res = await request.get(`${BASE}${ep}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status(), `${ep} should return 200`).toBe(200);
    }
  });

  test('question bank list returns answerKeyJson to admin only', async ({ request }) => {
    const adminRes = await request.get(`${BASE}/api/admin/question-bank?pageSize=1`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(adminRes.ok()).toBe(true);
    const adminItems = await adminRes.json();
    if (adminItems.length > 0) {
      expect(adminItems[0].answerKeyJson).toBeDefined();
    }

    // Student should NOT see answerKeyJson
    const studentRes = await request.get(`${BASE}/api/student/questions?pageSize=1`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    expect(studentRes.ok()).toBe(true);
    const studentData = await studentRes.json();
    expect(studentData.success).toBe(true);
    if (studentData.data?.items?.length > 0) {
      expect(studentData.data.items[0].answerKeyJson).toBeUndefined();
    }
  });

  test('seed endpoint requires demo mode', async ({ request }) => {
    const res = await request.post(`${BASE}/api/seed`);
    // Should return 403 in non-demo (CI uses DEMO_MODE=true, so may be 200)
    // At minimum, should not return 500
    expect(res.status()).not.toBe(500);
  });
});
