export interface DashboardGreeting {
  name: string;
  streakDays?: number;
  lastActive?: string;
}

export interface DashboardTargetScore {
  current: number;
  target: number;
}

export interface DashboardExamDate {
  date?: string;
  daysRemaining?: number;
}

export interface DashboardContinueActivity {
  type: 'practice' | 'mock' | 'study_plan' | 'recommended';
  label: string;
  actionLabel: string;
  routeId: string;
  description?: string;
  attemptId?: string;
}

export interface DashboardReadiness {
  ready: boolean;
  estimatedScore?: number;
  message?: string;
  submissionsCount?: number;
  mocksCount?: number;
}

export interface DailyPlanItem {
  title: string;
  completed: boolean;
  duration?: number;
}

export interface DashboardDailyPlan {
  date: string;
  items: DailyPlanItem[];
  totalDuration?: number;
  completedItems?: number;
  totalItems?: number;
}

export interface RecommendedAction {
  id: string;
  title: string;
  description?: string;
  priority: 'high' | 'medium' | 'low';
  actionLabel?: string;
  routeId?: string;
}

export interface RecentActivityItem {
  id: string;
  type: 'practice' | 'mock' | 'lesson';
  title: string;
  score?: number;
  status?: string;
  date: string;
  section?: string;
}

export interface WeakAreaTask {
  taskCode: string;
  averageScore: number;
  count: number;
}

export interface DashboardWeakArea {
  section: string;
  averageScore: number;
  tasks: WeakAreaTask[];
}

export interface UpcomingItem {
  id: string;
  title: string;
  dueDate?: string;
  type: 'assignment' | 'mock' | 'lesson' | 'study';
}

export interface DashboardSubscription {
  tier: 'free' | 'premium';
  expiresAt?: string | null;
}

export interface DashboardData {
  greeting?: DashboardGreeting;
  targetScore?: DashboardTargetScore;
  examDate?: DashboardExamDate;
  continueActivity?: DashboardContinueActivity | null;
  readiness?: DashboardReadiness;
  dailyPlan?: DashboardDailyPlan;
  recommendedActions?: RecommendedAction[];
  recentActivity?: RecentActivityItem[];
  weakAreas?: DashboardWeakArea[];
  upcomingItems?: UpcomingItem[];
  subscription?: DashboardSubscription;
}
