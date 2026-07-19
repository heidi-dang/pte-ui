import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, Clock, Send, BookOpen, Loader2, Headphones, Play, Pause, Volume2, List, Check, X, Timer, BarChart3, HelpCircle } from 'lucide-react';
import { StudentPageContainer } from '../StudentPageContainer';
import { CardSkeleton } from '../../ui/Skeleton';
import { EmptyState } from '../../ui/EmptyState';
import { ErrorState } from '../../ui/ErrorState';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { ProgressBar } from '../../ui/ProgressBar';
import { useStudentRoute } from '../StudentRouteContext';
import { getTaskModule } from '../../../practice/tasks/registry';
import { getContract } from '../../../practice/contracts/registry';
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

const LISTENING_TASKS: Set<string> = new Set(['SST', 'MCMSL', 'FIBL', 'HCS', 'MCSSL', 'SMW', 'HIW', 'WFD']);
const READING_TASKS: Set<string> = new Set(['MCS', 'MCM', 'ROP', 'FIBR', 'FIBRW']);
const SPEAKING_TASKS: Set<string> = new Set(['RA', 'RS', 'DI', 'RL', 'ASQ', 'SGD', 'RTS']);
const SPEAKING_AUDIO_TASKS: Set<string> = new Set(['RS', 'RL', 'ASQ', 'SGD']);

interface SessionQuestion {
  item: PracticeItem;
  code: PTETaskCode;
  section: PTESection;
}

function getTaskTiming(code: string): { prepSeconds: number; responseSeconds: number } {
  try {
    const contract = getContract(code as PTETaskCode);
    return contract.timing;
  } catch {
    return { prepSeconds: 10, responseSeconds: 120 };
  }
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatAudioTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
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
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioEnded, setAudioEnded] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [questionPanelOpen, setQuestionPanelOpen] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessionElapsed, setSessionElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const autoSubmittedRef = useRef(false);
  const [submissionResults, setSubmissionResults] = useState<Record<number, {
    correct: boolean;
    userAnswer: string;
    correctAnswer: string;
    score: number | null;
  }>>({});

  const current = sessionQuestions[currentIndex];
  const module = current ? getTaskModule(current.code) : null;
  const totalQuestions = sessionQuestions.length;
  const progress = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;
  const isListening = current ? LISTENING_TASKS.has(current.code) : false;
  const isReading = current ? READING_TASKS.has(current.code) : false;
  const isSpeaking = current ? SPEAKING_TASKS.has(current.code) : false;
  const isSpeakingAudio = current ? SPEAKING_AUDIO_TASKS.has(current.code) : false;
  const hasAudio = !!(current?.item.audioUrl || current?.item.hasPromptAudio);

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
      setAnsweredQuestions(new Set());
      setAudioEnded(false);
      setAudioPlaying(false);
      setAudioProgress(0);
      setAudioDuration(0);
      autoSubmittedRef.current = false;
      const code = questions[0]?.code;
      const timing = getTaskTiming(code);
      if (LISTENING_TASKS.has(code) && questions[0]?.item.audioUrl) {
        setTimerPhase('prompt_playing');
        setPrepTimeLeft(null);
        setTimeLeft(null);
      } else if (SPEAKING_AUDIO_TASKS.has(code) && questions[0]?.item.audioUrl) {
        setTimerPhase('prompt_playing');
        setPrepTimeLeft(null);
        setTimeLeft(null);
      } else if (SPEAKING_TASKS.has(code)) {
        setTimerPhase('preparing');
        setPrepTimeLeft(Math.max(3, timing.prepSeconds));
        setTimeLeft(timing.responseSeconds);
      } else {
        setTimerPhase('preparing');
        setPrepTimeLeft(Math.max(5, timing.prepSeconds));
        setTimeLeft(timing.responseSeconds);
      }
      setSessionStartTime(Date.now());
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
    if (sessionStartTime && state === 'success') {
      sessionTimerRef.current = setInterval(() => {
        setSessionElapsed(Math.floor((Date.now() - sessionStartTime) / 1000));
      }, 1000);
    }
    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }
    };
  }, [sessionStartTime, state]);

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
            if (isSpeaking) {
              setTimerPhase('recording');
              setTimeLeft(getTaskTiming(current.code).responseSeconds);
            } else {
              setTimerPhase('answering');
              setTimeLeft(getTaskTiming(current.code).responseSeconds);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerPhase === 'recording' && timeLeft !== null) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === null || prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = null;
            setTimerPhase('expired');
            handleAutoSubmit();
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
            handleAutoSubmit();
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

  const handleAutoSubmit = useCallback(() => {
    if (autoSubmittedRef.current) return;
    autoSubmittedRef.current = true;
    setAnsweredQuestions((prev) => new Set(prev).add(currentIndex));
    setTimerPhase('submitted');
    setState('submitted');
  }, [currentIndex]);

  const startAudio = useCallback(() => {
    if (!current?.item.audioUrl || audioRef.current) return;
    const audio = new Audio(current.item.audioUrl);
    audioRef.current = audio;
    audio.onplay = () => setAudioPlaying(true);
    audio.onended = () => {
      setAudioPlaying(false);
      setAudioEnded(true);
      if (isSpeaking) {
        setTimerPhase('recording');
        setPrepTimeLeft(null);
        setTimeLeft(getTaskTiming(current.code).responseSeconds);
      } else {
        setTimerPhase('preparing');
        setPrepTimeLeft(10);
        setTimeLeft(null);
      }
    };
    audio.onloadedmetadata = () => setAudioDuration(audio.duration);
    audio.ontimeupdate = () => setAudioProgress(audio.currentTime);
    audio.onerror = () => {
      setAudioPlaying(false);
      setAudioEnded(true);
      if (isSpeaking) {
        setTimerPhase('recording');
        setTimeLeft(getTaskTiming(current.code).responseSeconds);
      } else {
        setTimerPhase('preparing');
        setPrepTimeLeft(10);
      }
    };
    audio.play().catch(() => {
      setAudioPlaying(false);
      setAudioEnded(true);
      if (isSpeaking) {
        setTimerPhase('recording');
        setTimeLeft(getTaskTiming(current.code).responseSeconds);
      } else {
        setTimerPhase('preparing');
        setPrepTimeLeft(10);
      }
    });
  }, [current?.item.audioUrl]);

  const handleAnswerChange = useCallback((data: any) => {
    setAnswerData(data);
  }, []);

  const computeFeedback = useCallback((idx: number, data: any, question: SessionQuestion) => {
    const item = question.item;
    let correct = false;
    let userAnswer = 'No answer provided';
    let correctAnswer = 'N/A';

    const mcCorrect = item.correctAnswer;
    if (data?.selectedOption) {
      userAnswer = data.selectedOption;
      correctAnswer = typeof mcCorrect === 'string' ? mcCorrect : 'N/A';
      correct = userAnswer === correctAnswer;
    } else if (data?.selectedMultiple) {
      userAnswer = data.selectedMultiple.join(', ');
      correctAnswer = Array.isArray(mcCorrect) ? mcCorrect.join(', ') : (typeof mcCorrect === 'string' ? mcCorrect : 'N/A');
      correct = JSON.stringify(data.selectedMultiple.sort()) === JSON.stringify((Array.isArray(mcCorrect) ? mcCorrect : []).sort());
    } else if (data?.typedText) {
      userAnswer = data.typedText.substring(0, 100);
      correctAnswer = typeof mcCorrect === 'string' ? mcCorrect : 'Model answer';
      const a = userAnswer.toLowerCase().trim();
      const b = correctAnswer.toLowerCase().trim();
      correct = a === b || a.includes(b) || b.includes(a);
    } else if (data?.blanks) {
      userAnswer = Object.entries(data.blanks).map(([k, v]) => `${k}:${v}`).join('; ');
      correctAnswer = 'See model answer';
    }

    return { correct, userAnswer, correctAnswer, score: correct ? 100 : null };
  }, []);

  const handleSubmit = useCallback(() => {
    autoSubmittedRef.current = true;
    const result = computeFeedback(currentIndex, answerData, current!);
    setSubmissionResults((prev) => ({ ...prev, [currentIndex]: result }));
    setAnsweredQuestions((prev) => new Set(prev).add(currentIndex));
    setTimerPhase('submitted');
    setState('submitted');
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, [currentIndex, answerData, current, computeFeedback]);

  const navigateToQuestion = useCallback((index: number) => {
    if (index === currentIndex) return;
    setCurrentIndex(index);
    setAnswerData(null);
    setAudioEnded(false);
    setAudioPlaying(false);
    setAudioProgress(0);
    setAudioDuration(0);
    autoSubmittedRef.current = false;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    const question = sessionQuestions[index];
    const timing = getTaskTiming(question.code);
    if ((LISTENING_TASKS.has(question.code) || SPEAKING_AUDIO_TASKS.has(question.code)) && question.item.audioUrl) {
      setTimerPhase('prompt_playing');
      setPrepTimeLeft(null);
      setTimeLeft(null);
    } else if (SPEAKING_TASKS.has(question.code)) {
      setTimerPhase('preparing');
      setPrepTimeLeft(Math.max(3, timing.prepSeconds));
      setTimeLeft(timing.responseSeconds);
    } else {
      setTimerPhase('preparing');
      setPrepTimeLeft(Math.max(5, timing.prepSeconds));
      setTimeLeft(timing.responseSeconds);
    }
    setState('success');
    setQuestionPanelOpen(false);
  }, [currentIndex, sessionQuestions]);

  const handleNext = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      navigateToQuestion(currentIndex + 1);
    }
  }, [currentIndex, totalQuestions, navigateToQuestion]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      navigateToQuestion(currentIndex - 1);
    }
  }, [currentIndex, navigateToQuestion]);

  const handleRetry = useCallback(() => {
    autoSubmittedRef.current = false;
    setState('loading');
    fetchQuestions();
  }, [fetchQuestions]);

  const handleFinish = useCallback(() => {
    navigate('review');
  }, [navigate]);

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
    : timerPhase === 'prompt_playing'
      ? '--:--'
      : timeLeft !== null
        ? formatTime(timeLeft)
        : '--:--';

  const timerLabel = timerPhase === 'preparing' ? 'Preparation'
    : timerPhase === 'prompt_playing' ? 'Listen'
    : timerPhase === 'recording' ? 'Recording'
    : timerPhase === 'answering' ? 'Remaining'
    : timerPhase === 'expired' ? 'Expired' : '';

  const timerColor = timerPhase === 'expired'
    ? 'text-error-400'
    : timerPhase === 'prompt_playing' || timerPhase === 'recording'
      ? 'text-primary-400'
      : timeLeft !== null && timeLeft <= 30
        ? 'text-warning-400'
        : 'text-gray-100';

  const answeredCount = answeredQuestions.size;

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 min-w-0">
        <StudentPageContainer maxWidth="lg" className="min-h-screen">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => navigate(previousRouteId || 'practice')}
                  className="shrink-0 h-8 w-8 rounded-lg border border-dark-border bg-dark-surface-50 flex items-center justify-center text-gray-500 hover:text-gray-300 hover:border-gray-600 transition-all"
                  title="Exit session"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-medium text-gray-500 uppercase">{current.code}</span>
                    <Badge variant={SECTION_BADGE[current.section] || 'default'}>{current.section}</Badge>
                  </div>
                  <h1 className="text-sm font-semibold text-gray-100 truncate">{current.item.title}</h1>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setQuestionPanelOpen(!questionPanelOpen)}
                  className="h-8 px-2.5 rounded-lg border border-dark-border bg-dark-surface-50 flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 hover:border-gray-600 transition-all"
                  title="Question list"
                >
                  <List className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{answeredCount}/{totalQuestions}</span>
                </button>
                <div className="h-8 px-2.5 rounded-lg border border-dark-border bg-dark-surface-50 flex items-center gap-1.5 text-xs text-gray-500">
                  <Timer className="h-3.5 w-3.5" />
                  <span className="tabular-nums font-mono">{formatTime(sessionElapsed)}</span>
                </div>
                <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border ${timerPhase === 'expired' ? 'border-error-500/30 bg-error-500/10' : 'border-dark-border bg-dark-surface-50'}`}>
                  <Clock className={`h-3.5 w-3.5 ${timerPhase === 'expired' ? 'text-error-400' : 'text-gray-500'}`} />
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

            {timerPhase === 'prompt_playing' && hasAudio && (
              <div className="rounded-2xl border border-primary-500/30 bg-primary-500/5 p-6 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary-500/20 flex items-center justify-center">
                    <Headphones className="h-8 w-8 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-100 mb-1">Listen to the Audio Prompt</h3>
                    <p className="text-xs text-gray-500">The recording will play once. Listen carefully.</p>
                  </div>
                  {audioPlaying ? (
                    <div className="w-full max-w-sm space-y-2">
                      <div className="h-1.5 rounded-full bg-dark-elevated overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full transition-all duration-300"
                          style={{ width: audioDuration > 0 ? `${(audioProgress / audioDuration) * 100}%` : '0%' }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{formatAudioTime(audioProgress)}</span>
                        <Volume2 className="h-4 w-4 text-primary-400 animate-pulse" />
                        <span>{formatAudioTime(audioDuration)}</span>
                      </div>
                    </div>
                  ) : audioEnded ? (
                    <p className="text-xs text-success-400">Audio complete. Preparing...</p>
                  ) : (
                    <Button onClick={startAudio} icon={<Play className="h-4 w-4 fill-current" />}>
                      Play Audio
                    </Button>
                  )}
                </div>
              </div>
            )}

            {isReading && current.item.passageText && timerPhase !== 'prompt_playing' && (
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

            {isSpeaking && current.code === 'DI' && current.item.imageUrl && timerPhase !== 'prompt_playing' && (
              <div className="rounded-2xl border border-dark-border bg-dark-surface-50 overflow-hidden">
                <img referrerPolicy="no-referrer" src={current.item.imageUrl} alt={current.item.title} className="w-full max-h-72 object-contain p-4" />
              </div>
            )}

            {timerPhase !== 'prompt_playing' && (
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
            )}

            {state === 'submitted' && submissionResults[currentIndex] && (
              <div className={`rounded-2xl border p-5 ${
                submissionResults[currentIndex].correct
                  ? 'border-success-500/30 bg-success-500/5'
                  : 'border-error-500/30 bg-error-500/5'
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    submissionResults[currentIndex].correct
                      ? 'bg-success-500/20 text-success-400'
                      : 'bg-error-500/20 text-error-400'
                  }`}>
                    {submissionResults[currentIndex].correct ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <X className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-100">
                      {submissionResults[currentIndex].correct ? 'Correct!' : 'Incorrect'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {submissionResults[currentIndex].score !== null
                        ? `Score: ${submissionResults[currentIndex].score}%`
                        : 'Model answer comparison available in review'}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 shrink-0 w-20">Your answer:</span>
                    <span className="text-gray-300">{submissionResults[currentIndex].userAnswer}</span>
                  </div>
                  {!submissionResults[currentIndex].correct && (
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500 shrink-0 w-20">Expected:</span>
                      <span className="text-gray-300">{submissionResults[currentIndex].correctAnswer}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {timerPhase !== 'prompt_playing' && (
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
                    currentIndex < totalQuestions - 1 ? (
                      <Button
                        size="sm"
                        onClick={handleNext}
                        icon={<ChevronRight className="h-4 w-4" />}
                        iconPosition="right"
                      >
                        Next Question
                      </Button>
                    ) : (
                      <Button size="sm" onClick={handleFinish} icon={<BarChart3 className="h-4 w-4" />}>
                        View Results
                      </Button>
                    )
                  ) : (
                    <Button
                      size="sm"
                      onClick={handleSubmit}
                      disabled={timerPhase === 'preparing' || timerPhase === 'submitted'}
                      icon={<Send className="h-4 w-4" />}
                    >
                      {timerPhase === 'expired' ? 'Submit (Expired)' : 'Submit Answer'}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </StudentPageContainer>
      </div>

      {questionPanelOpen && (
        <div className="w-72 border-l border-dark-border bg-dark-surface-100 overflow-y-auto shrink-0 hidden sm:block">
          <div className="sticky top-0 bg-dark-surface-100/95 backdrop-blur-sm px-4 py-3 border-b border-dark-border flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-100">Questions</span>
            <button
              onClick={() => setQuestionPanelOpen(false)}
              className="h-6 w-6 rounded flex items-center justify-center text-gray-500 hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-3 space-y-1">
            {sessionQuestions.map((q, idx) => {
              const isCurrent = idx === currentIndex;
              const isAnswered = answeredQuestions.has(idx);
              return (
                <button
                  key={idx}
                  onClick={() => navigateToQuestion(idx)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 ${
                    isCurrent
                      ? 'bg-primary-500/10 border border-primary-500/30'
                      : 'hover:bg-dark-elevated border border-transparent'
                  }`}
                >
                  <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                    isAnswered
                      ? 'bg-success-500/20 text-success-400'
                      : isCurrent
                        ? 'bg-primary-500/20 text-primary-400'
                        : 'bg-dark-elevated text-gray-500'
                  }`}>
                    {isAnswered ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-gray-300 truncate">{q.item.title}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-mono text-gray-500">{q.code}</span>
                      <Badge variant={SECTION_BADGE[q.section] || 'default'}>{q.section}</Badge>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
