import { useEffect, useState, useCallback } from 'react';
import { Search, ChevronRight, BookOpen } from 'lucide-react';
import { StudentPageContainer } from '../StudentPageContainer';
import { EmptyState } from '../../ui/EmptyState';
import { ErrorState } from '../../ui/ErrorState';
import { Badge } from '../../ui/Badge';
import { getPracticeSubmissions } from '../../../api/student.api';

interface SubmissionItem {
  id: string;
  taskCode: string;
  section: string;
  title: string;
  submittedAt: string;
  score: number | null;
  feedback: string | null;
  answerText?: string;
  correctAnswer?: string;
}

export function ReviewPage() {
  const [state, setState] = useState<'loading' | 'error' | 'empty' | 'success'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [search, setSearch] = useState('');
  const [sectionFilter, setSectionFilter] = useState<string>('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchSubmissions = useCallback(async () => {
    setState('loading');
    setError(null);
    try {
      const data = await getPracticeSubmissions();
      const items: SubmissionItem[] = (data as any[] || []).map((s: any) => ({
        id: s.id,
        taskCode: s.taskCode || s.code || '',
        section: s.section || '',
        title: s.title || s.taskTitle || 'Untitled',
        submittedAt: s.submittedAt || s.createdAt || '',
        score: s.score ?? null,
        feedback: s.feedback || null,
        answerText: s.answerText || '',
      }));
      if (items.length === 0) {
        setState('empty');
      } else {
        setSubmissions(items);
        setState('success');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load review data');
      setState('error');
    }
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const filtered = submissions
    .filter((s) => {
      if (search && !s.title.toLowerCase().includes(search.toLowerCase()) && !s.taskCode.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (sectionFilter && s.section !== sectionFilter) return false;
      return true;
    })
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

  const sections = ['', 'Speaking', 'Writing', 'Reading', 'Listening'];

  if (state === 'loading') {
    return (
      <StudentPageContainer title="Review & Results" maxWidth="xl">
        <div className="space-y-4">
          <div className="h-10 w-64 bg-dark-elevated rounded-lg animate-pulse" />
          <div className="h-8 w-full bg-dark-elevated rounded-lg animate-pulse" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-dark-elevated rounded-xl animate-pulse" />
          ))}
        </div>
      </StudentPageContainer>
    );
  }

  if (state === 'error') {
    return (
      <StudentPageContainer maxWidth="md">
        <ErrorState title="Failed to load results" message={error || ''} onRetry={fetchSubmissions} />
      </StudentPageContainer>
    );
  }

  if (state === 'empty') {
    return (
      <StudentPageContainer maxWidth="md">
        <EmptyState
          icon={<BookOpen className="h-6 w-6 text-gray-500" />}
          title="No submissions yet"
          description="Complete a practice session to see your results here"
        />
      </StudentPageContainer>
    );
  }

  return (
    <StudentPageContainer title="Review & Results" subtitle={`${submissions.length} submission${submissions.length !== 1 ? 's' : ''}`} maxWidth="xl">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search submissions..."
              className="w-full rounded-lg border border-dark-border bg-dark-surface-50 pl-10 pr-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {sections.map((s) => (
              <button
                key={s || 'all'}
                onClick={() => setSectionFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  sectionFilter === s
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                    : 'bg-dark-elevated text-gray-400 border border-dark-border hover:border-gray-600'
                }`}
              >
                {s || 'All'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {filtered.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSelectedId(selectedId === sub.id ? null : sub.id)}
              className={`w-full text-left rounded-xl border p-4 transition-all ${
                selectedId === sub.id
                  ? 'border-primary-500/40 bg-primary-500/5'
                  : 'border-dark-border bg-dark-surface hover:border-gray-600'
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-mono font-medium text-gray-500 uppercase">{sub.taskCode}</span>
                    <Badge variant={sub.section === 'Speaking' ? 'premium' : sub.section === 'Writing' ? 'info' : sub.section === 'Reading' ? 'success' : sub.section === 'Listening' ? 'warning' : 'default'}>
                      {sub.section}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-gray-200 truncate">{sub.title}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    {sub.score !== null ? (
                      <span className={`text-sm font-bold tabular-nums ${
                        sub.score >= 70 ? 'text-success-400' : sub.score >= 40 ? 'text-warning-400' : 'text-error-400'
                      }`}>
                        {Math.round(sub.score)}%
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500">No score</span>
                    )}
                  </div>
                  <ChevronRight className={`h-4 w-4 text-gray-500 transition-transform ${selectedId === sub.id ? 'rotate-90' : ''}`} />
                </div>
              </div>
              {selectedId === sub.id && (
                <div className="mt-3 pt-3 border-t border-dark-border space-y-2">
                  {sub.feedback && (
                    <p className="text-xs text-gray-400 leading-relaxed">{sub.feedback}</p>
                  )}
                  {sub.answerText && (
                    <div className="flex items-start gap-2 text-xs">
                      <span className="text-gray-500 shrink-0">Answer:</span>
                      <span className="text-gray-300">{sub.answerText}</span>
                    </div>
                  )}
                  <p className="text-[11px] text-gray-600">
                    Submitted {new Date(sub.submittedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">No submissions match your filters</p>
          </div>
        )}
      </div>
    </StudentPageContainer>
  );
}
