import { History, FileText, ClipboardCheck, BookOpen } from 'lucide-react';
import { Badge } from '../../ui/Badge';
import type { RecentActivityItem } from '../../../shared/api/dashboard';

interface RecentActivityProps {
  data?: RecentActivityItem[];
}

const typeConfig = {
  practice: { icon: FileText, color: 'text-primary-400', bg: 'bg-primary-500/10' },
  mock: { icon: ClipboardCheck, color: 'text-success-400', bg: 'bg-success-500/10' },
  lesson: { icon: BookOpen, color: 'text-info-400', bg: 'bg-info-500/10' },
};

export function RecentActivity({ data }: RecentActivityProps) {
  if (!data || data.length === 0) return null;

  return (
    <div className="rounded-2xl border border-dark-border bg-dark-surface p-5">
      <div className="flex items-center gap-2 mb-4">
        <History className="h-5 w-5 text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-100">Recent Activity</h3>
      </div>
      <div className="space-y-3">
        {data.map((item) => {
          const config = typeConfig[item.type] || typeConfig.practice;
          const Icon = config.icon;
          return (
            <div key={item.id} className="flex items-start gap-3">
              <div className={`h-8 w-8 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`h-4 w-4 ${config.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200 truncate">{item.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-500 capitalize">{item.type}</span>
                  {item.section && <span className="text-xs text-gray-600">· {item.section}</span>}
                  {item.score != null && (
                    <Badge variant={item.score >= 65 ? 'success' : 'warning'}>{item.score}</Badge>
                  )}
                  {item.status === 'pending' && <Badge variant="info">Pending</Badge>}
                </div>
              </div>
              <span className="text-xs text-gray-600 shrink-0">
                {formatRelativeTime(item.date)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString();
}
