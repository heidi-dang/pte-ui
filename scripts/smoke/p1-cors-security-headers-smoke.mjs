#!/usr/bin/env node

const BASE_URL = process.env.PRODUCTION_BASE_URL || 'http://localhost:3000';

function bail(msg) {
  console.error('FAIL:', msg);
  process.exit(1);
}

(async () => {
  try {
    console.log('[1] Health endpoint returns security headers...');
    const res = await fetch(`${BASE_URL}/api/health`);
    const headers = res.headers;

    const checks = [
      ['x-frame-options', 'SAMEORIGIN', 'X-Frame-Options'],
      ['x-content-type-options', 'nosniff', 'X-Content-Type-Options'],
      ['x-dns-prefetch-control', 'off', 'X-DNS-Prefetch-Control'],
      ['x-download-options', 'noopen', 'X-Download-Options'],
      ['x-permitted-cross-domain-policies', 'none', 'X-Permitted-Cross-Domain-Policies'],
      ['x-xss-protection', '0', 'X-XSS-Protection'],
    ];

    for (const [header, expected, name] of checks) {
      const val = headers.get(header);
      if (!val) bail(`Missing security header: ${name}`);
      if (val !== expected) bail(`Expected ${name}=${expected}, got ${val}`);
      console.log(`  PASS: ${name}=${val}`);
    }

    const hsts = headers.get('strict-transport-security');
    if (!hsts) bail('Missing Strict-Transport-Security');
    if (!hsts.includes('max-age=')) bail('HSTS missing max-age');
    console.log(`  PASS: Strict-Transport-Security=${hsts}`);

    const csp = headers.get('content-security-policy');
    if (csp) {
      console.log(`  INFO: Content-Security-Policy=${csp.substring(0, 80)}...`);
    } else {
      console.log('  INFO: CSP not set (expected in dev mode)');
    }

    console.log('\n[2] CORS headers present with Origin header...');
    const corsRes = await fetch(`${BASE_URL}/api/health`, {
      headers: { Origin: 'http://localhost:5173' },
    });
    const corsHeaders = corsRes.headers.get('access-control-allow-origin');
    if (!corsHeaders) bail('Missing Access-Control-Allow-Origin');
    console.log(`  PASS: Access-Control-Allow-Origin=${corsHeaders}`);

    const corsCred = corsRes.headers.get('access-control-allow-credentials');
    if (corsCred !== 'true') bail('Missing Access-Control-Allow-Credentials: true');
    console.log(`  PASS: Access-Control-Allow-Credentials=${corsCred}`);

    console.log('\nPASS: CORS and security headers are correctly configured.');
    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
})();
