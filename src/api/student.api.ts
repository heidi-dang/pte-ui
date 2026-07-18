import { apiFetch } from './client';
import { ROUTES } from '../shared/routes';

export async function getNotifications() {
  return apiFetch(ROUTES.STUDENT_NOTIFICATIONS);
}

export async function markNotificationRead(id: string) {
  return apiFetch(`${ROUTES.STUDENT_NOTIFICATION_READ}/${id}/read`, { method: 'POST' });
}

export async function markAllNotificationsRead() {
  return apiFetch(ROUTES.STUDENT_NOTIFICATIONS_READ_ALL, { method: 'POST' });
}

export async function triggerSeed() {
  return apiFetch(ROUTES.SEED, { method: 'POST' });
}

export async function submitPracticeResponse(payload: {
  taskCode: string;
  title: string;
  section: string;
  answerText: string;
  audioUrl?: string | null;
  questionBankItemId?: string;
  answerJson?: string;
}) {
  return apiFetch(ROUTES.STUDENT_PRACTICE_SUBMIT, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getPracticeSubmissions() {
  return apiFetch(ROUTES.STUDENT_PRACTICE_SUBMISSIONS);
}

export async function startPracticeAttempt(payload: {
  questionBankItemId: string;
  mode?: string;
}) {
  return apiFetch(ROUTES.STUDENT_PRACTICE_ATTEMPT_START, {
    method: 'POST',
    body: JSON.stringify(payload),
  }) as Promise<{
    success: boolean;
    attemptId: string;
    deadlineAt: string | null;
    taskCode: string;
    section: string;
    timing: { prepSeconds: number; responseSeconds: number };
    question: Record<string, unknown>;
    playbackPolicy: Record<string, unknown>;
  }>;
}

export async function playPromptAudio(attemptId: string) {
  return apiFetch(ROUTES.STUDENT_PRACTICE_ATTEMPT_PLAY_PROMPT(attemptId), {
    method: 'POST',
  }) as Promise<{
    success: boolean;
    audioUrl: string;
    playedCount: number;
  }>;
}

export async function uploadPracticeResponseAudio(attemptId: string, blob: Blob) {
  const form = new FormData();
  form.append('audio', blob, `response-${attemptId}.webm`);
  return apiFetch(ROUTES.STUDENT_PRACTICE_ATTEMPT_AUDIO_UPLOAD(attemptId), {
    method: 'POST',
    body: form,
  }) as Promise<{
    success: boolean;
    audioMetadataId: string;
    byteSize: number;
  }>;
}

export async function submitPracticeAttempt(attemptId: string, payload: {
  answerJson?: string;
  typedText?: string;
  selectedOption?: string;
  selectedMultiple?: string[];
  reorderedList?: string[];
  blanks?: Record<number, string>;
  highlightedIncorrect?: string[];
}) {
  return apiFetch(ROUTES.STUDENT_PRACTICE_ATTEMPT_SUBMIT(attemptId), {
    method: 'POST',
    body: JSON.stringify(payload),
  }) as Promise<{
    success: boolean;
    submissionId: string;
    status: string;
  }>;
}

export async function getPracticeAttempt(attemptId: string) {
  return apiFetch(ROUTES.STUDENT_PRACTICE_ATTEMPT_GET(attemptId)) as Promise<{
    id: string;
    taskCode: string;
    mode: string;
    status: string;
    startedAt: string;
    deadlineAt: string | null;
    submittedAt: string | null;
    hasResponseAudio: boolean;
    submissionId: string | null;
    submissionStatus: string | null;
  }>;
}

export async function getPracticeAttemptResult(attemptId: string) {
  return apiFetch(ROUTES.STUDENT_PRACTICE_ATTEMPT_RESULT(attemptId)) as Promise<{
    id: string;
    score: number | null;
    fluencyScore: number | null;
    pronunciationScore: number | null;
    grammarIssues: number | null;
    feedback: string | null;
    status: string;
  }>;
}
