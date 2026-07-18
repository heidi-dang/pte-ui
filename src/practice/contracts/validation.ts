import { z } from 'zod';
import { getContract, TASK_REGISTRY } from './registry';
import type { PTETaskCode } from './types';

export interface ValidationError {
  path: string;
  message: string;
}

function formatZodErrors(err: z.ZodError): ValidationError[] {
  return err.issues.map((i) => ({
    path: i.path.join('.'),
    message: i.message,
  }));
}

export function validateQuestionForTask(
  taskCode: PTETaskCode,
  payload: unknown,
): { valid: true; data: unknown } | { valid: false; errors: ValidationError[] } {
  const contract = getContract(taskCode);
  const result = contract.questionSchema.safeParse(payload);
  if (!result.success) {
    return { valid: false, errors: formatZodErrors(result.error) };
  }
  return { valid: true, data: result.data };
}

export function validateResponseForTask(
  taskCode: PTETaskCode,
  payload: unknown,
): { valid: true; data: unknown } | { valid: false; errors: ValidationError[] } {
  const contract = getContract(taskCode);
  const result = contract.responseSchema.safeParse(payload);
  if (!result.success) {
    return { valid: false, errors: formatZodErrors(result.error) };
  }
  return { valid: true, data: result.data };
}

export function validatePublishableQuestion(
  taskCode: PTETaskCode,
  payload: Record<string, unknown>,
): { valid: true } | { valid: false; errors: ValidationError[] } {
  const contract = getContract(taskCode);
  const questionResult = contract.questionSchema.safeParse(payload);
  if (!questionResult.success) {
    return { valid: false, errors: formatZodErrors(questionResult.error) };
  }

  const media = contract.media;
  const errors: ValidationError[] = [];

  if (media.requiresPromptAudio && !payload.audioUrl) {
    errors.push({ path: 'audioUrl', message: `${taskCode} requires prompt audio for publishing` });
  }
  if (media.requiresImage && !payload.imageUrl) {
    errors.push({ path: 'imageUrl', message: `${taskCode} requires an image for publishing` });
  }

  if (contract.scoringMode === 'deterministic') {
    if (!payload.answerKeyJson && !payload.answerKeyJson) {
      errors.push({ path: 'answerKeyJson', message: `${taskCode} requires answer key for deterministic scoring` });
    }
  }

  switch (taskCode) {
    case 'RS':
      if (!payload.audioUrl) errors.push({ path: 'audioUrl', message: 'RS requires prompt audio' });
      break;
    case 'DI':
      if (!payload.imageUrl) errors.push({ path: 'imageUrl', message: 'DI requires an image' });
      break;
    case 'ROP': {
      const opts = payload.optionsJson;
      if (!Array.isArray(opts) || opts.length < 2) {
        errors.push({ path: 'optionsJson', message: 'ROP requires at least 2 paragraphs' });
      }
      break;
    }
    case 'MCM': {
      const ak = payload.answerKeyJson;
      if (!ak) errors.push({ path: 'answerKeyJson', message: 'MCM requires multiple correct answers' });
      break;
    }
    case 'FIBR':
    case 'FIBRW': {
      const blanks = payload.answerKeyJson;
      if (!blanks) errors.push({ path: 'answerKeyJson', message: 'FIB tasks require blank-position answer keys' });
      break;
    }
    case 'HIW': {
      const akHiw = payload.answerKeyJson;
      if (!akHiw) errors.push({ path: 'answerKeyJson', message: 'HIW requires token-position answer keys' });
      break;
    }
    case 'WFD':
      if (!payload.answerKeyJson) errors.push({ path: 'answerKeyJson', message: 'WFD requires reference transcript in answerKeyJson' });
      break;
    case 'SGD':
      if (!payload.answerKeyJson) errors.push({ path: 'answerKeyJson', message: 'SGD requires speaker-labelled transcript in answerKeyJson' });
      break;
  }

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true };
}

export function buildStudentSafeQuestion(taskCode: PTETaskCode, question: Record<string, unknown>): Record<string, unknown> {
  const contract = getContract(taskCode);
  const safe: Record<string, unknown> = {};

  const fields = contract.questionSchema instanceof z.ZodObject
    ? Object.keys((contract.questionSchema as z.ZodObject<any>).shape)
    : [];

  for (const key of fields) {
    if (key === 'answerKeyJson') continue;
    safe[key] = question[key];
  }

  return safe;
}
