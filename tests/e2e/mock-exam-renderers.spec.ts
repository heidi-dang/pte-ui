import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const EMAIL = 'student@example.com';
const PASSWORD = 'password123';

test.describe('Mock Exam Renderer Coverage', () => {
  test('all 22 renderer codes resolve via API', async ({ request }) => {
    const loginRes = await request.post(`${BASE}/api/auth/login`, {
      data: { email: EMAIL, password: PASSWORD },
    });
    const loginData = await loginRes.json();
    const token = loginData.token;

    // Fetch renderer codes from test endpoint
    const res = await request.get(`${BASE}/api/test/renderer-codes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    expect(data.count).toBe(22);
    expect(data.codes).toContain('RA');
    expect(data.codes).toContain('RS');
    expect(data.codes).toContain('DI');
    expect(data.codes).toContain('RL');
    expect(data.codes).toContain('ASQ');
    expect(data.codes).toContain('SGD');
    expect(data.codes).toContain('RTS');
    expect(data.codes).toContain('SWT');
    expect(data.codes).toContain('WE');
    expect(data.codes).toContain('MCS');
    expect(data.codes).toContain('MCM');
    expect(data.codes).toContain('ROP');
    expect(data.codes).toContain('FIBR');
    expect(data.codes).toContain('FIBRW');
    expect(data.codes).toContain('SST');
    expect(data.codes).toContain('MCMSL');
    expect(data.codes).toContain('FIBL');
    expect(data.codes).toContain('HCS');
    expect(data.codes).toContain('MCSSL');
    expect(data.codes).toContain('SMW');
    expect(data.codes).toContain('HIW');
    expect(data.codes).toContain('WFD');
  });

  test('task registry smoke confirms 22 renderers', async ({ request }) => {
    const loginRes = await request.post(`${BASE}/api/auth/login`, {
      data: { email: EMAIL, password: PASSWORD },
    });
    const loginData = await loginRes.json();
    const token = loginData.token;

    const res = await request.get(`${BASE}/api/test/renderer-codes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    expect(data.count).toBe(22);
  });
});
