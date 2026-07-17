import { apiFetch } from './client';

export async function getTeacherSubmissions() {
  return apiFetch('/api/teacher/submissions');
}

export async function getTeacherStudents() {
  return apiFetch('/api/teacher/students');
}

export async function createCustomQuestion(data: any) {
  return apiFetch('/api/teacher/custom-tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function gradeSubmission(submissionId: string, score: number, feedback: string) {
  return apiFetch('/api/teacher/grade', {
    method: 'PUT',
    body: JSON.stringify({ submissionId, score, feedback }),
  });
}
