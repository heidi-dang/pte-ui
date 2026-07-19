import { Calendar } from 'lucide-react';
import type { DashboardExamDate } from '../../../shared/api/dashboard';

interface ExamDateCardProps {
  data?: DashboardExamDate;
}

export function ExamDateCard({ data }: ExamDateCardProps) {
  if (!data) return null;

  return (
    <div className="rounded-2xl border border-dark-border bg-dark-surface p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-10 w-10 rounded-lg bg-warning-500/10 flex items-center justify-center">
          <Calendar className="h-5 w-5 text-warning-400" />
        </div>
        <div>
          <p className="text-sm text-gray-400">Exam Date</p>
          {data.date && (
            <p className="text-sm font-semibold text-gray-100">
              {new Date(data.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>
      </div>
      {data.daysRemaining != null && (
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-gray-100">{data.daysRemaining}</span>
          <span className="text-sm text-gray-500">days remaining</span>
        </div>
      )}
    </div>
  );
}
