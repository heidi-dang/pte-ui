import { prisma } from '../../db';
import { logger } from '../../logger';
import { getTtsProvider } from '../../tts/provider';
import { TaskCode, QUESTION_REGISTRY } from '../../../shared/questionTaskRegistry';
import { getAudioStore } from '../../storage';

interface JobContext {
  job: any;
  isCancelled: () => boolean;
}

export async function handleGenerateQuestionAsset(payload: any, ctx: JobContext) {
  const { questionId, taskCode } = payload;
  const qItem = await prisma.questionBankItem.findUnique({ where: { id: questionId } });
  
  if (!qItem) {
    throw new Error(`Question ${questionId} not found`);
  }

  const taskDef = QUESTION_REGISTRY[taskCode as TaskCode];

  // 1. Image generation (e.g. for DI)
  if (taskDef.requiresImage) {
    // Generate image from chart specification
    // Since we don't have a rendering engine yet, we mock a URL or generate an SVG
    await prisma.questionBankItem.update({
      where: { id: questionId },
      data: { imageUrl: '/mock-generated-chart.png' }
    });
  }

  // 2. Audio generation (e.g. for RS, WFD, ASQ, RL, SGD, RTS, SST, MCMSL, FIBL, HCS, MCSSL, SMW, HIW)
  if (taskDef.requiresAudio) {
    try {
      const provider = getTtsProvider();
      let script = '';
      const payload = JSON.parse(qItem.taskPayloadJson || '{}');
      
      script = payload.ttsScript || payload.lectureScript || payload.discussionScript || payload.situationScript || payload.audioScript || payload.dictationSentence || payload.question || '';

      if (script) {
        const audioRes = await provider.generateAudio(script);
        
        // upload to storage
        const storage = getAudioStore();
        const objectKey = `questions/${questionId}_${Date.now()}.wav`;
        await storage.put(objectKey, audioRes.audioBuffer, audioRes.mimeType);

        await prisma.questionBankItem.update({
          where: { id: questionId },
          data: { audioUrl: objectKey }
        });
      } else {
        logger.warn(`No script found for audio generation on question ${questionId}`);
      }
    } catch (e: any) {
      throw new Error('Audio generation failed: ' + e.message);
    }
  }

  // 3. Mark assets as completed
  await prisma.questionBankItem.update({
    where: { id: questionId },
    data: { assetStatus: 'completed' }
  });
  
  if (qItem.generationBatchId && qItem.generationSlot) {
    await prisma.questionGenerationCandidate.update({
      where: { batchId_slotNumber: { batchId: qItem.generationBatchId, slotNumber: qItem.generationSlot } },
      data: { status: 'completed' }
    });
  }

  return { success: true };
}
