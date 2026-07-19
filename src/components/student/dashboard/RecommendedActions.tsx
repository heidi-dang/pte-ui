import { Lightbulb, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { useStudentRoute } from '../StudentRouteContext';
import type { RecommendedAction } from '../../../shared/api/dashboard';

interface RecommendedActionsProps {
  data?: RecommendedAction[];
}

const priorityOrder = { high: 0, medium: 1, low: 2 };

export function RecommendedActions({ data }: RecommendedActionsProps) {
  const { navigate } = useStudentRoute();

  if (!data || data.length === 0) return null;

  const sorted = [...data].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return (
    <div className="rounded-2xl border border-dark-border bg-dark-surface p-5">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="h-5 w-5 text-primary-400" />
        <h3 className="text-sm font-semibold text-gray-100">Recommended Actions</h3>
      </div>
      <div className="space-y-3">
        {sorted.map((action) => (
          <div
            key={action.id}
            className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-dark-border bg-dark-elevated p-4"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-medium text-gray-100">{action.title}</span>
                {action.priority === 'high' && (
                  <Badge variant="warning">Priority</Badge>
                )}
              </div>
              {action.description && (
                <p className="text-xs text-gray-500">{action.description}</p>
              )}
            </div>
            {action.actionLabel && action.routeId && (
              <Button
                variant={action.priority === 'high' ? 'primary' : 'outline'}
                size="sm"
                icon={action.priority === 'high' ? <Sparkles className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                onClick={() => navigate(action.routeId as any)}
                className="shrink-0 w-full sm:w-auto"
              >
                {action.actionLabel}
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
