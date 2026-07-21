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

  // 1. Image generation (e.g. for DI photographs or RL placeholders)
  if (taskCode === 'DI' || taskCode === 'RL') {
    const payload = JSON.parse(qItem.taskPayloadJson || '{}');
    
    if (taskCode === 'DI' && payload.chartSpecification) {
      // It is a chart, Recharts will render it on the frontend. No static image needed.
      await prisma.questionBankItem.update({
        where: { id: questionId },
        data: { imageUrl: null }
      });
    } else {
      // It is a DI photograph OR an RL task needing a visual placeholder.
      try {
        let defaultPrompt = 'academic lecture professor';
        if (taskCode === 'DI') defaultPrompt = 'photograph';
        
        const prompt = payload.title || qItem.title || defaultPrompt;
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=600&nologo=true`;
        
        logger.info(`Fetching AI image from Pollinations for question ${questionId}`);
        const res = await fetch(imageUrl);
        if (res.ok) {
          const buffer = await res.arrayBuffer();
          const storage = getAudioStore(); // Works identically for any file type (images)
          const objectKey = `questions/${questionId}_${Date.now()}.jpg`;
          
          await storage.put(objectKey, Buffer.from(buffer), 'image/jpeg');
          
          await prisma.questionBankItem.update({
            where: { id: questionId },
            data: { imageUrl: objectKey }
          });
        } else {
          logger.warn(`Pollinations API failed for question ${questionId} with status ${res.status}`);
        }
      } catch (err: any) {
        logger.warn(`Failed to generate image asset: ${err.message}`);
      }
    }
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
        const ext = audioRes.mimeType === 'audio/mpeg' ? 'mp3' : 'wav';
        const objectKey = `questions/${questionId}_${Date.now()}.${ext}`;
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
