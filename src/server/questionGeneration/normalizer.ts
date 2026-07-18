import { TaskCode } from '../../shared/questionTaskRegistry';

export function normalizeCandidate(candidate: any, taskCode: TaskCode): any {
  if (!candidate || typeof candidate !== 'object') return candidate;
  
  const normalized = { ...candidate, taskCode };

  // Ensure arrays/objects intended for strings are converted properly for DB storage later
  if (Array.isArray(normalized.tagsJson)) {
    normalized.tagsJson = JSON.stringify(normalized.tagsJson);
  } else if (normalized.tags && Array.isArray(normalized.tags)) {
    normalized.tagsJson = JSON.stringify(normalized.tags);
  }

  // Strip arbitrary markdown from string fields
  for (const key of ['promptText', 'passageText', 'instruction', 'explanation']) {
    if (typeof normalized[key] === 'string') {
      normalized[key] = normalized[key].trim().replace(/\r\n/g, '\n');
    }
  }

  if (normalized.taskPayload) {
    if (typeof normalized.taskPayload === 'object') {
      normalized.taskPayloadJson = JSON.stringify(normalized.taskPayload);
    }
  }

  return normalized;
}
