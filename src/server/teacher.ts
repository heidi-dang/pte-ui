import { Router, Request, Response } from 'express';
import { prisma } from './db';
import { authenticateToken, requireRole } from './auth';

export const teacherRouter = Router();
teacherRouter.use(authenticateToken);
teacherRouter.use(requireRole(['teacher', 'admin']));

const safeStudentSelect = { id: true, name: true, email: true, targetScore: true, currentAvg: true, status: true, createdAt: true, lastLoginAt: true };

async function getAssignedStudentIds(user: any): Promise<string[]> {
  const a = await prisma.teacherStudentAssignment.findMany({ where: { teacherId: user.id }, select: { studentId: true } });
  return a.map(x => x.studentId);
}

async function studentScopeWhere(user: any) {
  if (user.role === 'admin') return { role: 'student' as const };
  return { id: { in: await getAssignedStudentIds(user) } };
}

async function submissionScopeWhere(user: any) {
  if (user.role === 'admin') return {};
  return { userId: { in: await getAssignedStudentIds(user) } };
}

async function isAssignedOrAdmin(user: any, sid: string): Promise<boolean> {
  if (user.role === 'admin') return true;
  const a = await prisma.teacherStudentAssignment.findFirst({ where: { teacherId: user.id, studentId: sid }, select: { id: true } });
  return Boolean(a);
}

// Dashboard
teacherRouter.get('/dashboard', async (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const where = await submissionScopeWhere(user);
    const [t, p, s] = await Promise.all([
      prisma.practiceSubmission.count({ where }),
      prisma.practiceSubmission.count({ where: { ...where, status: 'pending' } }),
      prisma.practiceSubmission.count({ where: { ...where, status: 'graded' } }),
    ]);
    const assignedCount = user.role === 'admin'
      ? await prisma.user.count({ where: { role: 'student' } })
      : (await getAssignedStudentIds(user)).length;
    res.json({ assignedCount, totalSubmissions: t, pendingScoring: p, scoredCount: s });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

// Students
teacherRouter.get('/students', async (req: Request, res: Response) => {
  const user = (req as any).user;
  try { res.json(await prisma.user.findMany({ where: await studentScopeWhere(user), select: safeStudentSelect, orderBy: { name: 'asc' } })); }
  catch { res.status(500).json({ error: 'Failed' }); }
});

// Student detail
teacherRouter.get('/students/:id', async (req: Request, res: Response) => {
  const user = (req as any).user;
  try { if (!(await isAssignedOrAdmin(user, req.params.id))) { res.status(403).json({ error: 'Not assigned' }); return; }
    const student = await prisma.user.findUnique({ where: { id: req.params.id }, select: safeStudentSelect }); if (!student) { res.status(404).json({ error: 'Not found' }); return; }
    const [subs, tests, lessons] = await Promise.all([
      prisma.practiceSubmission.findMany({ where: { userId: student.id }, orderBy: { submittedAt: 'desc' }, take: 20, select: { id: true, taskCode: true, title: true, section: true, submittedAt: true, status: true, score: true, fluencyScore: true, pronunciationScore: true, grammarIssues: true, feedback: true } }),
      prisma.testAttempt.findMany({ where: { userId: student.id, status: 'Completed' }, orderBy: { date: 'desc' }, take: 10, select: { id: true, title: true, type: true, date: true, overallScore: true, speakingScore: true, writingScore: true, readingScore: true, listeningScore: true } }),
      prisma.lessonCompletion.count({ where: { userId: student.id } }),
    ]);
    res.json({ student, submissions: subs, tests, completedLessons: lessons }); }
  catch { res.status(500).json({ error: 'Failed' }); }
});

// Student activity
teacherRouter.get('/students/:id/activity', async (req: Request, res: Response) => {
  const user = (req as any).user;
  try { if (!(await isAssignedOrAdmin(user, req.params.id))) { res.status(403).json({ error: 'Not assigned' }); return; }
    res.json(await prisma.practiceSubmission.findMany({ where: { userId: req.params.id }, orderBy: { submittedAt: 'desc' }, take: 30, select: { id: true, taskCode: true, score: true, status: true, submittedAt: true } })); }
  catch { res.status(500).json({ error: 'Failed' }); }
});

// Student reports
teacherRouter.get('/students/:id/reports', async (req: Request, res: Response) => {
  const user = (req as any).user;
  try { if (!(await isAssignedOrAdmin(user, req.params.id))) { res.status(403).json({ error: 'Not assigned' }); return; }
    const scored = await prisma.practiceSubmission.findMany({ where: { userId: req.params.id, status: 'graded', score: { not: null } }, select: { section: true, score: true, taskCode: true } });
    const secs: Record<string, number[]> = {}; const tks: Record<string, number[]> = {}; scored.forEach(s => { if (!secs[s.section]) secs[s.section] = []; secs[s.section].push(s.score!); if (!tks[s.taskCode]) tks[s.taskCode] = []; tks[s.taskCode].push(s.score!); });
    const avg = (a: number[]) => Math.round(a.reduce((x,y)=>x+y,0)/a.length);
    res.json({ sectionAvgs: Object.entries(secs).map(([k,v])=>({section:k,average:avg(v),count:v.length})), taskAvgs: Object.entries(tks).map(([k,v])=>({taskCode:k,average:avg(v),count:v.length})), scoredCount: scored.length }); }
  catch { res.status(500).json({ error: 'Failed' }); }
});

// Submissions
teacherRouter.get('/submissions', async (req: Request, res: Response) => {
  const user = (req as any).user;
  try { const where = await submissionScopeWhere(user);
    const subs = await prisma.practiceSubmission.findMany({ where, orderBy: { submittedAt: 'desc' }, take: 50, select: { id: true, userId: true, taskCode: true, title: true, section: true, submittedAt: true, status: true, score: true, fluencyScore: true, pronunciationScore: true, grammarIssues: true, feedback: true } });
    const studentIds = [...new Set(subs.map(s => s.userId))];
    const students = studentIds.length > 0 ? await prisma.user.findMany({ where: { id: { in: studentIds } }, select: { id: true, name: true } }) : [];
    const m: Record<string, string> = {}; students.forEach(s => { m[s.id] = s.name; });
    res.json(subs.map(s => ({ ...s, studentName: m[s.userId] || 'Unknown' }))); }
  catch { res.status(500).json({ error: 'Failed' }); }
});

// Submission detail
teacherRouter.get('/submissions/:id', async (req: Request, res: Response) => {
  const user = (req as any).user;
  try { const sub = await prisma.practiceSubmission.findUnique({ where: { id: req.params.id }, select: { id: true, userId: true, taskCode: true, title: true, section: true, submittedAt: true, status: true, score: true, fluencyScore: true, pronunciationScore: true, grammarIssues: true, feedback: true } });
    if (!sub) { res.status(404).json({ error: 'Not found' }); return; }
    if (!(await isAssignedOrAdmin(user, sub.userId))) { res.status(403).json({ error: 'Not assigned' }); return; }
    const review = user.role === 'admin'
      ? await prisma.teacherSubmissionReview.findFirst({ where: { submissionId: sub.id }, include: { teacher: { select: { id: true, name: true } } } })
      : await prisma.teacherSubmissionReview.findUnique({ where: { teacherId_submissionId: { teacherId: user.id, submissionId: sub.id } } });
    res.json({ ...sub, teacherReview: review }); }
  catch { res.status(500).json({ error: 'Failed' }); }
});

// Feedback
teacherRouter.post('/submissions/:id/feedback', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { feedback } = req.body;
  if (!feedback || !feedback.trim()) { res.status(400).json({ error: 'feedback required' }); return; }
  try { const sub = await prisma.practiceSubmission.findUnique({ where: { id: req.params.id }, select: { userId: true } });
    if (!sub || !(await isAssignedOrAdmin(user, sub.userId))) { res.status(403).json({ error: 'Not assigned' }); return; }
    const review = await prisma.teacherSubmissionReview.upsert({ where: { teacherId_submissionId: { teacherId: user.id, submissionId: req.params.id } }, update: { feedback: feedback.trim() }, create: { teacherId: user.id, submissionId: req.params.id, feedback: feedback.trim(), status: 'reviewed' } });
    res.json({ success: true, review }); }
  catch { res.status(500).json({ error: 'Failed' }); }
});

// Review status
teacherRouter.patch('/submissions/:id/review-status', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { status } = req.body;
  if (!status || !['pending', 'reviewed'].includes(status)) { res.status(400).json({ error: 'status must be pending or reviewed' }); return; }
  try { const sub = await prisma.practiceSubmission.findUnique({ where: { id: req.params.id }, select: { userId: true } });
    if (!sub || !(await isAssignedOrAdmin(user, sub.userId))) { res.status(403).json({ error: 'Not assigned' }); return; }
    const review = await prisma.teacherSubmissionReview.upsert({ where: { teacherId_submissionId: { teacherId: user.id, submissionId: req.params.id } }, update: { status }, create: { teacherId: user.id, submissionId: req.params.id, status } });
    res.json({ success: true, review }); }
  catch { res.status(500).json({ error: 'Failed' }); }
});

// Mock tests
teacherRouter.get('/mock-tests', async (req: Request, res: Response) => {
  const user = (req as any).user;
  try { const where = await submissionScopeWhere(user);
    const attempts = await prisma.testAttempt.findMany({ where, orderBy: { date: 'desc' }, take: 30, select: { id: true, userId: true, title: true, type: true, date: true, overallScore: true, speakingScore: true, writingScore: true, readingScore: true, listeningScore: true, status: true } });
    const studentIds = [...new Set(attempts.map(a => a.userId))];
    const students = studentIds.length > 0 ? await prisma.user.findMany({ where: { id: { in: studentIds } }, select: { id: true, name: true } }) : [];
    const m: Record<string, string> = {}; students.forEach(s => { m[s.id] = s.name; });
    res.json(attempts.map(a => ({ ...a, studentName: m[a.userId] || 'Unknown' }))); }
  catch { res.status(500).json({ error: 'Failed' }); }
});

// Learning progress
teacherRouter.get('/learning-progress', async (req: Request, res: Response) => {
  const user = (req as any).user;
  try { const ids = user.role === 'admin' ? [] : await getAssignedStudentIds(user);
    const where = user.role === 'admin' ? {} : { userId: { in: ids } };
    const [l, f] = await Promise.all([prisma.lessonCompletion.count({ where }), prisma.flashcardState.count({ where: { ...where, mastered: true } })]);
    const assignedCount = user.role === 'admin' ? await prisma.user.count({ where: { role: 'student' } }) : ids.length;
    res.json({ assignedStudents: assignedCount, totalLessonsCompleted: l, totalFlashcardsMastered: f }); }
  catch { res.status(500).json({ error: 'Failed' }); }
});

// Notes CRUD
teacherRouter.get('/notes', async (req: Request, res: Response) => {
  const user = (req as any).user;
  try { const where = user.role === 'admin' ? {} : { teacherId: user.id };
    res.json(await prisma.teacherStudentNote.findMany({ where, include: { student: { select: { id: true, name: true } }, teacher: { select: { id: true, name: true } } }, orderBy: { updatedAt: 'desc' } })); }
  catch { res.status(500).json({ error: 'Failed' }); }
});

teacherRouter.post('/notes', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { studentId, text } = req.body;
  if (!studentId || !text || !text.trim()) { res.status(400).json({ error: 'studentId and non-empty text required' }); return; }
  try { if (!(await isAssignedOrAdmin(user, studentId))) { res.status(403).json({ error: 'Not assigned' }); return; }
    res.status(201).json(await prisma.teacherStudentNote.create({ data: { teacherId: user.id, studentId, text: text.trim() }, include: { student: { select: { name: true } }, teacher: { select: { id: true, name: true } } } })); }
  catch { res.status(500).json({ error: 'Failed' }); }
});

teacherRouter.patch('/notes/:id', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { text } = req.body;
  if (!text || !text.trim()) { res.status(400).json({ error: 'non-empty text required' }); return; }
  try { const where = user.role === 'admin' ? { id: req.params.id } : { id: req.params.id, teacherId: user.id };
    const note = await prisma.teacherStudentNote.findFirst({ where }); if (!note) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(await prisma.teacherStudentNote.update({ where: { id: req.params.id }, data: { text: text.trim() }, include: { student: { select: { name: true } }, teacher: { select: { id: true, name: true } } } })); }
  catch { res.status(500).json({ error: 'Failed' }); }
});

teacherRouter.delete('/notes/:id', async (req: Request, res: Response) => {
  const user = (req as any).user;
  try { const where = user.role === 'admin' ? { id: req.params.id } : { id: req.params.id, teacherId: user.id };
    const note = await prisma.teacherStudentNote.findFirst({ where }); if (!note) { res.status(404).json({ error: 'Not found' }); return; }
    await prisma.teacherStudentNote.delete({ where: { id: req.params.id } }); res.json({ success: true }); }
  catch { res.status(500).json({ error: 'Failed' }); }
});
