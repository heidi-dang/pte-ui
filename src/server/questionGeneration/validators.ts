import { ValidationResult, QUESTION_REGISTRY, TaskCode } from '../../shared/questionTaskRegistry';
import { generatedBatchSchema } from './schemas';

export function validateCandidate(candidate: any, expectedTaskCode: TaskCode): ValidationResult {
  if (!candidate) {
    return { valid: false, errors: ['Candidate is null or undefined'] };
  }

  const errors: string[] = [];

  // Common validation
  if (!candidate.title) errors.push('Missing title');
  if (!candidate.instruction) errors.push('Missing instruction');
  if (!candidate.promptText) errors.push('Missing promptText');
  if (!candidate.difficulty) errors.push('Missing difficulty');
  
  if (candidate.taskCode !== expectedTaskCode) {
    errors.push(`Task code mismatch: expected ${expectedTaskCode}, got ${candidate.taskCode}`);
  }

  // Ensure no HTML/placeholder residue
  const strRep = JSON.stringify(candidate);
  if (strRep.includes('[insert text]') || strRep.match(/<[^>]*>/)) {
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
