import { Router, Request, Response } from 'express';
import { prisma } from './db';
import { authenticateToken } from './auth';
import { queueJob } from './jobs';
import { COURSES, LESSONS, FLASHCARDS, MOCK_TESTS } from '../data/mockData';
import { logger } from './logger';

export const studentRouter = Router();

// Apply auth middleware to all student endpoints
studentRouter.use(authenticateToken);

// 1. Get Dashboard Statistics
studentRouter.get('/dashboard-stats', async (req: Request, res: Response) => {
  const user = (req as any).user;

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        submissions: true,
        testAttempts: true,
      },
    });

    if (!dbUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Calculate skill averages based on submissions
    const gradedSubmissions = dbUser.submissions.filter(s => s.status === 'graded');
    
    const getAvgBySection = (section: string) => {
      const subs = gradedSubmissions.filter(s => s.section.toLowerCase() === section.toLowerCase());
      if (subs.length === 0) return 0;
      return Math.round(subs.reduce((sum, s) => sum + (s.score || 0), 0) / subs.length);
    };

    const speaking = getAvgBySection('Speaking') || 65; // fallbacks to typical starting scores
    const writing = getAvgBySection('Writing') || 62;
    const reading = getAvgBySection('Reading') || 58;
    const listening = getAvgBySection('Listening') || 60;

    const overallScore = dbUser.currentAvg || Math.round((speaking + writing + reading + listening) / 4);

    // Calculate dynamic weekly activity (e.g. mock hours based on submissions/attempts)
    const weeklyActivity = [
      { day: 'Mon', hours: 1.5 },
      { day: 'Tue', hours: 2.0 },
      { day: 'Wed', hours: 0.5 },
      { day: 'Thu', hours: gradedSubmissions.length * 0.4 },
      { day: 'Fri', hours: dbUser.testAttempts.length * 2 },
      { day: 'Sat', hours: 0 },
      { day: 'Sun', hours: 1.0 },
    ];

    res.json({
      overallScore,
      targetScore: dbUser.targetScore,
      streakDays: 5, // Simulated streak or can be tracked via dates
      lastActive: 'Just now',
      skills: { speaking, writing, reading, listening },
      weeklyActivity,
    });
  } catch (err: any) {
    logger.error('Error fetching dashboard stats', { error: err.message, userId: user.id });
    res.status(500).json({ error: 'Internal server error fetching dashboard stats' });
  }
});

// 2. Get Courses and Lessons with dynamic completion progress
studentRouter.get('/courses', async (req: Request, res: Response) => {
  const user = (req as any).user;

  try {
    const completedLessons = await prisma.lessonCompletion.findMany({
      where: { userId: user.id },
    });
    const completedIds = completedLessons.map(l => l.lessonId);

    // Map courses and calculate dynamic progress percentage
    const coursesWithProgress = COURSES.map(course => {
      const courseLessons = LESSONS.filter(l => l.courseId === course.id);
      const courseCompleted = courseLessons.filter(l => completedIds.includes(l.id)).length;
      const progress = courseLessons.length > 0 ? Math.round((courseCompleted / courseLessons.length) * 100) : 0;
      
      return {
        ...course,
        progress,
      };
    });

    res.json(coursesWithProgress);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve courses' });
  }
});

// 3. Get lessons for a specific course
studentRouter.get('/courses/:courseId/lessons', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { courseId } = req.params;

  try {
    const completedLessons = await prisma.lessonCompletion.findMany({
      where: { userId: user.id },
    });
    const completedIds = completedLessons.map(l => l.lessonId);

    const courseLessons = LESSONS.filter(l => l.courseId === courseId).map(lesson => ({
      ...lesson,
      completed: completedIds.includes(lesson.id),
    }));

    res.json(courseLessons);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve lessons' });
  }
});

// 4. Toggle Lesson Completion
studentRouter.post('/lessons/:lessonId/toggle', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { lessonId } = req.params;

  try {
    const existing = await prisma.lessonCompletion.findFirst({
      where: { userId: user.id, lessonId },
    });

    if (existing) {
      await prisma.lessonCompletion.delete({ where: { id: existing.id } });
      res.json({ completed: false });
    } else {
      await prisma.lessonCompletion.create({
        data: { userId: user.id, lessonId },
      });
      res.json({ completed: true });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to toggle lesson completion' });
  }
});

// 5. Get Student Practice Submissions
studentRouter.get('/practice/submissions', async (req: Request, res: Response) => {
  const user = (req as any).user;

  try {
    const subs = await prisma.practiceSubmission.findMany({
      where: { userId: user.id },
      orderBy: { submittedAt: 'desc' },
    });
    res.json(subs);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch practice submissions' });
  }
});

// 6. Submit a Practice Item (Queues background grading job)
studentRouter.post('/practice/submit', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { taskCode, title, section, answerText, audioUrl } = req.body;

  if (!taskCode || !title || !section) {
    res.status(400).json({ error: 'Task details are required' });
    return;
  }

  try {
    const submission = await prisma.practiceSubmission.create({
      data: {
        userId: user.id,
        taskCode,
        title,
        section,
        answerText: answerText || null,
        audioUrl: audioUrl || null,
        status: 'pending',
      },
    });

    // Queue grading background job
    await queueJob('grade_submission', { submissionId: submission.id });

    logger.info(`Student ${user.name} submitted practice for "${title}". Queued grading job.`);

    res.status(201).json(submission);
  } catch (err: any) {
    logger.error('Practice submission error', { error: err.message });
    res.status(500).json({ error: 'Failed to register practice submission' });
  }
});

// 7. Get Mock Tests
studentRouter.get('/mock-tests', async (req: Request, res: Response) => {
  res.json(MOCK_TESTS);
});

// 8. Get Mock Test Attempt History
studentRouter.get('/mock-tests/attempts', async (req: Request, res: Response) => {
  const user = (req as any).user;

  try {
    const attempts = await prisma.testAttempt.findMany({
      where: { userId: user.id },
      orderBy: { date: 'desc' },
    });
    res.json(attempts);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch test attempt history' });
  }
});

// 9. Submit/Record a Mock Test Attempt
studentRouter.post('/mock-tests/submit', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { testId, title, type, overallScore, speakingScore, writingScore, readingScore, listeningScore } = req.body;

  try {
    const attempt = await prisma.testAttempt.create({
      data: {
        userId: user.id,
        testId,
        title,
        type,
        overallScore: parseInt(overallScore) || 50,
        speakingScore: parseInt(speakingScore) || 50,
        writingScore: parseInt(writingScore) || 50,
        readingScore: parseInt(readingScore) || 50,
        listeningScore: parseInt(listeningScore) || 50,
        date: new Date().toISOString().split('T')[0],
      },
    });

    // Queue a system audit log
    logger.info(`Student ${user.name} completed mock test "${title}" with overall score ${overallScore}`);

    res.status(201).json(attempt);
  } catch (err: any) {
    logger.error('Mock test submit error', { error: err.message });
    res.status(500).json({ error: 'Failed to record mock test attempt' });
  }
});

// 10. Get Flashcards with Mastery state
studentRouter.get('/flashcards', async (req: Request, res: Response) => {
  const user = (req as any).user;

  try {
    const dbMastery = await prisma.flashcardState.findMany({
      where: { userId: user.id },
    });
    const masteredIds = dbMastery.filter(f => f.mastered).map(f => f.flashcardId);

    const cards = FLASHCARDS.map(card => ({
      ...card,
      mastered: masteredIds.includes(card.id),
    }));

    res.json(cards);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch flashcards' });
  }
});

// 11. Toggle Flashcard Mastery
studentRouter.post('/flashcards/:cardId/toggle', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { cardId } = req.params;

  try {
    const existing = await prisma.flashcardState.findFirst({
      where: { userId: user.id, flashcardId: cardId },
    });

    if (existing) {
      const updated = await prisma.flashcardState.update({
        where: { id: existing.id },
        data: { mastered: !existing.mastered },
      });
      res.json({ mastered: updated.mastered });
    } else {
      const created = await prisma.flashcardState.create({
        data: { userId: user.id, flashcardId: cardId, mastered: true },
      });
      res.json({ mastered: created.mastered });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to toggle flashcard mastery state' });
  }
});

// 12. Get Student Notifications
studentRouter.get('/notifications', async (req: Request, res: Response) => {
  const user = (req as any).user;

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(notifications);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// 13. Mark single notification as read
studentRouter.post('/notifications/:id/read', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { id } = req.params;

  try {
    await prisma.notification.updateMany({
      where: { id, userId: user.id },
      data: { read: true },
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update notification status' });
  }
});

// 14. Mark all notifications as read
studentRouter.post('/notifications/read-all', async (req: Request, res: Response) => {
  const user = (req as any).user;

  try {
    await prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to read all notifications' });
  }
});

// 15. Get Diagnostic Test State & Personalized Study Plan
studentRouter.get('/diagnostic-state', async (req: Request, res: Response) => {
  const user = (req as any).user;

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        diagnosticDone: true,
        studyPlan: true,
        estimatedScores: true,
      },
    });

    if (!dbUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      diagnosticDone: dbUser.diagnosticDone,
      studyPlan: dbUser.studyPlan ? JSON.parse(dbUser.studyPlan) : null,
      estimatedScores: dbUser.estimatedScores ? JSON.parse(dbUser.estimatedScores) : null,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve diagnostic state' });
  }
});

// 16. Submit Diagnostic Test & Generate Study Plan
import { generateDiagnosticStudyPlan } from './aiService';

studentRouter.post('/diagnostic/submit', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { answers } = req.body; // Array of { taskCode, title, section, answerText, promptText }

  if (!answers || !Array.isArray(answers) || answers.length === 0) {
    res.status(400).json({ error: 'Valid diagnostic answers are required' });
    return;
  }

  try {
    logger.info(`Generating diagnostic study plan for user: ${user.name}`);
    const result = await generateDiagnosticStudyPlan(answers);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        diagnosticDone: true,
        studyPlan: JSON.stringify(result.studyPlan),
        estimatedScores: JSON.stringify(result.estimatedScores),
      },
    });

    res.json({
      success: true,
      diagnosticDone: true,
      studyPlan: result.studyPlan,
      estimatedScores: result.estimatedScores,
    });
  } catch (err: any) {
    logger.error('Diagnostic generation failed', { error: err.message });
    res.status(500).json({ error: 'Failed to generate diagnostic study plan' });
  }
});

// 17. Save or Pause Mock Test Progress (Interrupted Resume System)
studentRouter.post('/mock-tests/save-progress', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { attemptId, testId, title, type, currentQuestionIndex, secondsRemaining, answers, isPaused } = req.body;

  try {
    const answersStr = JSON.stringify(answers || {});
    const statusVal = isPaused ? 'Paused' : 'In Progress';

    let attempt;
    if (attemptId) {
      attempt = await prisma.testAttempt.update({
        where: { id: attemptId, userId: user.id },
        data: {
          currentQuestionIndex: currentQuestionIndex || 0,
          secondsRemaining: secondsRemaining || 0,
          answersJson: answersStr,
          status: statusVal,
        },
      });
    } else {
      // Find or create in-progress session
      attempt = await prisma.testAttempt.create({
        data: {
          userId: user.id,
          testId,
          title,
          type,
          overallScore: 0,
          speakingScore: 0,
          writingScore: 0,
          readingScore: 0,
          listeningScore: 0,
          status: statusVal,
          currentQuestionIndex: currentQuestionIndex || 0,
          secondsRemaining: secondsRemaining || 0,
          answersJson: answersStr,
          date: new Date().toISOString().split('T')[0],
        },
      });
    }

    res.json({ success: true, attempt });
  } catch (err: any) {
    logger.error('Error saving mock progress', { error: err.message });
    res.status(500).json({ error: 'Failed to save mock test progress' });
  }
});

// 18. Retrieve Active/Interrupted Mock Test to Resume
studentRouter.get('/mock-tests/active', async (req: Request, res: Response) => {
  const user = (req as any).user;

  try {
    const activeAttempt = await prisma.testAttempt.findFirst({
      where: {
        userId: user.id,
        status: { in: ['In Progress', 'Paused'] },
      },
      orderBy: { date: 'desc' },
    });

    if (!activeAttempt) {
      res.json({ activeAttempt: null });
      return;
    }

    res.json({
      activeAttempt: {
        ...activeAttempt,
        answers: activeAttempt.answersJson ? JSON.parse(activeAttempt.answersJson) : {},
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch active mock session' });
  }
});

// 19. Submit complete Mock Test with subscore calculations & update attempts status
studentRouter.post('/mock-tests/complete', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { attemptId, testId, title, type, overallScore, speakingScore, writingScore, readingScore, listeningScore, answers } = req.body;

  try {
    const answersStr = JSON.stringify(answers || {});
    let attempt;

    if (attemptId) {
      attempt = await prisma.testAttempt.update({
        where: { id: attemptId, userId: user.id },
        data: {
          overallScore: parseInt(overallScore) || 50,
          speakingScore: parseInt(speakingScore) || 50,
          writingScore: parseInt(writingScore) || 50,
          readingScore: parseInt(readingScore) || 50,
          listeningScore: parseInt(listeningScore) || 50,
          status: 'Completed',
          answersJson: answersStr,
        },
      });
    } else {
      attempt = await prisma.testAttempt.create({
        data: {
          userId: user.id,
          testId,
          title,
          type,
          overallScore: parseInt(overallScore) || 50,
          speakingScore: parseInt(speakingScore) || 50,
          writingScore: parseInt(writingScore) || 50,
          readingScore: parseInt(readingScore) || 50,
          listeningScore: parseInt(listeningScore) || 50,
          status: 'Completed',
          answersJson: answersStr,
          date: new Date().toISOString().split('T')[0],
        },
      });
    }

    // Send graduation/score notifications
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Mock Exam Scored!',
        text: `Completed "${title}" with overall PTE band score ${overallScore}. View detail analytics.`,
      },
    });

    res.status(200).json({ success: true, attempt });
  } catch (err: any) {
    logger.error('Failed completing test attempt', { error: err.message });
    res.status(500).json({ error: 'Failed to record completed test attempt' });
  }
});

// 20. Validate Coupon Code
studentRouter.post('/coupon/validate', async (req: Request, res: Response) => {
  const { code } = req.body;
  if (!code) {
    res.status(400).json({ error: 'Coupon code is required' });
    return;
  }

  try {
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase().trim() },
    });

    if (!coupon || !coupon.active) {
      res.status(404).json({ error: 'Invalid or expired coupon code' });
      return;
    }

    res.json({ success: true, discountPercent: coupon.discountPercent });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to validate coupon code' });
  }
});

// 21. Process Payment & Activate Premium Subscription
studentRouter.post('/subscribe', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { planType, price, couponCode, cardNumber, cardExpiry, cardCvc } = req.body;

  if (!cardNumber || !cardExpiry || !cardCvc) {
    res.status(400).json({ error: 'Payment details are required' });
    return;
  }

  // Security: Simulate Stripe verification & fraud detection engine
  // Decline card numbers starting with 4000 (declined) to showcase errors
  if (cardNumber.replace(/\s+/g, '').startsWith('4000')) {
    // Record security block/failed payment audit log
    await prisma.auditLog.create({
      data: {
        action: 'PAYMENT_DECLINED',
        category: 'Billing',
        message: `Failed subscription attempt for ${user.email} (Card Declined)`,
        metadata: JSON.stringify({ planType, error: 'Card declined by issuing bank' }),
      },
    });
    res.status(400).json({ error: 'Your credit card was declined. Please use a valid card (e.g. starting with 4242).' });
    return;
  }

  try {
    // Determine expiration date (1 month or 1 year)
    const expiration = new Date();
    if (planType === 'yearly') {
      expiration.setFullYear(expiration.getFullYear() + 1);
    } else {
      expiration.setMonth(expiration.getMonth() + 1);
    }

    // Upgrade student's tier
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        subTier: 'premium',
        couponApplied: couponCode || null,
        subExpiresAt: expiration,
      },
    });

    // Create Audit Log of Transaction
    await prisma.auditLog.create({
      data: {
        action: 'PAYMENT_RECEIVED',
        category: 'Billing',
        message: `User ${user.email} successfully upgraded to premium (${planType} plan).`,
        metadata: JSON.stringify({ pricePaid: price, planType, couponCode }),
      },
    });

    // Email Automation Trigger (Simulated with Audit Log record)
    await prisma.auditLog.create({
      data: {
        action: 'EMAIL_SENT',
        category: 'Email',
        message: `Automated Email: Premium Invoice & Receipt sent to ${user.email}.`,
        metadata: JSON.stringify({
          subject: 'PTE Master Premium Activated! 🚀',
          plan: planType,
          amount: `$${price}`,
        }),
      },
    });

    // Notification in System
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Premium Activated! 🎉',
        text: `Welcome to PTE Master Premium! All 22 tasks, full mock exams, and personalized AI evaluations are now fully unlocked.`,
      },
    });

    res.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        subTier: updatedUser.subTier,
        couponApplied: updatedUser.couponApplied,
        subExpiresAt: updatedUser.subExpiresAt,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to process subscription payment' });
  }
});

// 22. Cancel Premium Subscription (Downgrade back to Free)
studentRouter.post('/unsubscribe', async (req: Request, res: Response) => {
  const user = (req as any).user;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        subTier: 'free',
        subExpiresAt: null,
      },
    });

    // Log Action
    await prisma.auditLog.create({
      data: {
        action: 'SUBSCRIPTION_CANCELLED',
        category: 'Billing',
        message: `User ${user.email} cancelled their premium subscription.`,
      },
    });

    // Simulated Email Log
    await prisma.auditLog.create({
      data: {
        action: 'EMAIL_SENT',
        category: 'Email',
        message: `Automated Email: Subscription cancellation feedback request sent to ${user.email}.`,
      },
    });

    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Subscription Cancelled',
        text: 'Your subscription was cancelled successfully. Your account has returned to the standard Free Tier limits.',
      },
    });

    res.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        subTier: updatedUser.subTier,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// 23. Retrieve custom PTE questions authored by teachers
studentRouter.get('/custom-questions', async (req: Request, res: Response) => {
  try {
    const questions = await prisma.customTask.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(questions);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve custom tasks' });
  }
});


