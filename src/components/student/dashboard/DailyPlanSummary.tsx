import { BookOpen, CheckCircle2, Circle } from 'lucide-react';
import type { DashboardDailyPlan } from '../../../shared/api/dashboard';

interface DailyPlanSummaryProps {
  data?: DashboardDailyPlan;
}

export function DailyPlanSummary({ data }: DailyPlanSummaryProps) {
  if (!data || !data.items || data.items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-dark-border bg-dark-surface p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-lg bg-info-500/10 flex items-center justify-center">
          <BookOpen className="h-5 w-5 text-info-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-100">Today's Study Plan</h3>
          <p className="text-xs text-gray-500">
            {data.completedItems != null && data.totalItems != null
              ? `${data.completedItems} of ${data.totalItems} completed`
              : `${data.items.length} tasks`}
            {data.totalDuration != null && ` · ~${data.totalDuration} min`}
          </p>
        </div>
      </div>
      <ul className="space-y-2">
        {data.items.map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            {item.completed ? (
              <CheckCircle2 className="h-5 w-5 text-success-400 shrink-0 mt-0.5" />
            ) : (
              <Circle className="h-5 w-5 text-gray-600 shrink-0 mt-0.5" />
            )}
            <div className="min-w-0 flex-1">
              <p className={`text-sm ${item.completed ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                {item.title}
              </p>
              {item.duration != null && (
                <p className="text-xs text-gray-600">{item.duration} min</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
