import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const EMAIL = 'student@example.com';
const PASSWORD = 'password123';

test.describe('P1 Upload Security', () => {
  test('Unauthenticated upload is rejected', async ({ page }) => {
    const res = await page.request.post(`${BASE}/api/upload`);
    expect(res.status()).toBe(401);
  });

  test('Upload with valid auth passes auth layer', async ({ page }) => {
    const loginRes = await page.request.post(`${BASE}/api/auth/login`, {
      data: { email: EMAIL, password: PASSWORD },
    });
    expect(loginRes.status()).toBe(200);
    const loginBody = await loginRes.json();

    const res = await page.request.post(`${BASE}/api/upload`, {
      headers: { Authorization: `Bearer ${loginBody.token}` },
      multipart: {
        file: {
          name: 'test.png',
          mimeType: 'image/png',
          buffer: Buffer.from('fake-png-data'),
        },
      },
    });
    // 400 (no file / multer error) or 200 — but not 401/403
    expect([200, 400]).toContain(res.status());
  });

  test('Disallowed file extension is rejected', async ({ page }) => {
    const loginRes = await page.request.post(`${BASE}/api/auth/login`, {
      data: { email: EMAIL, password: PASSWORD },
    });
    expect(loginRes.status()).toBe(200);
    const loginBody = await loginRes.json();

    const res = await page.request.post(`${BASE}/api/upload`, {
      headers: { Authorization: `Bearer ${loginBody.token}` },
      multipart: {
        file: {
          name: 'evil.exe',
          mimeType: 'application/x-msdownload',
          buffer: Buffer.from('malicious'),
        },
      },
    });
    // Should be rejected with 400 or 415
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
  });
});
