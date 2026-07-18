export type PracticeAttemptStatus =
  | 'In_Progress'
  | 'Submitted'
  | 'Pending_Transcription'
  | 'Transcribing'
  | 'Transcription_Failed'
  | 'Pending_Grading'
  | 'Grading'
  | 'Grading_Failed'
  | 'Completed'
  | 'Expired';

const ALLOWED_TRANSITIONS: Record<PracticeAttemptStatus, PracticeAttemptStatus[]> = {
  In_Progress: ['Submitted', 'Expired'],
  Submitted: ['Pending_Transcription', 'Pending_Grading', 'Expired'],
  Pending_Transcription: ['Transcribing', 'Transcription_Failed', 'Expired'],
  Transcribing: ['Pending_Grading', 'Transcription_Failed', 'Expired'],
  Transcription_Failed: ['Pending_Transcription', 'Expired'],
  Pending_Grading: ['Grading', 'Grading_Failed', 'Expired'],
  Grading: ['Completed', 'Grading_Failed', 'Expired'],
  Grading_Failed: ['Pending_Grading', 'Expired'],
  Completed: [],
  Expired: [],
};

export function assertPracticeAttemptTransition(
  current: PracticeAttemptStatus,
  next: PracticeAttemptStatus,
): void {
  if (current === next) return;
  const allowed = ALLOWED_TRANSITIONS[current];
  if (!allowed || !allowed.includes(next)) {
    throw new Error(
      `Invalid PracticeAttempt transition: ${current} → ${next}. Allowed: ${(allowed || []).join(', ') || 'none'}`,
    );
  }
}

export function isValidTransition(
  current: PracticeAttemptStatus,
  next: PracticeAttemptStatus,
): boolean {
  if (current === next) return true;
  const allowed = ALLOWED_TRANSITIONS[current];
  return !!allowed && allowed.includes(next);
}
