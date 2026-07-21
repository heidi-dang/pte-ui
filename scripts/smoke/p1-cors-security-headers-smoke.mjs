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
      ['x-frame-options', 'DENY', 'X-Frame-Options'],
      ['x-content-type-options', 'nosniff', 'X-Content-Type-Options'],
      ['strict-transport-security', null, 'Strict-Transport-Security'],
      ['x-dns-prefetch-control', 'off', 'X-DNS-Prefetch-Control'],
      ['x-download-options', 'noopen', 'X-Download-Options'],
      ['x-permitted-cross-domain-policies', 'none', 'X-Permitted-Cross-Domain-Policies'],
    ];

    for (const [header, expected, name] of checks) {
      const val = headers.get(header);
      if (!val) bail(`Missing security header: ${name}`);
      if (expected && val !== expected) bail(`Expected ${name}=${expected}, got ${val}`);
      console.log(`  PASS: ${name}=${val}`);
    }

    console.log('\n[2] CORS headers present...');
    const corsHeaders = headers.get('access-control-allow-origin');
    if (!corsHeaders) bail('Missing Access-Control-Allow-Origin');
    console.log(`  PASS: Access-Control-Allow-Origin=${corsHeaders}`);

    console.log('\nPASS: CORS and security headers are correctly configured.');
    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
})();
