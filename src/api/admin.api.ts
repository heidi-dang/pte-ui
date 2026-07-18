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
