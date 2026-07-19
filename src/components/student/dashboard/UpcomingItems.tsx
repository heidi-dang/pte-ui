import { CalendarCheck, FileText, ClipboardCheck, BookOpen, GraduationCap } from 'lucide-react';
import type { UpcomingItem } from '../../../shared/api/dashboard';

interface UpcomingItemsProps {
  data?: UpcomingItem[];
}

const typeConfig = {
  assignment: { icon: FileText, color: 'text-primary-400' },
  mock: { icon: ClipboardCheck, color: 'text-success-400' },
  lesson: { icon: BookOpen, color: 'text-info-400' },
  study: { icon: GraduationCap, color: 'text-warning-400' },
};

export function UpcomingItems({ data }: UpcomingItemsProps) {
  if (!data || data.length === 0) return null;

  return (
    <div className="rounded-2xl border border-dark-border bg-dark-surface p-5">
      <div className="flex items-center gap-2 mb-4">
        <CalendarCheck className="h-5 w-5 text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-100">Upcoming</h3>
      </div>
      <div className="space-y-3">
        {data.map((item) => {
          const config = typeConfig[item.type] || typeConfig.study;
          const Icon = config.icon;
          return (
            <div key={item.id} className="flex items-start gap-3">
              <Icon className={`h-5 w-5 ${config.color} shrink-0 mt-0.5`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200">{item.title}</p>
                {item.dueDate && (
                  <p className="text-xs text-gray-500">
                    Due: {new Date(item.dueDate).toLocaleDateString()}
                  </p>
                )}
              </div>
              <span className="text-xs capitalize text-gray-600 shrink-0">{item.type}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
