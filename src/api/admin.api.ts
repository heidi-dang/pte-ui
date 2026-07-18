import { apiFetch } from './client';
import { ROUTES } from '../shared/routes';

export async function getAdminUsers() {
  return apiFetch(ROUTES.ADMIN_USERS);
}

export async function getAdminJobs() {
  return apiFetch(ROUTES.ADMIN_JOBS);
}

export async function getAdminLogs() {
  return apiFetch(ROUTES.ADMIN_LOGS);
}

export async function getAdminCoupons() {
  return apiFetch(ROUTES.ADMIN_COUPONS);
}

export async function getAdminAuditLogs() {
  return apiFetch(ROUTES.ADMIN_AUDIT_LOGS);
}

export async function createCoupon(code: string, discountPercent: number, maxUses?: number) {
  return apiFetch(ROUTES.ADMIN_COUPONS, {
    method: 'POST',
    body: JSON.stringify({ code, discountPercent, maxUses }),
  });
}

export async function triggerBackup() {
  return apiFetch(ROUTES.ADMIN_BACKUP, { method: 'POST' });
}

export async function getQuestionBankItems(params?: Record<string, string>) {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  return apiFetch(ROUTES.ADMIN_QUESTION_BANK + query);
}

export async function getQuestionBankItem(id: string) {
  return apiFetch(ROUTES.ADMIN_QUESTION_BANK_ITEM(id));
}

export async function createQuestionBankItem(data: Record<string, any>) {
  return apiFetch(ROUTES.ADMIN_QUESTION_BANK, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateQuestionBankItem(id: string, data: Record<string, any>) {
  return apiFetch(ROUTES.ADMIN_QUESTION_BANK_ITEM(id), {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function updateQuestionBankItemStatus(id: string, status: string) {
  return apiFetch(ROUTES.ADMIN_QUESTION_BANK_STATUS(id), {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function archiveQuestionBankItem(id: string) {
  return apiFetch(ROUTES.ADMIN_QUESTION_BANK_ITEM(id), { method: 'DELETE' });
}

export async function getPublishedQuestions(params?: Record<string, string>) {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  return apiFetch(ROUTES.STUDENT_QUESTIONS + query);
}
