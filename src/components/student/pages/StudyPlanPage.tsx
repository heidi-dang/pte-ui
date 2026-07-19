import { useEffect, useState, useCallback } from 'react';
import { Calendar, BookOpen, CheckCircle2, Circle, RefreshCw } from 'lucide-react';
import { StudentPageContainer } from '../StudentPageContainer';
import { CardSkeleton } from '../../ui/Skeleton';
import { EmptyState } from '../../ui/EmptyState';
import { ErrorState } from '../../ui/ErrorState';
import { Button } from '../../ui/Button';

interface PlanItem {
  title: string;
  duration?: number;
  completed?: boolean;
  reason?: string;
  priority?: string;
}

interface StudyPlanData {
  date: string;
  items: PlanItem[];
  totalDuration?: number;
  completedItems?: number;
  totalItems?: number;
}

export function StudyPlanPage() {
  const [state, setState] = useState<'loading' | 'error' | 'empty' | 'success'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<StudyPlanData | null>(null);

  const fetchData = useCallback(async () => {
    setState('loading');
    setError(null);
    try {
      const res = await fetch('/api/student/study-plan');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data || !data.items || data.items.length === 0) {
        setState('empty');
      } else {
        setPlan(data);
        setState('success');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load study plan');
      setState('error');
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRegenerate = async () => {
    try {
      await fetch('/api/student/study-plan/regenerate', { method: 'POST' });
      fetchData();
    } catch {}
  };

  if (state === 'loading') {
    return (
      <StudentPageContainer title="Study Plan" maxWidth="xl">
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </StudentPageContainer>
    );
  }

  if (state === 'error') {
    return (
      <StudentPageContainer maxWidth="md">
        <ErrorState title="Failed to load study plan" message={error || ''} onRetry={fetchData} />
      </StudentPageContainer>
    );
  }

  if (state === 'empty') {
    return (
      <StudentPageContainer maxWidth="md">
        <EmptyState
          icon={<Calendar className="h-6 w-6 text-gray-500" />}
          title="No study plan yet"
          description="Complete a diagnostic test to get a personalized study plan"
        />
      </StudentPageContainer>
    );
  }

  return (
    <StudentPageContainer title="Study Plan" subtitle={plan?.date ? new Date(plan.date).toLocaleDateString() : undefined} maxWidth="xl">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">
              {plan?.completedItems != null && plan?.totalItems != null
                ? `${plan.completedItems} of ${plan.totalItems} completed`
                : `${plan?.items.length || 0} tasks`}
              {plan?.totalDuration != null && ` · ~${plan.totalDuration} min`}
            </p>
          </div>
          <Button size="sm" variant="ghost" onClick={handleRegenerate} icon={<RefreshCw className="h-4 w-4" />}>
            Regenerate
          </Button>
        </div>

        <div className="rounded-xl border border-dark-border bg-dark-surface overflow-hidden">
          {plan?.items.map((item, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 p-4 ${i < (plan?.items.length || 0) - 1 ? 'border-b border-dark-border' : ''}`}
            >
              {item.completed ? (
                <CheckCircle2 className="h-5 w-5 text-success-400 shrink-0 mt-0.5" />
              ) : (
                <Circle className="h-5 w-5 text-gray-600 shrink-0 mt-0.5" />
              )}
              <div className="min-w-0 flex-1">
                <p className={`text-sm ${item.completed ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                  {item.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {item.duration != null && (
                    <span className="text-xs text-gray-600">{item.duration} min</span>
                  )}
                  {item.reason && (
                    <span className="text-xs text-gray-600">{item.reason}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </StudentPageContainer>
  );
}
