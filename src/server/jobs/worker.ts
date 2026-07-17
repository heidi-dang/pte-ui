import { prisma } from '../db';
import { logger } from '../logger';
import { evaluateSubmission } from '../aiService';

export async function startJobProcessor() {
  logger.info('Starting background job processor...');

  setInterval(async () => {
    try {
      const job = await prisma.backgroundJob.findFirst({
        where: { status: 'queued' },
        orderBy: { scheduledAt: 'asc' },
      });

      if (!job) return;

      await prisma.backgroundJob.update({
        where: { id: job.id },
        data: { status: 'running' },
      });

      logger.info(`Processing job ${job.name} (ID: ${job.id})`);

      const payload = JSON.parse(job.data);
      let resultData: any = {};

      if (job.name === 'grade_submission') {
        const { submissionId } = payload;
        const sub = await prisma.practiceSubmission.findUnique({
          where: { id: submissionId },
        });

        if (sub) {
          logger.info(`AI grading submission ${sub.id} for task ${sub.taskCode}...`);

          const result = await evaluateSubmission(
            sub.taskCode,
            sub.section,
            sub.title,
            sub.answerText || '',
            ''
          );

          await prisma.practiceSubmission.update({
            where: { id: submissionId },
            data: {
              status: 'graded',
              score: result.score,
              fluencyScore: result.fluencyScore,
              pronunciationScore: result.pronunciationScore,
              grammarIssues: result.grammarIssues,
              feedback: result.feedback,
            },
          });

          await prisma.notification.create({
            data: {
              userId: sub.userId,
              title: 'Practice Graded Successfully',
              text: `Your submission for "${sub.title}" has been graded with a score of ${result.score}/90. Check reports for details!`,
            },
          });

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

          resultData = { success: true, score: result.score };
        }
      } else {
        resultData = { message: 'Unknown job type ignored.' };
      }

      await prisma.backgroundJob.update({
        where: { id: job.id },
        data: {
          status: 'completed',
          result: JSON.stringify(resultData),
          completedAt: new Date(),
        },
      });

      logger.info(`Successfully completed job ${job.name} (ID: ${job.id})`);
    } catch (err: any) {
      console.error('Error processing background job:', err);
    }
  }, 3000);
}
