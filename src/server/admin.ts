import { Router, Request, Response } from 'express';
import { prisma } from './db';
import { authenticateToken, requireRole } from './auth';
import { logger } from './logger';
import crypto from 'crypto';

const safeUserSelect = {
  id: true, name: true, email: true, role: true, status: true,
  targetScore: true, currentAvg: true, createdAt: true, lastLoginAt: true,
  emailVerifiedAt: true, subTier: true, subExpiresAt: true,
};

export const adminRouter = Router();

// Secure this router to admins only
adminRouter.use(authenticateToken);
adminRouter.use(requireRole(['admin']));

// 1. Get All Users (Students, Teachers, Admins)
adminRouter.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: safeUserSelect,
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve user accounts' });
  }
});

// 2. Update User Role
adminRouter.post('/users/:id/role', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { role } = req.body;

  if (!role || !['student', 'teacher', 'admin'].includes(role)) {
    res.status(400).json({ error: 'Invalid or missing role' });
    return;
  }

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: safeUserSelect,
    });

    logger.info(`Admin changed user role for ${updated.email} to ${role}`);
    await prisma.auditLog.create({ data: { action: 'ROLE_CHANGED', category: 'Admin', message: `Admin changed role for ${updated.email} to ${role}` } });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// 3. Toggle User Status (Active vs Inactive)
adminRouter.post('/users/:id/status', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['Active', 'Inactive'].includes(status)) {
    res.status(400).json({ error: 'Invalid or missing status' });
    return;
  }

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: { status },
      select: safeUserSelect,
    });

    logger.info(`Admin toggled status for ${updated.email} to ${status}`);
    await prisma.auditLog.create({ data: { action: 'STATUS_CHANGED', category: 'Admin', message: `Admin changed status for ${updated.email} to ${status}` } });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// 4. Get System Logs
adminRouter.get('/logs', async (req: Request, res: Response) => {
  try {
    const logs = await prisma.logEntry.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100, // Last 100 logs
    });
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve system logs' });
  }
});

// 5. Get Background Jobs status
adminRouter.get('/jobs', async (req: Request, res: Response) => {
  try {
    const jobs = await prisma.backgroundJob.findMany({
      orderBy: { scheduledAt: 'desc' },
      take: 50,
    });
    res.json(jobs);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve background jobs' });
  }
});

// 6. Get Audit Logs (Billing, Email Queue, Security, Backups)
adminRouter.get('/audit-logs', async (req: Request, res: Response) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 150,
    });
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve administrative audit logs' });
  }
});

// 7. Generate a Coupon Code
adminRouter.post('/coupons', async (req: Request, res: Response): Promise<void> => {
  const { code, discountPercent } = req.body;

  if (!code || !discountPercent) {
    res.status(400).json({ error: 'Coupon code and discount percentage are required' });
    return;
  }

  try {
    const newCoupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase().trim(),
        discountPercent: parseInt(discountPercent),
        active: true,
      },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        action: 'COUPON_CREATED',
        category: 'Billing',
        message: `Admin created coupon code "${newCoupon.code}" offering ${newCoupon.discountPercent}% discount.`,
        metadata: JSON.stringify({ code: newCoupon.code, discountPercent }),
      },
    });

    res.status(201).json({ success: true, coupon: newCoupon });
  } catch (err: any) {
    if (err.code === 'P2002') {
      res.status(400).json({ error: 'Coupon code already exists' });
    } else {
      res.status(500).json({ error: 'Failed to generate new coupon code' });
    }
  }
});

// 8. Get All Coupons
adminRouter.get('/coupons', async (req: Request, res: Response) => {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(coupons);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve coupons list' });
  }
});

// 9. Backup management — deferred to Phase 16
adminRouter.post('/backup', async (req: Request, res: Response) => {
  res.status(501).json({ error: 'Production backup management is deferred to Phase 16.' });
});

// 10. Compile Admin System Metrics
adminRouter.get('/system-metrics', async (req: Request, res: Response) => {
  try {
    const totalUsers = await prisma.user.count();
    const students = await prisma.user.count({ where: { role: 'student' } });
    const freeTier = await prisma.user.count({ where: { role: 'student', subTier: 'free' } });
    const premiumTier = await prisma.user.count({ where: { role: 'student', subTier: 'premium' } });
    const teachers = await prisma.user.count({ where: { role: 'teacher' } });
    const admins = await prisma.user.count({ where: { role: 'admin' } });

    // Sum of completed tests
    const completedExams = await prisma.testAttempt.count({ where: { status: 'Completed' } });

    // Sum of custom tasks
    const customTasks = await prisma.customTask.count();

    res.json({
      totalUsers,
      roles: { students, teachers, admins },
      tiers: { free: freeTier, premium: premiumTier },
      completedExams,
      customTasks,
      systemStatus: { uptime: process.uptime(), memoryUsage: process.memoryUsage(), environment: process.env.NODE_ENV || 'production' },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to compile advanced system metrics' });
  }
});

// 11. Override user's subscription tier
adminRouter.post('/users/:id/tier', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { subTier } = req.body;

  if (!subTier || !['free', 'premium'].includes(subTier)) {
    res.status(400).json({ error: 'Invalid or missing subscription tier' });
    return;
  }

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: {
        subTier,
        subExpiresAt: subTier === 'premium' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
      },
      select: safeUserSelect,
    });

    logger.info(`Admin overrode subscription tier for ${updated.email} to ${subTier}`);

    // Log in AuditLog
    await prisma.auditLog.create({
      data: {
        action: 'TIER_OVERRIDDEN',
        category: 'Billing',
        message: `Admin overrode tier for user ${updated.email} to "${subTier}".`,
      },
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to override user subscription tier' });
  }
});

// 12. Question Bank — List all items
adminRouter.get('/question-bank', async (req: Request, res: Response) => {
  try {
    const { taskCode, section, difficulty, status } = req.query;
    const where: any = {};
    if (taskCode) where.taskCode = taskCode as string;
    if (section) where.section = section as string;
    if (difficulty) where.difficulty = difficulty as string;
    if (status) where.status = status as string;

    const items = await prisma.questionBankItem.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve question bank items' });
  }
});

// 13. Question Bank — Get single item
adminRouter.get('/question-bank/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const item = await prisma.questionBankItem.findUnique({
      where: { id: req.params.id },
    });
    if (!item) {
      res.status(404).json({ error: 'Question bank item not found' });
      return;
    }
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve question bank item' });
  }
});

// 14. Question Bank — Create item
adminRouter.post('/question-bank', async (req: Request, res: Response): Promise<void> => {
  const {
    taskCode, section, title, instruction, promptText, promptHtml, audioUrl, imageUrl,
    passageText, optionsJson, answerKeyJson, sampleAnswer, explanation, difficulty,
    tagsJson, source, status,
  } = req.body;

  if (!taskCode || !section || !title || !instruction || !promptText) {
    res.status(400).json({ error: 'taskCode, section, title, instruction, and promptText are required' });
    return;
  }

  const validDifficulty = difficulty || 'medium';
  if (!['easy', 'medium', 'hard'].includes(validDifficulty)) {
    res.status(400).json({ error: 'difficulty must be easy, medium, or hard' });
    return;
  }

  const itemStatus = status || 'draft';
  if (!['draft', 'published', 'archived'].includes(itemStatus)) {
    res.status(400).json({ error: 'status must be draft, published, or archived' });
    return;
  }

  try {
    const user = (req as any).user;
    const item = await prisma.questionBankItem.create({
      data: {
        taskCode, section, title, instruction, promptText,
        promptHtml: promptHtml || null,
        audioUrl: audioUrl || null,
        imageUrl: imageUrl || null,
        passageText: passageText || null,
        optionsJson: optionsJson || null,
        answerKeyJson: answerKeyJson || null,
        sampleAnswer: sampleAnswer || null,
        explanation: explanation || null,
        difficulty: validDifficulty,
        tagsJson: tagsJson || null,
        source: source || null,
        status: itemStatus,
        createdByUserId: user.id,
      },
    });

    logger.info(`Admin created question bank item: ${item.title} (${item.taskCode})`);
    res.status(201).json({ success: true, item });
  } catch (err: any) {
    logger.error('Question bank create error', { error: err.message });
    res.status(500).json({ error: 'Failed to create question bank item' });
  }
});

// 15. Question Bank — Update item
adminRouter.patch('/question-bank/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await prisma.questionBankItem.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) {
      res.status(404).json({ error: 'Question bank item not found' });
      return;
    }

    const { difficulty, status, ...fields } = req.body;
    const data: any = { ...fields };

    if (difficulty && !['easy', 'medium', 'hard'].includes(difficulty)) {
      res.status(400).json({ error: 'difficulty must be easy, medium, or hard' });
      return;
    }
    if (difficulty) data.difficulty = difficulty;
    if (status && !['draft', 'published', 'archived'].includes(status)) {
      res.status(400).json({ error: 'status must be draft, published, or archived' });
      return;
    }
    if (status) data.status = status;

    const updated = await prisma.questionBankItem.update({
      where: { id: req.params.id },
      data,
    });

    logger.info(`Admin updated question bank item: ${updated.title}`);
    res.json({ success: true, item: updated });
  } catch (err: any) {
    logger.error('Question bank update error', { error: err.message });
    res.status(500).json({ error: 'Failed to update question bank item' });
  }
});

// 16. Question Bank — Update status only (publish/archive/draft)
adminRouter.patch('/question-bank/:id/status', async (req: Request, res: Response): Promise<void> => {
  const { status } = req.body;

  if (!status || !['draft', 'published', 'archived'].includes(status)) {
    res.status(400).json({ error: 'status must be draft, published, or archived' });
    return;
  }

  try {
    const existing = await prisma.questionBankItem.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) {
      res.status(404).json({ error: 'Question bank item not found' });
      return;
    }

    const updated = await prisma.questionBankItem.update({
      where: { id: req.params.id },
      data: { status },
    });

    logger.info(`Admin changed question bank item status: ${updated.title} → ${status}`);
    res.json({ success: true, item: updated });
  } catch (err: any) {
    logger.error('Question bank status update error', { error: err.message });
    res.status(500).json({ error: 'Failed to update question bank item status' });
  }
});

// 17. Question Bank — Archive item (soft delete, never hard delete)
adminRouter.delete('/question-bank/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await prisma.questionBankItem.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) {
      res.status(404).json({ error: 'Question bank item not found' });
      return;
    }

    const archived = await prisma.questionBankItem.update({
      where: { id: req.params.id },
      data: { status: 'archived' },
    });

    logger.info(`Admin archived question bank item: ${archived.title}`);
    res.json({ success: true, item: archived });
  } catch (err: any) {
    logger.error('Question bank archive error', { error: err.message });
    res.status(500).json({ error: 'Failed to archive question bank item' });
  }
});

// 18. Admin dashboard
adminRouter.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const [totalUsers, activeStudents, teachers, admins, submissionsToday, pendingScoring, completedMocks, publishedQ, draftQ, archivedQ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'student', status: 'Active' } }),
      prisma.user.count({ where: { role: 'teacher' } }),
      prisma.user.count({ where: { role: 'admin' } }),
      prisma.practiceSubmission.count({ where: { submittedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
      prisma.practiceSubmission.count({ where: { status: 'pending' } }),
      prisma.testAttempt.count({ where: { status: 'Completed' } }),
      prisma.questionBankItem.count({ where: { status: 'published' } }),
      prisma.questionBankItem.count({ where: { status: 'draft' } }),
      prisma.questionBankItem.count({ where: { status: 'archived' } }),
    ]);
    res.json({ totalUsers, activeStudents, teachers, admins, submissionsToday, pendingScoring, completedMocks, publishedQ, draftQ, archivedQ });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

// 19. User activity summary for admin
adminRouter.get('/users/:id/activity', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id }, select: { id: true, name: true, email: true, role: true, status: true, targetScore: true, currentAvg: true, createdAt: true, lastLoginAt: true, subTier: true } });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    const [submissions, tests, lessons] = await Promise.all([
      prisma.practiceSubmission.findMany({ where: { userId: req.params.id }, orderBy: { submittedAt: 'desc' }, take: 20, select: { id: true, taskCode: true, title: true, section: true, submittedAt: true, status: true, score: true, fluencyScore: true, pronunciationScore: true, grammarIssues: true } }),
      prisma.testAttempt.findMany({ where: { userId: req.params.id }, orderBy: { date: 'desc' }, take: 10, select: { id: true, testId: true, title: true, type: true, date: true, overallScore: true, speakingScore: true, writingScore: true, readingScore: true, listeningScore: true, status: true, currentQuestionIndex: true, secondsRemaining: true } }),
      prisma.lessonCompletion.count({ where: { userId: req.params.id } }),
    ]);
    res.json({ user, submissions, tests, completedLessons: lessons });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load user activity' });
  }
});

// 20. User suspend/reactivate
adminRouter.post('/users/:id/suspend', async (req, res) => {
  try {
    const updated = await prisma.user.update({ where: { id: req.params.id }, data: { status: 'Inactive' }, select: safeUserSelect });
    await prisma.auditLog.create({ data: { action: 'USER_SUSPENDED', category: 'Security', message: `Admin suspended user ${updated.email}` } });
    res.json({ success: true, user: updated });
  } catch (err: any) { res.status(500).json({ error: 'Failed to suspend user' }); }
});

adminRouter.post('/users/:id/reactivate', async (req, res) => {
  try {
    const updated = await prisma.user.update({ where: { id: req.params.id }, data: { status: 'Active' }, select: safeUserSelect });
    await prisma.auditLog.create({ data: { action: 'USER_REACTIVATED', category: 'Security', message: `Admin reactivated user ${updated.email}` } });
    res.json({ success: true, user: updated });
  } catch (err: any) { res.status(500).json({ error: 'Failed to reactivate user' }); }
});

// 20b. Password reset trigger — properly invalidates current password
adminRouter.post('/users/:id/password-reset', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, email: true },
    });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: `INVALIDATED_${crypto.randomBytes(32).toString('hex')}`,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
        passwordChangedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: { action: 'PASSWORD_RESET_TRIGGERED', category: 'Security', message: `Admin triggered password reset for ${user.email}` },
    });

    res.json({ success: true, message: `Password reset triggered for ${user.email}. They must use the forgot-password flow.` });
  } catch (err: any) { res.status(500).json({ error: 'Failed to trigger password reset' }); }
});

// 20c. Get single user
adminRouter.get('/users/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id }, select: safeUserSelect });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    res.json(user);
  } catch (err: any) { res.status(500).json({ error: 'Failed to load user' }); }
});

// 20d. Update user fields (safe)
adminRouter.patch('/users/:id', async (req, res) => {
  try {
    const { name, targetScore } = req.body;
    const data: any = {};
    if (name) data.name = name;
    if (targetScore != null) data.targetScore = Number(targetScore);
    const updated = await prisma.user.update({ where: { id: req.params.id }, data, select: safeUserSelect });
    res.json(updated);
  } catch (err: any) { res.status(500).json({ error: 'Failed to update user' }); }
});

// 21. Admin platform reports overview
adminRouter.get('/reports/overview', async (req, res) => {
  try {
    const [practiceVolume, sectionAvgsRaw, taskAvgsRaw, scoreZeroCount, lessonVolume] = await Promise.all([
      prisma.practiceSubmission.count(),
      prisma.practiceSubmission.groupBy({ by: ['section'], _avg: { score: true }, _count: true, where: { status: 'graded', score: { not: null } } }),
      prisma.practiceSubmission.groupBy({ by: ['taskCode'], _avg: { score: true }, _count: true, where: { status: 'graded', score: { not: null } } }),
      prisma.practiceSubmission.count({ where: { status: 'graded', score: 0 } }),
      prisma.lessonCompletion.count(),
    ]);
    res.json({ practiceVolume, sectionAvgs: sectionAvgsRaw, taskAvgs: taskAvgsRaw, scoreZeroCount, lessonVolume, pendingScoring: await prisma.practiceSubmission.count({ where: { status: 'pending' } }), mockCompleted: await prisma.testAttempt.count({ where: { status: 'Completed' } }) });
  } catch (err: any) { res.status(500).json({ error: 'Failed to load admin reports' }); }
});

// 22. Admin submissions list
adminRouter.get('/submissions', async (req, res) => {
  try {
    const { status, section, taskCode } = req.query;
    const where: any = {};
    if (status) where.status = status as string;
    if (section) where.section = section as string;
    if (taskCode) where.taskCode = taskCode as string;
    const subs = await prisma.practiceSubmission.findMany({
      where,
      orderBy: { submittedAt: 'desc' },
      take: 100,
      select: {
        id: true, userId: true, taskCode: true, title: true, section: true, submittedAt: true,
        status: true, score: true, fluencyScore: true, pronunciationScore: true, grammarIssues: true, feedback: true,
      },
    });
    const users = await prisma.user.findMany({ where: { id: { in: [...new Set(subs.map(s => s.userId))] } }, select: { id: true, name: true, email: true } });
    const userMap: Record<string, string> = {};
    users.forEach(u => { userMap[u.id] = u.email || u.name; });
    res.json(subs.map(s => ({ ...s, userName: userMap[s.userId] || 'Unknown' })));
  } catch (err: any) { res.status(500).json({ error: 'Failed to load submissions' }); }
});

// 23. Admin mock tests list
adminRouter.get('/mock-tests', async (req, res) => {
  try {
    const { status, type } = req.query;
    const where: any = {};
    if (status) where.status = status as string;
    if (type) where.type = type as string;
    const attempts = await prisma.testAttempt.findMany({ where, orderBy: { date: 'desc' }, take: 50,
      select: { id: true, userId: true, testId: true, title: true, type: true, date: true, overallScore: true, speakingScore: true, writingScore: true, readingScore: true, listeningScore: true, status: true },
    });
    const users = await prisma.user.findMany({ where: { id: { in: [...new Set(attempts.map(a => a.userId))] } }, select: { id: true, name: true, email: true } });
    const userMap: Record<string, string> = {};
    users.forEach(u => { userMap[u.id] = u.email || u.name; });
    const counts = { completed: await prisma.testAttempt.count({ where: { status: 'Completed' } }), inProgress: await prisma.testAttempt.count({ where: { status: 'In Progress' } }), paused: await prisma.testAttempt.count({ where: { status: 'Paused' } }) };
    res.json({ attempts: attempts.map(a => ({ ...a, userName: userMap[a.userId] || 'Unknown' })), counts });
  } catch (err: any) { res.status(500).json({ error: 'Failed to load mock tests' }); }
});

// 24. Teacher-student assignments
adminRouter.get('/assignments', async (req: Request, res: Response) => {
  try {
    const assignments = await prisma.teacherStudentAssignment.findMany({ include: { teacher: { select: { id: true, name: true, email: true } }, student: { select: { id: true, name: true, email: true } } } });
    res.json(assignments);
  } catch (err: any) { res.status(500).json({ error: 'Failed to load assignments' }); }
});

adminRouter.post('/assignments', async (req: Request, res: Response) => {
  const { teacherId, studentId } = req.body;
  if (!teacherId || !studentId) { res.status(400).json({ error: 'teacherId and studentId required' }); return; }
  try {
    const teacher = await prisma.user.findUnique({ where: { id: teacherId }, select: { role: true, name: true } });
    const student = await prisma.user.findUnique({ where: { id: studentId }, select: { role: true, name: true } });
    if (!teacher || teacher.role !== 'teacher') { res.status(400).json({ error: 'Invalid teacher id' }); return; }
    if (!student || student.role !== 'student') { res.status(400).json({ error: 'Invalid student id' }); return; }
    const existing = await prisma.teacherStudentAssignment.findFirst({ where: { teacherId, studentId } });
    if (existing) { res.json(existing); return; }
    const assignment = await prisma.teacherStudentAssignment.create({ data: { teacherId, studentId } });
    await prisma.auditLog.create({ data: { action: 'TEACHER_ASSIGNED', category: 'Admin', message: `Admin assigned teacher ${teacher.name} to student ${student.name}` } });
    res.status(201).json(assignment);
  } catch (err: any) { res.status(500).json({ error: 'Failed to create assignment' }); }
});

adminRouter.delete('/assignments/:id', async (req: Request, res: Response) => {
  try {
    const assignment = await prisma.teacherStudentAssignment.findUnique({ where: { id: req.params.id }, include: { teacher: { select: { name: true } }, student: { select: { name: true } } } });
    if (!assignment) { res.status(404).json({ error: 'Assignment not found' }); return; }
    await prisma.teacherStudentAssignment.delete({ where: { id: req.params.id } });
    await prisma.auditLog.create({ data: { action: 'TEACHER_UNASSIGNED', category: 'Admin', message: `Admin removed teacher ${assignment.teacher.name} from student ${assignment.student.name}` } });
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: 'Failed to delete assignment' }); }
});

// 25. Admin job management
adminRouter.get('/jobs', async (req: Request, res: Response) => {
  try {
    const { status, name, search, page, pageSize, dateFrom, dateTo } = req.query;
    const where: any = {};
    if (status) where.status = status as string;
    if (name) where.name = name as string;
    if (search) where.name = { contains: search as string };
    if (dateFrom || dateTo) {
      where.scheduledAt = {};
      if (dateFrom) where.scheduledAt.gte = new Date(dateFrom as string);
      if (dateTo) where.scheduledAt.lte = new Date(dateTo as string);
    }

    const take = pageSize ? parseInt(pageSize as string) : 50;
    const skip = page ? (parseInt(page as string) - 1) * take : 0;

    const [jobs, total] = await Promise.all([
      prisma.backgroundJob.findMany({ where, orderBy: { scheduledAt: 'desc' }, take, skip, select: safeJobSelect }),
      prisma.backgroundJob.count({ where }),
    ]);

    res.json({ jobs, total, page: page ? parseInt(page as string) : 1, pageSize: take });
  } catch (err: any) { res.status(500).json({ error: 'Failed to load jobs' }); }
});

const safeJobSelect = { id: true, name: true, status: true, attempts: true, maxAttempts: true, scheduledAt: true, startedAt: true, completedAt: true, error: true, workerId: true };

adminRouter.get('/jobs/:id', async (req: Request, res: Response) => {
  try {
    const job = await prisma.backgroundJob.findUnique({ where: { id: req.params.id }, select: { ...safeJobSelect, heartbeatAt: true, leaseExpiresAt: true } });
    if (!job) { res.status(404).json({ error: 'Job not found' }); return; }
    res.json(job);
  } catch (err: any) { res.status(500).json({ error: 'Failed to load job' }); }
});

adminRouter.post('/jobs/:id/retry', async (req: Request, res: Response) => {
  try {
    const job = await prisma.backgroundJob.findUnique({ where: { id: req.params.id } });
    if (!job) { res.status(404).json({ error: 'Job not found' }); return; }
    if (job.status !== 'failed' && job.status !== 'dead_letter') { res.status(400).json({ error: 'Only failed or dead-letter jobs can be retried' }); return; }
    const updated = await prisma.backgroundJob.update({ where: { id: job.id }, data: { status: 'queued', attempts: 0, error: null, completedAt: null, startedAt: null, heartbeatAt: null, leaseExpiresAt: null, workerId: null, claimToken: null }, select: safeJobSelect });
    await prisma.auditLog.create({ data: { action: 'JOB_RETRIED', category: 'System', message: `Admin retried job ${updated.name} (${updated.id})` } });
    res.json({ success: true, job: updated });
  } catch (err: any) { res.status(500).json({ error: 'Failed to retry job' }); }
});

adminRouter.post('/jobs/:id/cancel', async (req: Request, res: Response) => {
  try {
    const job = await prisma.backgroundJob.findUnique({ where: { id: req.params.id } });
    if (!job) { res.status(404).json({ error: 'Job not found' }); return; }
    if (job.status !== 'queued' && job.status !== 'retrying') { res.status(400).json({ error: 'Only queued jobs can be cancelled' }); return; }
    const updated = await prisma.backgroundJob.update({ where: { id: job.id }, data: { status: 'cancelled' }, select: safeJobSelect });
    await prisma.auditLog.create({ data: { action: 'JOB_CANCELLED', category: 'System', message: `Admin cancelled job ${updated.name} (${updated.id})` } });
    res.json({ success: true, job: updated });
  } catch (err: any) { res.status(500).json({ error: 'Failed to cancel job' }); }
});

// 26. Runtime health
adminRouter.get('/runtime-health', async (req: Request, res: Response) => {
  try {
    const [queued, running, failed, deadLetter, staleJobs, recentFails] = await Promise.all([
      prisma.backgroundJob.count({ where: { status: 'queued' } }),
      prisma.backgroundJob.count({ where: { status: 'running' } }),
      prisma.backgroundJob.count({ where: { status: 'failed' } }),
      prisma.backgroundJob.count({ where: { status: 'dead_letter' } }),
      prisma.backgroundJob.findMany({ where: { status: 'running', heartbeatAt: { lt: new Date(Date.now() - 5 * 60 * 1000) } }, select: { id: true } }),
      prisma.backgroundJob.count({ where: { status: { in: ['failed', 'dead_letter'] }, scheduledAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
    ]);
    res.json({
      dbReachable: true,
      queueCounts: { queued, running, failed, deadLetter, cancelled: await prisma.backgroundJob.count({ where: { status: 'cancelled' } }) },
      staleJobs: staleJobs.length,
      recentFailures24h: recentFails,
      workerHeartbeat: running > 0 ? 'active' : 'idle',
    });
  } catch (err: any) { res.status(500).json({ error: 'Health check failed' }); }
});

