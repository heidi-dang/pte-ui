import { Router, Request, Response } from 'express';
import { prisma } from './db';
import { authenticateToken } from './auth';
import { queueJob } from './jobs/queue';
import { getAudioStore } from './storage';
import { COURSES, LESSONS, FLASHCARDS, MOCK_TESTS, PRACTICE_ITEMS_LIST } from '../data/mockData';
import { ExamGenerator } from '../utils/ExamGenerator';
import { logger } from './logger';
import { evaluateSubmission } from './aiService';
import { config } from './config';
import { generateMockTest } from '../utils/mockTestGenerator';
import { generateStudyPlan } from '../utils/studyPlanGenerator';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import {
  getContract,
  validateQuestionForTask,
  validateResponseForTask,
  buildStudentSafeQuestion,
  getEffectivePlaybackPolicy,
  TASK_REGISTRY,
  assertPracticeAttemptTransition,
} from '../practice/contracts';
import type { PTETaskCode, PracticeAttemptStatus } from '../practice/contracts';
import { ApiError, badRequest, forbidden, notFound, internal } from './apiError';
import { ErrorCodes } from '../shared/api/practice';
import type { QuestionListParams, QuestionListResponse, QuestionListItem } from '../shared/api/practice';
import { MOCK_ATTEMPT_STATUS, ACTIVE_RESUME_STATUSES } from '../shared/mockExamStatus';
import { normalizeMockResponse } from '../utils/mockExamResponseNormalizer';

export const studentRouter = Router();

// Apply auth middleware to all student endpoints
studentRouter.use(authenticateToken);

const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.wav', '.mp3', '.m4a', '.ogg', '.webm'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported audio format: ${ext}. Allowed: ${allowed.join(', ')}`));
    }
  },
});

// ---------------------------------------------------------------------------
// Practice Attempt Lifecycle (Phase 3 closure)
// ---------------------------------------------------------------------------

// POST /practice/attempts/start — start a new practice attempt
studentRouter.post('/practice/attempts/start', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { questionBankItemId, mode } = req.body;

  if (!questionBankItemId) {
    badRequest(ErrorCodes.VALIDATION_ERROR, 'questionBankItemId is required').send(res);
    return;
  }

  try {
    const qItem = await prisma.questionBankItem.findUnique({
      where: { id: questionBankItemId },
    });
    if (!qItem) {
      notFound(ErrorCodes.QUESTION_NOT_FOUND, 'Question not found').send(res);
      return;
    }
    if (qItem.status !== 'published') {
      badRequest(ErrorCodes.QUESTION_NOT_PUBLISHED, 'Question is not published').send(res);
      return;
    }

    const contract = getContract(qItem.taskCode as any);
    const playMode = mode || 'timed';

    const effectivePlayback = getEffectivePlaybackPolicy(qItem.taskCode as any, playMode);

    const now = new Date();
    const totalSec = contract.timing.prepSeconds + contract.timing.responseSeconds;
    const deadline = totalSec > 0 ? new Date(now.getTime() + totalSec * 1000 + 5000) : null;

    const studentSafe = buildStudentSafeQuestion(qItem.taskCode as any, {
      id: qItem.id,
      taskCode: qItem.taskCode,
      section: qItem.section,
      title: qItem.title,
      instruction: qItem.instruction,
      promptText: qItem.promptText,
      promptHtml: qItem.promptHtml,
      imageUrl: qItem.imageUrl,
      passageText: qItem.passageText,
      optionsJson: qItem.optionsJson,
      difficulty: qItem.difficulty,
    });

    const gradingSnapshot = {
      questionId: qItem.id,
      questionVersion: qItem.contentVersion || 1,
      taskCode: qItem.taskCode,
      promptText: qItem.promptText,
      answerKeyJson: qItem.answerKeyJson,
      rubricVersion: 'pte-v1',
      scoringPolicyVersion: 'pte-estimated-v1',
    };

    const attempt = await prisma.practiceAttempt.create({
      data: {
        userId: user.id,
        questionBankItemId: qItem.id,
        questionVersion: qItem.contentVersion || 1,
        taskCode: qItem.taskCode,
        mode: playMode,
        status: 'In_Progress',
        deadlineAt: deadline,
        scoringPolicyVersion: 'pte-estimated-v1',
        questionSnapshotJson: JSON.stringify(studentSafe),
        gradingSnapshotJson: JSON.stringify(gradingSnapshot),
        playbackPolicySnapshotJson: JSON.stringify(effectivePlayback),
      },
    });

    res.status(201).json({
      success: true,
      data: {
        attemptId: attempt.id,
        status: attempt.status,
        deadlineAt: attempt.deadlineAt,
        taskCode: contract.code,
        section: contract.section,
        timing: contract.timing,
        playbackPolicy: effectivePlayback,
        question: studentSafe,
      },
    });
  } catch (err: any) {
    logger.error('Start attempt failed', { error: err.message, userId: user.id });
    internal(ErrorCodes.INTERNAL_ERROR, 'Failed to start practice attempt').send(res);
  }
});

// POST /practice/attempts/:attemptId/play-prompt — atomically authorised prompt playback
studentRouter.post('/practice/attempts/:attemptId/play-prompt', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { attemptId } = req.params;

  try {
    const attempt = await prisma.practiceAttempt.findFirst({
      where: { id: attemptId, userId: user.id },
    });
    if (!attempt) {
      notFound(ErrorCodes.ATTEMPT_NOT_FOUND_OR_FORBIDDEN, 'Attempt not found').send(res);
      return;
    }
    if (attempt.status !== 'In_Progress') {
      badRequest(ErrorCodes.ATTEMPT_NOT_IN_PROGRESS, `Attempt is ${attempt.status}, cannot play prompt`).send(res);
      return;
    }

    const playbackPolicy = attempt.playbackPolicySnapshotJson
      ? JSON.parse(attempt.playbackPolicySnapshotJson)
      : { maxPlays: 1 };
    const maxPlays = playbackPolicy.maxPlays || 1;
    const now = new Date();

    // Atomic upsert for first-play race
    await prisma.practicePlaybackConsumption.upsert({
      where: { attemptId },
      update: {},
      create: { attemptId, userId: user.id, playedCount: 0 },
    });

    const consumed = await prisma.practicePlaybackConsumption.updateMany({
      where: { attemptId, playedCount: { lt: maxPlays } },
      data: {
        playedCount: { increment: 1 },
        firstPlayedAt: now,
        lastPlayedAt: now,
        version: { increment: 1 },
      },
    });

    if (consumed.count !== 1) {
      forbidden(ErrorCodes.PROMPT_PLAYBACK_LIMIT_REACHED, `Playback limit exceeded (max ${maxPlays})`).send(res);
      return;
    }

    // Load original question for audio URL (snapshot no longer stores raw audioUrl)
    const question = await prisma.questionBankItem.findUnique({
      where: { id: attempt.questionBankItemId },
      select: { audioUrl: true },
    });
    const playbackRecord = await prisma.practicePlaybackConsumption.findUnique({
      where: { attemptId },
      select: { playedCount: true },
    });
    const remainingPlays = Math.max(0, maxPlays - (playbackRecord?.playedCount ?? 1));
    res.json({
      success: true,
      data: {
        attemptId,
        playbackId: `${attemptId}-play-${playbackRecord?.playedCount ?? 1}`,
        audioUrl: question?.audioUrl || null,
        expiresAt: null,
        remainingPlays,
        playedCount: playbackRecord?.playedCount ?? 1,
        maxPlays,
      },
    });
  } catch (err: any) {
    if (err instanceof ApiError) { err.send(res); return; }
    logger.error('Play prompt failed', { error: err.message, userId: user.id });
    internal(ErrorCodes.INTERNAL_ERROR, 'Failed to authorize playback').send(res);
  }
});

// POST /practice/attempts/:attemptId/audio-upload — upload response audio for speaking tasks
studentRouter.post('/practice/attempts/:attemptId/audio-upload', audioUpload.single('audio'), async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { attemptId } = req.params;

  let _objectKey: string | null = null;
  let _metaId: string | null = null;

  try {
    const attempt = await prisma.practiceAttempt.findFirst({
      where: { id: attemptId, userId: user.id },
    });
    if (!attempt) {
      notFound(ErrorCodes.ATTEMPT_NOT_FOUND_OR_FORBIDDEN, 'Attempt not found').send(res);
      return;
    }
    if (attempt.status !== 'In_Progress') {
      badRequest(ErrorCodes.ATTEMPT_NOT_IN_PROGRESS, `Attempt is ${attempt.status}, cannot upload audio`).send(res);
      return;
    }
    if (!req.file) {
      badRequest(ErrorCodes.RESPONSE_AUDIO_MISSING, 'No audio file provided').send(res);
      return;
    }

    const contract = getContract(attempt.taskCode as any);
    if (!contract.media.requiresResponseRecording) {
      badRequest(ErrorCodes.RESPONSE_AUDIO_REQUIRED, `${attempt.taskCode} does not require response recording`).send(res);
      return;
    }

    const fileBuffer = req.file.buffer;
    const mimeType = req.file.mimetype;
    const ext = path.extname(req.file.originalname) || '.wav';
    const uniqueKey = `${crypto.randomUUID()}${ext}`;
    const objectKey = `practice/${user.id}/${attemptId}/${uniqueKey}`;
    _objectKey = objectKey;

    const storage = getAudioStore();
    await storage.put(objectKey, fileBuffer, mimeType);

    const meta = await prisma.audioMetadata.create({
      data: {
        objectKey,
        mimeType,
        byteSize: fileBuffer.length,
        hash: crypto.createHash('sha256').update(fileBuffer).digest('hex'),
        userId: user.id,
      },
    });
    _metaId = meta.id;

    const oldAudioId = attempt.responseAudioId;
    await prisma.practiceAttempt.update({
      where: { id: attemptId },
      data: { responseAudioId: meta.id },
    });

    // Safe re-record: delete old audio only AFTER new relation is committed
    if (oldAudioId) {
      const oldAudio = await prisma.audioMetadata.findUnique({ where: { id: oldAudioId } });
      if (oldAudio) {
        await storage.delete(oldAudio.objectKey).catch(() => {});
        await prisma.audioMetadata.delete({ where: { id: oldAudioId } }).catch(() => {});
      }
    }

    logger.info(`Response audio uploaded for attempt ${attemptId}: ${fileBuffer.length} bytes`);

    res.status(201).json({
      success: true,
      data: {
        attemptId,
        responseAudioId: meta.id,
        status: attempt.status,
      },
    });
  } catch (err: any) {
    if (err instanceof ApiError) { err.send(res); return; }
    // Rollback orphans (P0.12)
    if (_objectKey) {
      try { await getAudioStore().delete(_objectKey); } catch { /* best-effort */ }
    }
    if (_metaId) {
      try { await prisma.audioMetadata.delete({ where: { id: _metaId } }); } catch { /* best-effort */ }
    }
    logger.error('Response audio upload failed', { error: err.message, userId: user.id });
    internal(ErrorCodes.INTERNAL_ERROR, 'Failed to upload response audio').send(res);
  }
});

// POST /practice/attempts/:attemptId/submit — atomic submission with idempotency
studentRouter.post('/practice/attempts/:attemptId/submit', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { attemptId } = req.params;
  const { answerJson } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const attempt = await tx.practiceAttempt.findFirst({
        where: { id: attemptId, userId: user.id },
      });
      if (!attempt) throw notFound(ErrorCodes.ATTEMPT_NOT_FOUND_OR_FORBIDDEN, 'Attempt not found');
      if (attempt.status !== 'In_Progress') {
        // Already submitted — return existing submission
        const existing = await tx.practiceSubmission.findUnique({ where: { attemptId } });
        if (existing) {
          return { submissionId: existing.id, status: attempt.status, idempotent: true };
        }
        throw badRequest(ErrorCodes.ATTEMPT_NOT_IN_PROGRESS, `Attempt is ${attempt.status}, cannot submit`);
      }
      if (attempt.deadlineAt && new Date() > attempt.deadlineAt) {
        await tx.practiceAttempt.update({ where: { id: attemptId }, data: { status: 'Expired' } });
        throw badRequest(ErrorCodes.ATTEMPT_EXPIRED, 'Attempt deadline has expired');
      }

      const contract = getContract(attempt.taskCode as any);
      const gradingSnapshot: Record<string, unknown> = attempt.gradingSnapshotJson
        ? JSON.parse(attempt.gradingSnapshotJson)
        : {};

      const rawResponse: Record<string, unknown> = {};
      if (contract.media.requiresResponseRecording) {
        if (!attempt.responseAudioId) {
          throw badRequest(ErrorCodes.RESPONSE_AUDIO_REQUIRED, `${attempt.taskCode} requires a recorded response`);
        }
        rawResponse.audioRecorded = true;
      } else if (answerJson) {
        Object.assign(rawResponse, typeof answerJson === 'string' ? JSON.parse(answerJson) : answerJson);
      }

      const validation = validateResponseForTask(attempt.taskCode as any, rawResponse);
      if (!validation.valid) {
        throw badRequest(ErrorCodes.INVALID_RESPONSE, 'Invalid response', (validation as any).errors);
      }

      const normalized = contract.normalizeResponse(validation.data) as Record<string, unknown>;

      const submission = await tx.practiceSubmission.create({
        data: {
          userId: user.id,
          taskCode: attempt.taskCode,
          title: JSON.parse(attempt.questionSnapshotJson).title || attempt.taskCode,
          section: contract.section,
          answerJson: JSON.stringify(normalized),
          answerText: extractResponseTextForScoring(attempt.taskCode as any, normalized, gradingSnapshot),
          audioMetadataId: attempt.responseAudioId || undefined,
          questionBankItemId: attempt.questionBankItemId,
          status: 'pending',
          attemptId: attempt.id,
        },
      });

      const isSpeaking = contract.scoringMode === 'ai_speech' || contract.scoringMode === 'acoustic';
      const isDeterministic = contract.scoringMode === 'deterministic';
      const needsResponseTranscription = contract.transcription.requiresTranscription && contract.media.requiresResponseRecording;
      // Speaking tasks with audio response need transcription first.
      // Deterministic text-only tasks (WFD, HIW, FIBL) go direct to Pending_Deterministic.
      const nextStatus = needsResponseTranscription ? 'Pending_Transcription' : isDeterministic ? 'Pending_Deterministic' : 'Pending_Grading';
      assertPracticeAttemptTransition(attempt.status as PracticeAttemptStatus, nextStatus);

      await tx.practiceAttempt.update({
        where: { id: attemptId },
        data: { status: nextStatus, submittedAt: new Date() },
      });

      const idemKey = needsResponseTranscription ? `practice-transcribe:${attempt.id}` : `practice-grade:${attempt.id}`;
      await queueJob(
        needsResponseTranscription ? 'transcribe_audio' : 'grade_submission',
        { submissionId: submission.id, attemptId: attempt.id },
        { idempotencyKey: idemKey },
        tx,
      );

      return { submissionId: submission.id, status: nextStatus, idempotent: false };
    });

    const nextAction = result.idempotent ? 'poll_result' as const
      : result.status === 'Pending_Transcription' ? 'wait_for_transcription' as const
      : result.status === 'Pending_Deterministic' || result.status === 'Pending_Grading' ? 'wait_for_grading' as const
      : result.status === 'Expired' ? 'failed' as const
      : 'poll_result' as const;

    res.status(result.idempotent ? 200 : 201).json({
      success: true,
      data: {
        attemptId,
        submissionId: result.submissionId,
        status: result.status,
        nextAction,
      },
    });
  } catch (err: any) {
    if (err instanceof ApiError) { err.send(res); return; }
    logger.error('Submit attempt failed', { error: err.message, userId: user.id });
    internal(ErrorCodes.INTERNAL_ERROR, 'Failed to submit practice attempt').send(res);
  }
});

function extractResponseTextForScoring(
  taskCode: PTETaskCode,
  normalized: Record<string, unknown>,
  _gradingSnapshot?: Record<string, unknown>,
): string {
  const text = normalized.typedText;
  if (typeof text === 'string' && text.length > 0) return text;

  const option = normalized.selectedOption;
  if (typeof option === 'string') return option;

  const multiple = normalized.selectedMultiple;
  if (Array.isArray(multiple) && multiple.length > 0) return multiple.join(', ');

  const reorder = normalized.reorderedList;
  if (Array.isArray(reorder) && reorder.length > 0) return reorder.join(' | ');

  const blanks = normalized.blanks;
  if (blanks && typeof blanks === 'object') return Object.values(blanks as Record<string, string>).join(', ');

  const highlight = normalized.highlightedIncorrect;
  if (Array.isArray(highlight) && highlight.length > 0) return highlight.join(', ');

  return '';
}

// GET /practice/attempts/:attemptId — read attempt state
studentRouter.get('/practice/attempts/:attemptId', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { attemptId } = req.params;

  try {
    const attempt = await prisma.practiceAttempt.findFirst({
      where: { id: attemptId, userId: user.id },
    });
    if (!attempt) {
      res.status(404).json({ error: 'Attempt not found' });
      return;
    }

    const submission = await prisma.practiceSubmission.findUnique({ where: { attemptId } });

    res.json({
      id: attempt.id,
      taskCode: attempt.taskCode,
      mode: attempt.mode,
      status: attempt.status,
      startedAt: attempt.startedAt,
      deadlineAt: attempt.deadlineAt,
      submittedAt: attempt.submittedAt,
      hasResponseAudio: !!attempt.responseAudioId,
      submissionId: submission?.id || null,
      submissionStatus: submission?.status || null,
    });
  } catch (err: any) {
    logger.error('Get attempt failed', { error: err.message, userId: user.id });
    res.status(500).json({ error: 'Failed to fetch attempt' });
  }
});

// GET /practice/attempts/:attemptId/result — read final result
studentRouter.get('/practice/attempts/:attemptId/result', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { attemptId } = req.params;

  try {
    const attempt = await prisma.practiceAttempt.findFirst({
      where: { id: attemptId, userId: user.id },
    });
    if (!attempt) {
      notFound(ErrorCodes.ATTEMPT_NOT_FOUND_OR_FORBIDDEN, 'Attempt not found').send(res);
      return;
    }

    const status = attempt.status;
    if (status === 'In_Progress' || status === 'Submitted') {
      res.json({
        success: true,
        data: { attemptId, status, result: null },
      });
      return;
    }

    const submission = await prisma.practiceSubmission.findUnique({ where: { attemptId } });
    if (!submission) {
      res.json({
        success: true,
        data: { attemptId, status, result: null },
      });
      return;
    }

    // Parse structured feedback JSON if available
    let scorerVersion: string | null = null;
    let maxScore: number | null = null;
    let earnedScore: number | null = null;
    let normalizedScore: number | null = null;
    let breakdown: Record<string, unknown> | null = null;
    let feedback: string | null = submission.feedback;
    if (submission.feedback) {
      try {
        const parsed = JSON.parse(submission.feedback);
        if (parsed && typeof parsed === 'object' && parsed.feedback) {
          feedback = parsed.feedback;
          scorerVersion = parsed.scorerVersion || null;
          maxScore = parsed.maxScore ?? null;
          earnedScore = parsed.earnedScore ?? null;
          normalizedScore = parsed.normalizedScore ?? null;
          breakdown = parsed.breakdown ?? null;
        }
      } catch { /* feedback is plain text, use as-is */ }
    }

    res.json({
      success: true,
      data: {
        attemptId,
        status,
        result: {
          score: submission.score,
          maxScore,
          earnedScore,
          normalizedScore,
          scorerVersion,
          feedback,
          breakdown,
          transcript: submission.transcript,
          fluencyScore: submission.fluencyScore,
          pronunciationScore: submission.pronunciationScore,
          grammarIssues: submission.grammarIssues,
        },
      },
    });
  } catch (err: any) {
    if (err instanceof ApiError) { err.send(res); return; }
    logger.error('Get result failed', { error: err.message, userId: user.id });
    internal(ErrorCodes.INTERNAL_ERROR, 'Failed to fetch result').send(res);
  }
});

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

// 1b. Get Dashboard (aggregated data for Phase 3 dashboard)
studentRouter.get('/dashboard', async (req: Request, res: Response) => {
  const user = (req as any).user;

  try {
    const [
      dbUser,
      ongoingPracticeAttempt,
      ongoingMockAttempt,
      scored,
      recentSubmissions,
      recentTests,
      recentLessons,
      testAttempts,
      sectionSubmissions,
      notifications,
    ] = await Promise.all([
      prisma.user.findUnique({ where: { id: user.id } }),
      prisma.practiceAttempt.findFirst({
        where: { userId: user.id, status: 'In_Progress' },
        orderBy: { startedAt: 'desc' },
        select: { id: true, taskCode: true, startedAt: true },
      }),
      prisma.testAttempt.findFirst({
        where: { userId: user.id, status: { in: [MOCK_ATTEMPT_STATUS.IN_PROGRESS, MOCK_ATTEMPT_STATUS.PAUSED] } },
        orderBy: { attemptStartedAt: 'desc' },
        select: { id: true, title: true, type: true },
      }),
      prisma.practiceSubmission.findMany({
        where: { userId: user.id, status: 'graded', score: { not: null } },
        select: { score: true, section: true, taskCode: true },
        orderBy: { submittedAt: 'desc' },
        take: 200,
      }),
      prisma.practiceSubmission.findMany({
        where: { userId: user.id },
        orderBy: { submittedAt: 'desc' },
        take: 10,
        select: { id: true, taskCode: true, title: true, score: true, status: true, submittedAt: true, section: true },
      }),
      prisma.testAttempt.findMany({
        where: { userId: user.id, status: MOCK_ATTEMPT_STATUS.COMPLETED },
        orderBy: { date: 'desc' },
        take: 5,
        select: { id: true, title: true, type: true, overallScore: true, date: true },
      }),
      prisma.lessonCompletion.findMany({
        where: { userId: user.id },
        orderBy: { completedAt: 'desc' },
        take: 5,
        select: { id: true, lessonId: true, completedAt: true },
      }),
      prisma.testAttempt.findMany({
        where: { userId: user.id, status: MOCK_ATTEMPT_STATUS.COMPLETED, overallScore: { not: null } },
        select: { overallScore: true },
      }),
      prisma.practiceSubmission.findMany({
        where: { userId: user.id, status: 'graded', score: { not: null } },
        select: { section: true, taskCode: true, score: true },
      }),
      prisma.notification.findMany({
        where: { userId: user.id, read: false },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, title: true, text: true, createdAt: true },
      }),
    ]);

    if (!dbUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const dashboardData: Record<string, unknown> = {};

    // Greeting
    dashboardData.greeting = {
      name: dbUser.name,
      streakDays: 0,
      lastActive: dbUser.lastLoginAt?.toISOString() || null,
    };

    // Target score
    dashboardData.targetScore = {
      current: dbUser.currentAvg || 0,
      target: dbUser.targetScore || 79,
    };

    // Continue activity — single primary action
    let continueActivity: Record<string, unknown> | null = null;
    if (ongoingPracticeAttempt) {
      continueActivity = {
        type: 'practice',
        label: 'Resume Practice',
        actionLabel: 'Resume',
        routeId: 'practice-session',
        description: `Continue your ${ongoingPracticeAttempt.taskCode} practice`,
        attemptId: ongoingPracticeAttempt.id,
      };
    } else if (ongoingMockAttempt) {
      continueActivity = {
        type: 'mock',
        label: 'Resume Mock Exam',
        actionLabel: 'Resume',
        routeId: 'mock-exam-session',
        description: `Continue "${ongoingMockAttempt.title}"`,
        attemptId: ongoingMockAttempt.id,
      };
    } else if (dbUser.studyPlan) {
      try {
        const plan = JSON.parse(dbUser.studyPlan);
        const today = new Date().toISOString().slice(0, 10);
        const todayItems = plan.dailyPlans?.find((d: { date: string }) => d.date?.slice(0, 10) === today);
        if (todayItems?.items?.length > 0) {
          continueActivity = {
            type: 'study_plan',
            label: 'Continue Study Plan',
            actionLabel: 'Continue',
            routeId: 'study-plan',
            description: 'Pick up where you left off',
          };
        }
      } catch { /* fall through */ }
    }
    if (!continueActivity && dbUser.diagnosticDone && scored.length > 0) {
      continueActivity = {
        type: 'recommended',
        label: 'Recommended Practice',
        actionLabel: 'Start',
        routeId: 'practice',
        description: 'Improve your weakest areas',
      };
    }
    dashboardData.continueActivity = continueActivity;

    // Readiness
    const allScores = [...scored.map(s => s.score || 0), ...testAttempts.map(t => t.overallScore || 0)];
    if (allScores.length > 0) {
      const avgScore = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);
      dashboardData.readiness = {
        ready: avgScore >= (dbUser.targetScore || 79),
        estimatedScore: avgScore,
        message: avgScore >= (dbUser.targetScore || 79)
          ? 'You\'re on track to meet your target!'
          : 'Keep practicing to reach your target score.',
        submissionsCount: scored.length,
        mocksCount: testAttempts.length,
      };
    } else {
      dashboardData.readiness = {
        ready: false,
        message: 'Complete some practice tasks to see your readiness estimate.',
        submissionsCount: 0,
        mocksCount: 0,
      };
    }

    // Daily plan from study plan
    if (dbUser.studyPlan) {
      try {
        const plan = JSON.parse(dbUser.studyPlan);
        const today = new Date().toISOString().slice(0, 10);
        const todayPlan = plan.dailyPlans?.find((d: { date: string }) => d.date?.slice(0, 10) === today)
          || plan.dailyPlans?.[0];
        if (todayPlan) {
          const items = (todayPlan.items || []).map((item: { title?: string; completed?: boolean; duration?: number }) => ({
            title: item.title || 'Study task',
            completed: !!item.completed,
            duration: item.duration,
          }));
          dashboardData.dailyPlan = {
            date: todayPlan.date?.slice(0, 10) || today,
            items,
            totalDuration: todayPlan.totalDuration || items.reduce((s: number, i: { duration?: number }) => s + (i.duration || 30), 0),
            completedItems: items.filter((i: { completed: boolean }) => i.completed).length,
            totalItems: items.length,
          };
        }
      } catch { /* ignore parse errors */ }
    }

    // Recommended actions
    const weakTaskCodes: { taskCode: string; avg: number; count: number }[] = [];
    const byTask: Record<string, { scores: number[]; section: string }> = {};
    for (const s of sectionSubmissions) {
      if (!byTask[s.taskCode]) byTask[s.taskCode] = { scores: [], section: s.section };
      byTask[s.taskCode].scores.push(s.score || 0);
    }
    for (const [code, data] of Object.entries(byTask)) {
      weakTaskCodes.push({
        taskCode: code,
        avg: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
        count: data.scores.length,
      });
    }
    weakTaskCodes.sort((a, b) => a.avg - b.avg);

    const recommendedActions: Record<string, unknown>[] = [];
    if (weakTaskCodes.length > 0) {
      const weakest = weakTaskCodes[0];
      recommendedActions.push({
        id: `improve-${weakest.taskCode}`,
        title: `Practice ${weakest.taskCode}`,
        description: `Your weakest task with an average of ${weakest.avg}/90`,
        priority: 'high',
        actionLabel: 'Practice Now',
        routeId: 'practice',
      });
    }
    if (!dbUser.diagnosticDone) {
      recommendedActions.unshift({
        id: 'take-diagnostic',
        title: 'Take Diagnostic Test',
        description: 'Get a personalized study plan based on your current level',
        priority: 'high',
        actionLabel: 'Start Diagnostic',
        routeId: 'practice',
      });
    }
    if (dbUser.subTier !== 'premium' && scored.length >= 3) {
      recommendedActions.push({
        id: 'upgrade-premium',
        title: 'Unlock Premium',
        description: 'Get full access to all mock exams and AI evaluations',
        priority: 'medium',
        actionLabel: 'View Plans',
        routeId: 'subscription',
      });
    }
    dashboardData.recommendedActions = recommendedActions;

    // Recent activity
    const practiceEntries = recentSubmissions.map(s => ({
      id: s.id,
      type: 'practice' as const,
      title: s.title,
      score: s.score || undefined,
      status: s.status,
      date: s.submittedAt.toISOString(),
      section: s.section,
    }));
    const mockEntries = recentTests.map(t => ({
      id: t.id,
      type: 'mock' as const,
      title: t.title,
      score: t.overallScore || undefined,
      status: 'completed',
      date: new Date(t.date).toISOString(),
    }));
    const lessonEntries = recentLessons.map(l => ({
      id: l.id,
      type: 'lesson' as const,
      title: `Lesson: ${l.lessonId}`,
      status: 'completed',
      date: l.completedAt.toISOString(),
    }));
    const combined = [...practiceEntries, ...mockEntries, ...lessonEntries]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
    if (combined.length > 0) {
      dashboardData.recentActivity = combined;
    }

    // Weak areas
    const bySection: Record<string, { scores: number[]; tasks: Record<string, { scores: number[] }> }> = {};
    for (const s of sectionSubmissions) {
      if (!bySection[s.section]) bySection[s.section] = { scores: [], tasks: {} };
      bySection[s.section].scores.push(s.score || 0);
      if (!bySection[s.section].tasks[s.taskCode]) bySection[s.section].tasks[s.taskCode] = { scores: [] };
      bySection[s.section].tasks[s.taskCode].scores.push(s.score || 0);
    }
    const weakAreas = Object.entries(bySection)
      .map(([section, data]) => {
        const avg = Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length);
        const tasks = Object.entries(data.tasks).map(([taskCode, t]) => ({
          taskCode,
          averageScore: Math.round(t.scores.reduce((a, b) => a + b, 0) / t.scores.length),
          count: t.scores.length,
        }));
        return { section, averageScore: avg, tasks };
      })
      .sort((a, b) => a.averageScore - b.averageScore);
    if (weakAreas.length > 0) {
      dashboardData.weakAreas = weakAreas;
    }

    // Upcoming items from unread notifications
    if (notifications.length > 0) {
      dashboardData.upcomingItems = notifications.map(n => ({
        id: n.id,
        title: n.title,
        dueDate: n.createdAt.toISOString(),
        type: 'study' as const,
      }));
    }

    // Subscription
    dashboardData.subscription = {
      tier: (dbUser.subTier as 'free' | 'premium') || 'free',
      expiresAt: dbUser.subExpiresAt?.toISOString() || null,
    };

    // Exam date — check user profile or settings for target exam date
    // Default to null, can be set via profile settings
    if (dbUser.targetScore) {
      // Rough estimate: default 90 days from now as placeholder
      const defaultExamDate = new Date();
      defaultExamDate.setDate(defaultExamDate.getDate() + 90);
      dashboardData.examDate = {
        date: defaultExamDate.toISOString().slice(0, 10),
        daysRemaining: 90,
      };
    }

    res.json({ success: true, data: dashboardData });
  } catch (err: any) {
    logger.error('Error fetching dashboard', { error: err.message, userId: user.id });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to load dashboard' } });
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

// ---------------------------------------------------------------------------
// Legacy /practice/submit removed — use /practice/attempts/:attemptId/submit instead

// 7. Phase 1c: Submission status-only endpoint — no re-scoring.
// Scoring is handled exclusively by the background grade_submission job.
// Frontend polls this after submitting to check when grading completes.
studentRouter.get('/practice/:id/status', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const submission = await prisma.practiceSubmission.findFirst({
      where: { id, userId: (req as any).user.id },
    });
    if (!submission) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }
    res.json({ success: true, submission });
  } catch (err: any) {
    logger.error('Submission status fetch error', { error: err.message });
    res.status(500).json({ error: 'Failed to fetch submission status' });
  }
});

// 8. Get Mock Tests
studentRouter.get('/mock-tests', async (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    const mappedTests = MOCK_TESTS.map(test => {
      if (test.type === 'full' && !dbUser?.isPremium) {
        return { ...test, isLocked: true };
      }
      return test;
    });
    res.json(mappedTests);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load mock tests' });
  }
});

// 8b. Upgrade to Premium
studentRouter.post('/upgrade-premium', async (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { isPremium: true, subTier: 'premium' }
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to upgrade to premium' });
  }
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

// GET detailed mock test attempt with question results, responses, and signed playback URLs
studentRouter.get('/mock-tests/attempt/:id', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { id } = req.params;

  try {
    const attempt = await prisma.testAttempt.findFirst({
      where: { id, userId: user.id },
      include: {
        questionResults: {
          orderBy: { questionIndex: 'asc' },
        },
      },
    });

    if (!attempt) {
      res.status(404).json({ error: 'Test attempt not found' });
      return;
    }

    const storage = getAudioStore();
    const results = await Promise.all(
      attempt.questionResults.map(async (resItem) => {
        let audioPlaybackUrl: string | null = null;
        if (resItem.audioMetadataId) {
          const audio = await prisma.audioMetadata.findUnique({
            where: { id: resItem.audioMetadataId },
          });
          if (audio) {
            try {
              audioPlaybackUrl = await storage.getSignedReadUrl(audio.objectKey);
            } catch (err) {
              logger.error('Failed generating signed URL for audio playback', err);
            }
          }
        }

        const questions = attempt.questionsJson ? JSON.parse(attempt.questionsJson) : [];
        const questionMeta = questions[resItem.questionIndex] || {};

        return {
          questionIndex: resItem.questionIndex,
          questionId: resItem.questionId,
          taskType: resItem.taskType,
          taskCode: resItem.taskType,
          section: questionMeta.section || '',
          title: questionMeta.title || '',
          instruction: questionMeta.instruction || '',
          promptText: questionMeta.promptText || '',
          status: resItem.status,
          finalScore: resItem.finalScore,
          transcript: resItem.transcript,
          transcriptProvider: resItem.transcriptProvider,
          feedback: resItem.feedback,
          aiProvider: resItem.aiProvider,
          aiModel: resItem.aiModel,
          normalizedResponse: resItem.normalizedResponse,
          skillContributions: resItem.skillContributions,
          rawDimensions: resItem.rawDimensions,
          audioPlaybackUrl,
        };
      })
    );

    const questions = attempt.questionsJson ? JSON.parse(attempt.questionsJson) : [];

    res.json({
      id: attempt.id,
      testId: attempt.testId,
      title: attempt.title,
      type: attempt.type,
      status: attempt.status,
      overallScore: attempt.overallScore,
      speakingScore: attempt.speakingScore,
      writingScore: attempt.writingScore,
      readingScore: attempt.readingScore,
      listeningScore: attempt.listeningScore,
      date: attempt.date,
      submittedAt: attempt.submittedAt,
      questions: questions.map((q: any, i: number) => ({
        id: q.id || q.questionId,
        taskCode: q.taskCode,
        section: q.section,
        title: q.title,
      })),
      questionResults: results,
      resultSummary: {
        total: results.length,
        scored: results.filter(r => r.finalScore !== null).length,
        failed: results.filter(r => r.status === 'Failed').length,
        pending: results.filter(r => r.status === 'Pending' || r.status === 'Grading').length,
      },
    });
  } catch (err: any) {
    logger.error('Failed fetching detailed test attempt', err);
    res.status(500).json({ error: 'Failed to fetch test attempt details' });
  }
});

// 9. Submit/Record a Mock Test Attempt
studentRouter.post('/mock-tests/submit', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { testId, title, type, overallScore, speakingScore, writingScore, readingScore, listeningScore } = req.body;
  const parseScore = (v: any): number => Number.isFinite(Number(v)) ? Number(v) : 0;

  try {
    const attempt = await prisma.testAttempt.create({
      data: {
        userId: user.id,
        testId,
        title,
        type,
        overallScore: parseScore(overallScore),
        speakingScore: parseScore(speakingScore),
        writingScore: parseScore(writingScore),
        readingScore: parseScore(readingScore),
        listeningScore: parseScore(listeningScore),
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

// 11b. Explicit flashcard state (set mastered to exact boolean)
studentRouter.post('/flashcards/:cardId/state', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { cardId } = req.params;
  const { mastered } = req.body;

  if (typeof mastered !== 'boolean') {
    res.status(400).json({ error: 'mastered must be a boolean' });
    return;
  }

  try {
    const existing = await prisma.flashcardState.findFirst({
      where: { userId: user.id, flashcardId: cardId },
    });

    if (existing) {
      const updated = await prisma.flashcardState.update({
        where: { id: existing.id },
        data: { mastered },
      });
      res.json({ mastered: updated.mastered });
    } else {
      const created = await prisma.flashcardState.create({
        data: { userId: user.id, flashcardId: cardId, mastered },
      });
      res.json({ mastered: created.mastered });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update flashcard state' });
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
import { generateDiagnosticStudyPlan, generateQuestionTemplate } from './aiService';

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
  const { attemptId, testId, title, type, currentQuestionIndex, secondsRemaining, answers, isPaused, questionsJson, revision } = req.body;

  if (!attemptId && (!testId || !title || !type)) {
    res.status(400).json({ error: 'testId, title, and type are required when attemptId is not provided' });
    return;
  }

  try {
    const answersStr = JSON.stringify(answers || {});
    const statusVal = isPaused ? MOCK_ATTEMPT_STATUS.PAUSED : MOCK_ATTEMPT_STATUS.IN_PROGRESS;
    const questionsStr = questionsJson ? JSON.stringify(questionsJson) : undefined;
    const incomingRevision = revision || 0;

    let attempt;
    if (attemptId) {
      const existing = await prisma.testAttempt.findUnique({
        where: { id: attemptId, userId: user.id }
      });
      if (!existing) {
        res.status(404).json({ error: 'Attempt not found' });
        return;
      }
      
      if (incomingRevision > 0 && incomingRevision <= existing.revision) {
        // Idempotency: Reject stale update, return current state so client can sync
        res.status(409).json({ error: 'Stale revision', currentRevision: existing.revision, attempt: existing });
        return;
      }

      let newEndsAt = existing.endsAt;
      let newPausedAt = existing.pausedAt;
      let newTotalPauseMs = existing.totalPauseMs;

      if (isPaused && existing.status !== MOCK_ATTEMPT_STATUS.PAUSED) {
        newPausedAt = new Date();
      } else if (!isPaused && existing.status === MOCK_ATTEMPT_STATUS.PAUSED && existing.pausedAt) {
        const pauseDurationMs = new Date().getTime() - existing.pausedAt.getTime();
        newTotalPauseMs += pauseDurationMs;
        if (newEndsAt) {
          newEndsAt = new Date(newEndsAt.getTime() + pauseDurationMs);
        }
        newPausedAt = null;
      }
      const updateData: any = {
        currentQuestionIndex: currentQuestionIndex || 0,
        secondsRemaining: secondsRemaining || 0,
        answersJson: answersStr,
        status: statusVal,
        revision: incomingRevision > 0 ? incomingRevision : existing.revision + 1,
        endsAt: newEndsAt,
        pausedAt: newPausedAt,
        totalPauseMs: newTotalPauseMs,
      };
      if (questionsStr) updateData.questionsJson = questionsStr;
      attempt = await prisma.testAttempt.update({
        where: { id: attemptId, userId: user.id },
        data: updateData,
      });
    } else {
      attempt = await prisma.testAttempt.create({
        data: {
          userId: user.id,
          testId,
          title,
          type,
          overallScore: null,
          speakingScore: null,
          writingScore: null,
          readingScore: null,
          listeningScore: null,
          status: statusVal,
          currentQuestionIndex: currentQuestionIndex || 0,
          secondsRemaining: secondsRemaining || 0,
          answersJson: answersStr,
          questionsJson: questionsStr,
          date: new Date().toISOString().split('T')[0],
          endsAt: new Date(Date.now() + (secondsRemaining || 0) * 1000),
          pausedAt: isPaused ? new Date() : null,
          revision: 1,
        },
      });
    }

    res.json({ success: true, attempt });
  } catch (err: any) {
    logger.error('Error saving mock progress', { error: err.message });
    res.status(500).json({ error: 'Failed to save mock test progress' });
  }
});

// 17.5. Poll for grading status
studentRouter.get('/mock-tests/status/:id', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { id } = req.params;

  try {
    const attempt = await prisma.testAttempt.findUnique({
      where: { id, userId: user.id },
      select: { id: true, status: true, overallScore: true }
    });
    if (!attempt) {
      res.status(404).json({ error: 'Attempt not found' });
      return;
    }
    res.json({ attempt });
  } catch (err: any) {
    logger.error('Error fetching mock status', { error: err.message });
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

// 17b. Generate Dynamic Mock Test based on randomized templates or AI generation
studentRouter.post('/mock-tests/generate', async (req: Request, res: Response) => {
  const { testType, focusSection } = req.body;

  const validTypes = ['mini', 'section', 'full'];
  const validSections = ['Speaking', 'Writing', 'Reading', 'Listening'];

  if (!validTypes.includes(testType)) {
    res.status(400).json({ error: 'testType must be mini, section, or full' });
    return;
  }
  if (testType === 'section' && (typeof focusSection !== 'string' || !validSections.includes(focusSection))) {
    res.status(400).json({ error: 'focusSection is required and must be Speaking, Writing, Reading, or Listening' });
    return;
  }

  try {
    const chosenType = testType as 'mini' | 'section' | 'full';
    const chosenSection = focusSection || undefined;

    const generatedTest = await generateMockTest(chosenType, chosenSection, { demo: config.demoMode });

    res.json({ success: true, test: generatedTest });
  } catch (err: any) {
    logger.error('Failed generating mock test', { error: err.message });
    res.status(500).json({ error: 'Failed to generate test: ' + err.message });
  }
});

studentRouter.post('/mock-tests/upload-audio', audioUpload.single('file'), async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { attemptId, questionId } = req.body;

  if (!attemptId || !questionId) {
    res.status(400).json({ error: 'attemptId and questionId are required' });
    return;
  }
  if (!req.file) {
    res.status(400).json({ error: 'No audio file provided' });
    return;
  }

  try {
    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId, userId: user.id },
    });
    if (!attempt) {
      res.status(404).json({ error: 'Test attempt not found' });
      return;
    }

    const fileBuffer = req.file.buffer;
    const mimeType = req.file.mimetype;
    const ext = path.extname(req.file.originalname) || '.webm';
    const uniqueKey = `${crypto.randomUUID()}${ext}`;
    const objectKey = `mock/${user.id}/${attemptId}/${questionId}/${uniqueKey}`;

    const storage = getAudioStore();
    await storage.put(objectKey, fileBuffer, mimeType);

    // Idempotency: replace existing metadata for same attempt+question
    const existing = await prisma.audioMetadata.findFirst({
      where: { attemptId, questionId },
      select: { id: true, objectKey: true },
    });

    let meta;
    if (existing) {
      // Remove previous storage object
      try { await storage.delete(existing.objectKey); } catch { /* ignore cleanup failures */ }
      meta = await prisma.audioMetadata.update({
        where: { id: existing.id },
        data: { objectKey, mimeType, byteSize: fileBuffer.length, hash: crypto.createHash('sha256').update(fileBuffer).digest('hex') },
      });
    } else {
      meta = await prisma.audioMetadata.create({
        data: {
          objectKey, mimeType,
          byteSize: fileBuffer.length,
          hash: crypto.createHash('sha256').update(fileBuffer).digest('hex'),
          userId: user.id, attemptId, questionId,
        },
      });
    }

    const fileUrl = `/uploads/${objectKey}`; // For fallback compat or we can just let UI use signed url later
    res.json({ url: fileUrl, audioMetadataId: meta.id });
  } catch (err: any) {
    logger.error('Failed to upload mock audio', err);
    res.status(500).json({ error: 'Internal server error during audio upload' });
  }
});

studentRouter.delete('/mock-tests/active/:id', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { id } = req.params;

  try {
    const attempt = await prisma.testAttempt.findUnique({
      where: { id, userId: user.id },
    });
    if (!attempt) {
      res.status(404).json({ error: 'Test attempt not found' });
      return;
    }

    // 1. Sweep audio payloads from storage before dropping DB rows (GC)
    const associatedAudio = await prisma.audioMetadata.findMany({
      where: { attemptId: id, userId: user.id },
    });
    const storage = getAudioStore();
    await Promise.all(
      associatedAudio.map(file =>
        storage.delete(file.objectKey).catch(err => {
          logger.error('Orphan audio cleanup failed', err);
        })
      )
    );

    // 2. Remove the DB record safely
    await prisma.testAttempt.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (err: any) {
    logger.error('Failed to delete active mock attempt', err);
    res.status(500).json({ error: 'Internal server error deleting attempt' });
  }
});

// 18. Retrieve Active/Interrupted Mock Test to Resume
studentRouter.get('/mock-tests/active', async (req: Request, res: Response) => {
  const user = (req as any).user;

  try {
    const activeAttempt = await prisma.testAttempt.findFirst({
      where: {
        userId: user.id,
        status: { in: [MOCK_ATTEMPT_STATUS.IN_PROGRESS, MOCK_ATTEMPT_STATUS.PAUSED] },
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
        questions: activeAttempt.questionsJson ? JSON.parse(activeAttempt.questionsJson) : [],
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch active mock session' });
  }
});

// 19. Submit complete Mock Test with subscore calculations & update attempts status
studentRouter.post('/mock-tests/complete', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { attemptId, testId, title, type, answers, questionsJson } = req.body;

  try {
    const finalAttemptId = attemptId || crypto.randomUUID();
    const questionsStr = questionsJson ? JSON.stringify(questionsJson) : undefined;
    let questionsList: any[] = [];
    if (questionsJson) {
      questionsList = Array.isArray(questionsJson) ? questionsJson : JSON.parse(questionsJson);
    }

    // Normalize each answer by task type for stable grading
    const normalizedAnswers: Record<string, unknown> = {};
    if (answers && typeof answers === 'object') {
      for (const [key, val] of Object.entries(answers)) {
        const idx = parseInt(key, 10);
        const q = questionsList[idx];
        const taskCode = q?.code || q?.taskCode || 'RA';
        normalizedAnswers[key] = normalizeMockResponse(taskCode, val);
      }
    }
    const answersStr = JSON.stringify(Object.keys(normalizedAnswers).length > 0 ? normalizedAnswers : (answers || {}));

    const attempt = await prisma.$transaction(async (tx) => {
      let existingAttempt = await tx.testAttempt.findUnique({
        where: { id: finalAttemptId },
      });

      if (!existingAttempt) {
        existingAttempt = await tx.testAttempt.create({
          data: {
            id: finalAttemptId,
            userId: user.id,
            testId: testId || crypto.randomUUID(),
            title: title || 'Mock Exam Attempt',
            type: type || 'mini',
            overallScore: null,
            speakingScore: null,
            writingScore: null,
            readingScore: null,
            listeningScore: null,
            status: MOCK_ATTEMPT_STATUS.IN_PROGRESS,
            date: new Date().toISOString().split('T')[0],
          },
        });
      }

      if (existingAttempt.status === MOCK_ATTEMPT_STATUS.COMPLETED || existingAttempt.status === MOCK_ATTEMPT_STATUS.PENDING_GRADING || existingAttempt.status === MOCK_ATTEMPT_STATUS.GRADING) {
        return existingAttempt;
      }

for (let i = 0; i < questionsList.length; i++) {
        const q = questionsList[i];
        const qId = q.questionId || q.id || `q-${i}`;
        const taskType = q.code || q.taskCode || 'RA';
        const normalizedAns = normalizedAnswers[String(i)];
        const rawAns = normalizedAns !== undefined ? normalizedAns : (answers && answers[i] !== undefined ? answers[i] : null);

        await tx.mockQuestionResult.upsert({
          where: {
            attemptId_questionId: {
              attemptId: finalAttemptId,
              questionId: qId,
            },
          },
          create: {
            attemptId: finalAttemptId,
            questionId: qId,
            questionVersion: q.version || 1,
            questionIndex: i,
            taskType,
            normalizedResponse: normalizedAns !== undefined ? normalizedAns : (rawAns !== null ? (typeof rawAns === 'object' ? rawAns : JSON.stringify(rawAns)) : {}),
            scoringPolicyVersion: 'pte-estimated-v1',
            status: 'Pending',
          },
          update: {
            normalizedResponse: normalizedAns !== undefined ? normalizedAns : (rawAns !== null ? (typeof rawAns === 'object' ? rawAns : JSON.stringify(rawAns)) : {}),
            status: 'Pending',
          },
        });
      }

      await tx.mockQuestionSession.updateMany({
        where: { attemptId: finalAttemptId },
        data: { status: 'Submitted', submittedAt: new Date() },
      });

      const updatedAttempt = await tx.testAttempt.update({
        where: { id: finalAttemptId },
        data: {
          status: MOCK_ATTEMPT_STATUS.PENDING_GRADING,
          submittedAt: new Date(),
          answersJson: answersStr,
          questionsJson: questionsStr,
        },
      });

      await tx.backgroundJob.create({
        data: {
          name: 'grade_mock_test',
          data: JSON.stringify({ attemptId: finalAttemptId }),
          idempotencyKey: `grade_mock_test:${finalAttemptId}`,
          status: 'queued',
        },
      });

      return updatedAttempt;
    });

    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Mock Exam Submitted',
        text: `Your "${attempt.title}" mock exam has been submitted for AI grading.`,
      },
    });

    res.status(202).json({ success: true, attempt });
  } catch (err: any) {
    if (err.code === 'P2002' || err.message.includes('Unique constraint')) {
      try {
        const attempt = await prisma.testAttempt.findUnique({ where: { id: attemptId } });
        res.status(202).json({ success: true, attempt, message: 'Idempotency key matched. Attempt is already queued or completed.' });
        return;
      } catch (dbErr) {
        logger.error('Failed fetching idempotent attempt', dbErr);
      }
    }
    logger.error('Failed completing test attempt', { error: err.message });
    res.status(500).json({ error: 'Failed to record completed test attempt' });
  }
});

// Play listening audio prompt under atomic playback consumption rules
studentRouter.post('/mock-tests/play-prompt', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { attemptId, questionId } = req.body;

  if (!attemptId || !questionId) {
    res.status(400).json({ error: 'attemptId and questionId are required' });
    return;
  }

  try {
    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId, userId: user.id },
    });
    if (!attempt) {
      res.status(404).json({ error: 'Test attempt not found' });
      return;
    }

    const maxPlays = 1;
    const now = new Date();

    let consumption = await prisma.playbackConsumption.findUnique({
      where: { attemptId_questionId: { attemptId, questionId } },
    });

    if (!consumption) {
      try {
        consumption = await prisma.playbackConsumption.create({
          data: {
            attemptId,
            questionId,
            userId: user.id,
            playedCount: 0,
          },
        });
      } catch (err: any) {
        consumption = await prisma.playbackConsumption.findUnique({
          where: { attemptId_questionId: { attemptId, questionId } },
        });
      }
    }

    if (!consumption) {
      res.status(500).json({ error: 'Failed to initialize playback consumption' });
      return;
    }

    // Atomic conditional increment check
    const consumed = await prisma.playbackConsumption.updateMany({
      where: {
        id: consumption.id,
        playedCount: { lt: maxPlays },
      },
      data: {
        playedCount: { increment: 1 },
        firstPlayedAt: consumption.firstPlayedAt || now,
        lastPlayedAt: now,
        version: { increment: 1 },
      },
    });

    if (consumed.count !== 1) {
      res.status(403).json({ error: 'Playback limit exceeded. This listening prompt can only be played once.' });
      return;
    }

    let questionsList: any[] = [];
    try {
      questionsList = JSON.parse(attempt.questionsJson || '[]');
    } catch {}

    const q = questionsList.find((item) => item.questionId === questionId || item.id === questionId);
    if (!q || !q.audioUrl) {
      res.status(404).json({ error: 'Audio prompt not found for this question' });
      return;
    }

    res.json({ success: true, audioUrl: q.audioUrl });
  } catch (err: any) {
    logger.error('Failed to register playback consumption', err);
    res.status(500).json({ error: 'Internal server error during playback authorization' });
  }
});

// Initialize server authoritative question session timers
studentRouter.post('/mock-tests/start-question', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { attemptId, questionId, questionIndex, prepTime, responseTime } = req.body;

  if (!attemptId || !questionId) {
    res.status(400).json({ error: 'attemptId and questionId are required' });
    return;
  }

  try {
    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId, userId: user.id },
    });
    if (!attempt) {
      res.status(404).json({ error: 'Test attempt not found' });
      return;
    }

    const now = new Date();
    const durationSec = Number(prepTime || 0) + Number(responseTime || 0);
    const graceSeconds = Number(process.env.TIMER_GRACE_SECONDS || '5');
    const deadline = new Date(now.getTime() + (durationSec + graceSeconds) * 1000);

    let session = await prisma.mockQuestionSession.findUnique({
      where: { attemptId_questionId: { attemptId, questionId } },
    });

    if (!session) {
      session = await prisma.mockQuestionSession.create({
        data: {
          attemptId,
          questionId,
          questionIndex: Number(questionIndex || 0),
          startedAt: now,
          deadlineAt: deadline,
          status: MOCK_ATTEMPT_STATUS.IN_PROGRESS,
        },
      });
    }

    res.json({ success: true, serverNow: now, deadlineAt: session.deadlineAt });
  } catch (err: any) {
    logger.error('Failed starting question session', err);
    res.status(500).json({ error: 'Internal server error starting question session' });
  }
});

// Retry Grading failed attempts
studentRouter.post('/mock-tests/retry', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { attemptId } = req.body;

  if (!attemptId) {
    res.status(400).json({ error: 'attemptId is required' });
    return;
  }

  try {
    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId, userId: user.id },
    });
    if (!attempt) {
      res.status(404).json({ error: 'Test attempt not found' });
      return;
    }

    if (attempt.status !== MOCK_ATTEMPT_STATUS.GRADING_FAILED) {
      res.status(400).json({ error: 'Only failed grading attempts can be retried' });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.testAttempt.update({
        where: { id: attemptId },
        data: { status: MOCK_ATTEMPT_STATUS.PENDING_GRADING },
      });

      const key = `grade_mock_test:${attemptId}`;
      await tx.backgroundJob.upsert({
        where: { idempotencyKey: key },
        create: {
          name: 'grade_mock_test',
          data: JSON.stringify({ attemptId }),
          idempotencyKey: key,
          status: 'queued',
          attempts: 0,
        },
        update: {
          status: 'queued',
          attempts: 0,
          error: null,
          completedAt: null,
          startedAt: null,
          claimToken: null,
          workerId: null,
        },
      });
    });

    res.json({ success: true, message: 'Retry job queued successfully.' });
  } catch (err: any) {
    logger.error('Failed to retry mock grading', err);
    res.status(500).json({ error: 'Failed to enqueue retry grading' });
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

// 24. Published question bank — student read only
studentRouter.get('/questions', async (req: Request, res: Response) => {
  try {
    const { taskCode, section, difficulty, search, page: pageStr, pageSize: pageSizeStr, random } = req.query;

    const where: any = { status: 'published' };
    if (taskCode) where.taskCode = taskCode as string;
    if (section) where.section = section as string;
    if (difficulty) where.difficulty = difficulty as string;
    if (search) where.OR = [
      { title: { contains: search as string } },
      { instruction: { contains: search as string } },
      { promptText: { contains: search as string } },
    ];

    const page = Math.max(1, parseInt(pageStr as string, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(pageSizeStr as string, 10) || 20));
    const skip = (page - 1) * pageSize;

    const orderBy: any = random === 'true' ? [] : { updatedAt: 'desc' };

    let items: any[];
    let total: number;

    if (random === 'true') {
      // For random mode, load all published IDs and pick randomly
      const allIds = await prisma.questionBankItem.findMany({
        where,
        select: { id: true },
        orderBy: { id: 'asc' },
      });
      const shuffled = allIds.sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(skip, skip + pageSize).map((r) => r.id);
      total = allIds.length;
      const rawItems = await prisma.questionBankItem.findMany({
        where: { id: { in: selected } },
        select: {
          id: true, taskCode: true, section: true, title: true, instruction: true,
          promptText: true, promptHtml: true, imageUrl: true, passageText: true,
          optionsJson: true, difficulty: true, tagsJson: true, source: true,
        },
      });
      // Preserve shuffled order
      const itemMap = new Map(rawItems.map((i) => [i.id, i]));
      items = selected.map((id) => itemMap.get(id)).filter(Boolean);
    } else {
      [items, total] = await Promise.all([
        prisma.questionBankItem.findMany({
          where,
          select: {
            id: true, taskCode: true, section: true, title: true, instruction: true,
            promptText: true, promptHtml: true, imageUrl: true, passageText: true,
            optionsJson: true, difficulty: true, tagsJson: true, source: true,
          },
          orderBy,
          skip,
          take: pageSize,
        }),
        prisma.questionBankItem.count({ where }),
      ]);
    }

    // Strip sensitive fields and build student-safe payload
    const safeItems: QuestionListItem[] = items.map((item: any) => {
      const safe = buildStudentSafeQuestion(item.taskCode as PTETaskCode, item);
      return {
        id: safe.id,
        taskCode: safe.taskCode,
        section: safe.section,
        title: safe.title,
        instruction: safe.instruction,
        difficulty: safe.difficulty,
        hasPromptAudio: safe.hasPromptAudio,
        hasImage: safe.hasImage,
        promptText: safe.promptText,
        passageText: safe.passageText,
        imageUrl: safe.imageUrl,
        options: safe.options,
      };
    });

    const response: QuestionListResponse = {
      items: safeItems,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      filters: {
        taskCode: taskCode as string | undefined,
        section: section as string | undefined,
        difficulty: difficulty as string | undefined,
        search: search as string | undefined,
      },
    };

    res.json({ success: true, data: response });
  } catch (err: any) {
    logger.error('Failed to retrieve questions', { error: err.message });
    internal(ErrorCodes.INTERNAL_ERROR, 'Failed to retrieve questions').send(res);
  }
});

// GET /questions/counts — published question counts per task
studentRouter.get('/questions/counts', async (req: Request, res: Response) => {
  try {
    const counts = await prisma.questionBankItem.groupBy({
      by: ['taskCode'],
      where: { status: 'published' },
      _count: { id: true },
    });
    const result = counts.map((c) => ({ taskCode: c.taskCode, publishedCount: c._count.id }));
    res.json({ success: true, data: result });
  } catch (err: any) {
    logger.error('Failed to get question counts', { error: err.message });
    internal(ErrorCodes.INTERNAL_ERROR, 'Failed to get question counts').send(res);
  }
});

// GET /practice/overview — student's per-task practice stats
studentRouter.get('/practice/overview', async (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const stats = await prisma.practiceSubmission.groupBy({
      by: ['taskCode'],
      where: { userId: user.id, status: 'graded' },
      _count: { id: true },
      _avg: { score: true },
      _max: { submittedAt: true },
    });
    const result = stats.map((s) => ({
      taskCode: s.taskCode,
      questionCount: s._count.id,
      averageScore: s._avg.score ?? null,
      lastAttemptedAt: s._max.submittedAt?.toISOString() ?? null,
      totalAttempts: s._count.id,
    }));
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: 'Failed to get practice overview' } });
  }
});

// 25. Learning overview
studentRouter.get('/learning/overview', async (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const [lessonCount, flashcardCount, flashcardMastered, submissions] = await Promise.all([
      prisma.lessonCompletion.count({ where: { userId: user.id } }),
      prisma.flashcardState.count({ where: { userId: user.id } }),
      prisma.flashcardState.count({ where: { userId: user.id, mastered: true } }),
      prisma.practiceSubmission.count({ where: { userId: user.id, status: 'graded' } }),
    ]);
    res.json({
      completedLessons: lessonCount,
      totalFlashcards: flashcardCount,
      masteredFlashcards: flashcardMastered,
      scoredSubmissions: submissions,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load learning overview' });
  }
});

// 26. Study plan — read persisted, fall back to generation
studentRouter.get('/study-plan', async (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { studyPlan: true } });
    if (dbUser?.studyPlan) {
      try {
        const parsed = JSON.parse(dbUser.studyPlan);
        res.json(parsed);
        return;
      } catch { /* fall through to generate */ }
    }
    const plan = await generateStudyPlan(user.id);
    await prisma.user.update({
      where: { id: user.id },
      data: { studyPlan: JSON.stringify(plan) },
    });
    res.json(plan);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate study plan' });
  }
});

// 27. Regenerate study plan — always fresh
studentRouter.post('/study-plan/regenerate', async (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const plan = await generateStudyPlan(user.id);
    await prisma.user.update({
      where: { id: user.id },
      data: { studyPlan: JSON.stringify(plan) },
    });
    res.json(plan);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to regenerate study plan' });
  }
});

// 28. Reports — overview
studentRouter.get('/reports/overview', async (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const [totalSubmissions, pendingSubmissions, scoredSubmissions, completedTests, completedLessons, masteredFlashcards, dbUser] = await Promise.all([
      prisma.practiceSubmission.count({ where: { userId: user.id } }),
      prisma.practiceSubmission.count({ where: { userId: user.id, status: 'pending' } }),
      prisma.practiceSubmission.count({ where: { userId: user.id, status: 'graded' } }),
      prisma.testAttempt.count({ where: { userId: user.id, status: MOCK_ATTEMPT_STATUS.COMPLETED } }),
      prisma.lessonCompletion.count({ where: { userId: user.id } }),
      prisma.flashcardState.count({ where: { userId: user.id, mastered: true } }),
      prisma.user.findUnique({ where: { id: user.id }, select: { targetScore: true, currentAvg: true } }),
    ]);

    res.json({
      totalSubmissions,
      pendingSubmissions,
      scoredSubmissions,
      completedTests,
      completedLessons,
      masteredFlashcards,
      targetScore: dbUser?.targetScore ?? null,
      currentAverage: dbUser?.currentAvg || 0,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load report overview' });
  }
});

// 28b. Reports — progress trends
studentRouter.get('/reports/progress', async (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const [submissions, tests, lessons, totalLessons] = await Promise.all([
      prisma.practiceSubmission.findMany({
        where: { userId: user.id, status: 'graded', score: { not: null } },
        select: { score: true, submittedAt: true },
        orderBy: { submittedAt: 'desc' }, take: 100,
      }),
      prisma.testAttempt.findMany({
        where: { userId: user.id, status: MOCK_ATTEMPT_STATUS.COMPLETED, overallScore: { not: null } },
        select: { overallScore: true, date: true },
        orderBy: { date: 'desc' }, take: 20,
      }),
      prisma.lessonCompletion.findMany({
        where: { userId: user.id },
        select: { lessonId: true, completedAt: true },
        orderBy: { completedAt: 'desc' },
        take: 50,
      }),
      prisma.lessonCompletion.count({ where: { userId: user.id } }),
    ]);

    const groupByDate = (records: { date: string; score: number }[]) => {
      const map: Record<string, number[]> = {};
      records.forEach(r => {
        const d = (r.date || '').slice(0, 10);
        if (!map[d]) map[d] = [];
        map[d].push(r.score);
      });
      return Object.entries(map).map(([date, scores]) => ({
        date,
        averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        count: scores.length,
      }));
    };

    const practiceTrend = groupByDate(submissions.map(s => ({ date: s.submittedAt.toISOString(), score: s.score! })));
    const mockTrend = groupByDate(tests.map(t => ({ date: t.date, score: t.overallScore })));
    const lessonCompletionDates = lessons.map(l => l.completedAt.toISOString().slice(0, 10));
    const lessonTrend = Object.entries(
      lessonCompletionDates.reduce((acc: Record<string, number>, d) => { acc[d] = (acc[d] || 0) + 1; return acc; }, {})
    ).map(([date, count]) => ({ date, completedCount: count }));

    res.json({
      practiceTrend,
      mockTrend,
      lessonTrend,
      currentLessonTotal: totalLessons,
      pendingCount: await prisma.practiceSubmission.count({ where: { userId: user.id, status: 'pending' } }),
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load progress trends' });
  }
});

// 28c. Reports — tasks breakdown
studentRouter.get('/reports/tasks', async (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const submissions = await prisma.practiceSubmission.findMany({
      where: { userId: user.id },
      select: { taskCode: true, section: true, score: true, status: true },
      orderBy: { submittedAt: 'desc' }, take: 200,
    });

    const byTask: Record<string, { section: string; scores: number[]; pending: number; other: number }> = {};
    submissions.forEach(s => {
      if (!byTask[s.taskCode]) byTask[s.taskCode] = { section: s.section, scores: [], pending: 0, other: 0 };
      if (s.status === 'graded' && s.score != null) byTask[s.taskCode].scores.push(s.score);
      else if (s.status === 'pending') byTask[s.taskCode].pending++;
      else byTask[s.taskCode].other++;
    });

    const result = Object.entries(byTask).map(([taskCode, data]) => ({
      taskCode,
      section: data.section,
      total: data.scores.length + data.pending + data.other,
      pending: data.pending,
      scored: data.scores.length,
      other: data.other,
      averageScore: data.scores.length > 0 ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length) : null,
      recentScores: data.scores.slice(-5),
    }));

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load task breakdown' });
  }
});

// 29. Reports — section averages (using existing code above, already present)

// 29. Reports — section averages
studentRouter.get('/reports/sections', async (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const submissions = await prisma.practiceSubmission.findMany({
      where: { userId: user.id, status: 'graded', score: { not: null } },
      select: { section: true, score: true },
      orderBy: { submittedAt: 'desc' },
      take: 100,
    });

    const sections: Record<string, { total: number; count: number; scores: number[] }> = {};
    for (const s of submissions) {
      if (!sections[s.section]) sections[s.section] = { total: 0, count: 0, scores: [] };
      sections[s.section].total += s.score!;
      sections[s.section].count++;
      sections[s.section].scores.push(s.score!);
    }

    const result = Object.entries(sections).map(([section, data]) => ({
      section,
      average: Math.round(data.total / data.count),
      count: data.count,
      recentScores: data.scores.slice(-5),
    }));

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load section analytics' });
  }
});

// 30. Reports — recent activity
studentRouter.get('/reports/recent-activity', async (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const [submissions, tests, lessons] = await Promise.all([
      prisma.practiceSubmission.findMany({
        where: { userId: user.id },
        orderBy: { submittedAt: 'desc' }, take: 10,
        select: { taskCode: true, title: true, score: true, status: true, submittedAt: true, section: true },
      }),
      prisma.testAttempt.findMany({
        where: { userId: user.id, status: MOCK_ATTEMPT_STATUS.COMPLETED },
        orderBy: { date: 'desc' }, take: 5,
        select: { title: true, type: true, overallScore: true, date: true },
      }),
      prisma.lessonCompletion.findMany({
        where: { userId: user.id },
        orderBy: { completedAt: 'desc' }, take: 5,
        select: { lessonId: true, completedAt: true },
      }),
    ]);

    const practiceEntries = submissions.map(s => ({
      type: 'practice',
      taskCode: s.taskCode,
      title: s.title,
      section: s.section,
      score: s.score,
      status: s.status,
      date: s.submittedAt,
    }));

    const mockEntries = tests.map(t => ({
      type: 'mock',
      title: t.title,
      score: t.overallScore,
      status: 'completed',
      date: t.date,
    }));

    const lessonEntries = lessons.map(l => ({
      type: 'lesson',
      title: l.lessonId,
      status: 'completed',
      date: l.completedAt,
    }));

    const combined = [...practiceEntries, ...mockEntries, ...lessonEntries]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    res.json(combined);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load recent activity' });
  }
});

// 31. Reports — readiness estimate
studentRouter.get('/reports/readiness', async (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const [scored, tests] = await Promise.all([
      prisma.practiceSubmission.findMany({
        where: { userId: user.id, status: 'graded', score: { not: null } },
        select: { score: true, section: true },
      }),
      prisma.testAttempt.findMany({
        where: { userId: user.id, status: MOCK_ATTEMPT_STATUS.COMPLETED, overallScore: { not: null } },
        select: { overallScore: true },
      }),
    ]);

    const allScores = [...scored.map(s => s.score || 0), ...tests.map(t => t.overallScore)];
    if (allScores.length === 0) {
      res.json({ ready: false, message: 'Insufficient data for readiness estimate.', submissionsCount: 0, mocksCount: 0, sectionsWithData: [], generatedAt: new Date().toISOString() });
      return;
    }

    const avgScore = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);
    const sectionsWithData = [...new Set(scored.map(s => s.section))];

    res.json({
      ready: true,
      message: 'Practice readiness estimate, not an official PTE score.',
      estimatedScore: avgScore,
      submissionsCount: scored.length,
      mocksCount: tests.length,
      sectionsWithData,
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to compute readiness estimate' });
  }
});


