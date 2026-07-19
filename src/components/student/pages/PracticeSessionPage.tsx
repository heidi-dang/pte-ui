import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, Clock, Send, BookOpen, Loader2 } from 'lucide-react';
import { StudentPageContainer } from '../StudentPageContainer';
import { CardSkeleton } from '../../ui/Skeleton';
import { EmptyState } from '../../ui/EmptyState';
import { ErrorState } from '../../ui/ErrorState';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { ProgressBar } from '../../ui/ProgressBar';
import { useStudentRoute } from '../StudentRouteContext';
import { getTaskModule } from '../../../practice/tasks/registry';
import { getPublishedQuestions } from '../../../api/questions.api';
import type { PracticeItem, PTETaskCode, PTESection } from '../../../types';
import type { TimerPhase } from '../../../practice/tasks/types';

type PageState = 'loading' | 'error' | 'empty' | 'success' | 'submitting' | 'submitted';

const SECTION_BADGE: Record<string, 'premium' | 'info' | 'success' | 'warning'> = {
  Speaking: 'premium',
  Writing: 'info',
  Reading: 'success',
  Listening: 'warning',
};

interface SessionQuestion {
  item: PracticeItem;
  code: PTETaskCode;
  section: PTESection;
}

export function PracticeSessionPage() {
  const { navigate, previousRouteId } = useStudentRoute();
  const [state, setState] = useState<PageState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [sessionQuestions, setSessionQuestions] = useState<SessionQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerData, setAnswerData] = useState<any>(null);
  const [timerPhase, setTimerPhase] = useState<TimerPhase>('idle');
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [prepTimeLeft, setPrepTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const current = sessionQuestions[currentIndex];
  const module = current ? getTaskModule(current.code) : null;
  const totalQuestions = sessionQuestions.length;
  const progress = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;

  const fetchQuestions = useCallback(async () => {
    setState('loading');
    setError(null);
    try {
      const data = await getPublishedQuestions({ limit: 10, random: true });
      if (!data || data.length === 0) {
        setState('empty');
        return;
      }
      const questions: SessionQuestion[] = data.map((q: any) => ({
        item: {
          id: q.id,
          code: q.taskCode as PTETaskCode,
          title: q.title || '',
          instruction: q.instruction || '',
          promptText: q.promptText || '',
          passageText: q.passageText || '',
          imageUrl: q.imageUrl || '',
          audioUrl: q.audioUrl || '',
          options: q.options || [],
          correctAnswer: '',
          modelAnswer: '',
          templates: [],
          tips: [],
          vocabulary: [],
          hasPromptAudio: !!q.hasPromptAudio,
        },
        code: q.taskCode as PTETaskCode,
        section: q.section as PTESection,
      }));
      setSessionQuestions(questions);
      setCurrentIndex(0);
      setAnswerData(null);
      setTimerPhase('preparing');
      setPrepTimeLeft(10);
      setTimeLeft(null);
      setState('success');
    } catch (err: any) {
      setError(err.message || 'Failed to load question');
      setState('error');
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (state !== 'success') return;

    if (timerPhase === 'preparing' && prepTimeLeft !== null) {
      timerRef.current = setInterval(() => {
        setPrepTimeLeft((prev) => {
          if (prev === null || prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = null;
            setTimerPhase('answering');
            setTimeLeft(120);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerPhase === 'answering' && timeLeft !== null) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === null || prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = null;
            setTimerPhase('expired');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timerPhase, prepTimeLeft, timeLeft, state]);

  const handleAnswerChange = useCallback((data: any) => {
    setAnswerData(data);
  }, []);

  const handleSubmit = useCallback(() => {
    setTimerPhase('submitted');
    setState('submitted');
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleNext = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((i) => i + 1);
      setAnswerData(null);
      setTimerPhase('preparing');
      setPrepTimeLeft(10);
      setTimeLeft(null);
      setState('success');
    }
  }, [currentIndex, totalQuestions]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setAnswerData(null);
      setTimerPhase('preparing');
      setPrepTimeLeft(10);
      setTimeLeft(null);
      setState('success');
    }
  }, [currentIndex]);

  const handleRetry = useCallback(() => {
    setState('loading');
    fetchQuestions();
  }, [fetchQuestions]);

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  if (state === 'loading') {
    return (
      <StudentPageContainer title="Practice Session" maxWidth="lg">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="h-6 w-32 bg-dark-elevated rounded animate-pulse" />
            <div className="h-6 w-20 bg-dark-elevated rounded animate-pulse" />
          </div>
          <div className="h-2 bg-dark-elevated rounded-full animate-pulse" />
          <CardSkeleton className="h-64" />
          <div className="flex justify-between">
            <div className="h-10 w-24 bg-dark-elevated rounded-lg animate-pulse" />
            <div className="h-10 w-24 bg-dark-elevated rounded-lg animate-pulse" />
          </div>
        </div>
      </StudentPageContainer>
    );
  }

  if (state === 'error') {
    return (
      <StudentPageContainer maxWidth="md">
        <ErrorState
          title="Failed to load practice question"
          message={error || 'An unexpected error occurred'}
          onRetry={handleRetry}
        />
      </StudentPageContainer>
    );
  }

  if (state === 'empty') {
    return (
      <StudentPageContainer maxWidth="md">
        <EmptyState
          icon={<BookOpen className="h-6 w-6 text-gray-500" />}
          title="No questions available"
          description="There are no published questions to practice with right now"
          action={
            <Button variant="primary" onClick={handleRetry}>
              Refresh
            </Button>
          }
        />
      </StudentPageContainer>
    );
  }

  if (!current || !module) {
    return (
      <StudentPageContainer maxWidth="md">
        <ErrorState title="Invalid question" message="Could not load task module for this question" onRetry={handleRetry} />
      </StudentPageContainer>
    );
  }

  const timerDisplay = timerPhase === 'preparing' && prepTimeLeft !== null
    ? formatTime(prepTimeLeft)
    : timeLeft !== null
      ? formatTime(timeLeft)
      : '--:--';

  const timerLabel = timerPhase === 'preparing' ? 'Preparation' : timerPhase === 'answering' ? 'Time Remaining' : timerPhase === 'expired' ? 'Time Expired' : '';

  const timerColor = timerPhase === 'expired'
    ? 'text-error-400'
    : timeLeft !== null && timeLeft <= 30
      ? 'text-warning-400'
      : 'text-gray-100';

  const hasPassage = current.code === 'MCS' || current.code === 'MCM' || current.code === 'ROP' || current.code === 'FIBR' || current.code === 'FIBRW';

  return (
    <StudentPageContainer maxWidth="lg" className="min-h-screen">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate(previousRouteId || 'practice')}
              className="shrink-0 h-8 w-8 rounded-lg border border-dark-border bg-dark-surface-50 flex items-center justify-center text-gray-500 hover:text-gray-300 hover:border-gray-600 transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-medium text-gray-500 uppercase">{current.code}</span>
                <Badge variant={SECTION_BADGE[current.section] || 'default'}>{current.section}</Badge>
              </div>
              <h1 className="text-sm font-semibold text-gray-100 truncate">{current.item.title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${timerPhase === 'expired' ? 'border-error-500/30 bg-error-500/10' : 'border-dark-border bg-dark-surface-50'}`}>
              <Clock className={`h-4 w-4 ${timerPhase === 'expired' ? 'text-error-400' : 'text-gray-500'}`} />
              <span className={`text-sm font-mono font-semibold tabular-nums ${timerColor}`}>
                {timerDisplay}
              </span>
              {timerLabel && (
                <span className="text-[10px] text-gray-500 hidden sm:inline">{timerLabel}</span>
              )}
            </div>
          </div>
        </div>

        <ProgressBar value={progress} size="sm" label={`Question ${currentIndex + 1} of ${totalQuestions}`} showValue />

        {hasPassage && current.item.passageText && (
          <div className="rounded-2xl border border-dark-border bg-dark-surface-50 max-h-64 overflow-y-auto">
            <div className="sticky top-0 bg-dark-surface-50/95 backdrop-blur-sm px-5 py-2.5 border-b border-dark-border flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary-400" />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Passage</span>
            </div>
            <div className="p-5 text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
              {current.item.passageText}
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-dark-border bg-dark-surface p-5">
          {current.item.instruction && (
            <div className="mb-4 pb-4 border-b border-dark-border">
              <p className="text-xs text-gray-500">{current.item.instruction}</p>
            </div>
          )}
          {module.Renderer && (
            <module.Renderer
              item={current.item}
              status={timerPhase}
              theme="dark"
              onAnswerChange={handleAnswerChange}
            />
          )}
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={currentIndex === 0}
            onClick={handlePrevious}
            icon={<ChevronLeft className="h-4 w-4" />}
          >
            Previous
          </Button>

          <div className="flex items-center gap-3">
            {state === 'submitted' ? (
              <Button
                size="sm"
                onClick={handleNext}
                icon={currentIndex < totalQuestions - 1 ? <ChevronRight className="h-4 w-4" /> : undefined}
                iconPosition="right"
              >
                {currentIndex < totalQuestions - 1 ? 'Next Question' : 'Finish Session'}
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={timerPhase === 'preparing' || timerPhase === 'submitted'}
                icon={<Send className="h-4 w-4" />}
              >
                Submit Answer
              </Button>
            )}
          </div>
        </div>
      </div>
    </StudentPageContainer>
  );
}
