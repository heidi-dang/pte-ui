import { apiFetch } from './client';
import { ROUTES } from '../shared/routes';
import type {
  StartAttemptData,
  PlayPromptData,
  UploadAudioData,
  SubmitAttemptData,
  GetAttemptData,
  GetAttemptResultData,
  QuestionListParams,
  QuestionListResponse,
  TaskCount,
} from '../shared/api/practice';

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
}): Promise<StartAttemptData> {
  return apiFetch<StartAttemptData>(ROUTES.STUDENT_PRACTICE_ATTEMPT_START, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function playPromptAudio(attemptId: string): Promise<PlayPromptData> {
  return apiFetch<PlayPromptData>(ROUTES.STUDENT_PRACTICE_ATTEMPT_PLAY_PROMPT(attemptId), {
    method: 'POST',
  });
}

export async function uploadPracticeResponseAudio(attemptId: string, blob: Blob): Promise<UploadAudioData> {
  const form = new FormData();
  form.append('audio', blob, `response-${attemptId}.webm`);
  return apiFetch<UploadAudioData>(ROUTES.STUDENT_PRACTICE_ATTEMPT_AUDIO_UPLOAD(attemptId), {
    method: 'POST',
    body: form,
  });
}

export async function submitPracticeAttempt(attemptId: string, payload: {
  answerJson?: string;
  typedText?: string;
  selectedOption?: string;
  selectedMultiple?: string[];
  reorderedList?: string[];
  blanks?: Record<number, string>;
  highlightedIncorrect?: string[];
}): Promise<SubmitAttemptData> {
  return apiFetch<SubmitAttemptData>(ROUTES.STUDENT_PRACTICE_ATTEMPT_SUBMIT(attemptId), {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getPracticeAttempt(attemptId: string): Promise<GetAttemptData> {
  return apiFetch<GetAttemptData>(ROUTES.STUDENT_PRACTICE_ATTEMPT_GET(attemptId));
}

export async function getPracticeAttemptResult(attemptId: string): Promise<GetAttemptResultData> {
  return apiFetch<GetAttemptResultData>(ROUTES.STUDENT_PRACTICE_ATTEMPT_RESULT(attemptId));
}

export async function listPracticeQuestions(params: QuestionListParams = {}): Promise<QuestionListResponse> {
  const qs = new URLSearchParams();
  if (params.taskCode) qs.set('taskCode', params.taskCode);
  if (params.section) qs.set('section', params.section);
  if (params.difficulty) qs.set('difficulty', params.difficulty);
  if (params.search) qs.set('search', params.search);
  if (params.page) qs.set('page', String(params.page));
  if (params.pageSize) qs.set('pageSize', String(params.pageSize));
  if (params.random) qs.set('random', params.random);
  return apiFetch<QuestionListResponse>(`${ROUTES.STUDENT_PRACTICE_QUESTIONS}?${qs.toString()}`);
}

export async function getTaskCounts(): Promise<TaskCount[]> {
  return apiFetch<TaskCount[]>(ROUTES.STUDENT_PRACTICE_QUESTIONS_COUNTS);
}
