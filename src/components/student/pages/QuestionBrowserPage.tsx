import { useEffect, useState, useCallback, useMemo } from 'react';
import { Search, X, ChevronLeft, ChevronRight, Play, SlidersHorizontal, CheckSquare, Square } from 'lucide-react';
import { StudentPageContainer } from '../StudentPageContainer';
import { CardSkeleton } from '../../ui/Skeleton';
import { EmptyState } from '../../ui/EmptyState';
import { ErrorState } from '../../ui/ErrorState';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Select } from '../../ui/Select';
import { useStudentRoute } from '../StudentRouteContext';
import { listPracticeQuestions } from '../../../api/student.api';
import { getAllContracts } from '../../../practice/contracts/registry';
import type { QuestionListItem, QuestionListResponse } from '../../../shared/api/practice';

type PageState = 'loading' | 'error' | 'empty' | 'success';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const SECTION_OPTIONS = ['all', 'Speaking', 'Writing', 'Reading', 'Listening'];

export function QuestionBrowserPage() {
  const { navigate } = useStudentRoute();
  const [state, setState] = useState<PageState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<QuestionListResponse | null>(null);

  const [search, setSearch] = useState('');
  const [taskCode, setTaskCode] = useState('');
  const [section, setSection] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filtersVisible, setFiltersVisible] = useState(false);

  const taskOptions = useMemo(() => {
    const contracts = getAllContracts();
    return [
      { value: '', label: 'All task types' },
      ...contracts.map((c) => ({ value: c.code, label: `${c.code} — ${c.name}` })),
    ];
  }, []);

  const fetchData = useCallback(async (p: number) => {
    setState('loading');
    setError(null);
    try {
      const res = await listPracticeQuestions({
        search: search || undefined,
        taskCode: taskCode || undefined,
        section: section || undefined,
        difficulty: difficulty || undefined,
        page: p,
        pageSize: 24,
      });
      if (res.items.length === 0 && p === 1) {
        setData(res);
        setState('empty');
      } else {
        setData(res);
        setState('success');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load questions');
      setState('error');
    }
  }, [search, taskCode, section, difficulty]);

  useEffect(() => {
    setPage(1);
    fetchData(1);
  }, [fetchData]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchData(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!data) return;
    if (selected.size === data.items.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(data.items.map((q) => q.id)));
    }
  };

  const clearFilters = () => {
    setSearch('');
    setTaskCode('');
    setSection('');
    setDifficulty('');
  };

  const hasActiveFilters = search || taskCode || section || difficulty;

  const sectionBadge: Record<string, 'premium' | 'info' | 'success' | 'warning'> = {
    Speaking: 'premium',
    Writing: 'info',
    Reading: 'success',
    Listening: 'warning',
  };

  const difficultyBadge: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
    Easy: 'success',
    Medium: 'warning',
    Hard: 'error',
  };

  if (state === 'loading') {
    return (
      <StudentPageContainer title="Question Browser" subtitle="Browse and select questions for custom practice" maxWidth="xl">
        <div className="space-y-6">
          <div className="h-10 w-full max-w-xs bg-dark-elevated rounded-lg animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-dark-border bg-dark-surface p-5 space-y-3">
                <div className="h-4 w-16 bg-dark-elevated rounded animate-pulse" />
                <div className="h-5 w-3/4 bg-dark-elevated rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-dark-elevated rounded animate-pulse" />
                <div className="flex gap-2">
                  <div className="h-6 w-16 bg-dark-elevated rounded-full animate-pulse" />
                  <div className="h-6 w-20 bg-dark-elevated rounded-full animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </StudentPageContainer>
    );
  }

  if (state === 'error') {
    return (
      <StudentPageContainer maxWidth="md">
        <ErrorState
          title="Failed to load questions"
          message={error || 'An unexpected error occurred'}
          onRetry={() => fetchData(page)}
        />
      </StudentPageContainer>
    );
  }

  if (state === 'empty') {
    return (
      <StudentPageContainer
        title="Question Browser"
        subtitle="Browse and select questions for custom practice"
        maxWidth="md"
        actions={
          hasActiveFilters ? (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          ) : undefined
        }
      >
        <div className="mb-6 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions..."
              className="w-full rounded-lg border border-dark-border bg-dark-surface-50 pl-10 pr-3 py-2 text-sm text-gray-100 placeholder-gray-500 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-dark-surface"
            />
          </div>
          <select
            value={taskCode}
            onChange={(e) => setTaskCode(e.target.value)}
            className="rounded-lg border border-dark-border bg-dark-surface-50 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-400"
          >
            <option value="">All task types</option>
            {getAllContracts().map((c) => (
              <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Clear
          </Button>
        </div>
        <EmptyState
          icon={<Search className="h-6 w-6 text-gray-500" />}
          title="No questions found"
          description={hasActiveFilters ? 'Try adjusting your filters or search terms' : 'No published questions available yet'}
        />
      </StudentPageContainer>
    );
  }

  return (
    <StudentPageContainer
      title="Question Browser"
      subtitle={`${data?.total ?? 0} questions available`}
      maxWidth="xl"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFiltersVisible(!filtersVisible)}
            icon={<SlidersHorizontal className="h-4 w-4" />}
          >
            Filters
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions..."
              className="w-full rounded-lg border border-dark-border bg-dark-surface-50 pl-10 pr-3 py-2 text-sm text-gray-100 placeholder-gray-500 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-dark-surface"
            />
          </div>
          <select
            value={taskCode}
            onChange={(e) => setTaskCode(e.target.value)}
            className="rounded-lg border border-dark-border bg-dark-surface-50 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-400"
          >
            <option value="">All task types</option>
            {getAllContracts().map((c) => (
              <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
            ))}
          </select>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} icon={<X className="h-4 w-4" />}>
              Clear
            </Button>
          )}
        </div>

        {filtersVisible && (
          <div className="flex flex-wrap gap-3 p-4 rounded-xl border border-dark-border bg-dark-surface-50">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500">Section</label>
              <div className="flex gap-1.5">
                {SECTION_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSection(s === 'all' ? '' : s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                      (s === 'all' && !section) || section === s
                        ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                        : 'bg-dark-elevated text-gray-400 border border-dark-border hover:border-gray-600'
                    }`}
                  >
                    {s === 'all' ? 'All' : s}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500">Difficulty</label>
              <div className="flex gap-1.5">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(difficulty === d ? '' : d)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                      difficulty === d
                        ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                        : 'bg-dark-elevated text-gray-400 border border-dark-border hover:border-gray-600'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            {selected.size === (data?.items.length ?? 0) ? (
              <CheckSquare className="h-4 w-4 text-primary-400" />
            ) : (
              <Square className="h-4 w-4" />
            )}
            {selected.size > 0 ? `${selected.size} selected` : 'Select all'}
          </button>
          <span className="text-xs text-gray-500">
            Page {data?.page ?? 1} of {data?.totalPages ?? 1}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.items.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              selected={selected.has(q.id)}
              onToggle={() => toggleSelect(q.id)}
            />
          ))}
        </div>

        {(data?.totalPages ?? 0) > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
              icon={<ChevronLeft className="h-4 w-4" />}
            >
              Previous
            </Button>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: Math.min(data?.totalPages ?? 1, 7) }, (_, i) => {
                const total = data?.totalPages ?? 1;
                let pageNum: number;
                if (total <= 7) {
                  pageNum = i + 1;
                } else if (page <= 4) {
                  pageNum = i + 1;
                } else if (page >= total - 3) {
                  pageNum = total - 6 + i;
                } else {
                  pageNum = page - 3 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`min-w-[2rem] h-8 rounded-lg text-xs font-medium transition-all duration-150 ${
                      page === pageNum
                        ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-dark-elevated'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= (data?.totalPages ?? 1)}
              onClick={() => handlePageChange(page + 1)}
              icon={<ChevronRight className="h-4 w-4" />}
              iconPosition="right"
            >
              Next
            </Button>
          </div>
        )}

        {selected.size > 0 && (
          <div className="sticky bottom-4 z-10 flex items-center justify-between gap-4 rounded-2xl border border-primary-500/30 bg-dark-surface-100/95 backdrop-blur-md p-4 shadow-lg shadow-primary-500/5">
            <div className="text-sm text-gray-300">
              <span className="font-semibold text-primary-400">{selected.size}</span> question{selected.size !== 1 ? 's' : ''} selected
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelected(new Set())}
              >
                Clear
              </Button>
              <Button
                size="sm"
                icon={<Play className="h-4 w-4 fill-current" />}
                onClick={() => navigate('practice-session')}
              >
                Start Practice
              </Button>
            </div>
          </div>
        )}
      </div>
    </StudentPageContainer>
  );
}

function QuestionCard({
  question,
  selected,
  onToggle,
}: {
  question: QuestionListItem;
  selected: boolean;
  onToggle: () => void;
  key?: string | number;
}) {
  const sectionBadge: Record<string, 'premium' | 'info' | 'success' | 'warning'> = {
    Speaking: 'premium',
    Writing: 'info',
    Reading: 'success',
    Listening: 'warning',
  };

  const difficultyBadge: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
    Easy: 'success',
    Medium: 'warning',
    Hard: 'error',
  };

  const excerpt = question.instruction
    ? question.instruction.length > 120
      ? question.instruction.slice(0, 120) + '...'
      : question.instruction
    : question.promptText
      ? question.promptText.length > 120
        ? question.promptText.slice(0, 120) + '...'
        : question.promptText
      : null;

  return (
    <div
      className={`group relative rounded-2xl border p-5 transition-all duration-200 cursor-pointer ${
        selected
          ? 'border-primary-500/50 bg-primary-500/5 shadow-sm shadow-primary-500/10'
          : 'border-dark-border bg-dark-surface hover:border-primary-500/30 hover:bg-dark-surface-100 hover:shadow-lg hover:shadow-primary-500/5'
      }`}
      onClick={onToggle}
      role="checkbox"
      aria-checked={selected}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
    >
      <div className="absolute top-4 right-4">
        {selected ? (
          <CheckSquare className="h-5 w-5 text-primary-400" />
        ) : (
          <Square className="h-5 w-5 text-gray-600 group-hover:text-gray-400 transition-colors" />
        )}
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span className="text-[11px] font-mono font-medium text-gray-500 uppercase tracking-wider">
          {question.taskCode}
        </span>
        <Badge variant={sectionBadge[question.section] || 'default'}>
          {question.section}
        </Badge>
        {question.difficulty && (
          <Badge variant={difficultyBadge[question.difficulty] || 'default'}>
            {question.difficulty}
          </Badge>
        )}
      </div>

      <h3 className="text-sm font-semibold text-gray-100 leading-snug mb-1.5 pr-6">
        {question.title}
      </h3>

      {excerpt && (
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
          {excerpt}
        </p>
      )}

      <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
        {question.hasPromptAudio && (
          <span className="flex items-center gap-1" title="Has audio prompt">Audio</span>
        )}
        {question.hasImage && (
          <span className="flex items-center gap-1" title="Has image">Image</span>
        )}
      </div>
    </div>
  );
}
