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
      } else if (job.name === 'grade_mock_test') {
        const { attemptId } = payload;
        const attempt = await prisma.testAttempt.findUnique({
          where: { id: attemptId },
        });

        if (attempt) {
          logger.info(`AI grading mock test attempt ${attempt.id} ("${attempt.title}")...`);

          const answers = attempt.answersJson ? JSON.parse(attempt.answersJson) : {};
          const questions = attempt.questionsJson ? JSON.parse(attempt.questionsJson) : [];

          let speakingTotal = 0, speakingCount = 0;
          let writingTotal = 0, writingCount = 0;
          let readingTotal = 0, readingCount = 0;
          let listeningTotal = 0, listeningCount = 0;

          const addSectionScore = (taskCode: string, section: string, score: number) => {
            if (section === 'Speaking') {
              speakingTotal += score;
              speakingCount++;
              if (taskCode === 'RA') {
                readingTotal += score;
                readingCount++;
              } else if (taskCode === 'RS' || taskCode === 'RL') {
                listeningTotal += score;
                listeningCount++;
              }
            } else if (section === 'Writing') {
              writingTotal += score;
              writingCount++;
              if (taskCode === 'SWT') {
                readingTotal += score;
                readingCount++;
              }
            } else if (section === 'Reading') {
              readingTotal += score;
              readingCount++;
              if (taskCode === 'FIBRW') {
                writingTotal += score;
                writingCount++;
              }
            } else if (section === 'Listening') {
              listeningTotal += score;
              listeningCount++;
              if (taskCode === 'SST' || taskCode === 'WFD' || taskCode === 'FIBL') {
                writingTotal += score;
                writingCount++;
              }
            }
          };

          for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            const taskCode = q.code || q.taskCode || 'RA';
            const section = q.section;
            const title = q.title;
            const promptText = q.promptText || q.passageText || '';
            const answerText = answers[i] || '';

            if (!answerText || answerText.trim() === '') {
              addSectionScore(taskCode, section, 10);
              continue;
            }

            try {
              const result = await evaluateSubmission(taskCode, section, title, answerText, promptText);
              const score = result.score || 10;
              addSectionScore(taskCode, section, score);
            } catch (err) {
              logger.error(`Error grading question ${i} (${taskCode}) in mock attempt ${attempt.id}:`, err);
              addSectionScore(taskCode, section, 10);
            }
          }

          const speakingScore = speakingCount > 0 ? Math.min(90, Math.max(10, Math.round(speakingTotal / speakingCount))) : 50;
          const writingScore = writingCount > 0 ? Math.min(90, Math.max(10, Math.round(writingTotal / writingCount))) : 50;
          const readingScore = readingCount > 0 ? Math.min(90, Math.max(10, Math.round(readingTotal / readingCount))) : 50;
          const listeningScore = listeningCount > 0 ? Math.min(90, Math.max(10, Math.round(listeningTotal / listeningCount))) : 50;

          const overallScore = Math.round((speakingScore + writingScore + readingScore + listeningScore) / 4);

          await prisma.testAttempt.update({
            where: { id: attemptId },
            data: {
              overallScore,
              speakingScore,
              writingScore,
              readingScore,
              listeningScore,
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

          resultData = { success: true, overallScore };
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
