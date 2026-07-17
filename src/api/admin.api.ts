import { apiFetch } from './client';

export async function getAdminUsers() {
  return apiFetch('/api/admin/users');
}

export async function getAdminJobs() {
  return apiFetch('/api/admin/jobs');
}

export async function getAdminLogs() {
  return apiFetch('/api/admin/logs');
}

export async function getAdminCoupons() {
  return apiFetch('/api/admin/coupons');
}

export async function getAdminAuditLogs() {
  return apiFetch('/api/admin/audit-logs');
}

export async function createCoupon(code: string, discountPercent: number) {
  return apiFetch('/api/admin/coupons', {
    method: 'POST',
    body: JSON.stringify({ code, discountPercent }),
  });
}

export async function triggerBackup() {
  return apiFetch('/api/admin/backup', { method: 'POST' });
}
