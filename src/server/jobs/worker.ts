import { prisma } from '../db';
import { logger } from '../logger';
import { evaluateSubmission } from '../aiService';
import { getAudioStore } from '../storage';
import { getTranscriber } from '../stt';
import { transitionPracticeAttempt, assertPracticeAttemptTransition } from '../../practice/contracts/transitions';
import { queueJob } from './queue';
import {
  normalizeSkillScore,
  calculateOverallScore,
  TASK_SCORING_REGISTRY,
  MOCK_SCORING_POLICY_VERSION,
  SkillScores,
} from '../../utils/mockScoringPolicy';
import crypto from 'crypto';
import { handleGenerateQuestionBatch } from './handlers/generateQuestionBatch';
import { handleGenerateQuestionAsset } from './handlers/generateQuestionAsset';

function isSqliteBusyError(err: any): boolean {
  const msg = String(err.message || err.stack || err).toLowerCase();
  return msg.includes('sqlite_busy') || msg.includes('database is locked') || err.code === 'P2034';
}

export async function startJobProcessor() {
  logger.info('Starting background job processor...');

  const workerId = `worker-${process.pid}-${Math.random().toString(36).substring(2, 9)}`;

  // Polling Loop
  setInterval(async () => {
    try {
      const job = await claimNextJob(workerId);
      if (!job) return;

      logger.info(`Worker ${workerId} successfully claimed job ${job.name} (ID: ${job.id})`);
      await processJob(job, workerId);
    } catch (err: any) {
      if (!isSqliteBusyError(err)) {
        logger.error('Error in background job processor loop:', err);
      }
    }
  }, Number(process.env.JOB_POLL_INTERVAL_MS || '3000'));

  // Stale Job Recovery Loop
  setInterval(async () => {
    try {
      await recoverStaleJobs();
    } catch (err) {
      logger.error('Error recovering stale background jobs:', err);
    }
  }, Number(process.env.JOB_RECOVERY_INTERVAL_MS || '60000'));
}

async function claimNextJob(workerId: string) {
  const maxBusyRetries = Number(process.env.JOB_BUSY_RETRY_MAX || '5');
  const busyBaseMs = Number(process.env.JOB_BUSY_RETRY_BASE_MS || '100');
  const busyMaxMs = Number(process.env.JOB_BUSY_RETRY_MAX_MS || '1000');
  const leaseSeconds = Number(process.env.JOB_LEASE_SECONDS || '180');

  let attempts = 0;
  while (attempts < maxBusyRetries) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Find candidate jobs
        const candidates = await tx.backgroundJob.findMany({
          where: {
            status: 'queued',
            scheduledAt: { lte: new Date() },
          },
          orderBy: [
            { scheduledAt: 'asc' },
            { id: 'asc' },
          ],
          take: 10,
        });

        // Filter eligible candidates where attempts < maxAttempts in JS
        const candidate = candidates.find((j) => j.attempts < j.maxAttempts);
        if (!candidate) return null;

        const claimToken = crypto.randomUUID();

        // Atomically claim the candidate
        const claim = await tx.backgroundJob.updateMany({
          where: {
            id: candidate.id,
            status: 'queued',
          },
          data: {
            status: 'running',
            workerId,
            claimToken,
            startedAt: new Date(),
            heartbeatAt: new Date(),
            leaseExpiresAt: new Date(Date.now() + leaseSeconds * 1000),
            attempts: { increment: 1 },
          },
        });

        if (claim.count !== 1) return null; // Lost the race to another thread/worker

        return await tx.backgroundJob.findUnique({
          where: { id: candidate.id },
        });
      });
    } catch (err: any) {
      if (isSqliteBusyError(err) && attempts < maxBusyRetries - 1) {
        attempts++;
        const delay = Math.min(busyMaxMs, busyBaseMs * Math.pow(2, attempts) + Math.random() * 50);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
  return null;
}

async function processJob(job: any, workerId: string) {
  const claimToken = job.claimToken;
  const leaseSeconds = Number(process.env.JOB_LEASE_SECONDS || '180');
  const heartbeatSeconds = Number(process.env.JOB_HEARTBEAT_SECONDS || '30');

  let isCancelled = false;
  let resultData: any = {};

  // Heartbeat Routine
  const heartbeatTimer = setInterval(async () => {
    try {
      const updated = await prisma.backgroundJob.updateMany({
        where: {
          id: job.id,
          status: 'running',
          claimToken,
        },
        data: {
          heartbeatAt: new Date(),
          leaseExpiresAt: new Date(Date.now() + leaseSeconds * 1000),
        },
      });

      if (updated.count !== 1) {
        logger.warn(`Worker ${workerId} lost ownership of job ${job.id}. Aborting execution.`);
        isCancelled = true;
        clearInterval(heartbeatTimer);
      }
    } catch (err) {
      logger.error(`Heartbeat update failed for job ${job.id}:`, err);
    }
  }, heartbeatSeconds * 1000);

  try {
    const payload = JSON.parse(job.data);
    const ctx = { job, isCancelled: () => isCancelled };

    const jobHandlers: Record<string, (payload: any, ctx: any) => Promise<any>> = {
      grade_submission: async (payload, ctx) => {
        const { submissionId, attemptId } = payload;

        const sub = await prisma.practiceSubmission.findUnique({
          where: { id: submissionId },
        });
        if (!sub) return { skipped: true, reason: 'Submission not found' };
        if (sub.status === 'graded') {
          logger.info(`Submission ${submissionId} is already graded. Skipping.`);
          return { skipped: true, reason: 'Already graded' };
        }

        // Load immutable grading context from attempt snapshot
        let gradingSnapshot: Record<string, any> = {};
        let attemptStatus: string | undefined;
        if (attemptId) {
          const attempt = await prisma.practiceAttempt.findUnique({
            where: { id: attemptId },
            select: { status: true, gradingSnapshotJson: true },
          });
          if (!attempt) return { skipped: true, reason: 'Attempt not found' };

          attemptStatus = attempt.status;
          gradingSnapshot = attempt.gradingSnapshotJson
            ? JSON.parse(attempt.gradingSnapshotJson)
            : {};

          if (attempt.status !== 'Pending_Deterministic') {
            await transitionPracticeAttempt(prisma as any, attemptId, 'Grading' as any);
          }
        }

        // Use immutable grading snapshot, NOT live QuestionBankItem
        const promptText = gradingSnapshot.promptText || '';
        const answerKey = gradingSnapshot.answerKeyJson || '';
        const answerForEval = sub.transcript || sub.answerText || '';

        const result = await evaluateSubmission(
          sub.taskCode,
          sub.section,
          sub.title,
          answerForEval,
          promptText,
          answerKey,
          sub.answerJson || undefined,
        );

        if (ctx.isCancelled()) return {};

        if (result.status === 'scored') {
          // Store full scorer metadata in feedback as JSON so result endpoint can expose it
          const feedbackPayload = JSON.stringify({
            feedback: result.feedback,
            scorerVersion: result.scorerVersion || 'pte-v1',
            maxScore: result.maxScore ?? null,
            earnedScore: result.earnedScore ?? null,
            normalizedScore: result.normalizedScore ?? null,
            breakdown: result.breakdown ?? null,
          });
          await prisma.practiceSubmission.update({
            where: { id: submissionId },
            data: {
              status: 'graded',
              score: result.score,
              fluencyScore: result.fluencyScore ?? null,
              pronunciationScore: result.pronunciationScore ?? null,
              feedback: feedbackPayload,
              grammarIssues: result.grammarIssues ?? 0,
            },
          });

          if (attemptId) {
            await transitionPracticeAttempt(prisma as any, attemptId, 'Completed' as any);
          }

          const allScored = await prisma.practiceSubmission.findMany({
            where: { userId: sub.userId, score: { not: null } },
            select: { score: true },
          });
          const scores = allScored.map((s) => s.score).filter((s): s is number => s !== null);
          if (scores.length > 0) {
            const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
            await prisma.user.update({ where: { id: sub.userId }, data: { currentAvg: avg } });
          }

          return { success: true, score: result.score };
        } else {
          logger.warn(`Submission ${submissionId} could not be scored: ${result.reason}`);
          await prisma.practiceSubmission.update({
            where: { id: submissionId },
            data: { status: 'scoring_failed', feedback: result.reason },
          });
          if (attemptId) {
            await transitionPracticeAttempt(prisma as any, attemptId, 'Grading_Failed' as any).catch(() => {});
          }
          throw new Error(`Scoring unavailable: ${result.reason}`);
        }
      },
      transcribe_audio: async (payload, ctx) => {
        const { submissionId, attemptId } = payload;
        const sub = await prisma.practiceSubmission.findUnique({
          where: { id: submissionId },
          include: { audioMetadata: true },
        });

        if (!sub) return { skipped: true, reason: 'Submission not found' };

        // Atomic transition to Transcribing (concurrency-safe)
        if (attemptId) {
          await transitionPracticeAttempt(prisma as any, attemptId, 'Transcribing' as any);
        }

        if (!sub.audioMetadata) {
          if (attemptId) {
            await transitionPracticeAttempt(prisma as any, attemptId, 'Transcription_Failed' as any).catch(() => {});
          }
          return { skipped: true, reason: 'No audio metadata' };
        }
        if (sub.transcript) return { skipped: true, reason: 'Already transcribed' };
        if (ctx.isCancelled()) return {};

        try {
          const storage = getAudioStore();
          const transcriber = getTranscriber(sub.taskCode);

          const audioBuffer = await storage.get(sub.audioMetadata.objectKey);
          const sttResult = await transcriber.transcribe(
            audioBuffer,
            sub.audioMetadata.objectKey,
            sub.audioMetadata.mimeType,
          );

          if (ctx.isCancelled()) return {};

          await prisma.practiceSubmission.update({
            where: { id: submissionId },
            data: {
              transcript: sttResult.transcript,
              transcriptProvider: sttResult.provider,
              transcriptConfidence: sttResult.confidence ?? null,
            },
          });

          if (sttResult.durationMs && sub.audioMetadata) {
            await prisma.audioMetadata.update({
              where: { id: sub.audioMetadata.id },
              data: { durationSec: sttResult.durationMs / 1000 },
            }).catch(() => {});
          }

          // Use atomic queueJob for grade job creation (P0.13)
          if (attemptId) {
            await transitionPracticeAttempt(prisma as any, attemptId, 'Pending_Grading' as any);
            const gradeKey = `practice-grade:${attemptId}`;
            await queueJob('grade_submission', { submissionId, attemptId }, { idempotencyKey: gradeKey });
          }

          return {
            success: true,
            transcript: sttResult.transcript,
            provider: sttResult.provider,
            durationMs: sttResult.durationMs,
          };
        } catch (err: any) {
          logger.error(`Transcription failed for submission ${submissionId}: ${err.message}`);
          if (attemptId) {
            await transitionPracticeAttempt(prisma as any, attemptId, 'Transcription_Failed' as any).catch(() => {});
          }
          throw err;
        }
      },
      grade_mock_test: async (payload, ctx) => {
        const { attemptId } = payload;
        const attempt = await prisma.testAttempt.findUnique({
          where: { id: attemptId },
        });

        if (!attempt) return { skipped: true, reason: 'Attempt not found' };

        await prisma.testAttempt.update({
          where: { id: attemptId },
          data: { status: 'Grading' },
        });

        const questionResults = await prisma.mockQuestionResult.findMany({
          where: { attemptId },
          orderBy: { questionIndex: 'asc' },
        });

        let questionsList: any[] = [];
        try {
          questionsList = JSON.parse(attempt.questionsJson || '[]');
        } catch (e) {
          logger.error('Failed parsing questions list in grading job', e);
        }

        let speakingEarned = 0, speakingMax = 0;
        let writingEarned = 0, writingMax = 0;
        let readingEarned = 0, readingMax = 0;
        let listeningEarned = 0, listeningMax = 0;

        for (const resItem of questionResults) {
          if (ctx.isCancelled()) break;

          await prisma.mockQuestionResult.update({
            where: { id: resItem.id },
            data: { status: 'Grading' },
          });

          const q = questionsList.find((item) => item.questionId === resItem.questionId || item.id === resItem.questionId);
          const taskCode = resItem.taskType;
          const section = q?.section || 'Section';
          const title = q?.title || 'Question Item';
          const promptText = q?.promptText || q?.passageText || '';
          
          let answerText = '';
          const responseJson: any = resItem.normalizedResponse;
          if (responseJson && typeof responseJson === 'object') {
            answerText = responseJson.typedText || responseJson.text || JSON.stringify(responseJson);
          } else {
            answerText = String(responseJson || '');
          }

          let transcript: string | null = null;
          let transcriptProvider: string | null = null;
          let transcriptConfidence: number | null = null;
          let finalScore: number | null = null;
          let feedbackText = '';
          let aiProvider: string | null = null;
          let aiModel: string | null = null;
          let gradingError: string | null = null;

          if (!answerText || answerText.trim() === '' || answerText === '{}' || answerText === '[]') {
            await prisma.mockQuestionResult.update({
              where: { id: resItem.id },
              data: {
                status: 'Completed',
                finalScore: 0,
                feedback: 'No response provided.',
              },
            });
            const weights = TASK_SCORING_REGISTRY[taskCode];
            if (weights) {
              if (weights.skills.includes('speaking')) speakingMax += weights.maxCredit;
              if (weights.skills.includes('writing')) writingMax += weights.maxCredit;
              if (weights.skills.includes('reading')) readingMax += weights.maxCredit;
              if (weights.skills.includes('listening')) listeningMax += weights.maxCredit;
            }
            continue;
          }

          try {
            const registryEntry = TASK_SCORING_REGISTRY[taskCode];
            if (registryEntry && registryEntry.skills.includes('speaking')) {
              const audioMeta = await prisma.audioMetadata.findFirst({
                where: { attemptId, questionId: resItem.questionId },
              });

              if (audioMeta) {
                try {
                  const transcriber = getTranscriber(taskCode);
                  const storage = getAudioStore();
                  const audioBuffer = await storage.get(audioMeta.objectKey);
                  const sttResult = await transcriber.transcribe(
                    audioBuffer,
                    audioMeta.objectKey,
                    audioMeta.mimeType
                  );

                  transcript = sttResult.transcript;
                  transcriptProvider = sttResult.provider;
                  transcriptConfidence = sttResult.confidence ?? null;
                  aiModel = sttResult.modelUsed;
                  answerText = sttResult.transcript;
                } catch (sttErr: any) {
                  logger.error(`STT Transcription failed for question ${resItem.questionId}:`, sttErr);
                  throw sttErr;
                }
              }
            }

            const gradeResult = await evaluateSubmission(taskCode, section, title, answerText, promptText);

            if (gradeResult.status !== 'scored') {
              logger.warn(`Mock question ${resItem.questionId} could not be scored: ${gradeResult.reason}`);
              await prisma.mockQuestionResult.update({
                where: { id: resItem.id },
                data: {
                  status: 'Failed',
                  feedback: gradeResult.reason,
                  finalScore: null,
                  gradedAt: new Date(),
                },
              });
              if (registryEntry) {
                if (registryEntry.skills.includes('speaking')) speakingMax += registryEntry.maxCredit;
                if (registryEntry.skills.includes('writing')) writingMax += registryEntry.maxCredit;
                if (registryEntry.skills.includes('reading')) readingMax += registryEntry.maxCredit;
                if (registryEntry.skills.includes('listening')) listeningMax += registryEntry.maxCredit;
              }
              continue;
            }

            const baseScore = gradeResult.score;
            const maxCreditVal = registryEntry?.maxCredit || 10;
            const earnedCredit = ((baseScore - 10) / 80) * maxCreditVal;

            finalScore = Math.round(baseScore);
            feedbackText = gradeResult.feedback || '';
            aiProvider = 'DeepSeek AI Grader';
            aiModel = aiModel || 'deepseek-chat';

            if (registryEntry) {
              if (registryEntry.skills.includes('speaking')) {
                speakingEarned += earnedCredit;
                speakingMax += maxCreditVal;
              }
              if (registryEntry.skills.includes('writing')) {
                writingEarned += earnedCredit;
                writingMax += maxCreditVal;
              }
              if (registryEntry.skills.includes('reading')) {
                readingEarned += earnedCredit;
                readingMax += maxCreditVal;
              }
              if (registryEntry.skills.includes('listening')) {
                listeningEarned += earnedCredit;
                listeningMax += maxCreditVal;
              }
            }

            await prisma.mockQuestionResult.update({
              where: { id: resItem.id },
              data: {
                status: 'Completed',
                finalScore,
                transcript,
                transcriptProvider,
                transcriptConfidence,
                feedback: feedbackText,
                aiProvider,
                aiModel,
                rawDimensions: gradeResult ? JSON.stringify(gradeResult) : null,
                skillContributions: JSON.stringify({
                  speaking: registryEntry?.skills.includes('speaking') ? earnedCredit : 0,
                  writing: registryEntry?.skills.includes('writing') ? earnedCredit : 0,
                  reading: registryEntry?.skills.includes('reading') ? earnedCredit : 0,
                  listening: registryEntry?.skills.includes('listening') ? earnedCredit : 0,
                }),
              },
            });
          } catch (err: any) {
            logger.error(`Error processing question ${resItem.questionId}:`, err);
            gradingError = err.message || 'Unknown grading failure';

            await prisma.mockQuestionResult.update({
              where: { id: resItem.id },
              data: {
                status: 'Failed',
                errorDetails: gradingError,
              },
            });

            throw err;
          }
        }

        if (ctx.isCancelled()) return {};

        const speakingScore = normalizeSkillScore(speakingEarned, speakingMax);
        const writingScore = normalizeSkillScore(writingEarned, writingMax);
        const readingScore = normalizeSkillScore(readingEarned, readingMax);
        const listeningScore = normalizeSkillScore(listeningEarned, listeningMax);

        const skillScores: SkillScores = {
          speaking: speakingScore,
          writing: writingScore,
          reading: readingScore,
          listening: listeningScore,
        };

        const overallScore = calculateOverallScore(skillScores) || 10;

        await prisma.testAttempt.update({
          where: { id: attemptId },
          data: {
            overallScore,
            speakingScore: speakingScore || 0,
            writingScore: writingScore || 0,
            readingScore: readingScore || 0,
            listeningScore: listeningScore || 0,
            status: 'Completed',
          },
        });

        await prisma.notification.create({
          data: {
            userId: attempt.userId,
            title: 'Mock Exam Graded Successfully',
            text: `Your mock exam "${attempt.title}" has been graded with an overall score of ${overallScore}/90. Check reports for details!`,
          },
        });

        return { success: true, overallScore };
      },
      generate_question_batch: handleGenerateQuestionBatch,
      generate_question_asset: handleGenerateQuestionAsset,
    };

    const handler = jobHandlers[job.name];
    if (handler) {
      resultData = await handler(payload, ctx);
    } else {
      logger.warn(`No handler registered for job: ${job.name}`);
      resultData = { skipped: true, reason: 'No handler' };
    }

    if (isCancelled) return;

    // Concurrency double check write matching claimToken
    const finalized = await prisma.backgroundJob.updateMany({
      where: {
        id: job.id,
        status: 'running',
        claimToken,
      },
      data: {
        status: 'completed',
        result: JSON.stringify(resultData),
        completedAt: new Date(),
      },
    });

    if (finalized.count === 1) {
      logger.info(`Successfully completed job ${job.name} (ID: ${job.id})`);
    } else {
      logger.warn(`Worker ${workerId} could not write final results for job ${job.id}. Lease lost.`);
    }
  } catch (err: any) {
    logger.error(`Error processing job ${job.id}:`, err);
    
    // Recovery / Failed transition check attempts limit
    try {
      const updatedJob = await prisma.backgroundJob.findUnique({ where: { id: job.id } });
      if (updatedJob) {
        const nextStatus = updatedJob.attempts >= updatedJob.maxAttempts ? 'dead_letter' : 'queued';
        await prisma.backgroundJob.updateMany({
          where: {
            id: job.id,
            status: 'running',
            claimToken,
          },
          data: {
            status: nextStatus,
            error: err.message || 'Job failure execution traceback',
            completedAt: nextStatus === 'dead_letter' ? new Date() : null,
            claimToken: null,
            workerId: null,
            leaseExpiresAt: null,
          },
        });

        // Set attempt status to Grading_Failed if mock grading crashed
        if (job.name === 'grade_mock_test' && nextStatus === 'dead_letter') {
          const payload = JSON.parse(job.data);
          await prisma.testAttempt.update({
            where: { id: payload.attemptId },
            data: { status: 'Grading_Failed' },
          });
        }
      }
    } catch (dbErr) {
      logger.error(`Failed logging job failure to database for job ${job.id}:`, dbErr);
    }
  } finally {
    clearInterval(heartbeatTimer);
  }
}

async function recoverStaleJobs() {
  const staleJobs = await prisma.backgroundJob.findMany({
    where: {
      status: 'running',
      leaseExpiresAt: { lt: new Date() },
    },
  });

  for (const job of staleJobs) {
    try {
      const nextStatus = job.attempts >= job.maxAttempts ? 'dead_letter' : 'queued';
      await prisma.backgroundJob.update({
        where: { id: job.id },
        data: {
          status: nextStatus,
          error: `Lease expired. Worker did not check in. Resetting status to ${nextStatus}.`,
          completedAt: nextStatus === 'dead_letter' ? new Date() : null,
          claimToken: null,
          workerId: null,
          leaseExpiresAt: null,
        },
      });

      if (job.name === 'grade_mock_test' && nextStatus === 'dead_letter') {
        const payload = JSON.parse(job.data);
        await prisma.testAttempt.update({
          where: { id: payload.attemptId },
          data: { status: 'Grading_Failed' },
        });
      }
      logger.warn(`Recovered stale background job ${job.id} (status reset to ${nextStatus})`);
    } catch (err) {
      logger.error(`Failed recovering stale job ${job.id}:`, err);
    }
  }
}
