import { useEffect, useState, useCallback, type ComponentType } from 'react';
import { Clock, Award, TrendingUp, BarChart3, Target, BookOpen } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { StudentPageContainer } from '../StudentPageContainer';
import { CardSkeleton } from '../../ui/Skeleton';
import { EmptyState } from '../../ui/EmptyState';
import { ErrorState } from '../../ui/ErrorState';
import { Badge } from '../../ui/Badge';
import { getReportsProgress, getReportsOverview } from '../../../api/student.api';
import type { ReportsOverview, ReportsProgress, ProgressTrend, MockTrend } from '../../../api/student.api';

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

export function PerformancePage() {
  const [state, setState] = useState<'loading' | 'error' | 'empty' | 'success'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [mocks, setMocks] = useState<MockAttempt[]>([]);
  const [overview, setOverview] = useState<ReportsOverview | null>(null);
  const [progress, setProgress] = useState<ReportsProgress | null>(null);
  const [selectedMock, setSelectedMock] = useState<MockAttempt | null>(null);

  const fetchData = useCallback(async () => {
    setState('loading');
    setError(null);
    try {
      const [ov, prog, mockRes] = await Promise.all([
        getReportsOverview().catch(() => null),
        getReportsProgress().catch(() => null),
        fetch('/api/student/mock-tests/attempts').then((r) => r.json()).catch(() => []),
      ]);
      setOverview(ov);
      setProgress(prog);
      const items: MockAttempt[] = (mockRes || []).map((m: any) => ({
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
      setMocks(items);
      if (!items.length && (!ov || (!ov.scoredSubmissions && !ov.completedTests))) {
        setState('empty');
      } else {
        setState('success');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load performance data');
      setState('error');
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const completedMocks = mocks.filter((m) => m.status === 'Completed' && m.overallScore != null);

  const combinedTrend = (() => {
    const map = new Map<string, { practice: number[]; mock: number[] }>();
    (progress?.practiceTrend || []).forEach((p: ProgressTrend) => {
      if (!map.has(p.date)) map.set(p.date, { practice: [], mock: [] });
      map.get(p.date)!.practice.push(p.averageScore);
    });
    (progress?.mockTrend || []).forEach((m: MockTrend) => {
      if (!map.has(m.date)) map.set(m.date, { practice: [], mock: [] });
      map.get(m.date)!.mock.push(m.averageScore);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-20)
      .map(([date, v]) => ({
        date: date.slice(5),
        practice: v.practice.length ? Math.round(v.practice.reduce((a, b) => a + b, 0) / v.practice.length) : undefined,
        mock: v.mock.length ? Math.round(v.mock.reduce((a, b) => a + b, 0) / v.mock.length) : undefined,
      }));
  })();

  const sectionAvg = (() => {
    const scored = completedMocks.filter((m) => m.speakingScore != null);
    if (!scored.length) return null;
    const avg = (key: keyof Pick<MockAttempt, 'speakingScore' | 'writingScore' | 'readingScore' | 'listeningScore'>) =>
      Math.round(scored.reduce((s, m) => s + (m[key] ?? 0), 0) / scored.length);
    return [
      { section: 'Speaking', score: avg('speakingScore') },
      { section: 'Writing', score: avg('writingScore') },
      { section: 'Reading', score: avg('readingScore') },
      { section: 'Listening', score: avg('listeningScore') },
    ];
  })();

  const mockChartData = completedMocks.map((m) => ({
    label: m.date?.slice(5, 10) || 'N/A',
    overall: m.overallScore ?? 0,
    speaking: m.speakingScore ?? 0,
    writing: m.writingScore ?? 0,
    reading: m.readingScore ?? 0,
    listening: m.listeningScore ?? 0,
  }));

  if (state === 'loading') {
    return (
      <StudentPageContainer title="Performance History" maxWidth="xl">
        <div className="space-y-6">
          <CardSkeleton />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
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
        <ErrorState title="Failed to load performance data" message={error || ''} onRetry={fetchData} />
      </StudentPageContainer>
    );
  }

  if (state === 'empty') {
    return (
      <StudentPageContainer maxWidth="md">
        <EmptyState
          icon={<BarChart3 className="h-6 w-6 text-gray-500" />}
          title="No performance data yet"
          description="Complete mock exams and practice submissions to see your performance history"
        />
      </StudentPageContainer>
    );
  }

  return (
    <StudentPageContainer title="Performance History" subtitle="Mock exams and score trends" maxWidth="xl">
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={Award} label="Mock Exams" value={completedMocks.length} color="text-primary-400" />
          <StatCard icon={Target} label="Avg Score" value={completedMocks.length ? Math.round(completedMocks.reduce((s, m) => s + (m.overallScore ?? 0), 0) / completedMocks.length) : '—'} color="text-success-400" />
          <StatCard icon={BookOpen} label="Scored" value={overview?.scoredSubmissions ?? 0} color="text-info-400" />
          <StatCard icon={TrendingUp} label="Current Avg" value={overview?.currentAverage != null ? `${Math.round(overview.currentAverage)}%` : '—'} color="text-warning-400" />
        </div>

        {combinedTrend.length > 0 && (
          <div className="rounded-2xl border border-dark-border bg-dark-surface p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-primary-400" />
              <h3 className="text-sm font-semibold text-gray-100">Score Trend</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={combinedTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: '12px', fontSize: '12px' }}
                    labelStyle={{ color: '#9ca3af' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }} />
                  <Line type="monotone" dataKey="practice" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 3 }} name="Practice" />
                  <Line type="monotone" dataKey="mock" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 3 }} name="Mock" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {sectionAvg && (
          <div className="rounded-2xl border border-dark-border bg-dark-surface p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-4 w-4 text-primary-400" />
              <h3 className="text-sm font-semibold text-gray-100">Section Averages (Mock Exams)</h3>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sectionAvg}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" vertical={false} />
                  <XAxis dataKey="section" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Bar dataKey="score" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {completedMocks.length > 1 && mockChartData.length > 0 && (
          <div className="rounded-2xl border border-dark-border bg-dark-surface p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-4 w-4 text-primary-400" />
              <h3 className="text-sm font-semibold text-gray-100">Mock Breakdown by Section</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }} />
                  <Bar dataKey="speaking" fill="#a855f7" radius={[4, 4, 0, 0]} name="Speaking" />
                  <Bar dataKey="writing" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Writing" />
                  <Bar dataKey="reading" fill="#22c55e" radius={[4, 4, 0, 0]} name="Reading" />
                  <Bar dataKey="listening" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Listening" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {mocks.length > 0 && (
          <div className="rounded-2xl border border-dark-border bg-dark-surface p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-primary-400" />
              <h3 className="text-sm font-semibold text-gray-100">Mock Exam Attempts</h3>
            </div>
            <div className="space-y-2">
              {mocks.map((mock) => {
                const isCompleted = mock.status === 'Completed' && mock.overallScore != null;
                return (
                  <div
                    key={mock.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-dark-border bg-dark-surface-50 hover:border-gray-600 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-mono font-medium text-gray-500 uppercase">{mock.type}</span>
                        <Badge variant={isCompleted ? 'success' : mock.status === 'In Progress' ? 'warning' : 'default'}>
                          {isCompleted ? 'Completed' : mock.status}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-gray-200 truncate">{mock.title}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{mock.date ? new Date(mock.date).toLocaleDateString() : '—'}</p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 ml-4">
                      {isCompleted ? (
                        <div className="flex gap-3 text-xs font-mono">
                          <span className="text-purple-400">{mock.speakingScore ?? '—'}</span>
                          <span className="text-blue-400">{mock.writingScore ?? '—'}</span>
                          <span className="text-success-400">{mock.readingScore ?? '—'}</span>
                          <span className="text-warning-400">{mock.listeningScore ?? '—'}</span>
                        </div>
                      ) : null}
                      <div className="text-right">
                        {isCompleted ? (
                          <span className={`text-lg font-bold tabular-nums ${(mock.overallScore ?? 0) >= 70 ? 'text-success-400' : (mock.overallScore ?? 0) >= 40 ? 'text-warning-400' : 'text-error-400'}`}>
                            {mock.overallScore}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">Pending</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </StudentPageContainer>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
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
