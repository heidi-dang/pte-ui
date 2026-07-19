import { AlertTriangle, TrendingDown } from 'lucide-react';
import { ProgressBar } from '../../ui/ProgressBar';
import type { DashboardWeakArea } from '../../../shared/api/dashboard';

interface WeakAreasProps {
  data?: DashboardWeakArea[];
}

export function WeakAreas({ data }: WeakAreasProps) {
  if (!data || data.length === 0) return null;

  const sorted = [...data].sort((a, b) => a.averageScore - b.averageScore);
  const weakest = sorted.slice(0, 3);

  return (
    <div className="rounded-2xl border border-dark-border bg-dark-surface p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingDown className="h-5 w-5 text-error-400" />
        <h3 className="text-sm font-semibold text-gray-100">Areas to Improve</h3>
      </div>
      <div className="space-y-4">
        {weakest.map((area) => (
          <div key={area.section}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-200">{area.section}</span>
                {area.averageScore < 50 && (
                  <AlertTriangle className="h-3.5 w-3.5 text-error-400" />
                )}
              </div>
              <span className="text-sm text-gray-400">{area.averageScore}/90</span>
            </div>
            <ProgressBar
              value={area.averageScore}
              max={90}
              size="sm"
              variant={area.averageScore < 50 ? 'error' : area.averageScore < 65 ? 'warning' : 'default'}
            />
            {area.tasks.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {area.tasks.map((task) => (
                  <span
                    key={task.taskCode}
                    className="inline-flex items-center gap-1 rounded-md bg-dark-elevated px-2 py-0.5 text-xs text-gray-400"
                  >
                    {task.taskCode}
                    <span className={task.averageScore < 50 ? 'text-error-400' : 'text-gray-500'}>
                      {task.averageScore}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
