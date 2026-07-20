import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { BookOpen, Sparkles } from 'lucide-react';
import { StudentPageContainer } from '../StudentPageContainer';
import { CardSkeleton } from '../../ui/Skeleton';
import { EmptyState } from '../../ui/EmptyState';
import { Button } from '../../ui/Button';
import { TaskCard } from '../practice/TaskCard';
import { SkillGroupSection } from '../practice/SkillGroupSection';
import { PracticeSearchFilters } from '../practice/PracticeSearchFilters';
import type { SortOption, SectionFilter } from '../practice/PracticeSearchFilters';
import { useStudentRoute } from '../StudentRouteContext';
import { getAllContracts } from '../../../practice/contracts/registry';
import { getTaskCounts, getPracticeOverview } from '../../../api/student.api';
import type { PracticeTaskOverviewItem } from '../../../shared/api/studentPractice';
import type { PTESection, PTETaskCode } from '../../../types';

interface TaskWithStats {
  code: PTETaskCode;
  name: string;
  section: PTESection;
  questionCount: number;
  averageScore: number | null;
  lastAttemptedAt: string | null;
  totalAttempts: number;
}

const SECTION_ORDER: PTESection[] = ['Speaking', 'Writing', 'Reading', 'Listening'];

function getRecommendedTasks(tasks: TaskWithStats[]): Set<PTETaskCode> {
  const recommended = new Set<PTETaskCode>();
  const lowScore = tasks.filter((t) => t.totalAttempts > 0 && t.averageScore !== null && t.averageScore < 50);
  const noAttempts = tasks.filter((t) => t.totalAttempts === 0);
  const sorted = [...lowScore, ...noAttempts].sort((a, b) => {
    const aScore = a.averageScore ?? 0;
    const bScore = b.averageScore ?? 0;
    return aScore - bScore;
  });
  for (const t of sorted.slice(0, 5)) {
    recommended.add(t.code);
  }
  return recommended;
}

export function PracticePage() {
  const { navigate } = useStudentRoute();
  const [overview, setOverview] = useState<PracticeTaskOverviewItem[]>([]);
  const [taskCountMap, setTaskCountMap] = useState<Record<string, number>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiLoaded, setApiLoaded] = useState(false);

  const STORAGE_KEY = 'pte_practice_filters';
  const [search, setSearch] = useState(() => sessionStorage.getItem(`${STORAGE_KEY}_search`) || '');
  const [sectionFilter, setSectionFilter] = useState<SectionFilter>(() => (sessionStorage.getItem(`${STORAGE_KEY}_section`) as SectionFilter) || 'all');
  const [recommendedOnly, setRecommendedOnly] = useState(() => sessionStorage.getItem(`${STORAGE_KEY}_recommended`) === 'true');
  const [sort, setSort] = useState<SortOption>(() => (sessionStorage.getItem(`${STORAGE_KEY}_sort`) as SortOption) || 'recommended');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const restoredRef = useRef(false);

  useEffect(() => {
    if (!restoredRef.current) { restoredRef.current = true; return; }
    sessionStorage.setItem(`${STORAGE_KEY}_search`, search);
    sessionStorage.setItem(`${STORAGE_KEY}_section`, sectionFilter);
    sessionStorage.setItem(`${STORAGE_KEY}_recommended`, String(recommendedOnly));
    sessionStorage.setItem(`${STORAGE_KEY}_sort`, sort);
  }, [search, sectionFilter, recommendedOnly, sort]);

  const fetchData = useCallback(async () => {
    setApiError(null);
    try {
      const [counts, overviewData] = await Promise.all([
        getTaskCounts().catch((e) => {
          console.warn('Failed to load task counts:', e);
          return [];
        }),
        getPracticeOverview().catch((e) => {
          console.warn('Failed to load practice overview:', e);
          return [];
        }),
      ]);
      const countMap: Record<string, number> = {};
      for (const c of counts) {
        countMap[c.taskCode] = c.publishedCount;
      }
      setTaskCountMap(countMap);
      setOverview(overviewData);
    } catch (err: any) {
      setApiError(err.message || 'Failed to load practice stats');
    } finally {
      setApiLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const overviewMap = useMemo(() => {
    const map: Record<string, PracticeTaskOverviewItem> = {};
    for (const item of overview) {
      map[item.taskCode] = item;
    }
    return map;
  }, [overview]);

  const allTasks: TaskWithStats[] = useMemo(() => {
    const contracts = getAllContracts();
    return contracts.map((c) => {
      const o = overviewMap[c.code];
      return {
        code: c.code,
        name: c.name,
        section: c.section,
        questionCount: taskCountMap[c.code] ?? o?.questionCount ?? 0,
        averageScore: o?.averageScore ?? null,
        lastAttemptedAt: o?.lastAttemptedAt ?? null,
        totalAttempts: o?.totalAttempts ?? 0,
      };
    });
  }, [overviewMap, taskCountMap]);

  const recommendedTasks = useMemo(() => getRecommendedTasks(allTasks), [allTasks]);

  const filteredTasks = useMemo(() => {
    let tasks = allTasks;

    if (search) {
      const q = search.toLowerCase();
      tasks = tasks.filter((t) => t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q));
    }

    if (sectionFilter !== 'all') {
      tasks = tasks.filter((t) => t.section === sectionFilter);
    }

    if (recommendedOnly) {
      tasks = tasks.filter((t) => recommendedTasks.has(t.code));
    }

    switch (sort) {
      case 'name':
        tasks = [...tasks].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'score':
        tasks = [...tasks].sort((a, b) => (b.averageScore ?? 0) - (a.averageScore ?? 0));
        break;
      case 'recent':
        tasks = [...tasks].sort((a, b) => {
          if (!a.lastAttemptedAt && !b.lastAttemptedAt) return 0;
          if (!a.lastAttemptedAt) return 1;
          if (!b.lastAttemptedAt) return -1;
          return b.lastAttemptedAt.localeCompare(a.lastAttemptedAt);
        });
        break;
      case 'recommended':
      default:
        tasks = [...tasks].sort((a, b) => {
          const aRec = recommendedTasks.has(a.code);
          const bRec = recommendedTasks.has(b.code);
          if (aRec && !bRec) return -1;
          if (!aRec && bRec) return 1;
          return SECTION_ORDER.indexOf(a.section) - SECTION_ORDER.indexOf(b.section);
        });
        break;
    }

    return tasks;
  }, [allTasks, search, sectionFilter, recommendedOnly, sort, recommendedTasks]);

  const groupedTasks = useMemo(() => {
    const groups = new Map<PTESection, TaskWithStats[]>();
    for (const task of filteredTasks) {
      const list = groups.get(task.section);
      if (list) {
        list.push(task);
      } else {
        groups.set(task.section, [task]);
      }
    }
    return groups;
  }, [filteredTasks]);

  if (!apiLoaded) {
    return (
      <StudentPageContainer title="Practice Library" subtitle="Master all 22 PTE task types" maxWidth="xl">
        <div className="space-y-8">
          <div className="h-10 w-full max-w-xs bg-dark-elevated rounded-lg animate-pulse" />
          <div className="space-y-4">
            <div className="h-6 w-32 bg-dark-elevated rounded animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-6 w-24 bg-dark-elevated rounded animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          </div>
        </div>
      </StudentPageContainer>
    );
  }

  return (
    <StudentPageContainer
      title="Practice Library"
      subtitle="Master all 22 PTE task types"
      maxWidth="xl"
      actions={
        recommendedTasks.size > 0 && allTasks.length > 0 ? (
          <Button
            variant={recommendedOnly ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setRecommendedOnly(!recommendedOnly)}
            icon={<Sparkles className="h-4 w-4" />}
          >
            {recommendedOnly ? 'Show All' : `Recommended (${recommendedTasks.size})`}
          </Button>
        ) : undefined
      }
    >
      {apiError && (
        <div className="mb-4 rounded-xl border border-warning-500/30 bg-warning-500/5 px-4 py-3 text-xs text-warning-300">
          {apiError}
          <button onClick={fetchData} className="ml-2 underline hover:text-warning-200">Retry</button>
        </div>
      )}

      <div className="space-y-6 min-w-0">
        <PracticeSearchFilters
          search={search}
          onSearchChange={setSearch}
          sectionFilter={sectionFilter}
          onSectionFilterChange={setSectionFilter}
          recommendedOnly={recommendedOnly}
          onRecommendedChange={setRecommendedOnly}
          sort={sort}
          onSortChange={setSort}
          filterDrawerOpen={filterDrawerOpen}
          onFilterDrawerOpenChange={setFilterDrawerOpen}
        />

        {filteredTasks.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="h-6 w-6 text-gray-500" />}
            title="No tasks found"
            description={search ? `No tasks match "${search}"` : 'Try adjusting your filters'}
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setSectionFilter('all');
                  setRecommendedOnly(false);
                }}
              >
                Clear Filters
              </Button>
            }
          />
        ) : (
          recommendedOnly ? (
            <SkillGroupSection title="Recommended" count={filteredTasks.length}>
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.code}
                  code={task.code}
                  name={task.name}
                  section={task.section}
                  questionCount={task.questionCount}
                  averageScore={task.averageScore}
                  lastAttemptedAt={task.lastAttemptedAt}
                  onQuickStart={() => navigate('practice-session')}
                  onChooseQuestions={() => navigate('practice-questions')}
                />
              ))}
            </SkillGroupSection>
          ) : (
            SECTION_ORDER.map((section) => {
              const sectionKey = section as PTESection;
              const tasks = groupedTasks.get(sectionKey);
              if (!tasks || tasks.length === 0) return null;
              return (
                <SkillGroupSection key={sectionKey} title={`${sectionKey}`} count={tasks.length}>
                  {tasks.map((task) => (
                    <TaskCard
                      key={task.code}
                      code={task.code}
                      name={task.name}
                      section={task.section}
                      questionCount={task.questionCount}
                      averageScore={task.averageScore}
                      lastAttemptedAt={task.lastAttemptedAt}
                      onQuickStart={() => {
                        navigate('practice-session');
                      }}
                      onChooseQuestions={() => navigate('practice-questions')}
                    />
                  ))}
                </SkillGroupSection>
              );
            })
          )
        )}
      </div>
    </StudentPageContainer>
  );
}
