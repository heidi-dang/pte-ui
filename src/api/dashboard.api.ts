import { apiFetch } from './client';
import { ROUTES } from '../shared/routes';
import type { DashboardData } from '../shared/api/dashboard';

export async function getDashboardData(): Promise<DashboardData> {
  return apiFetch<DashboardData>(ROUTES.STUDENT_DASHBOARD);
}
