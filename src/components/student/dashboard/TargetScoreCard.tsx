import { Target } from 'lucide-react';
import { ProgressBar } from '../../ui/ProgressBar';
import type { DashboardTargetScore } from '../../../shared/api/dashboard';

interface TargetScoreCardProps {
  data?: DashboardTargetScore;
}

export function TargetScoreCard({ data }: TargetScoreCardProps) {
  if (!data) return null;

  const gap = data.target - data.current;
  const progressPct = data.target > 0 ? Math.min((data.current / data.target) * 100, 100) : 0;

  return (
    <div className="rounded-2xl border border-dark-border bg-dark-surface p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-lg bg-primary-500/10 flex items-center justify-center">
          <Target className="h-5 w-5 text-primary-400" />
        </div>
        <div>
          <p className="text-sm text-gray-400">Target Score</p>
          <p className="text-lg font-bold text-gray-100">
            {data.current} / {data.target}
          </p>
        </div>
      </div>
      <ProgressBar value={data.current} max={data.target} size="sm" variant="default" />
      <p className="mt-2 text-xs text-gray-500">
        {gap > 0
          ? `${gap} points to reach your target`
          : 'Target achieved! 🎉'}
      </p>
    </div>
  );
}
