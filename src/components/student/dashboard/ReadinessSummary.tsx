import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { ProgressBar } from '../../ui/ProgressBar';
import type { DashboardReadiness } from '../../../shared/api/dashboard';

interface ReadinessSummaryProps {
  data?: DashboardReadiness;
}

export function ReadinessSummary({ data }: ReadinessSummaryProps) {
  if (!data) return null;

  const Icon = data.ready ? ShieldCheck : ShieldAlert;
  const iconColor = data.ready ? 'text-success-400' : 'text-warning-400';
  const bgColor = data.ready ? 'bg-success-500/10' : 'bg-warning-500/10';

  return (
    <div className="rounded-2xl border border-dark-border bg-dark-surface p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className={`h-10 w-10 rounded-lg ${bgColor} flex items-center justify-center`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div>
          <p className="text-sm text-gray-400">Readiness</p>
          {data.estimatedScore != null && (
            <p className="text-lg font-bold text-gray-100">{data.estimatedScore}/90</p>
          )}
        </div>
      </div>
      {data.estimatedScore != null && (
        <ProgressBar value={data.estimatedScore} max={90} size="sm" variant={data.ready ? 'success' : 'warning'} />
      )}
      <p className="mt-2 text-sm text-gray-500">{data.message}</p>
      {(data.submissionsCount != null || data.mocksCount != null) && (
        <div className="flex gap-4 mt-3 text-xs text-gray-500">
          {data.submissionsCount != null && <span>{data.submissionsCount} submissions</span>}
          {data.mocksCount != null && <span>{data.mocksCount} mock exams</span>}
        </div>
      )}
    </div>
  );
}
