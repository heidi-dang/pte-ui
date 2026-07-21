import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const EMAIL = 'student@example.com';
const PASSWORD = 'password123';

test.describe('P1 Upload Security', () => {
  async function loginAndGetCookie(page: any) {
    const maxRetries = 3;
    for (let i = 0; i < maxRetries; i++) {
      const loginRes = await page.request.post(`${BASE}/api/auth/login`, {
        data: { email: EMAIL, password: PASSWORD },
      });
      if (loginRes.status() === 200) {
        const setCookie = loginRes.headers()['set-cookie'] || '';
        const match = setCookie.match(/pte_token=[^;]+/);
        return match ? match[0] : '';
      }
      if (loginRes.status() === 429) {
        if (i < maxRetries - 1) {
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
      }
      expect(loginRes.status()).toBe(200);
    }
    return '';
  }

  test('Unauthenticated upload is rejected', async ({ page }) => {
    const res = await page.request.post(`${BASE}/api/upload`);
    expect(res.status()).toBe(401);
  });

  test('Upload with valid auth passes auth layer', async ({ page }) => {
    const cookie = await loginAndGetCookie(page);
    expect(cookie).toBeTruthy();

    const res = await page.request.post(`${BASE}/api/upload`, {
      headers: { Cookie: cookie },
      multipart: {
        file: {
          name: 'test.png',
          mimeType: 'image/png',
          buffer: Buffer.from('fake-png-data'),
        },
      },
    });
    expect([200, 400]).toContain(res.status());
  });

  test('Disallowed file extension is rejected', async ({ page }) => {
    const cookie = await loginAndGetCookie(page);
    expect(cookie).toBeTruthy();

    const res = await page.request.post(`${BASE}/api/upload`, {
      headers: { Cookie: cookie },
      multipart: {
        file: {
          name: 'evil.exe',
          mimeType: 'application/x-msdownload',
          buffer: Buffer.from('malicious'),
        },
      },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
  });
});
