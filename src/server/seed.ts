import { prisma } from './db';
import bcrypt from 'bcryptjs';
import { logger } from './logger';

// TODO (Phase 2): Move startup seeding behind demo/staging mode.
// Production should not auto-seed demo accounts on every startup.
export async function runSeeding() {
  const defaultUsers = [
    { email: 'student@example.com', name: 'Alex Mercer', role: 'student', password: 'password123', targetScore: 79, currentAvg: 74 },
    { email: 'teacher@example.com', name: 'Dr. Evelyn Carter', role: 'teacher', password: 'password123', targetScore: 90, currentAvg: 0 },
    { email: 'admin@example.com', name: 'Platform Admin', role: 'admin', password: 'password123', targetScore: 90, currentAvg: 0 },
  ];

  for (const u of defaultUsers) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (!existing) {
      const hashed = await bcrypt.hash(u.password, 10);
      await prisma.user.create({
        data: {
          email: u.email,
          name: u.name,
          role: u.role,
          password: hashed,
          targetScore: u.targetScore,
          currentAvg: u.currentAvg,
        },
      });
      logger.info(`Seeded user: ${u.email} (${u.role})`);
    }
  }

  const student = await prisma.user.findUnique({ where: { email: 'student@example.com' } });
  if (student) {
    const existingSubs = await prisma.practiceSubmission.findMany({ where: { userId: student.id } });
    if (existingSubs.length === 0) {
      await prisma.practiceSubmission.createMany({
        data: [
          {
            userId: student.id,
            taskCode: 'WE',
            title: 'Automation and Employment',
            section: 'Writing',
            answerText: 'In the modern world, the rise of artificial intelligence has created massive controversy regarding jobs...',
            status: 'graded',
            score: 79,
            feedback: 'Excellent structural control. Complex sentences are highly accurate. Try expanding vocabulary range.',
            grammarIssues: 1,
          },
          {
            userId: student.id,
            taskCode: 'RA',
            title: 'The Great Barrier Reef',
            section: 'Speaking',
            answerText: 'The Great Barrier Reef is the world... composed of over two thousand reefs...',
            status: 'pending',
          },
          {
            userId: student.id,
            taskCode: 'SST',
            title: 'Urban Heat Islands',
            section: 'Listening',
            answerText: 'The speaker discussed the urban heat island effect that is happening in cities due to concrete buildings and high air conditioning uses...',
            status: 'graded',
            score: 65,
            feedback: 'Good summary of main themes, but your word count was 42 words, which is under the 50-70 limit.',
            grammarIssues: 2,
          }
        ],
      });

      await prisma.testAttempt.createMany({
        data: [
          {
            userId: student.id,
            testId: 'MT-01',
            title: 'PTE Academic Mini Booster',
            type: 'mini',
            date: '2026-07-12',
            overallScore: 74,
            speakingScore: 78,
            writingScore: 72,
            readingScore: 69,
            listeningScore: 75,
            status: 'Completed',
          },
          {
            userId: student.id,
            testId: 'MT-03',
            title: 'Full Exam Real-Sim #1',
            type: 'full',
            date: '2026-06-28',
            overallScore: 68,
            speakingScore: 62,
            writingScore: 71,
            readingScore: 67,
            listeningScore: 70,
            status: 'Completed',
          }
        ]
      });

      await prisma.notification.create({
        data: {
          userId: student.id,
          title: 'Welcome Back Student!',
          text: 'You have been seeded with sample mock questions, graded practice essays, and a completed full mock exam.',
        }
      });
    }
  }

  const existingCoupons = await prisma.coupon.findMany();
  if (existingCoupons.length === 0) {
    await prisma.coupon.createMany({
      data: [
        { code: 'FIFTYOFF', discountPercent: 50, active: true },
        { code: 'LAUNCHPTE', discountPercent: 30, active: true },
        { code: 'VIP2026', discountPercent: 100, active: true },
      ],
    });
    logger.info('Seeded promotional coupons: FIFTYOFF, LAUNCHPTE, VIP2026');
  }

  const existingCustomTasks = await prisma.customTask.findMany();
  if (existingCustomTasks.length === 0) {
    await prisma.customTask.createMany({
      data: [
        {
          taskCode: 'RA',
          title: 'Acoustic Wave Propagation',
          section: 'Speaking',
          instruction: 'Read the acoustic physics text aloud focusing on vowel modulation.',
          promptText: 'Sound wave propagation through dense metallic structures is governed by elastic shear moduli and volumetric density anomalies, creating distinct supersonic acoustic pathways.',
          published: true,
          authorName: 'Dr. Evelyn Carter',
        },
        {
          taskCode: 'WE',
          title: 'Global Carbon Taxation',
          section: 'Writing',
          instruction: 'Write a persuasive academic essay regarding global carbon credit schemes.',
          promptText: 'Should countries with low per-capita emissions be penalized at identical carbon rates compared to highly industrialized manufacturing nations?',
          published: true,
          authorName: 'Dr. Evelyn Carter',
        }
      ]
    });
    logger.info('Seeded custom teacher tasks');
  }

  const existingAuditLogs = await prisma.auditLog.findMany();
  if (existingAuditLogs.length === 0) {
    await prisma.auditLog.createMany({
      data: [
        {
          action: 'BACKUP_COMPLETED',
          category: 'Backup',
          message: 'Automated nightly database backup compiled and synced with s3://pte-backups-asia/',
          metadata: JSON.stringify({ sizeMb: '2.44 MB', integrityHash: 'SHA256:e3b0c44298fc1c149afbf4c8996fb924' }),
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
        {
          action: 'EMAIL_SENT',
          category: 'Email',
          message: 'Weekly student progress digest compiled and emailed to active premium members.',
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
        },
        {
          action: 'SECURITY_HARDENING',
          category: 'Security',
          message: 'Platform firewall security configuration verified: rate limiting active (150 req/min).',
          timestamp: new Date(),
        }
      ]
    });
    logger.info('Seeded platform audit logs');
  }
}
