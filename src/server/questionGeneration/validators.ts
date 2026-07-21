import { ValidationResult, QUESTION_REGISTRY, TaskCode } from '../../shared/questionTaskRegistry';
import { generatedBatchSchema } from './schemas';

const PROMPT_TEXT_REQUIRED_TASKS = new Set<TaskCode>([
  'RA',
  'DI',
  'RTS',
  'SWT',
  'WE',
  'MCS',
  'MCM',
  'ROP',
  'FIBR',
  'FIBRW',
]);

export function validateCandidate(candidate: any, expectedTaskCode: TaskCode): ValidationResult {
  if (!candidate) {
    return { valid: false, errors: ['Candidate is null or undefined'] };
  }

  const errors: string[] = [];

  // Common validation
  if (!candidate.title) errors.push('Missing title');
  if (!candidate.instruction) errors.push('Missing instruction');
  if (PROMPT_TEXT_REQUIRED_TASKS.has(expectedTaskCode) && !candidate.promptText) {
    errors.push('Missing promptText');
  }
  if (!candidate.difficulty) errors.push('Missing difficulty');
  
  if (candidate.taskCode !== expectedTaskCode) {
    errors.push(`Task code mismatch: expected ${expectedTaskCode}, got ${candidate.taskCode}`);
  }

  // Ensure no HTML/placeholder residue (allow valid blank markers like [[blank_1]])
  const strRep = JSON.stringify(candidate);
  const placeholderFree = strRep.replace(/\[\[blank_\d+\]\]/g, '');
  if (placeholderFree.includes('[insert text]') || placeholderFree.match(/<[^>]*>/)) {
    errors.push('Content contains placeholders or HTML residue');
  }

  const taskDef = QUESTION_REGISTRY[expectedTaskCode];
  if (!taskDef) {
    errors.push(`Unknown task code: ${expectedTaskCode}`);
    return { valid: false, errors };
  }

  // Payload fields
  const payload = candidate.taskPayload || {};
  for (const field of taskDef.requiredPayloadFields) {
    if (payload[field] === undefined || payload[field] === null) {
      errors.push(`Missing required payload field: ${field}`);
    }
  }

  // Task specific validation
  const taskSpecific = taskDef.validateCandidate(candidate);
  if (!taskSpecific.valid) {
    errors.push(...(taskSpecific.errors || []));
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}
