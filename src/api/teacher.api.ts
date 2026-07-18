import { apiFetch } from './client';
import { ROUTES } from '../shared/routes';

export async function getTeacherSubmissions() {
  return apiFetch(ROUTES.TEACHER_SUBMISSIONS);
}

export async function getTeacherStudents() {
  return apiFetch(ROUTES.TEACHER_STUDENTS);
}

export async function createCustomQuestion(data: any) {
  return apiFetch(ROUTES.TEACHER_CUSTOM_TASKS, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function gradeSubmission(submissionId: string, score: number, feedback: string) {
  return apiFetch(ROUTES.TEACHER_GRADE, {
    method: 'PUT',
    body: JSON.stringify({ submissionId, score, feedback }),
  });
}
