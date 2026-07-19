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

const JSON_FIELDS = new Set([
  'optionsJson', 'answerKeyJson', 'tagsJson', 'validationJson',
  'taskPayloadJson', 'skillContributions', 'rawDimensions',
]);

function normaliseJsonFields<T>(payload: T): T {
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    for (const key of Object.keys(obj)) {
      if (JSON_FIELDS.has(key) && typeof obj[key] === 'string') {
        try { obj[key] = JSON.parse(obj[key] as string); } catch { /* keep as string */ }
      }
    }
  }
  return payload;
}

export function validateQuestionForTask(
  taskCode: PTETaskCode,
  payload: unknown,
): { valid: true; data: unknown } | { valid: false; errors: ValidationError[] } {
  const contract = getContract(taskCode);
  const result = contract.questionSchema.safeParse(normaliseJsonFields(payload));
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
  const result = contract.responseSchema.safeParse(normaliseJsonFields(payload));
  if (!result.success) {
    return { valid: false, errors: formatZodErrors(result.error) };
  }
  return { valid: true, data: result.data };
}


