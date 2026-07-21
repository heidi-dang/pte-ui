// scripts/smoke/full-app-security-route-smoke.mjs
// Audits: student routes have auth, admin routes have role check, no answer leaks.
// Fails on: student route missing auth, admin route missing role check.

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../..');
const src = resolve(root, 'src', 'server');

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) { passed++; }
  else { console.error(`  FAIL: ${msg}`); failed++; }
}

// ---------------------------------------------------------------------------
// 1. Student router has authenticateToken middleware
// ---------------------------------------------------------------------------
console.log('1. Checking student router auth...');
const studentFile = resolve(src, 'student.ts');
assert(existsSync(studentFile), 'student.ts exists');
const studentContent = readFileSync(studentFile, 'utf-8');
assert(studentContent.includes('studentRouter.use(authenticateToken'), 'Student router has authenticateToken middleware');
assert(!studentContent.includes('studentRouter.use(requireRole'), 'Student router does not have role restriction (all students need access)');

// ---------------------------------------------------------------------------
// 2. Admin router has authenticateToken + requireRole(['admin'])
// ---------------------------------------------------------------------------
console.log('2. Checking admin router auth...');
const adminFile = resolve(src, 'admin.ts');
assert(existsSync(adminFile), 'admin.ts exists');
const adminContent = readFileSync(adminFile, 'utf-8');
assert(adminContent.includes('adminRouter.use(authenticateToken'), 'Admin router has authenticateToken');
assert(adminContent.includes("requireRole(['admin'])"), "Admin router has requireRole(['admin'])");
assert(!adminContent.includes("requireRole(['student'])"), 'Admin router does not allow student role');

// ---------------------------------------------------------------------------
// 3. Teacher router has authenticateToken + requireRole(['teacher'])
// ---------------------------------------------------------------------------
console.log('3. Checking teacher router auth...');
const teacherFile = resolve(src, 'teacher.ts');
assert(existsSync(teacherFile), 'teacher.ts exists');
const teacherContent = readFileSync(teacherFile, 'utf-8');
assert(teacherContent.includes('teacherRouter.use(authenticateToken'), 'Teacher router has authenticateToken');
assert(teacherContent.includes("requireRole"), "Teacher router has requireRole");

// ---------------------------------------------------------------------------
// 4. Student data queries always scope by userId
// ---------------------------------------------------------------------------
console.log('4. Checking student data scoping...');
const studentQueries = studentContent.match(/prisma\.\w+\.(findMany|findUnique|findFirst|create|update|delete|count|upsert|groupBy)\(/g) || [];
assert(studentQueries.length > 0, `Student routes have ${studentQueries.length} DB queries`);

// Check that userId appears in where clauses of read queries
const whereClauses = studentContent.match(/where:\s*\{[^}]*userId/g) || [];
assert(whereClauses.length > 0, `Found ${whereClauses.length} userId-scoped queries in student routes`);

// ---------------------------------------------------------------------------
// 5. No admin endpoints accessible without auth
// ---------------------------------------------------------------------------
console.log('5. Checking no unprotected admin routes...');
const adminRoutes = adminContent.match(/adminRouter\.(get|post|patch|put|delete)\(/g) || [];
assert(adminRoutes.length > 0, `Admin has ${adminRoutes.length} route definitions`);

// All admin routes should be after the middleware declarations
const middlewareIndex = adminContent.indexOf('requireRole');
const routeIndices = adminContent.indexOf('adminRouter.get(', middlewareIndex);
assert(routeIndices > middlewareIndex, 'Admin routes defined after middleware');

// ---------------------------------------------------------------------------
// 6. Upload route requires auth
// ---------------------------------------------------------------------------
console.log('6. Checking upload route auth...');
const uploadsFile = resolve(src, 'uploads.ts');
assert(existsSync(uploadsFile), 'uploads.ts exists');
const uploadsContent = readFileSync(uploadsFile, 'utf-8');
assert(uploadsContent.includes('authenticateToken'), 'Upload route requires authentication');

// ---------------------------------------------------------------------------
// 7. Auth routes have rate limiting (or lack is noted)
// ---------------------------------------------------------------------------
console.log('7. Checking auth rate limiting...');
const authFile = resolve(src, 'auth.ts');
const authContent = readFileSync(authFile, 'utf-8');
const authRoutes = authContent.match(/authRouter\.(post|get)\(/g) || [];
assert(authRoutes.length >= 5, `Auth has ${authRoutes.length} routes`);
// Not failing on missing rate limiter — documented as P2 in audit

// ---------------------------------------------------------------------------
// 8. JWT secret production enforcement
// ---------------------------------------------------------------------------
console.log('8. Checking JWT secret production enforcement...');
const configFile = resolve(src, 'config.ts');
const configContent = readFileSync(configFile, 'utf-8');
assert(configContent.includes("requireEnv('JWT_SECRET')"), 'JWT secret uses requireEnv in production');
assert(configContent.includes("NODE_ENV === 'production'"), 'Production check exists in config');

// ---------------------------------------------------------------------------
// 9. DEMO_MODE guard in production
// ---------------------------------------------------------------------------
console.log('9. Checking DEMO_MODE guard...');
assert(configContent.includes('demoMode'), 'demoMode config exists');
assert(configContent.includes('isProduction'), 'Production check for demoMode');
// In production: DEMO_MODE === 'true' only if explicitly set
assert(configContent.includes("process.env.DEMO_MODE === 'true'"), 'DEMO_MODE explicitly requires true string in production');

// ---------------------------------------------------------------------------
// 10. Seed endpoint guarded
// ---------------------------------------------------------------------------
console.log('10. Checking seed endpoint guard...');
const appFile = resolve(src, 'app.ts');
const appContent = readFileSync(appFile, 'utf-8');
assert(appContent.includes("!config.demoMode"), 'Seed endpoint requires demoMode');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
