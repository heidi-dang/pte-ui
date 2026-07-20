import { apiFetch } from './client';
import { ROUTES } from '../shared/routes';
import type { QuestionListResponse } from '../shared/api/practice';

export interface QuestionFilters {
  taskCode?: string;
  section?: string;
  difficulty?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  limit?: number;
  random?: boolean;
}

export async function getPublishedQuestions(filters: QuestionFilters = {}): Promise<QuestionListResponse> {
  const params = new URLSearchParams();
  if (filters.taskCode) params.set('taskCode', filters.taskCode);
  if (filters.section) params.set('section', filters.section);
  if (filters.difficulty) params.set('difficulty', filters.difficulty);
  if (filters.search) params.set('search', filters.search);
  if (filters.page) params.set('page', String(filters.page));
  const pageSize = filters.pageSize ?? filters.limit;
  if (pageSize) params.set('pageSize', String(pageSize));
  if (filters.random) params.set('random', 'true');
  const query = params.toString();
  return apiFetch<QuestionListResponse>(ROUTES.STUDENT_QUESTIONS + (query ? '?' + query : ''));
}

export async function getPublishedQuestionForTask(taskCode: string) {
  const result = await getPublishedQuestions({ taskCode, pageSize: 1 });
  return result.items?.[0] ?? null;
}
