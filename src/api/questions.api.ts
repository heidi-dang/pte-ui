import { apiFetch } from './client';
import { ROUTES } from '../shared/routes';

export interface QuestionFilters {
  taskCode?: string;
  section?: string;
  difficulty?: string;
  limit?: number;
  random?: boolean;
}

export async function getPublishedQuestions(filters: QuestionFilters = {}) {
  const params = new URLSearchParams();
  if (filters.taskCode) params.set('taskCode', filters.taskCode);
  if (filters.section) params.set('section', filters.section);
  if (filters.difficulty) params.set('difficulty', filters.difficulty);
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.random) params.set('random', 'true');
  const query = params.toString();
  return apiFetch(ROUTES.STUDENT_QUESTIONS + (query ? '?' + query : ''));
}

export async function getPublishedQuestionForTask(taskCode: string) {
  const items = await getPublishedQuestions({ taskCode, limit: 1 });
  return items?.[0] || null;
}
