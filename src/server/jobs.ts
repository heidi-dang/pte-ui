import { prisma } from './db';
import { logger } from './logger';

export async function queueJob(name: string, data: any) {
  const job = await prisma.backgroundJob.create({
    data: {
      name,
      data: JSON.stringify(data),
      status: 'queued',
    },
  });
  logger.info(`Queued background job ${name} (ID: ${job.id})`);
  return job;
}

export async function startJobProcessor() {
  logger.info('Starting background job processor...');
  
  // Simple polling interval
  setInterval(async () => {
    try {
      // Find one queued job
      const job = await prisma.backgroundJob.findFirst({
        where: { status: 'queued' },
        orderBy: { scheduledAt: 'asc' },
      });

      if (!job) return;

      // Mark as running
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
          // Simulate some processing time and then update submission
          const score = Math.floor(Math.random() * 20) + 65; // Score between 65 and 85
          const fluency = sub.section === 'Speaking' ? Math.floor(Math.random() * 20) + 65 : undefined;
          const pronunciation = sub.section === 'Speaking' ? Math.floor(Math.random() * 20) + 65 : undefined;
          const grammarIssues = sub.section === 'Writing' ? Math.floor(Math.random() * 5) : undefined;
          
          let feedback = '';
          if (sub.section === 'Speaking') {
            feedback = `Excellent verbal fluency. Some minor pauses detected during transition words. Work on sustained vowels to improve pronunciation.`;
          } else if (sub.section === 'Writing') {
            feedback = `Strong grammatical range and coherent structure. Try using more complex discourse markers to elevate vocabulary range from Academic Word List.`;
          } else {
            feedback = `Good comprehension shown. Selected responses are accurate and vocabulary usage aligns with target PTE bands.`;
          }

          // Update submission
          await prisma.practiceSubmission.update({
            where: { id: submissionId },
            data: {
              status: 'graded',
              score,
              fluencyScore: fluency,
              pronunciationScore: pronunciation,
              grammarIssues,
              feedback,
            },
          });

          // Send notification to user
          await prisma.notification.create({
            data: {
              userId: sub.userId,
              title: 'Practice Graded Successfully',
              text: `Your submission for "${sub.title}" has been graded with a score of ${score}/90. Check reports for details!`,
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

          resultData = { success: true, score };
        }
      } else {
        resultData = { message: 'Unknown job type ignored.' };
      }

      // Mark job as completed
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
  }, 3000); // Check every 3 seconds
}
