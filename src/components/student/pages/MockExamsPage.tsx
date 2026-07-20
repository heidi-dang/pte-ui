import { useEffect, useState, useCallback } from 'react';
import { FileText, Play, RefreshCw, Clock, Award, ChevronRight, AlertCircle, BarChart3 } from 'lucide-react';
import { StudentPageContainer } from '../StudentPageContainer';
import { CardSkeleton } from '../../ui/Skeleton';
import { EmptyState } from '../../ui/EmptyState';
import { ErrorState } from '../../ui/ErrorState';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { getMockAttempts } from '../../../api/student.api';
import { MockTestEngine } from '../../MockTestEngine';

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

interface MockTestOption {
  type: string;
  label: string;
  description: string;
  duration: string;
  icon: string;
  isLocked?: boolean;
}

const MOCK_OPTIONS: MockTestOption[] = [
  { type: 'mini', label: 'Mini Mock Test', description: 'Quick mixed-topic mock exam covering all sections', duration: '~15 min', icon: 'Zap' },
  { type: 'section', label: 'Section Mock Test', description: 'Focus on one PTE section at a time', duration: '~30 min', icon: 'BookOpen' },
  { type: 'full', label: 'Full Mock Test', description: 'Complete PTE Academic mock exam with all sections', duration: '~2 hours', icon: 'Award' },
];

export function MockExamsPage() {
  const [state, setState] = useState<'loading' | 'error' | 'success'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<MockAttempt[]>([]);
  const [activeAttempt, setActiveAttempt] = useState<MockAttempt | null>(null);
  const [showEngine, setShowEngine] = useState(false);
  const [resumeData, setResumeData] = useState<any>(null);

  const fetchData = useCallback(async () => {
    setState('loading');
    setError(null);
    try {
      const [attemptsData, activeData] = await Promise.all([
        getMockAttempts().catch(() => []),
        fetch('/api/student/mock-tests/active', { headers: { Authorization: `Bearer ${localStorage.getItem('pte_token')}` } })
          .then(r => r.json()).catch(() => ({ activeAttempt: null })),
      ]);
      const items: MockAttempt[] = (attemptsData || []).map((m: any) => ({
        id: m.id, title: m.title || 'Mock Exam', type: m.type || 'Full',
        date: m.date || m.submittedAt || '', overallScore: m.overallScore ?? null,
        speakingScore: m.speakingScore ?? null, writingScore: m.writingScore ?? null,
        readingScore: m.readingScore ?? null, listeningScore: m.listeningScore ?? null,
        status: m.status || 'Completed',
      }));
      setAttempts(items);

      if (activeData?.activeAttempt) {
        const a = activeData.activeAttempt;
        setActiveAttempt({
          id: a.id, title: a.title || 'Mock Exam', type: a.type || 'mini',
          date: a.date || '', overallScore: null, speakingScore: null,
          writingScore: null, readingScore: null, listeningScore: null,
          status: a.status || 'In_Progress',
        });
        setResumeData(a);
      } else {
        setActiveAttempt(null);
        setResumeData(null);
      }
      setState('success');
    } catch (err: any) {
      setError(err.message || 'Failed to load');
      setState('error');
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleStartMock = async (type: string) => {
    try {
      const token = localStorage.getItem('pte_token');
      const genRes = await fetch('/api/student/mock-tests/generate', {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ testType: type }),
      });
      const genData = await genRes.json();
      const test = genData.test || genData;
      if (test && test.questions) {
        setResumeData({
          ...test,
          type,
          testId: test.id,
          questions: test.questions,
        });
        setShowEngine(true);
      }
    } catch (err) {
      console.error('Failed to start mock:', err);
    }
  };

  const handleResume = async () => {
    if (activeAttempt) {
      const token = localStorage.getItem('pte_token');
      try {
        const res = await fetch(`/api/student/mock-tests/attempt/${activeAttempt.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setResumeData(data);
          setShowEngine(true);
          return;
        }
      } catch {}
      // Fallback: use active attempt data
      setResumeData(activeAttempt);
      setShowEngine(true);
    }
  };

  const handleBack = () => {
    setShowEngine(false);
    fetchData();
  };

  const getActionForStatus = (status: string) => {
    switch (status) {
      case 'In_Progress': return { label: 'Continue', action: handleResume, variant: 'primary' as const };
      case 'Paused': return { label: 'Resume', action: handleResume, variant: 'primary' as const };
      case 'Pending_Grading': return { label: 'View Status', action: () => {}, variant: 'secondary' as const };
      case 'Grading_Failed': return { label: 'Retry', action: () => {}, variant: 'outline' as const };
      case 'Completed': return { label: 'View Results', action: () => {}, variant: 'outline' as const };
      default: return { label: 'View', action: () => {}, variant: 'outline' as const };
    }
  };

  const getStatusBadgeVariant = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'Completed': return 'success';
      case 'Paused': return 'warning';
      case 'In_Progress': return 'warning';
      case 'Pending_Grading': return 'default';
      case 'Grading_Failed': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'In_Progress': return 'In Progress';
      case 'Pending_Grading': return 'Grading';
      case 'Grading_Failed': return 'Failed';
      default: return status.replace(/_/g, ' ');
    }
  };

  if (showEngine) {
    return (
      <div className="min-h-screen bg-dark-surface">
        <div className="sticky top-0 z-10 bg-dark-surface/90 backdrop-blur-md border-b border-dark-border px-4 py-2 flex items-center gap-3">
          <button onClick={handleBack} className="text-xs text-emerald-400 hover:text-emerald-300 font-mono">← Back</button>
          <span className="text-xs font-mono text-gray-500">Mock Exam Session</span>
        </div>
        <MockTestEngine
          onNavigateReport={handleBack}
          initialTest={resumeData}
          initialAttemptId={resumeData?.id || resumeData?.attemptId || null}
          initialQuestions={resumeData?.questions || resumeData?.questionsJson}
          initialAnswers={resumeData?.answers || resumeData?.answersJson}
          initialQuestionIndex={resumeData?.currentQuestionIndex || 0}
          initialSecondsRemaining={resumeData?.secondsRemaining}
          initialExamMode={resumeData?.type === 'full' || resumeData?.type === 'section'}
        />
      </div>
    );
  }

  if (state === 'loading') {
    return (
      <StudentPageContainer title="Mock Exams" maxWidth="xl">
        <div className="space-y-4"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
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

  const completedAttempts = attempts.filter(a => a.status === 'Completed' || a.status === 'Grading_Failed');
  const otherAttempts = attempts.filter(a => a.status !== 'Completed' && a.status !== 'Grading_Failed');

  return (
    <StudentPageContainer title="Mock Exams" maxWidth="xl">
      {/* Section 1: Active / Resumable attempt */}
      {activeAttempt && (
        <div className="mb-6">
          <h3 className="text-xs font-mono font-bold text-gray-500 uppercase tracking-wider mb-3">Active Session</h3>
          <div
            onClick={handleResume}
            className="rounded-xl border-2 border-emerald-500/40 bg-emerald-500/5 p-4 hover:border-emerald-500 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase">{activeAttempt.type}</span>
                  <Badge variant={getStatusBadgeVariant(activeAttempt.status)}>
                    {getStatusLabel(activeAttempt.status)}
                  </Badge>
                </div>
                <p className="text-sm font-medium text-gray-200">{activeAttempt.title}</p>
              </div>
              <Button variant="primary" size="sm" icon={<Play className="w-4 h-4" />}>
                {activeAttempt.status === 'Paused' ? 'Resume' : 'Continue'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Section 2: Available mock exams */}
      <div className="mb-6">
        <h3 className="text-xs font-mono font-bold text-gray-500 uppercase tracking-wider mb-3">Start New Mock Exam</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_OPTIONS.map((opt) => (
            <div
              key={opt.type}
              onClick={() => handleStartMock(opt.type)}
              className="rounded-xl border border-dark-border bg-dark-surface p-4 hover:border-emerald-500/50 hover:bg-dark-elevated transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-sm font-bold text-gray-200">{opt.label}</h4>
                {opt.isLocked && <span className="text-[10px] text-gray-500 font-mono">🔒</span>}
              </div>
              <p className="text-[11px] text-gray-500 mb-3">{opt.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-gray-600">{opt.duration}</span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">Start →</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Attempt history */}
      {attempts.length > 0 && (
        <div>
          <h3 className="text-xs font-mono font-bold text-gray-500 uppercase tracking-wider mb-3">
            History ({attempts.length})
          </h3>
          <div className="space-y-2">
            {[...otherAttempts, ...completedAttempts].map((a) => {
              const isActive = activeAttempt?.id === a.id;
              const action = getActionForStatus(a.status);
              return (
                <div
                  key={a.id}
                  onClick={isActive ? handleResume : undefined}
                  className={`rounded-xl border p-4 transition-colors ${
                    isActive
                      ? 'border-emerald-500/30 bg-emerald-500/5 cursor-pointer hover:border-emerald-500'
                      : 'border-dark-border bg-dark-surface'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-mono font-medium text-gray-500 uppercase">{a.type}</span>
                        <Badge variant={getStatusBadgeVariant(a.status)}>{getStatusLabel(a.status)}</Badge>
                      </div>
                      <p className="text-sm font-medium text-gray-200 truncate">{a.title}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {a.date ? new Date(a.date).toLocaleDateString() : '—'}
                      </p>
                    </div>
                    {a.overallScore != null && (
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-gray-500">Score</span>
                        <div className={`text-lg font-bold tabular-nums ${
                          a.overallScore >= 70 ? 'text-success-400' : a.overallScore >= 40 ? 'text-warning-400' : 'text-error-400'
                        }`}>{a.overallScore}</div>
                      </div>
                    )}
                    {a.overallScore != null && (
                      <div className="hidden sm:flex gap-2 text-[10px] font-mono tabular-nums text-gray-500">
                        <span className="text-purple-400">{a.speakingScore ?? '—'}</span>
                        <span className="text-blue-400">{a.writingScore ?? '—'}</span>
                        <span className="text-success-400">{a.readingScore ?? '—'}</span>
                        <span className="text-warning-400">{a.listeningScore ?? '—'}</span>
                      </div>
                    )}
                    {!isActive && action.label !== 'View' && (
                      <Button variant={action.variant} size="sm">{action.label}</Button>
                    )}
                  </div>
                  {a.overallScore != null && (
                    <div className="sm:hidden flex gap-2 mt-3 pt-3 border-t border-dark-border text-[11px] font-mono">
                      <span className="text-purple-400">S:{a.speakingScore ?? '—'}</span>
                      <span className="text-blue-400">W:{a.writingScore ?? '—'}</span>
                      <span className="text-success-400">R:{a.readingScore ?? '—'}</span>
                      <span className="text-warning-400">L:{a.listeningScore ?? '—'}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {attempts.length === 0 && !activeAttempt && (
        <EmptyState
          icon={<FileText className="h-6 w-6 text-gray-500" />}
          title="No mock exams yet"
          description="Choose a mock exam above to get started"
        />
      )}
    </StudentPageContainer>
  );
}
