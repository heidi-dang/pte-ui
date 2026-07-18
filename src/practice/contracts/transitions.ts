import type { PrismaClient } from '@prisma/client';

export type PracticeAttemptStatus =
  | 'In_Progress'
  | 'Pending_Transcription'
  | 'Transcribing'
  | 'Transcription_Failed'
  | 'Pending_Grading'
  | 'Pending_Deterministic'
  | 'Grading'
  | 'Grading_Failed'
  | 'Completed'
  | 'Expired';

const ALLOWED_TRANSITIONS: Record<PracticeAttemptStatus, PracticeAttemptStatus[]> = {
  In_Progress: ['Pending_Transcription', 'Pending_Grading', 'Expired'],
  Pending_Transcription: ['Transcribing', 'Transcription_Failed', 'Expired'],
  Transcribing: ['Pending_Grading', 'Transcription_Failed', 'Expired'],
  Transcription_Failed: ['Pending_Transcription', 'Expired'],
  Pending_Grading: ['Grading', 'Grading_Failed', 'Pending_Deterministic', 'Expired'],
  Pending_Deterministic: ['Completed', 'Grading_Failed', 'Expired'],
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

export async function transitionPracticeAttempt(
  prisma: PrismaClient,
  attemptId: string,
  nextStatus: PracticeAttemptStatus,
  data: Record<string, unknown> = {},
): Promise<void> {
  const current = await prisma.practiceAttempt.findUnique({
    where: { id: attemptId },
    select: { status: true },
  });

  if (!current) {
    throw new Error('Attempt not found');
  }

  assertPracticeAttemptTransition(
    current.status as PracticeAttemptStatus,
    nextStatus,
  );

  const updated = await prisma.practiceAttempt.updateMany({
    where: {
      id: attemptId,
      status: current.status,
    },
    data: {
      ...data,
      status: nextStatus,
    },
  });

  if (updated.count !== 1) {
    throw new Error('Attempt transition lost concurrency race');
  }
}
