export type StudentRouteId =
  | 'dashboard'
  | 'practice'
  | 'practice-task'
  | 'practice-questions'
  | 'practice-session'
  | 'mock-exams'
  | 'mock-exam-session'
  | 'study-plan'
  | 'analytics'
  | 'analytics-task'
  | 'review'
  | 'review-detail'
  | 'results'
  | 'performance'
  | 'assignments'
  | 'assignment-detail'
  | 'bookmarks'
  | 'achievements'
  | 'subscription'
  | 'profile'
  | 'settings'
  | 'support';

export interface StudentRoute {
  id: StudentRouteId;
  label: string;
  path: string;
  icon?: string;
  badge?: number;
  group: 'primary' | 'secondary' | 'tertiary';
}

export const STUDENT_ROUTES: StudentRoute[] = [
  { id: 'dashboard', label: 'Dashboard', path: '/student/dashboard', icon: 'LayoutDashboard', group: 'primary' },
  { id: 'practice', label: 'Practice', path: '/student/practice', icon: 'Compass', group: 'primary' },
  { id: 'mock-exams', label: 'Mock Exams', path: '/student/mock-exams', icon: 'Activity', group: 'primary' },
  { id: 'study-plan', label: 'Study Plan', path: '/student/study-plan', icon: 'Calendar', group: 'primary' },
  { id: 'analytics', label: 'Analytics', path: '/student/analytics', icon: 'BarChart3', group: 'secondary' },
  { id: 'review', label: 'Review', path: '/student/review', icon: 'Search', group: 'secondary' },
  { id: 'performance', label: 'History', path: '/student/performance', icon: 'Clock', group: 'secondary' },
  { id: 'assignments', label: 'Assignments', path: '/student/assignments', icon: 'ClipboardList', group: 'secondary' },
  { id: 'bookmarks', label: 'Bookmarks', path: '/student/bookmarks', icon: 'Bookmark', group: 'secondary' },
  { id: 'achievements', label: 'Achievements', path: '/student/achievements', icon: 'Trophy', group: 'secondary' },
  { id: 'subscription', label: 'Subscription', path: '/student/subscription', icon: 'Sparkles', group: 'tertiary' },
  { id: 'profile', label: 'Profile', path: '/student/profile', icon: 'User', group: 'tertiary' },
  { id: 'settings', label: 'Settings', path: '/student/settings', icon: 'Settings', group: 'tertiary' },
  { id: 'support', label: 'Help & Support', path: '/student/support', icon: 'HelpCircle', group: 'tertiary' },
];

export const MOBILE_BOTTOM_ROUTES: StudentRoute[] = [
  { id: 'dashboard', label: 'Home', path: '/student/dashboard', icon: 'LayoutDashboard', group: 'primary' },
  { id: 'practice', label: 'Practice', path: '/student/practice', icon: 'Compass', group: 'primary' },
  { id: 'mock-exams', label: 'Mock', path: '/student/mock-exams', icon: 'Activity', group: 'primary' },
  { id: 'analytics', label: 'Progress', path: '/student/analytics', icon: 'BarChart3', group: 'secondary' },
];

export const DESKTOP_SIDEBAR_ROUTES = STUDENT_ROUTES;

export function getRouteByPath(path: string): StudentRoute | undefined {
  return STUDENT_ROUTES.find((r) => r.path === path);
}
