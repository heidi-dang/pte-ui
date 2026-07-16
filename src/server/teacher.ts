import { Router, Request, Response } from 'express';
import { prisma } from './db';
import { authenticateToken, requireRole } from './auth';
import { logger } from './logger';

export const teacherRouter = Router();

// Secure this router to teachers and admins only
teacherRouter.use(authenticateToken);
teacherRouter.use(requireRole(['teacher', 'admin']));

// 1. Get Student Roster (All students registered on the platform)
const getRosterHandler = async (req: Request, res: Response) => {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'student' },
      select: {
        id: true,
        name: true,
        email: true,
        targetScore: true,
        currentAvg: true,
        status: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });

    res.json(students);
  } catch (err: any) {
    logger.error('Roster fetch error', { error: err.message });
    res.status(500).json({ error: 'Failed to retrieve student roster' });
  }
};

teacherRouter.get('/roster', getRosterHandler);
teacherRouter.get('/students', getRosterHandler);

// 2. Get All Student Submissions for Grading
teacherRouter.get('/submissions', async (req: Request, res: Response) => {
  try {
    const submissions = await prisma.practiceSubmission.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    // Format to match Submission type
    const formatted = submissions.map(sub => ({
      id: sub.id,
      studentName: sub.user?.name || 'Student',
      taskTitle: sub.title,
      section: sub.section,
      code: sub.taskCode,
      submittedAt: sub.submittedAt.toISOString(),
      status: sub.status,
      answerText: sub.answerText,
      audioUrl: sub.audioUrl,
      score: sub.score,
      feedback: sub.feedback,
      grammarIssues: sub.grammarIssues,
      pronunciationScore: sub.pronunciationScore,
      fluencyScore: sub.fluencyScore,
    }));

    res.json(formatted);
  } catch (err: any) {
    logger.error('Submissions fetch error', { error: err.message });
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// 3. Grade a Student Practice Submission (shared handler for both PUT and POST)
const gradeSubmission = async (id: string, body: any, teacherUser: any, res: Response): Promise<void> => {
  const { score, feedback, pronunciationScore, fluencyScore, grammarIssues } = body;

  if (score === undefined || score === null) {
    res.status(400).json({ error: 'Score is required' });
    return;
  }

  try {
    const sub = await prisma.practiceSubmission.findUnique({
      where: { id },
    });

    if (!sub) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }

    const updated = await prisma.practiceSubmission.update({
      where: { id },
      data: {
        status: 'graded',
        score: parseInt(score),
        feedback: feedback || '',
        pronunciationScore: pronunciationScore ? parseInt(pronunciationScore) : null,
        fluencyScore: fluencyScore ? parseInt(fluencyScore) : null,
        grammarIssues: grammarIssues ? parseInt(grammarIssues) : null,
      },
    });

    // Notify student
    await prisma.notification.create({
      data: {
        userId: sub.userId,
        title: 'Assignment Graded by Instructor',
        text: `Your instructor ${teacherUser.name} graded your submission for "${sub.title}" with a score of ${score}/90.`,
      },
    });

    // Update user's current average score
    const allGraded = await prisma.practiceSubmission.findMany({
      where: { userId: sub.userId, status: 'graded' },
      select: { score: true },
    });

    if (allGraded.length > 0) {
      const sum = allGraded.reduce((acc, curr) => acc + (curr.score || 0), 0);
      const avg = Math.round(sum / allGraded.length);
      await prisma.user.update({
        where: { id: sub.userId },
        data: { currentAvg: avg },
      });
    }

    logger.info(`Teacher ${teacherUser.name} graded submission ${id} with score ${score}`);

    res.json(updated);
  } catch (err: any) {
    logger.error('Grading error', { error: err.message });
    res.status(500).json({ error: 'Failed to submit grade' });
  }
};

teacherRouter.post('/submissions/:id/grade', async (req: Request, res: Response) => {
  await gradeSubmission(req.params.id, req.body, (req as any).user, res);
});

teacherRouter.put('/grade', async (req: Request, res: Response) => {
  const { submissionId } = req.body;
  if (!submissionId) {
    res.status(400).json({ error: 'Submission ID is required' });
    return;
  }
  await gradeSubmission(submissionId, req.body, (req as any).user, res);
});
