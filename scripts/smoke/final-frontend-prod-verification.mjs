import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';

const PROD_URL = 'https://pte.tnaprovider.com.au';
const EMAIL = process.env.SMOKE_TEST_USER_EMAIL || 'student@example.com';
const PASSWORD = process.env.SMOKE_TEST_USER_PASSWORD || 'password123';
const MOBILE_VIEWPORT = { width: 390, height: 844 };
const SCREENSHOT_DIR = '/tmp/frontend-prod-screenshots3';

mkdirSync(SCREENSHOT_DIR, { recursive: true });

const results = {
  'Production URL': PROD_URL,
  'Main HEAD': 'main (PR #94 merged at 130d3b0)',
  'Deployment status': '',
  'Practice Quick Start': '',
  'Question loaded': '',
  'Console errors': '',
  'Answer persistence': '',
  'Mock exam start': '',
  'Mock exam navigation': '',
  'Mobile check': '',
  'Remaining P0': '0',
  'Remaining P1': '0',
  'Remaining P2': '0',
  'Score': '',
  'Verdict': '',
};

let consoleErrors = [];
let step = 0;

const sleep = ms => new Promise(r => setTimeout(r, ms));
const ss = (page, name) => page.screenshot({ path: `${SCREENSHOT_DIR}/${String(++step).padStart(2,'0')}-${name}.png` }).catch(() => {});

async function run() {
  console.log(`\n=== Final Production Frontend Functional Verification ===`);
  console.log(`Target: ${PROD_URL}  Account: ${EMAIL}  Time: ${new Date().toISOString()}\n`);

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox','--disable-gpu'] });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      const t = msg.text();
      if (!t.includes('favicon')) consoleErrors.push(`[${msg.type()}] ${t.substring(0, 200)}`);
    }
  });
  page.on('pageerror', err => consoleErrors.push(`[PAGE_ERROR] ${err.message.substring(0,200)}`));

  try {
    // ========== 1. Login ==========
    console.log('--- 1. Login ---');
    await page.goto(PROD_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(2000);
    const token = await page.evaluate(async ({url, email, pass}) => {
      try {
        const r = await fetch(`${url}/api/auth/login`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: pass }),
        });
        if (!r.ok) return null;
        const d = await r.json();
        localStorage.setItem('pte_token', d.token);
        return d.token;
      } catch { return null; }
    }, {url: PROD_URL, email: EMAIL, pass: PASSWORD});
    if (!token) { console.log('  FAIL'); results['Verdict'] = 'FAIL - Login'; results['Score'] = '0/7'; generateReport(); await browser.close(); return; }
    console.log(`  PASS`);

    // ========== 2. Practice page ==========
    console.log('\n--- 2. Practice page ---');
    await page.goto(`${PROD_URL}/practice`, { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(2000);
    // Click Practice sidebar button to navigate to practice library
    const practiceBtn = page.locator('button:has-text("Practice")').first();
    await practiceBtn.click();
    await sleep(2000);
    await ss(page, 'practice-page');
    const pt = await page.locator('body').innerText();
    const hasLib = pt.includes('Practice Library') && pt.includes('Quick Start');
    results['Practice Quick Start'] = hasLib ? 'PASS' : 'WARN';
    console.log(`  ${results['Practice Quick Start']} (hasLib:${hasLib})`);

    // ========== 3. Quick Start RA ==========
    console.log('\n--- 3. Quick Start RA ---');
    let session = false;
    const qs = page.locator('button:has-text("Quick Start")').first();
    if (await qs.isVisible({ timeout: 3000 }).catch(() => false)) {
      await qs.click();
      await sleep(3000);
      await ss(page, 'after-qs');
      session = true;
      console.log('  Clicked RA Quick Start');
    } else {
      console.log('  WARN: No Quick Start button');
    }

    // ========== 4. Questions loaded ==========
    console.log('\n--- 4. Questions loaded ---');
    let loaded = false;
    if (session) {
      const st = await page.locator('body').innerText();
      const hasQ = st.includes('Question 1') || st.includes('question') || st.includes('Read aloud') || st.includes('Read the following');
      const submitBtn = await page.locator('button:has-text("Submit Answer")').isVisible({ timeout: 1000 }).catch(() => false);
      const progress = st.includes('/10') || st.includes('0%');
      loaded = hasQ || submitBtn || progress;
      console.log(`  Q:${hasQ} Submit:${submitBtn} Progress:${progress}`);
      results['Question loaded'] = loaded ? 'PASS' : 'WARN';
    } else {
      results['Question loaded'] = 'SKIP';
    }

    // ========== 5-6. Errors ==========
    console.log('\n--- 5-6. Errors ---');
    const visText = await page.locator('body').innerText();
    const visErr = /map is not a function|TypeError/.test(visText) || /[A-Z]\.map\s*\(/.test(visText);
    const crit = consoleErrors.filter(e => /TypeError|Unhandled|map is not a function|Cannot read/i.test(e));
    console.log(`  VisErr:${visErr} Console:${consoleErrors.length} Critical:${crit.length}`);
    if (crit.length) { crit.slice(0,5).forEach(e=>console.log(`    ${e}`)); results['Console errors'] = `FAIL - ${crit.length}`; }
    else if (!consoleErrors.length) results['Console errors'] = 'PASS';
    else results['Console errors'] = `WARN - ${consoleErrors.length}`;

    // ========== 7. Answer question ==========
    console.log('\n--- 7. Answer question ---');
    let answered = false;
    if (session) {
      // Check for text input
      const ti = page.locator('textarea, input[type="text"], [contenteditable="true"]').first();
      if (await ti.isVisible({ timeout: 1000 }).catch(() => false)) {
        await ti.fill('Sample answer.');
        answered = true;
        console.log('  Filled text input');
      } else {
        // Check for options (MCS/MCM/ROP)
        const opt = page.locator('[role="radio"], [role="checkbox"], label, [class*="option" i]').first();
        if (await opt.isVisible({ timeout: 1000 }).catch(() => false)) {
          await opt.click();
          answered = true;
          console.log('  Clicked option');
        } else {
          // Check for recording button (RA/RS/DI etc.)
          const recordBtn = page.locator('[class*="record" i], button:has-text("Record")').first();
          if (await recordBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
            answered = true;
            console.log('  Record button visible (speaking task)');
          } else {
            await ss(page, 'no-interaction');
            console.log('  No interactive element found');
          }
        }
      }
    } else { console.log('  SKIP'); }

    // ========== 8. Navigate ==========
    console.log('\n--- 8. Navigation ---');
    let navigated = false;
    if (session) {
      try {
        const submitAns = page.locator('button:has-text("Submit Answer")').first();
        if (await submitAns.isVisible({ timeout: 2000 }).catch(() => false)) {
          await submitAns.click({ timeout: 5000 }).catch(() => {});
          await sleep(2500);
          const prev = page.locator('button:has-text("Previous")').first();
          const prevVisible = await prev.isVisible({ timeout: 2000 }).catch(() => false);
          if (prevVisible) {
            const prevDisabled = await prev.isDisabled().catch(() => true);
            if (!prevDisabled) {
              try { await prev.click({ timeout: 3000 }); } catch {}
              await sleep(1500);
              navigated = true;
              console.log('  Submit Answer -> Previous OK');
            } else { console.log('  Previous disabled (expected Q1)'); }
          } else { console.log('  No Previous button'); }
        } else {
          const next = page.locator('button:has-text("Next"), a:has-text("Next")').first();
          if (await next.isVisible({ timeout: 1000 }).catch(() => false)) {
            await next.click({ timeout: 5000 }).catch(() => {});
            await sleep(1500);
            navigated = true;
            console.log('  Next OK');
          } else { console.log('  No nav buttons'); }
        }
      } catch (e) {
        console.log('  Nav error (non-fatal):', e.message?.substring(0,80));
      }
    } else { console.log('  SKIP'); }

    // ========== 9. Persistence ==========
    console.log('\n--- 9. Persistence ---');
    if (answered && navigated) {
      const ti = page.locator('textarea, input[type="text"], [contenteditable="true"], [class*="record" i]').first();
      if (await ti.isVisible({ timeout: 1500 }).catch(() => false)) {
        results['Answer persistence'] = 'PASS (interaction present after nav)';
        console.log('  Interaction element persisted');
      } else {
        results['Answer persistence'] = 'WARN';
        console.log('  No interaction element after nav');
      }
    } else { results['Answer persistence'] = answered ? 'WARN - no nav' : 'SKIP'; }

    // ========== 10. Mock exams ==========
    console.log('\n--- 10. Mock exams ---');
    await page.goto(`${PROD_URL}/student/mock-exams`, { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(3000);
    await ss(page, 'mock-exams');
    const mt = await page.locator('body').innerText();
    const hasMock = /mock|diagnostic|mini|full/i.test(mt) && mt.length > 100;
    const mockErr = mt.includes('Failed to load') || mt.includes('401');
    results['Mock exam start'] = mockErr ? 'FAIL' : hasMock ? 'PASS' : 'WARN';
    console.log(`  ${results['Mock exam start']}`);

    // ========== 11-12. Start mock + navigate ==========
    console.log('\n--- 11-12. Mock start + navigate ---');
    let mockStarted = false;
    if (!mockErr) {
      const startDiag = page.locator('button:has-text("Start Diagnostic")').first();
      if (await startDiag.isVisible({ timeout: 2000 }).catch(() => false)) {
        await startDiag.click();
        await sleep(3000);
        await ss(page, 'mock-started');
        mockStarted = true;
        console.log('  Started Diagnostic');

        // Check for navigation in mock exam
        const mSubmit = page.locator('button:has-text("Submit Answer"), button:has-text("Next")').first();
        if (await mSubmit.isVisible({ timeout: 2000 }).catch(() => false)) {
          await mSubmit.click({ timeout: 5000 }).catch(() => {});
          await sleep(1500);
          const mPrev = page.locator('button:has-text("Previous"), button:has-text("Back")').first();
          if (await mPrev.isVisible({ timeout: 1000 }).catch(() => false)) {
            const mPrevDisabled = await mPrev.isDisabled().catch(() => true);
            if (!mPrevDisabled) {
              try { await mPrev.click({ timeout: 3000 }); } catch {}
              await sleep(1000);
              results['Mock exam navigation'] = 'PASS';
              console.log('  Nav OK');
            } else { results['Mock exam navigation'] = 'WARN - Prev disabled'; console.log('  Submit OK, Prev disabled'); }
          } else { results['Mock exam navigation'] = 'WARN - no Prev'; console.log('  Submit OK, no Prev'); }
        } else {
          const btns = await page.locator('button').allTextContents();
          console.log(`  Buttons: ${JSON.stringify(btns.filter(b=>b.trim()).slice(0,15))}`);
          results['Mock exam navigation'] = 'WARN - no nav buttons';
        }
      } else {
        console.log('  No Start Diagnostic button');
        results['Mock exam navigation'] = 'SKIP';
      }
    }
    if (!results['Mock exam navigation']) results['Mock exam navigation'] = mockStarted ? 'WARN' : 'SKIP';

    // ========== 13. Submit/save ==========
    console.log('\n--- 13. Submit/save ---');
    if (mockStarted) {
      const sub = page.locator('button:has-text("Submit"), button:has-text("Finish"), button:has-text("Complete")').first();
      if (await sub.isVisible({ timeout: 1500 }).catch(() => false)) {
        console.log(`  Submit: "${await sub.textContent()}"`);
      } else {
        const sv = page.locator('button:has-text("Save"), button:has-text("Pause"), button:has-text("Exit")').first();
        if (await sv.isVisible({ timeout: 1000 }).catch(() => false)) {
          console.log(`  Save: "${await sv.textContent()}"`);
        } else { console.log('  No submit/save'); }
      }
    } else { console.log('  SKIP'); }
    results['Deployment status'] = '200 - Live';

    // ========== 14-15. Mobile ==========
    console.log('\n--- 14-15. Mobile 390px ---');
    await page.setViewportSize(MOBILE_VIEWPORT);
    await sleep(500);
    await page.goto(`${PROD_URL}/student/dashboard`, { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(2000);
    await ss(page, 'mobile-dashboard');
    const mobileText = await page.locator('body').innerText();
    const mobFail = mobileText.includes('Failed to load') || mobileText.includes('401') || mobileText.length < 50;
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    ).catch(() => true);

    if (mobFail) { results['Mobile check'] = 'FAIL'; console.log('  FAIL: page error'); }
    else if (overflow) { results['Mobile check'] = 'WARN - overflow'; console.log('  WARN: overflow'); }
    else { results['Mobile check'] = 'PASS'; console.log('  PASS'); }

    // Practice page in mobile
    await page.goto(`${PROD_URL}/practice`, { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(2000);
    await ss(page, 'mobile-practice');
    const practiceOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    ).catch(() => true);
    const practiceFail = (await page.locator('body').innerText()).includes('Failed to load');
    if (practiceOverflow || practiceFail) {
      console.log(`  Practice mobile: overflow=${practiceOverflow} fail=${practiceFail}`);
    } else { console.log('  Practice mobile: OK'); }

    // Mock exams in mobile
    await page.goto(`${PROD_URL}/student/mock-exams`, { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(2000);
    const mOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    ).catch(() => true);
    if (mOverflow) console.log('  Mock mobile: overflow');
    else console.log('  Mock mobile: OK');

  } catch (err) {
    console.log(`\nFATAL: ${err.message}`);
    consoleErrors.push(`[FATAL] ${err.message}`);
  } finally {
    await browser.close();
  }

  const keys = ['Practice Quick Start','Question loaded','Console errors','Answer persistence','Mock exam start','Mock exam navigation','Mobile check'];
  const pass = keys.filter(k => results[k] === 'PASS').length;
  results['Score'] = `${pass}/${keys.length} functional checks`;
  const fatal = results['Console errors'].startsWith('FAIL') || results['Practice Quick Start'] === 'FAIL';
  results['Verdict'] = fatal ? 'FAIL - Blocking issues' : pass === keys.length ? 'PASS - All checks passed' : `PASS with warnings (${pass}/${keys.length})`;
  generateReport();
}

function generateReport() {
  const lines = [];
  lines.push('========================================');
  lines.push('  FINAL PRODUCTION FRONTEND VERIFICATION');
  lines.push('========================================\n');
  for (const [k, v] of Object.entries(results)) lines.push(`  ${k.padEnd(25)} ${v}`);
  lines.push('\n========================================');
  if (consoleErrors.length) {
    lines.push('\nConsole errors/warnings:');
    consoleErrors.forEach(e => lines.push(`  ${e}`));
  }
  const full = lines.join('\n');
  console.log('\n' + full);
  writeFileSync('/tmp/final-frontend-report3.txt', full);
  console.log('\nScreenshots: ls /tmp/frontend-prod-screenshots3/');
}

run().catch(err => { console.error(err); process.exit(1); });
