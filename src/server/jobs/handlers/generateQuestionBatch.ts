import { prisma } from '../../db';
import { logger } from '../../logger';
import { generateQuestionChunk } from '../../questionGeneration/generator';
import { normalizeCandidate } from '../../questionGeneration/normalizer';
import { validateCandidate } from '../../questionGeneration/validators';
import { checkDuplicate } from '../../questionGeneration/dedupe';
import { runReviewerPass } from '../../questionGeneration/reviewer';
import { createHash } from 'crypto';
import { TaskCode, QUESTION_REGISTRY } from '../../../shared/questionTaskRegistry';
import { validateQuestionForTask } from '../../../practice/contracts/validation';

interface JobContext {
  job: any;
  isCancelled: () => boolean;
}

export async function handleGenerateQuestionBatch(payload: any, ctx: JobContext) {
  const { batchId } = payload;

  try {
    const batch = await prisma.questionGenerationBatch.findUnique({
      where: { id: batchId },
      include: { candidates: true }
    });

    if (!batch) {
      throw new Error(`Batch not found: ${batchId}`);
    }

    // Claim batch
    await prisma.questionGenerationBatch.update({
      where: { id: batchId },
      data: { status: 'generating', startedAt: new Date() }
    });

    let candidates = [...batch.candidates];

    // If no candidates exist yet, create exactly 10 candidate slots
    if (candidates.length === 0) {
      const slots = [];
      for (let i = 1; i <= batch.requestedCount; i++) {
        slots.push({ batchId, slotNumber: i, status: 'queued' });
      }
      await prisma.questionGenerationCandidate.createMany({ data: slots });
      candidates = await prisma.questionGenerationCandidate.findMany({ where: { batchId }, orderBy: { slotNumber: 'asc' } });
    }

    const taskDef = QUESTION_REGISTRY[batch.taskCode as TaskCode];

    let promptTokens = batch.promptTokens || 0;
    let completionTokens = batch.completionTokens || 0;

    // Identify remaining slots to fill
    let activeCandidates = candidates.filter(c => c.status === 'queued' || c.status === 'failed');

    let attempts = 0;
    while (activeCandidates.length > 0 && attempts < 3) {
      if (ctx.isCancelled()) return { status: 'cancelled' };
      attempts++;
      logger.info(`Batch ${batchId}: Generating for ${activeCandidates.length} slots (Attempt ${attempts})`);

      // Chunk size 5
      for (let i = 0; i < activeCandidates.length; i += 5) {
        const chunk = activeCandidates.slice(i, i + 5);
        if (ctx.isCancelled()) return { status: 'cancelled' };
        
        try {
          const result = await generateQuestionChunk(batch.taskCode as TaskCode, batch.difficulty, chunk.length, batch.topic || undefined);
          promptTokens += result.promptTokens || 0;
          completionTokens += result.completionTokens || 0;

          for (let j = 0; j < chunk.length; j++) {
            const slot = chunk[j];
            const rawItem = result.questions[j];
            
            if (!rawItem) {
              await updateCandidate(slot.id, { status: 'failed', failureReason: 'Missing from chunk output' });
              continue;
            }

            // 5. Normalize
            const normalized = normalizeCandidate(rawItem, batch.taskCode as TaskCode);

            // 6. Deterministic Validation
            const valRes = validateCandidate(normalized, batch.taskCode as TaskCode);
            if (!valRes.valid) {
              await updateCandidate(slot.id, {
                status: 'failed',
                failureReason: 'Validation failed: ' + valRes.errors?.join(', '),
                rawOutputJson: JSON.stringify(rawItem),
                validationJson: JSON.stringify(valRes)
              });
              continue;
            }

            // 7. Duplicate Detection
            const coreText = (normalized.promptText || '') + ' ' + (normalized.passageText || '') + ' ' + (normalized.taskPayload?.audioScript || '');
            const dupRes = await checkDuplicate(batch.taskCode as TaskCode, coreText, 0.82);
            if (dupRes.isDuplicate) {
              await updateCandidate(slot.id, {
                status: 'failed',
                failureReason: `Duplicate detected (Score: ${dupRes.score})`,
                rawOutputJson: JSON.stringify(rawItem),
                similarityScore: dupRes.score,
                validationJson: JSON.stringify(dupRes)
              });
              continue;
            }

            // 8. Reviewer pass
            const review = await runReviewerPass(normalized, batch.taskCode as TaskCode);
            if (review.score < 80) {
              await updateCandidate(slot.id, {
                status: 'failed',
                failureReason: `Quality too low (${review.score}/100): ${review.reasoning}`,
                rawOutputJson: JSON.stringify(rawItem),
                qualityScore: review.score
              });
              continue;
            }

            // Ready for persistence!
            await updateCandidate(slot.id, {
              status: 'validating', // passed initial checks
              rawOutputJson: JSON.stringify(rawItem),
              normalizedPayload: JSON.stringify(normalized),
              qualityScore: review.score,
              validationJson: JSON.stringify({ review, dupRes }),
              failureReason: null
            });
          }

        } catch (err: any) {
          // entire chunk failed
          for (const slot of chunk) {
            await updateCandidate(slot.id, { status: 'failed', failureReason: 'Chunk generation exception: ' + err.message });
          }
        }
      }

      // Refresh active candidates
      const updatedCandidates = await prisma.questionGenerationCandidate.findMany({ where: { batchId } });
      activeCandidates = updatedCandidates.filter(c => c.status === 'failed');
    }

    // End of generation loops
    const finalCandidates = await prisma.questionGenerationCandidate.findMany({ where: { batchId } });
    let readyCount = 0;
    let failedCount = 0;

    for (const c of finalCandidates) {
      if (c.status === 'validating') {
        const normalized = JSON.parse(c.normalizedPayload || '{}');
        // Force string fields - AI sometimes returns arrays where Prisma expects String
        if (Array.isArray(normalized.tagsJson)) normalized.tagsJson = JSON.stringify(normalized.tagsJson);
        if (Array.isArray(normalized.taskPayloadJson)) normalized.taskPayloadJson = JSON.stringify(normalized.taskPayloadJson);
        const coreText = (normalized.promptText || '') + ' ' + (normalized.passageText || '') + ' ' + (normalized.taskPayload?.audioScript || '');
        const hash = createHash('sha256').update(`${batch.taskCode}:${coreText.toLowerCase().replace(/[^a-z0-9]/g, '')}`).digest('hex');

        // 10. Canonical task validation (Zod schema from task contracts)
        if (taskDef.requiresAudio && !normalized.audioUrl) normalized.audioUrl = '__pending__';
        if (taskDef.requiresImage && !normalized.imageUrl) normalized.imageUrl = '__pending__';
        const canonicalResult = validateQuestionForTask(batch.taskCode as any, normalized);
        if (!canonicalResult.valid) {
          const r = canonicalResult as { valid: false; errors: { path: string; message: string }[] };
          await updateCandidate(c.id, {
            status: 'failed',
            failureReason: 'Canonical validation failed: ' + r.errors.map(e => `${e.path}: ${e.message}`).join(', '),
            validationJson: JSON.stringify(canonicalResult)
          });
          failedCount++;
          continue;
        }

        const assetStatus = (taskDef.requiresAudio || taskDef.requiresImage) ? 'pending' : 'not_required';
        
        const qItem = await prisma.questionBankItem.create({
          data: {
            taskCode: batch.taskCode,
            section: batch.section as any,
            title: normalized.title,
            instruction: normalized.instruction,
            promptText: normalized.promptText,
            difficulty: (normalized.difficulty || 'medium') as any,
            tagsJson: typeof normalized.tagsJson === 'string' ? normalized.tagsJson : JSON.stringify(normalized.tagsJson),
            explanation: normalized.explanation,
            sampleAnswer: normalized.sampleAnswer,
            passageText: normalized.passageText,
            taskPayloadJson: typeof normalized.taskPayloadJson === 'string' ? normalized.taskPayloadJson : JSON.stringify(normalized.taskPayloadJson),
            optionsJson: normalized.optionsJson ? JSON.stringify(normalized.optionsJson) : undefined,
            answerKeyJson: normalized.answerKeyJson ? (typeof normalized.answerKeyJson === 'string' ? normalized.answerKeyJson : JSON.stringify(normalized.answerKeyJson)) : undefined,
            audioUrl: normalized.audioUrl || undefined,
            imageUrl: normalized.imageUrl || undefined,
            source: 'ai_original_deepseek',
            status: 'draft',
            reviewStatus: reviewStatusFromScore(c.qualityScore || 0),
            qualityScore: c.qualityScore,
            generationBatchId: batch.id,
            generationSlot: c.slotNumber,
            contentHash: hash,
            assetStatus,
            createdByUserId: batch.requestedByUserId,
            aiProvider: 'DeepSeek',
            aiModel: 'deepseek-chat',
            promptVersion: batch.promptVersion,
            schemaVersion: batch.schemaVersion,
          }
        });

        await updateCandidate(c.id, { 
          status: assetStatus === 'pending' ? 'assets_pending' : 'completed',
          questionBankItemId: qItem.id 
        });

        // 11. Queue required asset jobs
        if (assetStatus === 'pending') {
          await prisma.backgroundJob.create({
            data: {
              name: 'generate_question_asset',
              data: JSON.stringify({ questionId: qItem.id, taskCode: batch.taskCode })
            }
          });
        }
        readyCount++;
      } else if (c.status === 'failed') {
        failedCount++;
      } else if (c.status === 'assets_pending' || c.status === 'completed') {
        readyCount++;
      }
    }

    // 13. Mark completed only when all 10 draft records exist
    const finalStatus = (readyCount === batch.requestedCount) ? 'completed' 
                      : (readyCount > 0) ? 'partial_failed' : 'failed';

    // 14. Save token use, model, provider and prompt version
    await prisma.questionGenerationBatch.update({
      where: { id: batchId },
      data: {
        status: finalStatus,
        readyCount,
        failedCount,
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        completedAt: new Date()
      }
    });

    return { success: true, finalStatus, readyCount, failedCount };
  } catch (err: any) {
    logger.error(`Batch ${batchId} handler failed:`, err);
    await prisma.questionGenerationBatch.update({
      where: { id: batchId },
      data: { status: 'failed', error: err.message, completedAt: new Date() }
    }).catch(() => {});
    throw err;
  }
}

async function updateCandidate(id: string, data: any) {
  await prisma.questionGenerationCandidate.update({
    where: { id },
    data: { ...data, attempts: { increment: 1 } }
  });
}

function reviewStatusFromScore(score: number): string {
  if (score >= 90) return 'pending_review';
  if (score >= 80) return 'pending_review_warning';
  return 'rejected';
}
