import { apiFetch } from './client';
import { ROUTES } from '../shared/routes';

export async function loginRequest(email: string, password?: string) {
  return apiFetch(ROUTES.AUTH_LOGIN, {
    method: 'POST',
    body: JSON.stringify({ email, password: password || 'password123' }),
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
