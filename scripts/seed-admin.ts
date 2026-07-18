import { config } from 'dotenv';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

config();

const prisma = new PrismaClient();

async function main() {
  const enabled = process.env.ADMIN_SEED_ENABLED;
  if (enabled !== 'true') {
    console.log('ADMIN_SEED_ENABLED is not true. Skipping admin seed.');
    return;
  }

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'Platform Admin';

  if (!email) throw new Error('ADMIN_EMAIL is required.');
  if (!password || password.length < 16) throw new Error('ADMIN_PASSWORD must be at least 16 characters.');

  const hashedPassword = await bcrypt.hash(password, 10);
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { role: 'admin', status: 'Active', name, password: hashedPassword, passwordResetTokenHash: null, passwordResetExpiresAt: null, passwordChangedAt: new Date() },
    });
    console.log('Updated existing admin account:', email);
  } else {
    await prisma.user.create({ data: { email, name, role: 'admin', status: 'Active', password: hashedPassword } });
    console.log('Created new admin account:', email);
  }

  await prisma.auditLog.create({ data: { action: 'ADMIN_ENV_SEED_UPDATED', category: 'Security', message: `Admin account configured via environment seed for ${email}` } });
}

main()
  .catch((err) => { console.error('Admin seed failed:', err.message); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
