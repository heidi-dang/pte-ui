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
