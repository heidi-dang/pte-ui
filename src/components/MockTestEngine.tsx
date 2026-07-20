// Dynamic imports used to code-split heavy dependencies
import { WaveAudioPlayer } from "./WaveAudioPlayer";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Suspense } from 'react';
import { useGlobalContext } from './ThemeContext';
import { PTE_TASK_TYPES } from '../data/mockData';
import { MockTest, TestAttempt } from '../types';
import { MOCK_ATTEMPT_STATUS } from '../shared/mockExamStatus';
import { getMockTaskRenderer } from './mock-exam/renderers/registry';

// Code-split the heavy Recharts dashboard container
const TestHistoryTab = React.lazy(() => import('./TestHistoryTab'));
import {
  Play,
  Pause,
  Save,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Activity,
  Calendar,
  BookOpen,
  Award,
  Sparkles,
  Layers,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  Lock,
  X,
  Check,
  Mic,
  Square,
  Volume2,
  VolumeX,
  AlertTriangle,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MockTestEngineProps {
  onNavigateReport: () => void;
  initialTest?: any;
  initialAttemptId?: string | null;
  initialQuestions?: any[];
  initialAnswers?: Record<string, unknown>;
  initialQuestionIndex?: number;
  initialSecondsRemaining?: number;
  initialExamMode?: boolean;
}

const DIAG_QUESTIONS = [
  {
    id: 'diag-1',
    taskCode: 'RA',
    title: 'Read Aloud (Speaking)',
    section: 'Speaking',
    instruction: 'Look at the text below. In 40 seconds, you must read this text aloud as naturally and clearly as possible.',
    promptText: 'The rapid development of artificial intelligence has introduced unprecedented opportunities and systemic challenges to the traditional job market, prompting policymakers to reconsider vocational training frameworks.'
  },
  {
    id: 'diag-2',
    taskCode: 'WE',
    title: 'Write Essay (Writing)',
    section: 'Writing',
    instruction: 'Write a persuasive academic essay of 200-300 words. Explain if governments should prioritize industrialization over environmental protection.',
    promptText: 'Governments should prioritize rapid economic development and industrialization even if it leads to severe environmental degradation. To what extent do you agree or disagree?'
  },
  {
    id: 'diag-3',
    taskCode: 'ROP',
    title: 'Re-order Paragraphs (Reading)',
    section: 'Reading',
    instruction: 'Choose the correct chronological or logical sequencing for the scrambled paragraphs.',
    promptText: 'A. Consequently, they support unique communities of organisms.\nB. Historically, scientists believed deep-sea floors were barren deserts.\nC. These vents discharge mineral-rich superheated fluids from deep Earth.\nD. However, the discovery of hydrothermal vents in 1977 changed this paradigm.',
    options: [
      'B -> D -> C -> A (Correct Logical Flow)',
      'B -> C -> D -> A',
      'C -> B -> D -> A',
      'A -> C -> D -> B'
    ],
    correctAnswer: 'B -> D -> C -> A (Correct Logical Flow)'
  },
  {
    id: 'diag-4',
    taskCode: 'SST',
    title: 'Summarize Spoken Text (Listening)',
    section: 'Listening',
    instruction: 'Review the lecture transcript below and compile a strict 50-70 word summary detailing core arguments.',
    promptText: 'Coral reefs are experiencing unprecedented bleaching events. This severe degradation is directly triggered by anthropogenic carbon emissions, driving ocean warming and rapid acidification. Immediate global mitigation represents the only viable restoration pathway.'
  },
  {
    id: 'diag-5',
    taskCode: 'WFD',
    title: 'Write from Dictation (Listening)',
    section: 'Listening',
    instruction: 'Type the sentence exactly as spoken or transcribed in the prompt box.',
    promptText: 'The primary source of funding for scientific research comes from public federal grants.'
  }
];

export const MockTestEngine: React.FC<MockTestEngineProps> = ({
  onNavigateReport,
  initialTest,
  initialAttemptId: initialAttemptIdProp,
  initialQuestions,
  initialAnswers: initialAnswersProp,
  initialQuestionIndex: initialQIndexProp,
  initialSecondsRemaining: initialSecondsProp,
  initialExamMode,
}) => {
  const { theme, apiFetch, user } = useGlobalContext();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [activeTest, setActiveTest] = useState<MockTest | null>(null);
  const [testState, setTestState] = useState<'idle' | 'running' | 'paused' | 'review'>('idle');
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [activeTab, setActiveTab] = useState<'available' | 'diagnostic' | 'history'>('available');
  const [activeAttemptId, setActiveAttemptId] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [examMode, setExamMode] = useState(false);
  const [fullscreenAlert, setFullscreenAlert] = useState(false);

  // Diagnostic Test States
  const [inDiagnostic, setInDiagnostic] = useState(false);
  const [diagStep, setDiagStep] = useState(0);
  const [diagAnswers, setDiagAnswers] = useState<Record<string, string>>({});
  const [isSubmittingDiag, setIsSubmittingDiag] = useState(false);
  const [diagState, setDiagState] = useState<{
    diagnosticDone: boolean;
    studyPlan: string | null;
    estimatedScores: { speaking: number; writing: number; reading: number; listening: number } | null;
  }>({
    diagnosticDone: false,
    studyPlan: null,
    estimatedScores: null
  });

  const [testHistory, setTestHistory] = useState<TestAttempt[]>([]);
  const [mockTests, setMockTests] = useState<any[]>([]);
  const [activeResumeAttempt, setActiveResumeAttempt] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // AI Dynamic Test Generator States
  const [genNumQuestions, setGenNumQuestions] = useState(5);
  const [genTopic, setGenTopic] = useState('');
  const [genAiMode, setGenAiMode] = useState(false); // false: template randomization, true: DeepSeek AI
  const [genTaskCodes, setGenTaskCodes] = useState<string[]>(['RA', 'RS', 'DI', 'RL', 'ASQ', 'SWT', 'WE']);
  const [isGeneratingTest, setIsGeneratingTest] = useState(false);
  const [genStatusMessage, setGenStatusMessage] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('Speaking');

  // Timers & States for active question
  const [prepTimer, setPrepTimer] = useState(10);
  const [questionTimer, setQuestionTimer] = useState(40);
  const [status, setStatus] = useState<'preparing' | 'recording' | 'answering' | 'completed'>('preparing');
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioPlaybackProgress, setAudioPlaybackProgress] = useState(0);

  // Interaction inputs states
  const [userTypedText, setUserTypedText] = useState('');
  const [userSelectedOption, setUserSelectedOption] = useState<string>('');
  const [userSelectedMultiple, setUserSelectedMultiple] = useState<string[]>([]);
  const [reorderedList, setReorderedList] = useState<string[]>([]);
  const [selectedBlanks, setSelectedBlanks] = useState<Record<number, string>>({});
  const [highlightedIncorrect, setHighlightedIncorrect] = useState<string[]>([]);

  // Initialize from props if provided (start/resume from MockExamsPage)
  useEffect(() => {
    if (initialTest && initialQuestions) {
      setActiveTest(initialTest);
      setSecondsRemaining(initialSecondsProp ?? initialTest.duration * 60);
      setCurrentQuestionIndex(initialQIndexProp ?? 0);
      setAnswers((initialAnswersProp as Record<number, string>) ?? {});
      setExamMode(initialExamMode ?? (initialTest.type === 'full' || initialTest.type === 'section'));
      if (initialAttemptIdProp) setActiveAttemptId(initialAttemptIdProp);
      setTestState('running');
    }
  }, []); // run once on mount
  // Real voice recording states
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isRecordingRealMic, setIsRecordingRealMic] = useState(false);
  const [isRecordedPlaybackPlaying, setIsRecordedPlaybackPlaying] = useState(false);
  const recordedAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const promptAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const [simulatedVoiceLevels, setSimulatedVoiceLevels] = useState<number[]>([]);
  const [authorizedAudioUrl, setAuthorizedAudioUrl] = useState<string | null>(null);

  // Load diagnostic states and attempts history from API on mount
  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      // 0. Get Available Mock Tests
      const tests = await apiFetch('/api/student/mock-tests');
      setMockTests(tests);

      // 1. Get Diagnostic state
      const diagData = await apiFetch('/api/student/diagnostic-state');
      setDiagState({
        diagnosticDone: diagData.diagnosticDone,
        studyPlan: diagData.studyPlan,
        estimatedScores: diagData.estimatedScores
      });

      if (diagData.diagnosticDone) {
        setActiveTab('diagnostic');
      }

      // 2. Get Test Attempt History
      const history = await apiFetch('/api/student/mock-tests/attempts');
      setTestHistory(history);

      // 3. Check for any active/interrupted mock sessions to resume
      const activeSession = await apiFetch('/api/student/mock-tests/active');
      if (activeSession && activeSession.activeAttempt) {
        setActiveResumeAttempt(activeSession.activeAttempt);
      } else {
        setActiveResumeAttempt(null);
      }
    } catch (err) {
      console.error('Failed to load initial mock test or diagnostic details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [user]);

  // Keyboard navigation shortcuts and Anti-Cheat locks
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (testState === 'running' && activeTest) {
        // Block F5 / Refresh
        if (e.key === 'F5' || (e.ctrlKey && e.key === 'r') || (e.metaKey && e.key === 'r')) {
          e.preventDefault();
          alert('Page refresh is disabled during an active exam.');
        }

        // Navigation shortcuts
        if (e.altKey && e.key.toLowerCase() === 'n') {
          e.preventDefault();
          if (currentQuestionIndex === activeTest.questionsCount - 1) {
            setTestState('review');
          } else {
            handleNextQuestion();
          }
        }
        if (e.altKey && e.key.toLowerCase() === 'p' && currentQuestionIndex > 0) {
          e.preventDefault();
          handlePrevQuestion();
        }
      } else if (inDiagnostic) {
        if (e.altKey && e.key.toLowerCase() === 'n') {
          e.preventDefault();
          if (diagStep === DIAG_QUESTIONS.length - 1) {
            handleSubmitDiagnostic();
          } else {
            setDiagStep(prev => prev + 1);
          }
        } else if (e.altKey && e.key.toLowerCase() === 'p') {
          e.preventDefault();
          setDiagStep(prev => Math.max(prev - 1, 0));
        }
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (testState === 'running') {
        e.preventDefault();
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (testState === 'running' && examMode) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [testState, activeTest, currentQuestionIndex, inDiagnostic, diagStep, answers, userTypedText, userSelectedOption, userSelectedMultiple, reorderedList, selectedBlanks, highlightedIncorrect, recordedAudioUrl]);

  // Fullscreen Management — requested from user gesture in handleStartTest
  const [fullscreenRequested, setFullscreenRequested] = useState(false);
  useEffect(() => {
    if (fullscreenRequested && testState === 'running') {
      try {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(e => {
            console.warn('Failed to enter fullscreen mode', e);
          });
        }
      } catch (err) {}
      setFullscreenRequested(false);
    }
  }, [fullscreenRequested, testState]);

  const handleFullscreenChange = () => {
    if (!document.fullscreenElement && testState === 'running') {
      handlePauseTest();
      setFullscreenAlert(true);
    }
  };

  useEffect(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [testState]);

  // Master Timer Tick handler
  useEffect(() => {
    let timerId: NodeJS.Timeout;
    if (testState === 'running' && secondsRemaining > 0) {
      timerId = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerId);
            setTestState('review');
            return 0;
          }
          // Periodically save state to db in background every 30 seconds
          if (prev % 30 === 0) {
            saveProgressToDatabase(prev - 1, false);
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [testState, secondsRemaining]);

  // Trigger question-specific state initialization
  useEffect(() => {
    if (testState !== 'running' || !activeTest || !activeTest.questions) return;
    const currentQuestion = activeTest.questions[currentQuestionIndex];
    if (!currentQuestion) return;

    const taskCode = currentQuestion.code || (currentQuestion as any).taskCode || 'RA';
    const info = PTE_TASK_TYPES.find((t) => t.code === taskCode) || { prepTime: 10, attemptTime: 40 };

    const savedAnswer = answers[currentQuestionIndex] || '';

    // Stop prompt audio if playing
    setIsAudioPlaying(false);
    setAudioPlaybackProgress(0);
    setAuthorizedAudioUrl(null);
    if (promptAudioRef.current) {
      promptAudioRef.current.pause();
      promptAudioRef.current.currentTime = 0;
    }

    // Stop and clear previous recorder
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      try {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(t => t.stop());
      } catch {}
      setMediaRecorder(null);
    }
    setRecordedAudioUrl(null);
    setIsRecordedPlaybackPlaying(false);

    // Initialize answer inputs from savedAnswer string
    if (['SWT', 'WE', 'SST', 'WFD'].includes(taskCode)) {
      setUserTypedText(savedAnswer);
    } else {
      setUserTypedText('');
    }

    if (['MCS', 'MCSSL', 'HCS', 'SMW'].includes(taskCode)) {
      setUserSelectedOption(savedAnswer);
    } else {
      setUserSelectedOption('');
    }

    if (['MCM', 'MCMSL'].includes(taskCode)) {
      try {
        setUserSelectedMultiple(savedAnswer ? JSON.parse(savedAnswer) : []);
      } catch {
        setUserSelectedMultiple([]);
      }
    } else {
      setUserSelectedMultiple([]);
    }

    const options = currentQuestion.options || ((currentQuestion as any).optionsJson ? JSON.parse((currentQuestion as any).optionsJson) : []);
    if (taskCode === 'ROP') {
      try {
        setReorderedList(savedAnswer ? JSON.parse(savedAnswer) : [...options]);
      } catch {
        setReorderedList([...options]);
      }
    } else {
      setReorderedList([]);
    }

    if (['FIBR', 'FIBRW', 'FIBL'].includes(taskCode)) {
      try {
        setSelectedBlanks(savedAnswer ? JSON.parse(savedAnswer) : {});
      } catch {
        setSelectedBlanks({});
      }
    } else {
      setSelectedBlanks({});
    }

    if (taskCode === 'HIW') {
      try {
        setHighlightedIncorrect(savedAnswer ? JSON.parse(savedAnswer) : []);
      } catch {
        setHighlightedIncorrect([]);
      }
    } else {
      setHighlightedIncorrect([]);
    }

    // Set prep & response timers
    const syncServerTimer = async () => {
      if (!activeAttemptId) {
        setPrepTimer(info.prepTime);
        setQuestionTimer(info.attemptTime);
        setStatus(info.prepTime > 0 ? 'preparing' : 'answering');
        return;
      }
      try {
        const result = await apiFetch('/api/student/mock-tests/start-question', {
          method: 'POST',
          body: JSON.stringify({
            attemptId: activeAttemptId,
            questionId: currentQuestion.questionId || currentQuestion.id,
            questionIndex: currentQuestionIndex,
            prepTime: info.prepTime,
            responseTime: info.attemptTime,
          }),
        });

        if (result && result.deadlineAt) {
          const clientNow = Date.now();
          const serverDeadline = new Date(result.deadlineAt).getTime();
          const remainingSeconds = Math.max(1, Math.round((serverDeadline - clientNow) / 1000));
          
          if (info.prepTime > 0) {
            const prepSecs = Math.min(info.prepTime, remainingSeconds);
            setPrepTimer(prepSecs);
            setQuestionTimer(Math.max(0, remainingSeconds - prepSecs));
            setStatus(prepSecs > 0 ? 'preparing' : 'answering');
          } else {
            setPrepTimer(0);
            setQuestionTimer(remainingSeconds);
            setStatus('answering');
          }
        } else {
          setPrepTimer(info.prepTime);
          setQuestionTimer(info.attemptTime);
          setStatus(info.prepTime > 0 ? 'preparing' : 'answering');
        }
      } catch (err) {
        console.error('Failed to sync question timers with server:', err);
        setPrepTimer(info.prepTime);
        setQuestionTimer(info.attemptTime);
        setStatus(info.prepTime > 0 ? 'preparing' : 'answering');
      }
    };

    if (savedAnswer && ['RA', 'RS', 'DI', 'RL', 'ASQ', 'SGD', 'RTS'].includes(taskCode)) {
      setRecordedAudioUrl(savedAnswer);
      setStatus('completed');
    } else {
      syncServerTimer();
    }
  }, [currentQuestionIndex, activeTest, testState, activeAttemptId]);

  // Prep Timer Countdown
  useEffect(() => {
    if (testState === 'running' && status === 'preparing') {
      const pInterval = setInterval(() => {
        setPrepTimer((prev) => {
          if (prev <= 1) {
            clearInterval(pInterval);
            const currentQuestion = activeTest?.questions?.[currentQuestionIndex];
            const taskCode = currentQuestion?.code || (currentQuestion as any)?.taskCode || 'RA';
            if (['RA', 'RS', 'DI', 'RL', 'ASQ', 'SGD', 'RTS'].includes(taskCode)) {
              setStatus('recording');
            } else {
              setStatus('answering');
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(pInterval);
    }
  }, [status, testState, activeTest, currentQuestionIndex]);

  // Question Response Timer Countdown
  useEffect(() => {
    if (testState !== 'running') return;
    if (status === 'recording' || status === 'answering') {
      const qInterval = setInterval(() => {
        setQuestionTimer((prev) => {
          if (prev <= 1) {
            clearInterval(qInterval);
            setStatus('completed');
            handleAutoAdvance();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(qInterval);
    }
  }, [status, testState]);

  // Polling for Grading Status
  useEffect(() => {
    if (activeTab === 'history') {
      const needsPolling = testHistory.some(h => h.status === MOCK_ATTEMPT_STATUS.PENDING_GRADING || h.status === MOCK_ATTEMPT_STATUS.GRADING || h.overallScore === 0);
      if (needsPolling) {
        const pollInterval = setInterval(async () => {
          try {
            const updatedHistory = await apiFetch('/api/student/mock-tests/attempts');
            setTestHistory(updatedHistory);
          } catch { /* ignore */ }
        }, 5000);
        return () => clearInterval(pollInterval);
      }
    }
  }, [activeTab, testHistory]);

  // Handle start/stop recording on status change
  useEffect(() => {
    let simInterval: NodeJS.Timeout | null = null;
    if (status === 'recording') {
      startRecording();
      simInterval = setInterval(() => {
        setSimulatedVoiceLevels(() =>
          Array.from({ length: 18 }, () => Math.floor(Math.random() * 40) + 10)
        );
      }, 150);
    } else if (status === 'completed' || status === 'preparing') {
      stopRecording();
      if (simInterval) clearInterval(simInterval);
    }
    return () => {
      if (simInterval) clearInterval(simInterval);
    };
  }, [status]);

  // Save/Pause Mock Progress helper
  const saveProgressToDatabase = async (timeRemaining: number, isPausedState: boolean, overrideAnswers?: Record<number, string>) => {
    if (!activeTest) return;
    const nextRevision = revision + 1;
    setRevision(nextRevision);
    try {
      const res = await apiFetch('/api/student/mock-tests/save-progress', {
        method: 'POST',
        body: JSON.stringify({
          attemptId: activeAttemptId,
          testId: activeTest.id,
          title: activeTest.title,
          type: activeTest.type,
          currentQuestionIndex,
          secondsRemaining: timeRemaining,
          answers: overrideAnswers || answers,
          isPaused: isPausedState,
          revision: nextRevision
        })
      });
      if (res && res.attempt) {
        if (res.attempt.endsAt && !isPausedState) {
           const timeDiff = new Date(res.attempt.endsAt).getTime() - Date.now();
           if (timeDiff > 0) {
             setSecondsRemaining(Math.floor(timeDiff / 1000));
           }
        }
      }
    } catch (err: any) {
      if (err.status === 409) {
        console.warn('Stale revision detected, local state might be behind.');
      } else {
        console.error('Failed to save mock progress in background:', err);
      }
    }
  };

  const saveCurrentInputsToAnswers = () => {
    if (!activeTest) return;
    const currentQuestion = activeTest.questions?.[currentQuestionIndex];
    if (!currentQuestion) return;
    const taskCode = currentQuestion.code || (currentQuestion as any).taskCode || 'RA';

    let ansVal = '';
    if (['SWT', 'WE', 'SST', 'WFD'].includes(taskCode)) {
      ansVal = userTypedText;
    } else if (['MCS', 'MCSSL', 'HCS', 'SMW'].includes(taskCode)) {
      ansVal = userSelectedOption;
    } else if (['MCM', 'MCMSL'].includes(taskCode)) {
      ansVal = JSON.stringify(userSelectedMultiple);
    } else if (taskCode === 'ROP') {
      ansVal = JSON.stringify(reorderedList);
    } else if (['FIBR', 'FIBRW', 'FIBL'].includes(taskCode)) {
      ansVal = JSON.stringify(selectedBlanks);
    } else if (taskCode === 'HIW') {
      ansVal = JSON.stringify(highlightedIncorrect);
    } else if (['RA', 'RS', 'DI', 'RL', 'ASQ', 'SGD', 'RTS'].includes(taskCode)) {
      ansVal = recordedAudioUrl || '';
    }

    setAnswers((prev) => {
      const updated = { ...prev, [currentQuestionIndex]: ansVal };
      saveProgressToDatabase(secondsRemaining, false, updated);
      return updated;
    });
  };

  const handleAutoAdvance = () => {
    stopRecording();
    saveCurrentInputsToAnswers();
    if (activeTest) {
      if (currentQuestionIndex === activeTest.questionsCount - 1) {
        setTestState('review');
      } else {
        handleNextQuestion();
      }
    }
  };

  const startRecording = async () => {
    const capturedQuestionIndex = currentQuestionIndex;
    const currentQuestion = activeTest?.questions?.[capturedQuestionIndex];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedAudioUrl(url);

        try {
          const formData = new FormData();
          formData.append('file', blob, 'attempt.webm');
          formData.append('attemptId', activeAttemptId || '');
          formData.append('questionId', currentQuestion?.questionId || currentQuestion?.id || '');
          const uploadRes = await apiFetch('/api/student/mock-tests/upload-audio', {
            method: 'POST',
            body: formData,
          });
          if (uploadRes && uploadRes.url) {
            setAnswers(prev => {
              const updated = { ...prev, [capturedQuestionIndex]: uploadRes.url };
              saveProgressToDatabase(secondsRemaining, false, updated);
              return updated;
            });
          }
        } catch (uploadErr) {
          console.error('Audio upload failed:', uploadErr);
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecordingRealMic(true);
    } catch (err) {
      console.warn('Microphone access blocked or unavailable. Using fallback.', err);
      setIsRecordingRealMic(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      try {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      } catch (err) {
        console.error('Error stopping MediaRecorder:', err);
      }
    }
  };

  const handlePlayAudio = async () => {
    if (promptAudioRef.current) {
      if (isAudioPlaying) {
        promptAudioRef.current.pause();
        setIsAudioPlaying(false);
      } else {
        if (!authorizedAudioUrl) {
          try {
            const currentQuestion = activeTest?.questions?.[currentQuestionIndex];
            if (!currentQuestion) return;
            const res = await apiFetch('/api/student/mock-tests/play-prompt', {
              method: 'POST',
              body: JSON.stringify({
                attemptId: activeAttemptId,
                questionId: currentQuestion.questionId || currentQuestion.id,
              }),
            });
            if (res && res.audioUrl) {
              setAuthorizedAudioUrl(res.audioUrl);
              setTimeout(() => {
                if (promptAudioRef.current) {
                  promptAudioRef.current.play().catch(e => console.error(e));
                  setIsAudioPlaying(true);
                }
              }, 100);
            } else {
              alert('Could not authorize playback.');
            }
          } catch (err: any) {
            console.error(err);
            alert(err.message || 'Playback limit exceeded. This audio can only be played once.');
          }
        } else {
          promptAudioRef.current.play().catch(e => console.error(e));
          setIsAudioPlaying(true);
        }
      }
    } else {
      setIsAudioPlaying(true);
      let progress = 0;
      const playInterval = setInterval(() => {
        progress += 5;
        setAudioPlaybackProgress(progress);
        if (progress >= 100) {
          clearInterval(playInterval);
          setIsAudioPlaying(false);
        }
      }, 200);
    }
  };

  // Trigger Resume Examination session
  const handleResumeActiveExam = () => {
    if (!activeResumeAttempt) return;
    let restoredQuestions: any[] | undefined;
    let hasQuestions = false;
    try {
      if ((activeResumeAttempt as any).questions) {
        restoredQuestions = (activeResumeAttempt as any).questions;
        hasQuestions = true;
      }
    } catch { /* ignore parse errors */ }
    
    if (hasQuestions && restoredQuestions) {
      // Rebuild from persisted data, don't fall back to MOCK_TESTS
      setActiveTest({
        id: activeResumeAttempt.testId || '',
        title: activeResumeAttempt.title || 'Resumed Test',
        type: activeResumeAttempt.type || 'mini',
        duration: Math.ceil((activeResumeAttempt.secondsRemaining || 1800) / 60),
        questionsCount: restoredQuestions.length,
        questions: restoredQuestions,
        section: 'Resumed',
        difficulty: 'Medium',
      });
      setSecondsRemaining(activeResumeAttempt.secondsRemaining || 1800);
    } else {
      if (activeResumeAttempt) {
        try {
          // Find the test from the async‑loaded list; fall back to first entry if needed
          const testMatch =
            mockTests.find(t => t.id === activeResumeAttempt.testId) ||
            mockTests[0] ||
            // final safety net if the list is still empty
            { duration: 30 }; // 30 min fallback

          const testObj = {
            ...testMatch,
            questions: restoredQuestions,
          };
          setActiveTest(testObj);

          // Safe calculation guard to prevent NaN failures
          const defaultDuration = testMatch?.duration ? testMatch.duration * 60 : 1800; // 30-min fallback
          setSecondsRemaining(activeResumeAttempt.secondsRemaining || defaultDuration);
        } catch (e) {
          console.error('Error resuming test:', e);
          setSecondsRemaining(1800);
        }
      }
    }
    setActiveAttemptId(activeResumeAttempt.id);
    setCurrentQuestionIndex(activeResumeAttempt.currentQuestionIndex || 0);
    setAnswers(activeResumeAttempt.answers || {});
    setTestState('running');
    setActiveResumeAttempt(null);
  };

  // Discard interrupted session
  const handleDiscardActiveExam = async () => {
    if (!activeResumeAttempt) return;
    try {
      await apiFetch(`/api/student/mock-tests/active/${activeResumeAttempt.id}`, {
        method: 'DELETE',
      });
      setActiveResumeAttempt(null);
      fetchInitialData();
    } catch (err) {
      console.error('Failed discarding active session:', err);
    }
  };

  const handleGenerateTest = async () => {
    setIsGeneratingTest(true);
    setGenStatusMessage('Loading published question bank items...');
    
    const statuses = [
      'Building mock test sequence...',
      'Checking fallback coverage...',
      'Preparing mock test session...',
    ];
    
    let currentMsgIdx = 0;
    const interval = setInterval(() => {
      if (currentMsgIdx < statuses.length) {
        setGenStatusMessage(statuses[currentMsgIdx]);
        currentMsgIdx++;
      }
    }, 1200);

    try {
      const selectedTestType = genNumQuestions <= 5 ? 'mini' : genNumQuestions <= 15 ? 'section' : 'full';
      const result = await apiFetch('/api/student/mock-tests/generate', {
        method: 'POST',
        body: JSON.stringify({
          testType: selectedTestType,
          focusSection: selectedTestType === 'section' ? selectedSection : undefined,
        })
      });

      clearInterval(interval);
      if (result && result.test) {
        if (!result.test.id) {
          alert('Generated test has no id. Cannot start.');
          setIsGeneratingTest(false);
          setGenStatusMessage('');
          return;
        }
        handleStartTest(result.test);
      } else {
        alert('Failed to generate mock exam. Please verify your connection.');
      }
    } catch (err: any) {
      clearInterval(interval);
      console.error('Test generation error:', err);
      alert('Test generation failed: ' + (err.message || err));
    } finally {
      setIsGeneratingTest(false);
      setGenStatusMessage('');
    }
  };

  const handleStartTest = async (test: MockTest) => {
    let finalTest = { ...test };
    if (!finalTest.questions || finalTest.questions.length === 0) {
      try {
        const result = await apiFetch('/api/student/mock-tests/generate', {
          method: 'POST',
          body: JSON.stringify({
            testType: test.type,
            focusSection: test.type === 'section' ? test.section : undefined,
          })
        });
        if (result && result.test && result.test.questions) {
          finalTest = {
            ...finalTest,
            questions: result.test.questions,
            questionsCount: result.test.questions.length,
          };
        }
      } catch (err) {
        console.error('Failed generating preset questions:', err);
      }
    }

    setActiveTest(finalTest);
    setSecondsRemaining(finalTest.duration * 60);
    setCurrentQuestionIndex(0);
    setAnswers({});
    const isExam = finalTest.type === 'full' || finalTest.type === 'section';
    setExamMode(isExam);
    
    // Request fullscreen from user gesture
    if (isExam) {
      try {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(e => {
            console.warn('Failed to enter fullscreen mode', e);
          });
        }
      } catch (err) {}
    }

    try {
      const response = await apiFetch('/api/student/mock-tests/save-progress', {
        method: 'POST',
        body: JSON.stringify({
          testId: finalTest.id,
          title: finalTest.title,
          type: finalTest.type,
          currentQuestionIndex: 0,
          secondsRemaining: finalTest.duration * 60,
          answers: {},
          isPaused: false,
          questionsJson: (finalTest as any).questions || undefined,
        })
      });
      if (response && response.attempt) {
        setActiveAttemptId(response.attempt.id);
      }
      setTestState('running');
    } catch (err) {
      console.error('Failed starting test recording session:', err);
      // Show error to user instead of silently entering local-only mode
      // The test state stays 'idle' so the user sees a recoverable state
    }
  };

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs > 0 ? hrs + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePauseTest = async () => {
    setTestState('paused');
    await saveProgressToDatabase(secondsRemaining, true);
  };

  const handleResumeTest = async () => {
    setTestState('running');
    await saveProgressToDatabase(secondsRemaining, false);
  };

  const handleNextQuestion = () => {
    saveCurrentInputsToAnswers();
    setCurrentQuestionIndex(prev => {
      const nextIdx = prev + 1;
      return nextIdx;
    });
  };

  const handlePrevQuestion = () => {
    saveCurrentInputsToAnswers();
    setCurrentQuestionIndex(prev => {
      const prevIdx = Math.max(prev - 1, 0);
      return prevIdx;
    });
  };

  const handleSubmitMockTest = async () => {
    if (!activeTest) return;

    saveCurrentInputsToAnswers();

    try {
      await apiFetch('/api/student/mock-tests/complete', {
        method: 'POST',
        body: JSON.stringify({
          attemptId: activeAttemptId,
          testId: activeTest.id,
          title: activeTest.title,
          type: activeTest.type,
          overallScore: 0,
          speakingScore: 0,
          writingScore: 0,
          readingScore: 0,
          listeningScore: 0,
          answers,
          questionsJson: (activeTest as any).questions,
        })
      });
      
      setTestState('idle');
      setActiveTest(null);
      setActiveAttemptId(null);
      onNavigateReport();
    } catch (err: any) {
      setTestState('running');
      alert('Failed to submit mock test: ' + (err.message || 'Please try again.'));
    }
  };

  // Submit Diagnostic Test Answers to AI
  const handleSubmitDiagnostic = async () => {
    setIsSubmittingDiag(true);
    
    // Structure answers array for AI
    const submissionAnswers = DIAG_QUESTIONS.map((q) => ({
      taskCode: q.taskCode,
      title: q.title,
      section: q.section,
      promptText: q.promptText,
      answerText: diagAnswers[q.id] || 'Not answered.'
    }));

    try {
      const response = await apiFetch('/api/student/diagnostic/submit', {
        method: 'POST',
        body: JSON.stringify({ answers: submissionAnswers })
      });

      setDiagState({
        diagnosticDone: true,
        studyPlan: response.studyPlan,
        estimatedScores: response.estimatedScores
      });

      setInDiagnostic(false);
      setDiagStep(0);
      setDiagAnswers({});
      setActiveTab('diagnostic');
    } catch (err) {
      console.error('Diagnostic submission failed:', err);
    } finally {
      setIsSubmittingDiag(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      {/* 1. TIMED IMMERSIVE SIMULATOR SCREEN */}
      {testState !== 'idle' && activeTest ? (
        <div className={`space-y-6 p-6 sm:p-8 border shadow-xl rounded-3xl transition-all duration-300 ${
          theme === 'dark' 
            ? 'bg-slate-900/60 backdrop-blur-md border-gray-850 shadow-slate-950/40' 
            : 'bg-slate-50/90 border-slate-200 shadow-slate-200/50'
        }`}>
          {/* Header bar controls - Theme integrated premium style */}
          <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 rounded-2xl shadow-md transition-all duration-300 ${
            theme === 'dark' 
              ? 'bg-gradient-to-r from-indigo-950 to-slate-900 border border-slate-800 text-white' 
              : 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white'
          }`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-mono font-bold tracking-widest px-2.5 py-0.5 rounded uppercase ${
                  theme === 'dark' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/20 text-white'
                }`}>
                  {activeTest.title}
                </span>
                <span className={`text-[10px] font-mono tracking-wider font-bold uppercase ${
                  theme === 'dark' ? 'text-indigo-400' : 'text-amber-200'
                }`}>
                  ● MOCK EXAM IN PROGRESS
                </span>
              </div>
              <h2 className="text-sm font-bold opacity-95 hidden sm:block font-sans">Computerized PTE Academic Mock Test Session</h2>
            </div>

            {/* Timers & Pause Toggles */}
            <div className="flex items-center gap-4 mt-2 sm:mt-0">
              <span className="text-xs font-mono opacity-80 hidden md:inline">
                Question {currentQuestionIndex + 1} of {activeTest.questionsCount}
              </span>
              
              <div className={`flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1.5 rounded-xl shadow-inner transition-colors ${
                theme === 'dark'
                  ? 'text-red-400 bg-red-500/10 border border-red-500/25'
                  : 'text-red-600 bg-red-50 border border-red-250'
              }`}>
                <Clock className="w-3.5 h-3.5" /> 
                <span className="font-mono font-bold tracking-tight">{formatTime(secondsRemaining)}</span>
              </div>

              {testState === 'running' && !examMode ? (
                <button
                  onClick={handlePauseTest}
                  className={`px-3 py-1.5 text-xs font-mono transition-all rounded-xl flex items-center gap-1 cursor-pointer font-semibold ${
                    theme === 'dark'
                      ? 'bg-slate-800 hover:bg-slate-700 text-gray-200 border border-slate-700'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-sm'
                  }`}
                >
                  <Pause className="w-3 h-3 text-orange-400" /> Pause Exam
                </button>
              ) : (
                <button
                  onClick={handleResumeTest}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono transition-colors rounded-xl flex items-center gap-1 cursor-pointer font-semibold"
                >
                  <Play className="w-3 h-3 fill-white" /> Resume Exam
                </button>
              )}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {fullscreenAlert && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="fixed top-4 right-4 z-50 max-w-sm rounded-xl border border-warning-500/40 bg-warning-500/10 backdrop-blur-md px-4 py-3 shadow-2xl"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-warning-400 mt-0.5 shrink-0" />
                  <div className="text-xs text-warning-200">
                    <p className="font-semibold mb-1">Fullscreen Exited</p>
                    <p>Test paused. Re-enter fullscreen and resume to continue.</p>
                  </div>
                  <button onClick={() => setFullscreenAlert(false)} className="text-warning-400 hover:text-warning-200 shrink-0">
                    ✕
                  </button>
                </div>
              </motion.div>
            )}
            {testState === 'paused' ? (
              /* Pause Drawer Overlay */
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className={`p-10 text-center space-y-6 max-w-xl mx-auto rounded-3xl border shadow-2xl ${
                  theme === 'dark' 
                    ? 'bg-slate-950 border-slate-800 text-white' 
                    : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
                  theme === 'dark' ? 'bg-orange-500/10 text-orange-400' : 'bg-orange-100 text-orange-600'
                }`}>
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className={`text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Exam Session Paused</h3>
                  <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    Your answers are securely synced. Pearson guidelines require continuous pacing, but you can safely resume when ready.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={handleResumeTest}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-indigo-500/20"
                  >
                    Resume Exam Session
                  </button>
                  <button
                    onClick={() => {
                      setTestState('idle');
                      setActiveTest(null);
                      fetchInitialData();
                    }}
                    className={`px-6 py-2.5 text-xs font-bold transition-all rounded-xl cursor-pointer border ${
                      theme === 'dark'
                        ? 'bg-slate-900 border-slate-800 hover:bg-slate-850 text-gray-400'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    Return to Main Hub
                  </button>
                </div>
              </motion.div>
            ) : testState === 'review' ? (
              /* Review Session before submission */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`p-8 border space-y-6 rounded-3xl shadow-xl ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                <div className="text-center">
                  <span className={`text-[10px] font-mono tracking-widest uppercase px-2.5 py-1 font-bold rounded-md ${
                    theme === 'dark' ? 'text-indigo-400 bg-indigo-500/10' : 'text-[#0259aa] bg-[#ebf3fc]'
                  }`}>
                    PRE-SUBMISSION ANSWER AUDIT
                  </span>
                  <h3 className={`text-lg font-bold mt-3 font-sans ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>Verify Your Answer Allocations</h3>
                  <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Check that all segments are answered before committing to submission.</p>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 py-4 max-w-2xl mx-auto">
                  {Array.from({ length: activeTest.questionsCount }).map((_, index) => {
                    const isAnswered = answers[index] !== undefined && answers[index].trim() !== '';
                    return (
                      <div
                        key={index}
                        className={`p-3.5 rounded-xl border text-center transition-all ${
                          isAnswered
                            ? theme === 'dark'
                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : theme === 'dark'
                              ? 'border-slate-800 bg-slate-900/40 text-slate-500'
                              : 'border-slate-250 bg-slate-50 text-slate-400'
                        }`}
                      >
                        <p className="text-[10px] font-mono font-bold">Q{index + 1}</p>
                        <p className="text-[8px] uppercase font-mono mt-1 font-semibold">
                          {isAnswered ? 'SAVED' : 'EMPTY'}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className={`flex justify-center gap-4 pt-4 border-t ${
                  theme === 'dark' ? 'border-slate-850' : 'border-slate-200'
                }`}>
                  <button
                    onClick={() => setTestState('running')}
                    className={`px-6 py-2.5 text-xs font-bold transition-all rounded-xl cursor-pointer font-mono border ${
                      theme === 'dark'
                        ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                        : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    ← Back to Question
                  </button>
                  <button
                    onClick={handleSubmitMockTest}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/10 cursor-pointer font-mono"
                  >
                    Submit Complete Exam ✓
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-6 items-start">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`flex-1 w-full p-6 sm:p-8 border shadow-xl space-y-6 rounded-3xl ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                >
                {(() => {
                  const currentQuestion = activeTest.questions?.[currentQuestionIndex];
                  const taskCode = currentQuestion?.code || (currentQuestion as any)?.taskCode || 'RA';
                  const promptText = currentQuestion?.promptText || currentQuestion?.passageText || '';
                  const instruction = currentQuestion?.instruction || 'Perform this computerized academic task.';
                  const title = currentQuestion?.title || 'Dynamic Task';
                  const audioUrl = currentQuestion?.audioUrl;
                  const imageUrl = currentQuestion?.imageUrl;
                  const options = currentQuestion?.options || ((currentQuestion as any)?.optionsJson ? JSON.parse((currentQuestion as any).optionsJson) : undefined);

                  return (
                    <div className="space-y-6">
                      {/* Audio prompt tag replaced with WaveAudioPlayer below */}

                      {/* Recorded user audio player replaced with WaveAudioPlayer in UI */}

                      <div>
                        <div className={`flex justify-between items-center border-b pb-3 ${
                          theme === 'dark' ? 'border-slate-850' : 'border-slate-200'
                        }`}>
                          <span className={`text-[10px] font-mono tracking-wider px-3 py-1 font-bold uppercase rounded ${
                            theme === 'dark' ? 'text-indigo-400 bg-indigo-500/10' : 'text-[#1a3a5f] bg-[#ebf3fc]'
                          }`}>
                            Task Type: {taskCode} ({currentQuestion?.section || 'Section'})
                          </span>
                          
                          {/* Question timers indicator */}
                          <div className="flex gap-2">
                            {status === 'preparing' && (
                              <span className="text-[10px] font-mono font-bold text-orange-400 bg-orange-400/10 border border-orange-400/25 px-2 py-0.5 rounded animate-pulse">
                                Prep: {prepTimer}s
                              </span>
                            )}
                            {(status === 'recording' || status === 'answering') && (
                              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/25 px-2 py-0.5 rounded">
                                Limit: {questionTimer}s
                              </span>
                            )}
                          </div>
                        </div>

                        <h3 className={`text-sm sm:text-base font-bold mt-4 font-sans ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>
                          {title}
                        </h3>
                        
                        {/* Instructions envelope */}
                        <div className={`border-l-4 p-3.5 text-xs leading-normal font-sans mt-3 rounded-r-xl ${
                          theme === 'dark' 
                            ? 'bg-indigo-500/5 border-indigo-500/40 text-indigo-300' 
                            : 'bg-indigo-55 border-indigo-600 text-indigo-900'
                        }`}>
                          <p className="font-bold">Instructions:</p>
                          <p className="mt-0.5">{instruction}</p>
                        </div>

                        {/* Image Display for Describe Image */}
                        {imageUrl && (
                          <div className="mt-4 flex justify-center border border-gray-800/40 rounded-2xl overflow-hidden max-w-md mx-auto">
                            <img referrerPolicy="no-referrer" src={imageUrl} alt={title} className="max-h-60 object-contain" />
                          </div>
                        )}

                        {/* Audio Player panel for Listening tasks */}
                        {audioUrl && (
                          <div className={`p-4 rounded-2xl border flex flex-col gap-3 mt-4 ${
                            theme === 'dark' ? 'bg-gray-950/60 border-gray-850' : 'bg-gray-50 border-gray-200'
                          }`}>
                            <div className="flex justify-between items-center text-[10px] font-mono">
                              <span className="text-gray-400">LECTURE RECORDING</span>
                              <span className="text-emerald-400 font-bold">{isAudioPlaying ? 'PLAYING' : 'IDLE'}</span>
                            </div>
                            <WaveAudioPlayer 
                              src={authorizedAudioUrl || ''} 
                              autoPlay={status === 'preparing'}
                              onPlay={() => setIsAudioPlaying(true)}
                              onPause={() => setIsAudioPlaying(false)}
                              onEnded={() => setIsAudioPlaying(false)}
                            />
                          </div>
                        )}

                        {/* Question Prompt panel (Hide transcript for Listening tasks when audio is playing/present) */}
                        {(!audioUrl || !['RS', 'RL', 'SST', 'MCMSL', 'FIBL', 'HCS', 'MCSSL', 'SMW', 'HIW', 'WFD'].includes(taskCode)) && promptText && (
                          <div className={`p-5 rounded-2xl border text-xs leading-relaxed font-sans select-none mt-4 ${
                            theme === 'dark'
                              ? 'bg-slate-900/40 border-slate-850 text-slate-300'
                              : 'bg-slate-50 border-slate-200 text-slate-800'
                          }`}>
                            {promptText}
                          </div>
                        )}
                      </div>

                      {/* Task renderer via registry */}
                      <div className="mt-6">
                        {(taskCode => {
                          const Renderer = getMockTaskRenderer(taskCode);
                          if (Renderer) {
                            return (
                              <Renderer
                                question={currentQuestion}
                                response={answers[currentQuestionIndex]}
                                mode={examMode ? 'exam' : 'practice'}
                                status={status}
                                 timers={{ prepSeconds: 10, responseSeconds: 40 }}
                                onChange={(val) => {
                                  setAnswers(prev => ({ ...prev, [currentQuestionIndex]: val }));
                                  if (typeof val === 'object' && val !== null) {
                                    if (val.kind === 'text' && val.text !== undefined) setUserTypedText(val.text);
                                    else if (val.kind === 'single_choice' && val.selected) setUserSelectedOption(val.selected);
                                    else if (val.kind === 'multi_choice' && Array.isArray(val.selected)) setUserSelectedMultiple(val.selected);
                                    else if (val.kind === 'ordered_list' && Array.isArray(val.ordered)) setReorderedList(val.ordered);
                                    else if (val.kind === 'blanks') setSelectedBlanks(val.blanks);
                                    else if (val.kind === 'highlight_words' && Array.isArray(val.words)) setHighlightedIncorrect(val.words);
                                  }
                                }}
                              />
                            );
                          }
                          return null;
                        })(taskCode)}
                      </div>

                      {/* Navigation footer controls inside test */}
                      <div className={`flex justify-between items-center border-t pt-4 text-xs font-mono ${
                        theme === 'dark' ? 'border-slate-850' : 'border-slate-200'
                      }`}>
                        {/* Backward navigation locked for standard mock tests */}
                        {activeTest.type !== 'mini' && activeTest.type !== 'full' && activeTest.type !== 'section' ? (
                          <button
                            disabled={currentQuestionIndex === 0}
                            onClick={handlePrevQuestion}
                            className={`px-4 py-2 rounded-xl disabled:opacity-30 cursor-pointer transition-all ${
                              theme === 'dark'
                                ? 'bg-slate-800 hover:bg-slate-700 text-gray-200'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-750'
                            }`}
                          >
                            ← Previous (Alt+P)
                          </button>
                        ) : (
                          <div />
                        )}

                        <div className={`text-[10px] uppercase tracking-widest hidden sm:block ${
                          theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                        }`}>
                          PROGRESS AUTO-SAVED
                        </div>

                        {currentQuestionIndex === activeTest.questionsCount - 1 ? (
                          <button
                            onClick={() => {
                              saveCurrentInputsToAnswers();
                              setTestState('review');
                            }}
                            className={`px-6 py-2 text-white rounded-xl font-bold transition-all shadow cursor-pointer ${
                              theme === 'dark'
                                ? 'bg-indigo-600 hover:bg-indigo-500'
                                : 'bg-indigo-600 hover:bg-indigo-700'
                            }`}
                          >
                            Finish Exam (Alt+N) →
                          </button>
                        ) : (
                          <button
                            onClick={handleNextQuestion}
                            className={`px-4 py-2 text-white rounded-xl font-semibold transition-all cursor-pointer ${
                              theme === 'dark'
                                ? 'bg-indigo-600 hover:bg-indigo-500'
                                : 'bg-indigo-600 hover:bg-indigo-700'
                            }`}
                          >
                            Next (Alt+N) →
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </motion.div>

              {/* Global Timer & Navigation Sidebar */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`w-full lg:w-72 p-6 border shadow-xl rounded-3xl space-y-6 shrink-0 sticky top-24 ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
                }`}
              >
                <div>
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider mb-4">Exam Navigation</h3>
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: activeTest.questionsCount }).map((_, i) => {
                      const isAnswered = answers[i] !== undefined && answers[i] !== null && String(answers[i]).trim() !== '';
                      const isCurrent = i === currentQuestionIndex;
                      return (
                        <div
                          key={i}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold font-mono transition-all ${
                            isCurrent
                              ? 'bg-indigo-600 text-white shadow-md'
                              : isAnswered
                                ? theme === 'dark'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                : theme === 'dark'
                                  ? 'bg-slate-800 text-slate-500 border border-slate-700'
                                  : 'bg-slate-100 text-slate-400 border border-slate-200'
                          }`}
                        >
                          {i + 1}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className={`pt-4 border-t ${theme === 'dark' ? 'border-slate-800/50' : 'border-slate-200'}`}>
                   <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Time Remaining</p>
                   <p className={`text-2xl font-black font-mono tracking-tight mt-1 ${
                     secondsRemaining < 300 ? 'text-red-500 animate-pulse' : theme === 'dark' ? 'text-white' : 'text-slate-900'
                   }`}>
                     {formatTime(secondsRemaining)}
                   </p>
                </div>
              </motion.div>
            </div>
            )}
          </AnimatePresence>
        </div>
      ) : inDiagnostic ? (
        /* 2. IMMERSIVE DIAGNOSTIC ASSESSMENT SCREEN - Theme Integrated Premium styled */
        <div className={`max-w-3xl mx-auto space-y-6 p-6 sm:p-8 border shadow-xl rounded-3xl transition-all duration-300 ${
          theme === 'dark'
            ? 'bg-slate-900/60 backdrop-blur-md border-gray-850 shadow-slate-950/40'
            : 'bg-slate-50/90 border-slate-200 shadow-slate-200/50'
        }`}>
          <div className={`flex justify-between items-center p-4 rounded-2xl shadow transition-all duration-300 ${
            theme === 'dark'
              ? 'bg-gradient-to-r from-indigo-950 to-slate-900 border border-slate-800 text-white'
              : 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white'
          }`}>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${theme === 'dark' ? 'bg-orange-400' : 'bg-orange-300'}`}></span>
              <span className="text-xs font-mono font-bold uppercase tracking-widest">PTE AI DIAGNOSTIC MODE</span>
            </div>
            <span className="text-xs font-mono opacity-90">
              Diagnostic Step {diagStep + 1} of {DIAG_QUESTIONS.length}
            </span>
          </div>

          <div className={`p-6 sm:p-8 border shadow-lg space-y-6 rounded-2xl transition-all ${
            theme === 'dark' ? 'bg-slate-950 border-slate-850 text-white' : 'bg-white border-slate-200 text-slate-950'
          }`}>
            <div>
              <span className={`text-[10px] font-mono px-2.5 py-1 font-bold uppercase rounded ${
                theme === 'dark' ? 'text-indigo-400 bg-indigo-500/10' : 'text-[#1a3a5f] bg-[#ebf3fc]'
              }`}>
                {DIAG_QUESTIONS[diagStep].section} Section
              </span>
              <h3 className={`text-base font-bold mt-3 font-sans ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{DIAG_QUESTIONS[diagStep].title}</h3>
              
              <div className={`border-l-4 p-3 text-xs leading-normal font-sans mt-2 rounded-r-xl ${
                theme === 'dark'
                  ? 'bg-indigo-500/5 border-indigo-500/40 text-indigo-300'
                  : 'bg-indigo-55 border-indigo-600 text-[#1a3a5f]'
              }`}>
                <p className="font-bold">Instructions:</p>
                <p className="mt-0.5">{DIAG_QUESTIONS[diagStep].instruction}</p>
              </div>

              <div className={`p-4 rounded-2xl border text-xs font-mono leading-relaxed mt-4 ${
                theme === 'dark'
                  ? 'bg-slate-900/40 border-slate-850 text-slate-300'
                  : 'bg-slate-50 border-slate-300 text-slate-800'
              }`}>
                {DIAG_QUESTIONS[diagStep].promptText}
              </div>
            </div>

            {DIAG_QUESTIONS[diagStep].options ? (
              /* MCQ layout for ROP */
              <div className="space-y-2">
                {DIAG_QUESTIONS[diagStep].options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setDiagAnswers({ ...diagAnswers, [DIAG_QUESTIONS[diagStep].id]: opt })}
                    className={`w-full p-3 text-left text-xs rounded-xl border transition-all cursor-pointer ${
                      diagAnswers[DIAG_QUESTIONS[diagStep].id] === opt
                        ? theme === 'dark'
                          ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300 font-bold'
                          : 'bg-[#ebf3fc] border-indigo-500 text-indigo-900 font-bold'
                        : theme === 'dark'
                          ? 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white hover:border-slate-700'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-black'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              /* Text Response layout */
              <textarea
                rows={6}
                value={diagAnswers[DIAG_QUESTIONS[diagStep].id] || ''}
                onChange={(e) => setDiagAnswers({ ...diagAnswers, [DIAG_QUESTIONS[diagStep].id]: e.target.value })}
                placeholder="Type or transcribe your response details here..."
                className={`w-full p-4 rounded-2xl text-xs border focus:outline-none focus:ring-1 font-sans ${
                  theme === 'dark'
                    ? 'bg-slate-900 border-slate-800 text-white focus:border-indigo-500 focus:ring-indigo-500'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-600 focus:ring-indigo-600'
                }`}
              />
            )}

            <div className={`flex justify-between items-center border-t pt-4 text-xs font-mono ${
              theme === 'dark' ? 'border-slate-850' : 'border-slate-200'
            }`}>
              <button
                disabled={diagStep === 0}
                onClick={() => setDiagStep(prev => prev - 1)}
                className={`px-4 py-2 rounded-xl disabled:opacity-30 cursor-pointer transition-all ${
                  theme === 'dark'
                    ? 'bg-slate-800 hover:bg-slate-700 text-gray-200'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                ← Back (Alt+P)
              </button>

              <div className={`text-[10px] hidden sm:block ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                TEST SUBMITTED SUCCESSFULLY
              </div>

              {diagStep === DIAG_QUESTIONS.length - 1 ? (
                <button
                  disabled={isSubmittingDiag}
                  onClick={handleSubmitDiagnostic}
                  className={`px-6 py-2 text-white rounded-xl font-bold shadow flex items-center gap-1.5 transition-all cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-indigo-600 hover:bg-indigo-500'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {isSubmittingDiag ? (
                    <>
                      Analyzing... <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    </>
                  ) : (
                    <>
                      Submit Diagnostic (Alt+N)
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => setDiagStep(prev => prev + 1)}
                  className={`px-4 py-2 text-white rounded-xl font-semibold transition-all cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-indigo-600 hover:bg-indigo-500'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  Next (Alt+N) →
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* 3. MAIN DASHBOARD / SECTIONS NAVIGATION SCREEN */
        <div className="space-y-8">
          {/* Active/Resume interrupted Session Detection Panel */}
          {activeResumeAttempt && (
            <div className="p-6 rounded-3xl border border-orange-500/30 bg-orange-500/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping"></span>
                  <span className="text-[10px] font-mono uppercase text-orange-400 font-bold">Interrupted Session Restored</span>
                </div>
                <h3 className="text-sm font-bold">Incomplete Mock: {activeResumeAttempt.title}</h3>
                <p className="text-xs text-gray-400">
                  Paused at Question {activeResumeAttempt.currentQuestionIndex + 1} with {formatTime(activeResumeAttempt.secondsRemaining || 3600)} remaining.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleResumeActiveExam}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  Resume Exam <Play className="w-3 h-3 fill-white" />
                </button>
                <button
                  onClick={handleDiscardActiveExam}
                  className="px-4 py-2 bg-gray-900 border border-gray-800 hover:bg-gray-850 text-gray-400 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Discard Session
                </button>
              </div>
            </div>
          )}

          {/* Core Header section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-800/40 pb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">PTE Computerized Mock Exams</h1>
              <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Simulate Pearson environments precisely with adaptive, multi-section timing locks.
              </p>
            </div>
            <div className="flex gap-1 p-1 rounded-xl bg-gray-950/20 border border-white/5">
              <button
                onClick={() => setActiveTab('available')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  activeTab === 'available' ? 'bg-emerald-500 text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                Available Tests
              </button>
              <button
                onClick={() => setActiveTab('diagnostic')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  activeTab === 'diagnostic' ? 'bg-emerald-500 text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                AI Study Plan & Diagnostic
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  activeTab === 'history' ? 'bg-emerald-500 text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                Exam History ({testHistory.length})
              </button>
            </div>
          </div>

          {/* TAB 1: AVAILABLE TESTS */}
          {activeTab === 'available' && (
            <div className="space-y-8">
              {/* AI Custom Test Generator Panel */}
              <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl relative overflow-hidden ${
                theme === 'dark'
                  ? 'bg-gradient-to-br from-slate-900/80 to-slate-950 border-slate-850 shadow-slate-950/50'
                  : 'bg-gradient-to-br from-slate-50 to-white border-slate-250 shadow-slate-200/40'
              }`}>
                {/* Visual accent */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6 mb-6 border-gray-800/10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                        <Sparkles className="w-5 h-5 animate-pulse" />
                      </div>
                      <h2 className="text-lg font-extrabold tracking-tight">PTE Academic AI Exam Generator</h2>
                    </div>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Instantly generate completely customized exam sessions by randomizing high-quality template pools or invoking DeepSeek.
                    </p>
                  </div>

                  {/* Mode switcher */}
                  <div className={`flex items-center gap-1 p-1 rounded-xl border text-[10px] font-mono font-bold ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-250'
                  }`}>
                    <button
                      onClick={() => setGenAiMode(false)}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        !genAiMode 
                          ? 'bg-emerald-500 text-white shadow' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      🎲 Template Combinator
                    </button>
                    <button
                      onClick={() => setGenAiMode(true)}
                      className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                        genAiMode 
                          ? 'bg-emerald-500 text-white shadow' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      🚀 DeepSeek AI Mode
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-12 gap-6">
                  {/* Left Controls */}
                  <div className="md:col-span-5 space-y-4">
                    {/* Topic Input */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono tracking-wider text-gray-400 font-bold uppercase">Target Topic Focus</label>
                      <input
                        type="text"
                        value={genTopic}
                        onChange={(e) => setGenTopic(e.target.value)}
                        placeholder="e.g., Quantum Computing, Ecological Preservation..."
                        className={`w-full px-3.5 py-2 rounded-xl text-xs border focus:outline-none focus:ring-1 ${
                          theme === 'dark'
                            ? 'bg-slate-950 border-slate-850 text-white focus:border-emerald-500 focus:ring-emerald-500'
                            : 'bg-white border-slate-250 text-slate-900 focus:border-emerald-600 focus:ring-emerald-600'
                        }`}
                      />
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {['Deep Space', 'Global Commerce', 'Oceanography', 'AI Ethics'].map((suggestion) => (
                          <button
                            key={suggestion}
                            onClick={() => setGenTopic(suggestion)}
                            className={`text-[9px] font-mono px-2 py-0.5 rounded-md border cursor-pointer ${
                              theme === 'dark'
                                ? 'bg-slate-900/40 border-slate-850 text-slate-400 hover:text-white hover:border-slate-700'
                                : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-black'
                            }`}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Questions Count Selector */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono tracking-wider text-gray-400 font-bold uppercase">Number of Question Items</label>
                      <div className="grid grid-cols-4 gap-2">
                        {[5, 10, 15, 20].map((num) => (
                          <button
                            key={num}
                            onClick={() => setGenNumQuestions(num)}
                            className={`py-2 text-xs font-mono font-bold rounded-xl border transition-all cursor-pointer ${
                              genNumQuestions === num
                                ? theme === 'dark'
                                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                                  : 'bg-emerald-50 border-emerald-500 text-emerald-700'
                                : theme === 'dark'
                                  ? 'border-slate-850 bg-slate-950 text-slate-400 hover:text-white'
                                  : 'border-slate-250 bg-white text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {num} Items
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Section Selector (for section tests) */}
                    {genNumQuestions >= 6 && genNumQuestions <= 15 && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono tracking-wider text-gray-400 font-bold uppercase">Section Focus</label>
                        <div className="grid grid-cols-4 gap-2">
                          {['Speaking', 'Writing', 'Reading', 'Listening'].map((sec) => (
                            <button
                              key={sec}
                              onClick={() => setSelectedSection(sec)}
                              className={`py-2 text-xs font-mono rounded-xl border transition-all cursor-pointer ${
                                selectedSection === sec
                                  ? theme === 'dark'
                                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                                    : 'bg-emerald-50 border-emerald-500 text-emerald-700'
                                  : theme === 'dark'
                                    ? 'border-slate-850 bg-slate-950 text-slate-400 hover:text-white'
                                    : 'border-slate-250 bg-white text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {sec}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Controls: Task Codes Selection */}
                  <div className="md:col-span-7 space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-mono tracking-wider text-gray-400 font-bold uppercase">Included PTE Task Types</label>
                        <button
                          onClick={() => setGenTaskCodes(
                            genTaskCodes.length === 7 ? [] : ['RA', 'RS', 'DI', 'RL', 'ASQ', 'SWT', 'WE']
                          )}
                          className="text-[9px] font-mono text-emerald-400 hover:underline cursor-pointer"
                        >
                          {genTaskCodes.length === 7 ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {[
                          { code: 'RA', name: 'Read Aloud' },
                          { code: 'RS', name: 'Repeat Sentence' },
                          { code: 'DI', name: 'Describe Image' },
                          { code: 'RL', name: 'Retell Lecture' },
                          { code: 'ASQ', name: 'Answer Short Q' },
                          { code: 'SWT', name: 'Summarize Written' },
                          { code: 'WE', name: 'Write Essay' }
                        ].map((task) => {
                          const isSelected = genTaskCodes.includes(task.code);
                          return (
                            <button
                              key={task.code}
                              onClick={() => {
                                setGenTaskCodes(prev =>
                                  isSelected ? prev.filter(c => c !== task.code) : [...prev, task.code]
                                );
                              }}
                              className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                                isSelected
                                  ? theme === 'dark'
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold'
                                    : 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold'
                                  : theme === 'dark'
                                    ? 'border-slate-850 bg-slate-950 text-slate-500 hover:text-slate-300'
                                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <div className="truncate">
                                <span className="text-[8px] font-mono font-bold block opacity-60">{task.code}</span>
                                <span className="text-xs truncate block">{task.name}</span>
                              </div>
                              {isSelected ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                              ) : (
                                <span className="w-3.5 h-3.5 rounded-md border border-slate-750 flex-shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Big Action Button */}
                    <button
                      disabled={isGeneratingTest || genTaskCodes.length === 0}
                      onClick={handleGenerateTest}
                      className={`w-full py-3.5 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-500/10 ${
                        theme === 'dark'
                          ? 'bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50'
                          : 'bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50'
                      }`}
                    >
                      {isGeneratingTest ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-white" />
                          <span>{genStatusMessage || 'Generating custom exam...'}</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-white" />
                          <span>Generate & Start Dynamic Mock Exam 🚀</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Separator for Presets */}
              <div className="space-y-1">
                <h2 className={`text-xs font-bold tracking-tight uppercase ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Standard Fixed Mock Exams</h2>
                <div className={`w-full h-px ${theme === 'dark' ? 'bg-slate-850' : 'bg-slate-200'}`} />
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {mockTests.map((test) => {
                  const isLocked = test.isLocked;
                  return (
                    <div
                      key={test.id}
                      className={`p-6 rounded-2xl border flex flex-col justify-between relative overflow-hidden ${
                        isLocked ? 'opacity-85 border-amber-500/10 bg-gray-950/20' : ''
                      } ${
                        theme === 'dark' ? 'bg-gray-900/30 border-gray-850' : 'bg-white border-gray-200'
                      }`}
                    >
                      {isLocked && (
                        <div className="absolute top-2 right-2 bg-amber-500/10 text-amber-400 font-mono text-[8px] font-bold px-2 py-0.5 rounded flex items-center gap-1 border border-amber-500/20 z-10">
                          <Lock className="w-2.5 h-2.5" /> PRO ✨
                        </div>
                      )}
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <span className={`text-[9px] font-mono tracking-widest px-2.5 py-1 rounded-full uppercase font-bold ${
                            isLocked 
                              ? 'bg-amber-500/15 text-amber-400' 
                              : test.type === 'full' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-teal-500/10 text-teal-400'
                          }`}>
                            {test.type} Mock Exam
                          </span>
                          <span className="text-xs font-mono text-gray-500">{test.difficulty}</span>
                        </div>
                        <h3 className="text-sm font-bold mb-2 flex items-center gap-1.5">
                          {test.title} {isLocked && <Lock className="w-3.5 h-3.5 text-amber-400" />}
                        </h3>
                        <p className={`text-xs leading-relaxed mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          Simulates {test.questionsCount} consecutive Pearson-academic task formats with {test.duration} minutes of continuous timed pacing.
                        </p>
                      </div>
                      <div className="flex items-center justify-between border-t border-gray-800/40 pt-4 mt-4">
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-mono">
                          <Clock className="w-3.5 h-3.5 text-emerald-400" /> {test.duration} mins
                        </div>
                        {isLocked ? (
                          <button
                            onClick={() => setShowUpgradeModal(true)}
                            className="px-4 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            Unlock Premium <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStartTest(test)}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            Start Test <Play className="w-3 h-3 fill-white" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: AI STUDY PLAN & DIAGNOSTIC PLANNER */}
          {activeTab === 'diagnostic' && (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left Column: Subscores & Actions */}
              <div className="lg:col-span-1 space-y-6">
                {diagState.diagnosticDone && diagState.estimatedScores ? (
                  <div className="p-6 rounded-3xl border border-gray-850 bg-gray-900/20 space-y-6">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-emerald-400" />
                      <h3 className="text-sm font-bold">Estimated PTE Subscores</h3>
                    </div>

                    <div className="space-y-4 font-mono">
                      {[
                        { label: 'Speaking', score: diagState.estimatedScores.speaking },
                        { label: 'Writing', score: diagState.estimatedScores.writing },
                        { label: 'Reading', score: diagState.estimatedScores.reading },
                        { label: 'Listening', score: diagState.estimatedScores.listening }
                      ].map((sub) => {
                        const scorePct = (sub.score / 90) * 100;
                        return (
                          <div key={sub.label} className="space-y-1.5">
                            <div className="flex justify-between text-xs font-bold">
                              <span>{sub.label}</span>
                              <span className="text-emerald-400">{sub.score}/90</span>
                            </div>
                            <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                                style={{ width: `${scorePct}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="border-t border-gray-850 pt-4 text-center">
                      <button
                        onClick={() => setInDiagnostic(true)}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 mx-auto transition-all cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Retake Diagnostic
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-3xl border border-dashed border-emerald-500/30 bg-emerald-500/5 text-center space-y-4">
                    <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto animate-pulse">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">Diagnostic Assessment Pending</h4>
                      <p className="text-xs text-gray-400 mt-1">
                        Unlock estimated PTE subscores and a tailored syllabus by completing our quick AI language audit.
                      </p>
                    </div>
                    <button
                      onClick={() => setInDiagnostic(true)}
                      className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      Begin AI Audit <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column: Deep Study Plan Markdown */}
              <div className="lg:col-span-2">
                <div className="p-6 sm:p-8 rounded-3xl border border-gray-850 bg-gray-900/10 space-y-6">
                  <div className="flex items-center gap-2 border-b border-gray-800/40 pb-3">
                    <BookOpen className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h3 className="text-sm font-bold">Personalized Study Plan</h3>
                      <p className="text-[10px] text-gray-500">Evidence-based weekly study trajectory and curriculum milestones</p>
                    </div>
                  </div>

                  {diagState.studyPlan ? (
                    <div className="text-xs leading-relaxed space-y-4 text-gray-300">
                      {diagState.studyPlan.split('\n').map((line, idx) => {
                        if (line.startsWith('### ')) {
                          return <h4 key={idx} className="text-sm font-bold text-white mt-4 border-l-2 border-emerald-500 pl-2">{line.replace('### ', '')}</h4>;
                        }
                        if (line.startsWith('#### ')) {
                          return <h5 key={idx} className="text-xs font-bold text-emerald-400 mt-3">{line.replace('#### ', '')}</h5>;
                        }
                        if (line.startsWith('- ')) {
                          return (
                            <div key={idx} className="flex gap-2 pl-2">
                              <span className="text-emerald-500 font-bold">•</span>
                              <p className="text-gray-300">{line.replace('- ', '')}</p>
                            </div>
                          );
                        }
                        return <p key={idx} className="text-gray-400">{line}</p>;
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500 text-xs">
                      Complete the diagnostic evaluation in the left panel to load your tailored, university-grade study curriculum and focus areas.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: HISTORY EXAM ATTEMPTS */}
          {activeTab === 'history' && (
            <Suspense fallback={<div className="h-64 flex items-center justify-center text-gray-500 font-mono text-sm animate-pulse">Loading historical data...</div>}>
              <TestHistoryTab testHistory={testHistory} theme={theme} onNavigateReport={onNavigateReport} />
            </Suspense>
          )}
        </div>
      )}

      {/* Upgrade Premium Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg overflow-hidden border rounded-3xl bg-[#0f1322] border-gray-850 p-6 sm:p-8 space-y-6 shadow-2xl text-white">
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-900/60"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center mx-auto border border-amber-500/20">
                <Lock className="w-5 h-5 animate-bounce" />
              </div>
              <h3 className="text-xl font-extrabold tracking-tight">Unlock Full Simulation Exams</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Full 3-Hour simulated examinations with Pearson-accurate computerized grading require a Premium membership.
              </p>
            </div>

            <div className="space-y-3.5">
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider font-bold">UPGRADING TO PREMIUM UNLOCKS:</p>
              <div className="space-y-2 text-xs">
                {[
                  'Full 3-Hour Pearson-matched Mock Exam Simulation',
                  'Instant comprehensive scoring & subscores diagnostics',
                  'State-of-the-art Voice & Writing AI grading dashboards',
                  'Unlimited access to all 20+ courses and 22 core tasks',
                ].map((feat, idx) => (
                  <div key={idx} className="flex gap-2.5 items-start">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-gray-300">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-gray-850 flex flex-col gap-2">
              <button
                disabled={isGeneratingTest}
                onClick={async () => {
                  try {
                    const res = await apiFetch('/api/student/upgrade-premium', { method: 'POST' });
                    if (res.success) {
                      alert('Payment successful! You are now a Premium member. Full Mock Exams are unlocked!');
                      setShowUpgradeModal(false);
                      // reload mock tests
                      fetchInitialData();
                    } else {
                      throw new Error(res.error || 'Checkout failed');
                    }
                  } catch (err: any) {
                    alert(err.message);
                  }
                }}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-xs font-bold transition-all text-center cursor-pointer shadow-lg shadow-emerald-500/10 disabled:opacity-50"
              >
                Secure Checkout via Stripe (Mock) ✨
              </button>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="w-full py-2 bg-gray-900 border border-gray-800 hover:bg-gray-850 text-gray-400 hover:text-white rounded-xl text-xs font-bold transition-all"
              >
                Continue using Free diagnostics
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
