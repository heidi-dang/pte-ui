/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useGlobalContext } from './ThemeContext';
import { MOCK_TESTS, TEST_ATTEMPTS } from '../data/mockData';
import { MockTest, TestAttempt } from '../types';
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
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MockTestEngineProps {
  onNavigateReport: () => void;
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

export const MockTestEngine: React.FC<MockTestEngineProps> = ({ onNavigateReport }) => {
  const { theme, apiFetch, user } = useGlobalContext();
  const [activeTest, setActiveTest] = useState<MockTest | null>(null);
  const [testState, setTestState] = useState<'idle' | 'running' | 'paused' | 'review'>('idle');
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [activeTab, setActiveTab] = useState<'available' | 'diagnostic' | 'history'>('available');
  const [activeAttemptId, setActiveAttemptId] = useState<string | null>(null);

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
  const [activeResumeAttempt, setActiveResumeAttempt] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load diagnostic states and attempts history from API on mount
  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
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

  // Timer Tick handler
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

  // Save/Pause Mock Progress helper
  const saveProgressToDatabase = async (timeRemaining: number, isPausedState: boolean) => {
    if (!activeTest) return;
    try {
      await apiFetch('/api/student/mock-tests/save-progress', {
        method: 'POST',
        body: JSON.stringify({
          attemptId: activeAttemptId,
          testId: activeTest.id,
          title: activeTest.title,
          type: activeTest.type,
          currentQuestionIndex,
          secondsRemaining: timeRemaining,
          answers,
          isPaused: isPausedState
        })
      });
    } catch (err) {
      console.error('Failed to save mock progress in background:', err);
    }
  };

  // Trigger Resume Examination session
  const handleResumeActiveExam = () => {
    if (!activeResumeAttempt) return;
    const testMatch = MOCK_TESTS.find(t => t.id === activeResumeAttempt.testId) || MOCK_TESTS[0];
    
    setActiveTest(testMatch);
    setActiveAttemptId(activeResumeAttempt.id);
    setSecondsRemaining(activeResumeAttempt.secondsRemaining || testMatch.duration * 60);
    setCurrentQuestionIndex(activeResumeAttempt.currentQuestionIndex || 0);
    setAnswers(activeResumeAttempt.answers || {});
    setTestState('running');
    setActiveResumeAttempt(null);
  };

  // Discard interrupted session
  const handleDiscardActiveExam = async () => {
    if (!activeResumeAttempt) return;
    try {
      // Set status to complete with 0 score to archive it or clear it
      await apiFetch('/api/student/mock-tests/complete', {
        method: 'POST',
        body: JSON.stringify({
          attemptId: activeResumeAttempt.id,
          overallScore: 0,
          speakingScore: 0,
          writingScore: 0,
          readingScore: 0,
          listeningScore: 0,
          answers: {}
        })
      });
      setActiveResumeAttempt(null);
      fetchInitialData();
    } catch (err) {
      console.error('Failed discarding active session:', err);
    }
  };

  const handleStartTest = async (test: MockTest) => {
    setActiveTest(test);
    setSecondsRemaining(test.duration * 60);
    setCurrentQuestionIndex(0);
    setAnswers({});
    
    try {
      // Provision an active In-Progress record in the SQLite db
      const response = await apiFetch('/api/student/mock-tests/save-progress', {
        method: 'POST',
        body: JSON.stringify({
          testId: test.id,
          title: test.title,
          type: test.type,
          currentQuestionIndex: 0,
          secondsRemaining: test.duration * 60,
          answers: {},
          isPaused: false
        })
      });
      if (response && response.attempt) {
        setActiveAttemptId(response.attempt.id);
      }
      setTestState('running');
    } catch (err) {
      console.error('Failed starting test recording session:', err);
      // Fallback local run if api fails
      setTestState('running');
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
    setCurrentQuestionIndex(prev => {
      const nextIdx = prev + 1;
      saveProgressToDatabase(secondsRemaining, false);
      return nextIdx;
    });
  };

  const handlePrevQuestion = () => {
    setCurrentQuestionIndex(prev => {
      const prevIdx = Math.max(prev - 1, 0);
      saveProgressToDatabase(secondsRemaining, false);
      return prevIdx;
    });
  };

  const handleSubmitMockTest = async () => {
    if (!activeTest) return;
    setTestState('idle');

    // Calculate real/simulated subscores based on filled answers counts
    const totalQuestions = activeTest.questionsCount;
    const answeredCount = Object.keys(answers).length + 3; // base alignment offset
    const correctnessRatio = Math.min(1.0, answeredCount / totalQuestions);

    const overallScore = Math.min(90, Math.max(10, Math.round(15 + (correctnessRatio * 72) + (Math.random() * 4))));
    const speakingScore = Math.min(90, Math.max(10, overallScore + Math.floor(Math.random() * 5)));
    const writingScore = Math.min(90, Math.max(10, overallScore - Math.floor(Math.random() * 3)));
    const readingScore = Math.min(90, Math.max(10, overallScore + Math.floor(Math.random() * 4)));
    const listeningScore = Math.min(90, Math.max(10, overallScore - Math.floor(Math.random() * 5)));

    try {
      await apiFetch('/api/student/mock-tests/complete', {
        method: 'POST',
        body: JSON.stringify({
          attemptId: activeAttemptId,
          testId: activeTest.id,
          title: activeTest.title,
          type: activeTest.type,
          overallScore,
          speakingScore,
          writingScore,
          readingScore,
          listeningScore,
          answers
        })
      });
      
      setActiveTest(null);
      setActiveAttemptId(null);
      onNavigateReport();
    } catch (err) {
      console.error('Failed completing mock test:', err);
      setActiveTest(null);
      onNavigateReport();
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
        <div className="space-y-6">
          {/* Header bar controls */}
          <div className="flex justify-between items-center bg-gray-950/80 p-4 rounded-2xl border border-gray-800/60 shadow">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full uppercase">
                {activeTest.title}
              </span>
              <span className="text-xs text-gray-400 font-mono hidden sm:inline">
                Question {currentQuestionIndex + 1} of {activeTest.questionsCount}
              </span>
            </div>

            {/* Timers & Pause Toggles */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-red-400">
                <Clock className="w-4 h-4 animate-pulse" /> {formatTime(secondsRemaining)}
              </div>
              {testState === 'running' ? (
                <button
                  onClick={handlePauseTest}
                  className="p-2.5 bg-gray-900 border border-gray-850 rounded-xl hover:bg-gray-800 text-gray-300 transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                >
                  <Pause className="w-3.5 h-3.5 text-orange-500" /> Pause Exam
                </button>
              ) : (
                <button
                  onClick={handleResumeTest}
                  className="p-2.5 bg-emerald-500 rounded-xl hover:bg-emerald-600 text-white transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" /> Resume Exam
                </button>
              )}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {testState === 'paused' ? (
              /* Pause Drawer Overlay */
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="p-10 rounded-3xl border text-center space-y-6 bg-gray-950 border-orange-500/30 max-w-xl mx-auto"
              >
                <div className="w-12 h-12 bg-orange-500/10 text-orange-400 rounded-full flex items-center justify-center mx-auto animate-pulse">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Exam Session Suspended (Paused)</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Your answers have been securely synced to the cloud database. You can safely resume right here, or from any other device at your convenience.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={handleResumeTest}
                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Resume Session
                  </button>
                  <button
                    onClick={() => {
                      setTestState('idle');
                      setActiveTest(null);
                      fetchInitialData();
                    }}
                    className="px-6 py-2.5 bg-gray-900 border border-gray-800 hover:bg-gray-850 text-gray-400 rounded-xl text-xs font-bold transition-all cursor-pointer"
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
                className={`p-8 rounded-3xl border space-y-6 ${theme === 'dark' ? 'bg-[#0f1322] border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}
              >
                <div className="text-center">
                  <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase bg-emerald-500/10 px-2.5 py-0.5 rounded font-bold">
                    PRE-GRADUATE REVIEW AUDIT
                  </span>
                  <h3 className="text-base font-bold mt-2">Mock Exam Performance Audit</h3>
                  <p className="text-xs text-gray-400 mt-1">Review your answer allocation statuses below before committing.</p>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 py-4 max-w-2xl mx-auto">
                  {Array.from({ length: activeTest.questionsCount }).map((_, index) => {
                    const isAnswered = answers[index] !== undefined;
                    return (
                      <div
                        key={index}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          isAnswered
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                            : 'border-gray-800 bg-gray-950/40 text-gray-500'
                        }`}
                      >
                        <p className="text-[10px] font-mono font-bold">Q{index + 1}</p>
                        <p className="text-[8px] uppercase font-mono mt-1 opacity-70">
                          {isAnswered ? 'Saved' : 'Empty'}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-center gap-4 pt-4 border-t border-gray-850">
                  <button
                    onClick={() => setTestState('running')}
                    className="px-6 py-2.5 bg-gray-800 text-gray-300 hover:bg-gray-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    ← Resume Editing Answers
                  </button>
                  <button
                    onClick={handleSubmitMockTest}
                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow shadow-emerald-500/20 cursor-pointer"
                  >
                    Submit Complete Exam ✓
                  </button>
                </div>
              </motion.div>
            ) : (
              /* Standard Test Questions layout */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`p-6 sm:p-8 rounded-3xl border ${theme === 'dark' ? 'bg-[#0e1220] border-gray-850' : 'bg-white border-gray-200'}`}
              >
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-mono tracking-widest text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 rounded font-bold animate-pulse">
                        Exam Segment • Section {currentQuestionIndex < 5 ? 'Speaking/Writing' : 'Reading/Listening'}
                      </span>
                      <span className="text-xs text-gray-400 font-mono">Q{currentQuestionIndex + 1} of {activeTest.questionsCount}</span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold mt-2">
                      {currentQuestionIndex === 0 ? 'Read Aloud: Technological Disruption' : 
                       currentQuestionIndex === 1 ? 'Describe Image: Academic Graduation Yield' :
                       currentQuestionIndex === 2 ? 'Re-order Paragraphs: Plate Tectonics' :
                       currentQuestionIndex === 3 ? 'Summarize Written Text: Global Reforestation' : 
                       'Write Essay: Urban Decentralization vs Concentration'}
                    </h3>
                    <p className={`text-xs mt-2 leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {currentQuestionIndex === 0 ? 'Look at the text below. Read it aloud in a natural, continuous tone with flat vowel anchors.' :
                       currentQuestionIndex === 1 ? 'Analyze the academic chart and describe the key statistical trends and comparisons.' :
                       currentQuestionIndex === 2 ? 'Rearrange the sentences logically to form a cohesive, structured academic statement.' :
                       currentQuestionIndex === 3 ? 'Summarize the central arguments in a single compound sentence of 5-75 words.' :
                       'Write a persuasive academic essay arguing whether cities should decentralize or promote high density.'}
                    </p>

                    <div className="p-4 rounded-xl bg-gray-950/45 border border-white/5 mt-4 text-xs font-mono text-emerald-400 leading-normal">
                      {currentQuestionIndex === 0 ? 'The continuous expansion of cloud infrastructures has revolutionized data redundancy strategies. Modern corporations can maintain high availability with zero physical footprints.' :
                       currentQuestionIndex === 1 ? '[BAR CHART DISPLAYING GRADUATION RATES: 2020: 74%, 2021: 78%, 2022: 82%, 2023: 88%, 2024: 91%]' :
                       currentQuestionIndex === 2 ? 'Scrambled Sentences:\nA. This friction eventually triggers earthquake shocks.\nB. Tectonic plates move constantly above the mantle.\nC. These plates slide past each other at boundary faults.' :
                       currentQuestionIndex === 3 ? 'Reforestation represents the single most viable pathway to stabilize tropospheric carbon percentages. While industrial emissions continue to rise, massive tree coverage sequestering provides a critical cushion. Thus, governments must finance agroforestry immediately.' :
                       'Do you agree that modern metropolitan centers should decentralize into satellite towns to prevent infrastructure overload? Detail examples.'}
                    </div>
                  </div>

                  <textarea
                    rows={8}
                    value={answers[currentQuestionIndex] || ''}
                    onChange={(e) => setAnswers({ ...answers, [currentQuestionIndex]: e.target.value })}
                    placeholder="Provide your computerized exam response here..."
                    className={`w-full p-4 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:border-emerald-500 focus:ring-emerald-500 ${
                      theme === 'dark' ? 'bg-gray-950 border-gray-850 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />

                  {/* Navigation footer controls inside test */}
                  <div className="flex justify-between items-center border-t border-gray-850 pt-4">
                    <button
                      disabled={currentQuestionIndex === 0}
                      onClick={handlePrevQuestion}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-semibold disabled:opacity-30 cursor-pointer font-mono"
                    >
                      ← Previous
                    </button>

                    {currentQuestionIndex === activeTest.questionsCount - 1 ? (
                      <button
                        onClick={() => setTestState('review')}
                        className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-all shadow cursor-pointer font-mono"
                      >
                        Finish Exam →
                      </button>
                    ) : (
                      <button
                        onClick={handleNextQuestion}
                        className="px-4 py-2 bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg text-xs font-semibold transition-all cursor-pointer font-mono"
                      >
                        Next →
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : inDiagnostic ? (
        /* 2. IMMERSIVE DIAGNOSTIC ASSESSMENT SCREEN */
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex justify-between items-center bg-gray-950 border border-gray-800 p-4 rounded-2xl">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-mono font-bold uppercase text-emerald-400">PTE AI DIAGNOSTIC MODE</span>
            </div>
            <span className="text-xs text-gray-400 font-mono">
              Diagnostic Step {diagStep + 1} of {DIAG_QUESTIONS.length}
            </span>
          </div>

          <div className={`p-6 sm:p-8 rounded-3xl border space-y-6 ${theme === 'dark' ? 'bg-[#0e1220] border-gray-850' : 'bg-white border-gray-200'}`}>
            <div>
              <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded font-bold uppercase">
                {DIAG_QUESTIONS[diagStep].section} Section
              </span>
              <h3 className="text-base font-bold mt-2">{DIAG_QUESTIONS[diagStep].title}</h3>
              <p className="text-xs text-gray-400 mt-1 leading-normal">{DIAG_QUESTIONS[diagStep].instruction}</p>

              <div className="p-4 rounded-xl bg-gray-950 border border-white/5 text-xs font-mono text-emerald-400 leading-normal mt-4">
                {DIAG_QUESTIONS[diagStep].promptText}
              </div>
            </div>

            {DIAG_QUESTIONS[diagStep].options ? (
              /* MCQ layout for ROP */
              <div className="space-y-2.5">
                {DIAG_QUESTIONS[diagStep].options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setDiagAnswers({ ...diagAnswers, [DIAG_QUESTIONS[diagStep].id]: opt })}
                    className={`w-full p-3 text-left text-xs rounded-xl border transition-all cursor-pointer ${
                      diagAnswers[DIAG_QUESTIONS[diagStep].id] === opt
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 font-bold'
                        : 'border-gray-850 bg-gray-950/30 text-gray-400 hover:text-white hover:border-gray-800'
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
                className={`w-full p-4 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:border-emerald-500 focus:ring-emerald-500 ${
                  theme === 'dark' ? 'bg-gray-950 border-gray-850 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            )}

            <div className="flex justify-between items-center border-t border-gray-850 pt-4">
              <button
                disabled={diagStep === 0}
                onClick={() => setDiagStep(prev => prev - 1)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-semibold disabled:opacity-30 cursor-pointer"
              >
                ← Back
              </button>

              {diagStep === DIAG_QUESTIONS.length - 1 ? (
                <button
                  disabled={isSubmittingDiag}
                  onClick={handleSubmitDiagnostic}
                  className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {isSubmittingDiag ? (
                    <>
                      Analyzing... <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    </>
                  ) : (
                    <>
                      Submit Diagnostic <CheckCircle className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => setDiagStep(prev => prev + 1)}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer"
                >
                  Next Diagnostic Section →
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
            <div className="grid md:grid-cols-3 gap-8">
              {MOCK_TESTS.map((test) => (
                <div
                  key={test.id}
                  className={`p-6 rounded-2xl border flex flex-col justify-between ${
                    theme === 'dark' ? 'bg-gray-900/30 border-gray-850' : 'bg-white border-gray-200'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <span className={`text-[9px] font-mono tracking-widest px-2.5 py-1 rounded-full uppercase font-bold ${
                        test.type === 'full' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-teal-500/10 text-teal-400'
                      }`}>
                        {test.type} Mock Exam
                      </span>
                      <span className="text-xs font-mono text-gray-500">{test.difficulty}</span>
                    </div>
                    <h3 className="text-sm font-bold mb-2">{test.title}</h3>
                    <p className={`text-xs leading-relaxed mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Simulates {test.questionsCount} consecutive Pearson-academic task formats with {test.duration} minutes of continuous timed pacing.
                    </p>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-800/40 pt-4 mt-4">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 font-mono">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" /> {test.duration} mins
                    </div>
                    <button
                      onClick={() => handleStartTest(test)}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      Start Test <Play className="w-3 h-3 fill-white" />
                    </button>
                  </div>
                </div>
              ))}
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
            <div className="space-y-4">
              {testHistory.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-xs border border-dashed border-gray-850 rounded-2xl">
                  No completed mock exams recorded. Attempt an available mock test above to initialize your historical reports.
                </div>
              ) : (
                testHistory.map((h) => (
                  <div
                    key={h.id}
                    className={`p-5 rounded-2xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                      theme === 'dark' ? 'bg-gray-900/20 border-gray-850' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full font-bold uppercase">
                          {h.type}
                        </span>
                        <span className="text-xs text-gray-500 font-mono flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> {h.date}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold">{h.title}</h4>
                      <div className="flex gap-4 text-[10px] text-gray-400 font-mono pt-2">
                        <span>Speaking: <strong className="text-emerald-400">{h.speakingScore}</strong></span>
                        <span>Writing: <strong className="text-emerald-400">{h.writingScore}</strong></span>
                        <span>Reading: <strong className="text-emerald-400">{h.readingScore}</strong></span>
                        <span>Listening: <strong className="text-emerald-400">{h.listeningScore}</strong></span>
                      </div>
                    </div>

                    <div className="text-center sm:text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto border-t sm:border-0 border-gray-800/40 pt-3 sm:pt-0">
                      <div>
                        <p className="text-[10px] font-mono text-gray-500">Overall PTE Mark</p>
                        <p className="text-2xl font-black text-emerald-400 font-mono">{h.overallScore}</p>
                      </div>
                      <button
                        onClick={onNavigateReport}
                        className="text-xs text-emerald-400 font-bold hover:underline mt-1 block cursor-pointer"
                      >
                        View Full Analysis →
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
