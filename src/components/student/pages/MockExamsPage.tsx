import { useEffect, useState, useCallback } from 'react';
import { FileText, Clock, Award, ChevronRight, RefreshCw } from 'lucide-react';
import { StudentPageContainer } from '../StudentPageContainer';
import { CardSkeleton } from '../../ui/Skeleton';
import { EmptyState } from '../../ui/EmptyState';
import { ErrorState } from '../../ui/ErrorState';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';

interface MockAttempt {
  id: string;
  title: string;
  type: string;
  date: string;
  overallScore: number | null;
  speakingScore: number | null;
  writingScore: number | null;
  readingScore: number | null;
  listeningScore: number | null;
  status: string;
}

export function MockExamsPage() {
  const [state, setState] = useState<'loading' | 'error' | 'empty' | 'success'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<MockAttempt[]>([]);

  const fetchData = useCallback(async () => {
    setState('loading');
    setError(null);
    try {
      const res = await fetch('/api/student/mock-tests/attempts');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const items: MockAttempt[] = (data || []).map((m: any) => ({
        id: m.id,
        title: m.title || 'Mock Exam',
        type: m.type || 'Full',
        date: m.date || m.submittedAt || '',
        overallScore: m.overallScore ?? null,
        speakingScore: m.speakingScore ?? null,
        writingScore: m.writingScore ?? null,
        readingScore: m.readingScore ?? null,
        listeningScore: m.listeningScore ?? null,
        status: m.status || 'Completed',
      }));
      setAttempts(items);
      setState(items.length > 0 ? 'success' : 'empty');
    } catch (err: any) {
      setError(err.message || 'Failed to load mock exams');
      setState('error');
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (state === 'loading') {
    return (
      <StudentPageContainer title="Mock Exams" maxWidth="xl">
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </StudentPageContainer>
    );
  }

  if (state === 'error') {
    return (
      <StudentPageContainer maxWidth="md">
        <ErrorState title="Failed to load mock exams" message={error || ''} onRetry={fetchData} />
      </StudentPageContainer>
    );
  }

  if (state === 'empty') {
    return (
      <StudentPageContainer maxWidth="md">
        <EmptyState
          icon={<FileText className="h-6 w-6 text-gray-500" />}
          title="No mock exams yet"
          description="Complete a full-length mock exam to track your progress across all PTE sections"
        />
      </StudentPageContainer>
    );
  }

  return (
    <StudentPageContainer title="Mock Exams" subtitle={`${attempts.length} attempt${attempts.length !== 1 ? 's' : ''}`} maxWidth="xl">
      <div className="space-y-3">
        {attempts.map((a) => {
          const completed = a.status === 'Completed' && a.overallScore != null;
          return (
            <div
              key={a.id}
              className="rounded-xl border border-dark-border bg-dark-surface p-4 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-mono font-medium text-gray-500 uppercase">{a.type}</span>
                    <Badge variant={completed ? 'success' : a.status === 'In Progress' ? 'warning' : 'default'}>
                      {completed ? 'Scored' : a.status}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-gray-200 truncate">{a.title}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {a.date ? new Date(a.date).toLocaleDateString() : '—'}
                  </p>
                </div>
                {completed && (
                  <div className="flex items-center gap-4 shrink-0 ml-4">
                    <div className="hidden sm:flex gap-3 text-xs font-mono tabular-nums">
                      <span className="text-purple-400">{a.speakingScore ?? '—'}</span>
                      <span className="text-blue-400">{a.writingScore ?? '—'}</span>
                      <span className="text-success-400">{a.readingScore ?? '—'}</span>
                      <span className="text-warning-400">{a.listeningScore ?? '—'}</span>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-gray-500">Score</span>
                      </div>
                      <span className={`text-lg font-bold tabular-nums ${
                        (a.overallScore ?? 0) >= 70 ? 'text-success-400' : (a.overallScore ?? 0) >= 40 ? 'text-warning-400' : 'text-error-400'
                      }`}>
                        {a.overallScore}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              {completed && (
                <div className="sm:hidden flex gap-2 mt-3 pt-3 border-t border-dark-border">
                  <span className="text-[11px] text-purple-400">S: {a.speakingScore ?? '—'}</span>
                  <span className="text-[11px] text-blue-400">W: {a.writingScore ?? '—'}</span>
                  <span className="text-[11px] text-success-400">R: {a.readingScore ?? '—'}</span>
                  <span className="text-[11px] text-warning-400">L: {a.listeningScore ?? '—'}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </StudentPageContainer>
  );
}
