import crypto from 'crypto';
const API = 'http://localhost:3000/api';

const TASKS: { code: string; section: string }[] = [
  { code: 'RA', section: 'Speaking' }, { code: 'RS', section: 'Speaking' },
  { code: 'DI', section: 'Speaking' }, { code: 'RL', section: 'Speaking' },
  { code: 'ASQ', section: 'Speaking' }, { code: 'SGD', section: 'Speaking' },
  { code: 'RTS', section: 'Speaking' },
  { code: 'SWT', section: 'Writing' }, { code: 'WE', section: 'Writing' },
  { code: 'MCS', section: 'Reading' }, { code: 'MCM', section: 'Reading' },
  { code: 'ROP', section: 'Reading' }, { code: 'FIBR', section: 'Reading' },
  { code: 'FIBRW', section: 'Reading' },
  { code: 'SST', section: 'Listening' }, { code: 'FIBL', section: 'Listening' },
  { code: 'HCS', section: 'Listening' }, { code: 'MCSSL', section: 'Listening' },
  { code: 'MCMSL', section: 'Listening' }, { code: 'SMW', section: 'Listening' },
  { code: 'HIW', section: 'Listening' }, { code: 'WFD', section: 'Listening' },
];

const email = process.env.ADMIN_EMAIL!;
const password = process.env.ADMIN_PASSWORD!;

async function main() {
  // Login
  const loginRes = await fetch(`${API}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const { token } = await loginRes.json();
  if (!token) throw new Error('Login failed');
  process.stdout.write(`Logged in\n`);

  // Archive old drafts
  const allItems: any[] = await (await fetch(`${API}/admin/question-bank`, { headers: { Authorization: `Bearer ${token}` } })).json();
  for (const item of allItems) {
    if (item.status === 'draft') {
      await fetch(`${API}/admin/question-bank/${item.id}/status`, {
        method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' }),
      });
    }
  }
  process.stdout.write(`Archived old drafts\n`);

  // Create batches
  const batchIds: string[] = [];
  for (const task of TASKS) {
    const res = await fetch(`${API}/admin/question-bank/generate`, {
      method: 'POST', headers: {
        Authorization: `Bearer ${token}`, 'Content-Type': 'application/json',
      },
      body: JSON.stringify({ taskCode: task.code, section: task.section, difficulty: 'medium', requestKey: crypto.randomUUID() }),
    });
    const { batch } = await res.json();
    batchIds.push(batch.id);
    process.stdout.write(`  ${task.code}: created\n`);
  }
  process.stdout.write(`\nCreated ${batchIds.length} batches\n`);

  // Monitor
  const start = Date.now();
  const done = new Set<string>();
  while (done.size < batchIds.length) {
    await new Promise(r => setTimeout(r, 10000));
    for (const id of batchIds) {
      if (done.has(id)) continue;
      try {
        const d: any = await (await fetch(`${API}/admin/question-bank/batches/${id}`, { headers: { Authorization: `Bearer ${token}` } })).json();
        if (['completed', 'partial_failed', 'failed'].includes(d.status)) done.add(id);
      } catch {}
    }
    const elapsed = Math.round((Date.now() - start) / 1000);
    const items = await (await fetch(`${API}/admin/question-bank`, { headers: { Authorization: `Bearer ${token}` } })).json();
    const drafts = items.filter((i: any) => i.status === 'draft').length;
    const published = items.filter((i: any) => i.status === 'published').length;
    process.stdout.write(`[${elapsed}s] ${done.size}/${batchIds.length} done | ${drafts} drafts\n`);
  }
  process.stdout.write(`\nAll batches done in ${Math.round((Date.now()-start)/1000)}s\n`);

  // Publish
  const finalItems: any[] = await (await fetch(`${API}/admin/question-bank`, { headers: { Authorization: `Bearer ${token}` } })).json();
  const toPublish = finalItems.filter((i: any) => i.status === 'draft');
  let pubOk = 0;
  for (const item of toPublish) {
    const r = await fetch(`${API}/admin/question-bank/${item.id}/status`, {
      method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'published' }),
    });
    const rd = await r.json();
    if (rd.success) pubOk++;
  }
  process.stdout.write(`Published ${pubOk}/${toPublish.length}\n`);

  // Summary
  const summaryItems: any[] = await (await fetch(`${API}/admin/question-bank`, { headers: { Authorization: `Bearer ${token}` } })).json();
  const byTask: Record<string, { published: number; draft: number }> = {};
  for (const item of summaryItems) {
    if (item.status === 'archived') continue;
    if (!byTask[item.taskCode]) byTask[item.taskCode] = { published: 0, draft: 0 };
    byTask[item.taskCode][item.status]++;
  }
  for (const [code, counts] of Object.entries(byTask).sort()) {
    process.stdout.write(`  ${code}: ${counts.published} pub, ${counts.draft} draft\n`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
