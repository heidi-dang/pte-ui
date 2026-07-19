import { Router, Request, Response } from 'express';
import { prisma } from './db';
import { logger } from './logger';
import crypto from 'crypto';

export const testRouter = Router();

testRouter.use((req, res, next) => {
  if (process.env.PTE_TEST_MODE !== '1' && process.env.NODE_ENV !== 'development') {
    res.status(404).json({ error: 'Test endpoints only available in test/development mode' });
    return;
  }
  next();
});

// Seed a completed mock attempt with question results for E2E testing
testRouter.post('/seed-mock-result', async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  try {
    const attemptId = crypto.randomUUID();
    const testId = crypto.randomUUID();
    const taskCodes = ['RA', 'WE', 'MCS', 'MCM', 'ROP', 'FIBR', 'HIW', 'WFD'];
    const sections = ['Speaking', 'Writing', 'Reading', 'Reading', 'Reading', 'Reading', 'Listening', 'Listening'];
    const questions = taskCodes.map((code, i) => ({
      id: `seed-q-${i}`, questionId: `seed-q-${i}`,
      taskCode: code, section: sections[i] || 'Speaking',
      title: `Seed ${code}`, instruction: `Complete the ${code} task`,
      promptText: `Mock question prompt for ${code}`,
      difficulty: 'medium', source: 'cms' as const,
    }));

    await prisma.testAttempt.create({
      data: {
        id: attemptId, userId: user.id, testId,
        title: 'E2E Seed Mock Exam', type: 'full',
        status: 'Completed', overallScore: 72,
        speakingScore: 68, writingScore: 75, readingScore: 70, listeningScore: 74,
        questionsJson: JSON.stringify(questions),
        answersJson: JSON.stringify(Object.fromEntries(questions.map((_, i) => [i, { kind: 'text', text: `seed answer ${i}` }]))),
        date: new Date().toISOString().split('T')[0], revision: 1, submittedAt: new Date(),
      },
    });

    for (let i = 0; i < taskCodes.length; i++) {
      const code = taskCodes[i];
      const isSpeaking = ['RA', 'RS', 'DI', 'RL', 'ASQ', 'SGD', 'RTS'].includes(code);
      await prisma.mockQuestionResult.create({
        data: {
          attemptId, questionId: `seed-q-${i}`, questionIndex: i, questionVersion: 1,
          taskType: code,
          normalizedResponse: isSpeaking
            ? { kind: 'audio', transcript: `Seed transcript for ${code}` }
            : { kind: 'text', text: `Seed response for ${code}` },
          scoringPolicyVersion: 'pte-estimated-v1',
          status: 'Completed',
          finalScore: 70 + i * 3,
          feedback: `Graded successfully for ${code}`,
          aiProvider: 'Deterministic Engine',
          aiModel: 'deterministic-pte-v1',
          gradedAt: new Date(),
          skillContributions: {
            speaking: isSpeaking ? 10 : 0,
            writing: ['SWT', 'WE', 'SST', 'WFD'].includes(code) ? 10 : 0,
            reading: ['MCS', 'MCM', 'ROP', 'FIBR', 'FIBRW', 'HCS', 'MCSSL'].includes(code) ? 10 : 0,
            listening: ['SST', 'FIBL', 'HCS', 'MCSSL', 'MCMSL', 'SMW', 'HIW', 'WFD'].includes(code) ? 10 : 0,
          },
        },
      });
    }

    res.json({ attemptId, status: 'Completed', overallScore: 72 });
  } catch (err: any) {
    logger.error('Failed to seed mock result', err);
    res.status(500).json({ error: 'Seeding failed' });
  }
});

// Get renderer task codes for verification
testRouter.get('/renderer-codes', (_req: Request, res: Response) => {
  const codes = ['RA','RS','DI','RL','ASQ','SGD','RTS','SWT','WE','MCS','MCM','ROP','FIBR','FIBRW','SST','MCMSL','FIBL','HCS','MCSSL','SMW','HIW','WFD'];
  res.json({ codes, count: codes.length });
});
