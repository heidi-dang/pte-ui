import { Play, ArrowRight } from 'lucide-react';
import { Button } from '../../ui/Button';
import { useStudentRoute } from '../StudentRouteContext';
import type { DashboardContinueActivity } from '../../../shared/api/dashboard';

interface ContinueActivityCardProps {
  data?: DashboardContinueActivity | null;
}

export function ContinueActivityCard({ data }: ContinueActivityCardProps) {
  const { navigate } = useStudentRoute();

  if (!data) return null;

  const handleClick = () => {
    if (data.routeId) {
      navigate(data.routeId as any);
    }
  };

  const iconMap = {
    practice: Play,
    mock: Play,
    study_plan: ArrowRight,
    recommended: Play,
  };
  const Icon = iconMap[data.type] || Play;

  return (
    <div className="rounded-2xl border border-primary-500/30 bg-primary-500/5 p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Icon className="h-5 w-5 text-primary-400 shrink-0" />
            <h3 className="text-base font-semibold text-gray-100">{data.label}</h3>
          </div>
          {data.description && (
            <p className="text-sm text-gray-400">{data.description}</p>
          )}
        </div>
        <Button
          variant="primary"
          size="lg"
          icon={<Play className="h-5 w-5" />}
          onClick={handleClick}
          className="shrink-0 w-full sm:w-auto"
        >
          {data.actionLabel}
        </Button>
      </div>
    </div>
  );
}
