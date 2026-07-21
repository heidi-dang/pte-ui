import { apiFetch } from './client';
import { ROUTES } from '../shared/routes';

export async function loginRequest(email: string, password: string) {
  return apiFetch(ROUTES.AUTH_LOGIN, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function registerRequest(name: string, email: string, password: string, role = 'student', targetScore = 79) {
  return apiFetch(ROUTES.AUTH_SIGNUP, {
    method: 'POST',
    body: JSON.stringify({ name, email, password, role, targetScore }),
  });
}

export async function getMeRequest() {
  return apiFetch(ROUTES.AUTH_ME);
}

export async function logoutRequest() {
  return apiFetch(ROUTES.AUTH_LOGOUT, { method: 'POST' });
}

export async function forgotPasswordRequest(email: string) {
  return apiFetch(ROUTES.AUTH_FORGOT_PASSWORD, {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPasswordRequest(token: string, newPassword: string) {
  return apiFetch(ROUTES.AUTH_RESET_PASSWORD, {
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
  });
}

export async function changePasswordRequest(currentPassword: string, newPassword: string) {
  return apiFetch(ROUTES.AUTH_CHANGE_PASSWORD, {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}
