export const ROUTES = {
  AUTH_LOGIN: '/api/auth/login',
  AUTH_SIGNUP: '/api/auth/signup',
  AUTH_ME: '/api/auth/me',
  AUTH_FORGOT_PASSWORD: '/api/auth/forgot-password',
  AUTH_RESET_PASSWORD: '/api/auth/reset-password',
  AUTH_CHANGE_PASSWORD: '/api/auth/change-password',
  STUDENT_NOTIFICATIONS: '/api/student/notifications',
  STUDENT_NOTIFICATIONS_READ_ALL: '/api/student/notifications/read-all',
  SEED: '/api/seed',
} as const;
