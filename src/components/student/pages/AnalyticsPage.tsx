import { useEffect, useState, useCallback, type ComponentType } from 'react';
import { BarChart, TrendingUp, Clock, BookOpen, Award, Target, ArrowUp, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StudentPageContainer } from '../StudentPageContainer';
import { CardSkeleton } from '../../ui/Skeleton';
import { EmptyState } from '../../ui/EmptyState';
import { ErrorState } from '../../ui/ErrorState';
import { Badge } from '../../ui/Badge';
import { ProgressBar } from '../../ui/ProgressBar';
import {
  getReportsOverview,
  getReportsProgress,
  getReportsSections,
  getReportsTasks,
  getReportsRecentActivity,
} from '../../../api/student.api';
import type {
  ReportsOverview,
  ReportsProgress,
  SectionReport,
  TaskBreakdown,
  RecentActivityItem,
} from '../../../api/student.api';

const sectionBadge: Record<string, 'premium' | 'info' | 'success' | 'warning'> = {
  Speaking: 'premium',
  Writing: 'info',
  Reading: 'success',
  Listening: 'warning',
};

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-xs text-gray-500">N/A</span>;
  const color = score >= 70 ? 'text-success-400' : score >= 40 ? 'text-warning-400' : 'text-error-400';
  return <span className={`text-sm font-bold tabular-nums ${color}`}>{Math.round(score)}%</span>;
}

export function AnalyticsPage() {
  const [state, setState] = useState<'loading' | 'error' | 'empty' | 'success'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<ReportsOverview | null>(null);
  const [sections, setSections] = useState<SectionReport[]>([]);
  const [tasks, setTasks] = useState<TaskBreakdown[]>([]);
  const [progress, setProgress] = useState<ReportsProgress | null>(null);
  const [activity, setActivity] = useState<RecentActivityItem[]>([]);

  const fetchData = useCallback(async () => {
    setState('loading');
    setError(null);
    try {
      const [ov, sec, tsk, prog, act] = await Promise.all([
        getReportsOverview(),
        getReportsSections(),
        getReportsTasks(),
        getReportsProgress(),
        getReportsRecentActivity(),
      ]);
      setOverview(ov);
      setSections(sec);
      setTasks(tsk);
      setProgress(prog);
      setActivity(act);
      if (!ov.scoredSubmissions && !ov.completedTests && !ov.completedLessons) {
        setState('empty');
      } else {
        setState('success');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics');
      setState('error');
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const chartData = (progress?.practiceTrend || []).slice(-14).map((p) => ({
    date: p.date.slice(5),
    score: p.averageScore,
  }));

  if (state === 'loading') {
    return (
      <StudentPageContainer title="Tracked Progress" maxWidth="xl">
        <div className="space-y-6">
          <CardSkeleton />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </StudentPageContainer>
    );
  }

  if (state === 'error') {
    return (
      <StudentPageContainer maxWidth="md">
        <ErrorState title="Failed to load progress" message={error || ''} onRetry={fetchData} />
      </StudentPageContainer>
    );
  }

  if (state === 'empty') {
    return (
      <StudentPageContainer maxWidth="md">
        <EmptyState
          icon={<Activity className="h-6 w-6 text-gray-500" />}
          title="No progress data yet"
          description="Complete practice sessions and mock tests to see your tracked progress here"
        />
      </StudentPageContainer>
    );
  }

  return (
    <StudentPageContainer title="Tracked Progress" subtitle="Performance across all sections" maxWidth="xl">
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <SummaryCard icon={Award} label="Scored" value={overview?.scoredSubmissions ?? 0} color="text-success-400" />
          <SummaryCard icon={Clock} label="Pending" value={overview?.pendingSubmissions ?? 0} color="text-warning-400" />
          <SummaryCard icon={Target} label="Mock Tests" value={overview?.completedTests ?? 0} color="text-primary-400" />
          <SummaryCard icon={BookOpen} label="Lessons" value={overview?.completedLessons ?? 0} color="text-purple-400" />
        </div>

        <div className="rounded-2xl border border-dark-border bg-dark-surface p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-primary-400" />
            <h3 className="text-sm font-semibold text-gray-100">Score Trend</h3>
          </div>
          {chartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: '#1a1a2e',
                      border: '1px solid #2a2a3e',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                    labelStyle={{ color: '#9ca3af' }}
                  />
                  <Line type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center">
              <p className="text-sm text-gray-500">No trend data available yet</p>
            </div>
          )}
        </div>

        {sections.length > 0 && (
          <div className="rounded-2xl border border-dark-border bg-dark-surface p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart className="h-4 w-4 text-primary-400" />
              <h3 className="text-sm font-semibold text-gray-100">Section Performance</h3>
            </div>
            <div className="space-y-4">
              {sections.map((sec) => (
                <div key={sec.section}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Badge variant={sectionBadge[sec.section] || 'default'}>{sec.section}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <ScoreBadge score={sec.averageScore} />
                      <span className="text-[11px] text-gray-500">({sec.scoredSubmissions} scored)</span>
                    </div>
                  </div>
                  <ProgressBar
                    value={sec.averageScore ?? 0}
                    max={100}
                    variant={sec.section === 'Reading' ? 'success' : sec.section === 'Listening' ? 'warning' : 'default'}
                    size="md"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {tasks.length > 0 && (
          <div className="rounded-2xl border border-dark-border bg-dark-surface p-5">
            <div className="flex items-center gap-2 mb-4">
              <ArrowUp className="h-4 w-4 text-primary-400" />
              <h3 className="text-sm font-semibold text-gray-100">Task Breakdown</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
              {tasks.map((t) => (
                <div
                  key={t.taskCode}
                  className="flex items-center justify-between p-3 rounded-xl border border-dark-border bg-dark-surface-50"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs font-mono font-semibold text-primary-400">{t.taskCode}</span>
                      <Badge variant={sectionBadge[t.section] || 'default'}>{t.section}</Badge>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      {t.scored} scored{t.pending > 0 ? `, ${t.pending} pending` : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <ScoreBadge score={t.averageScore} />
                    {t.recentScores.length > 0 && (
                      <div className="flex gap-0.5 mt-1 justify-end">
                        {t.recentScores.slice(-5).map((s, i) => (
                          <div
                            key={i}
                            className={`h-1.5 w-3 rounded-sm ${
                              s >= 70 ? 'bg-success-500' : s >= 40 ? 'bg-warning-500' : 'bg-error-500'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activity.length > 0 && (
          <div className="rounded-2xl border border-dark-border bg-dark-surface p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-primary-400" />
              <h3 className="text-sm font-semibold text-gray-100">Recent Activity</h3>
            </div>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {activity.slice(0, 10).map((a, i) => (
                <div
                  key={a.id || i}
                  className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-dark-surface-50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-medium text-gray-400">{a.taskCode || a.type}</span>
                      <span className="text-sm text-gray-200 truncate">{a.title}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {new Date(a.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="shrink-0 ml-3">
                    {a.score != null ? (
                      <ScoreBadge score={a.score} />
                    ) : (
                      <Badge variant="default">{a.status || 'pending'}</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </StudentPageContainer>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-dark-border bg-dark-surface p-4">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-dark-surface-50 flex items-center justify-center">
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
        <div>
          <p className="text-[11px] text-gray-500">{label}</p>
          <p className={`text-lg font-bold tabular-nums ${color}`}>{value}</p>
        </div>
      </div>
    </div>
  );
}
