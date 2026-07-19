export interface PracticeTaskOverviewItem {
  taskCode: string;
  questionCount: number;
  averageScore: number | null;
  lastAttemptedAt: string | null;
  totalAttempts: number;
}

export type PracticeOverviewResponse = PracticeTaskOverviewItem[];
