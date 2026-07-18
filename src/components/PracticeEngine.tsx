import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useGlobalContext } from './ThemeContext';
import { PTE_TASK_TYPES, PRACTICE_ITEMS } from '../data/mockData';
import type { PTETaskCode, PracticeItem } from '../types';
import { getPublishedQuestions } from '../api/questions.api';
import { listPracticeQuestions, getTaskCounts, playPromptAudio } from '../api/student.api';
import type { QuestionListItem, TaskCount } from '../shared/api/practice';
import { BookOpen, CheckCircle, AlertTriangle, Mic, Square, Play, StopCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePracticeAttempt } from '../practice/hooks/usePracticeAttempt';
import { useAudioRecorder } from '../practice/hooks/useAudioRecorder';
import { useTaskTimer } from '../practice/hooks/useTaskTimer';
import { useSubmissionHistory } from '../practice/hooks/useSubmissionHistory';
import { useQuestionNote } from '../practice/hooks/useQuestionNote';
import { usePracticeNavigation } from '../practice/hooks/usePracticeNavigation';
import { getTaskModule } from '../practice/tasks/registry';
import { PracticeTaskForm } from '../practice/components/PracticeTaskForm';
import { PracticeResultPanel } from '../practice/components/PracticeResultPanel';
import { PracticeSidePanels } from '../practice/components/PracticeSidePanels';
import { getContract } from '../practice/contracts/registry';

interface PracticeEngineProps { initialTaskCode?: PTETaskCode; }

const PAGE_SIZE = 20;

export const PracticeEngine: React.FC<PracticeEngineProps> = ({ initialTaskCode = 'RA' }) => {
  const { theme } = useGlobalContext();
  const { attempt, start, uploadAudio, submit, refresh, fetchResult, clear: clearAttempt } = usePracticeAttempt();
  const { isRecording, recordedBlob, recordedAudioUrl, startRecording, stopRecording, clearRecording } = useAudioRecorder();
  const { phase, countdown, prepCountdown, reset: resetTimer } = useTaskTimer();

  const [activeCode, setActiveCode] = useState<PTETaskCode>(initialTaskCode);
  const [items, setItems] = useState<QuestionListItem[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [taskCounts, setTaskCounts] = useState<Record<string, number>>({});
  const activeQuestion = items[questionIndex] || null;
  const isPublishedCms = activeQuestion?.id ? activeQuestion.id.length > 20 : false;

  const [taskResponse, setTaskResponse] = useState<Record<string, unknown>>({});
  const [localStatus, setLocalStatus] = useState<'idle' | 'preparing' | 'recording' | 'answering' | 'submitted'>('idle');
  const [resultData, setResultData] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  const [micError, setMicError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [remainingPlays, setRemainingPlays] = useState<number | null>(null);
  const attemptRef = useRef(attempt);
  attemptRef.current = attempt;

  const taskModule = getTaskModule(activeCode);
  const contract = getContract(activeCode as any);
  const isSpeaking = contract.scoringMode === 'ai_speech' || contract.scoringMode === 'acoustic';
  const { note: noteText, isSaving: isNoteSaving, setNote: handleNoteChange } = useQuestionNote(activeQuestion?.id || '');
  const { serverSubmissions, questionHistory, loadServerSubmissions } = useSubmissionHistory();

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Load task counts
  useEffect(() => {
    getTaskCounts().then((counts) => {
      const map: Record<string, number> = {};
      for (const c of counts) map[c.taskCode] = c.publishedCount;
      setTaskCounts(map);
    }).catch(() => {});
  }, []);

  // Load questions for selected task
  useEffect(() => {
    let cancel = false;
    setLoadingQuestions(true);
    (async () => {
      try {
        const result = await listPracticeQuestions({
          taskCode: activeCode,
          difficulty: difficultyFilter || undefined,
          search: search || undefined,
          page,
          pageSize: PAGE_SIZE,
        });
        if (!cancel) {
          setItems(result.items);
          setTotal(result.total);
          setQuestionIndex(0);
        }
      } catch {
        if (!cancel) {
          setItems([]);
          setTotal(0);
        }
      } finally {
        if (!cancel) setLoadingQuestions(false);
      }
    })();
    return () => { cancel = true; };
  }, [activeCode, page, difficultyFilter]);

  // Reset search and page when task changes
  useEffect(() => {
    setPage(1);
    setSearch('');
    setDifficultyFilter('');
  }, [activeCode]);

  // Clear old state when question changes
  useEffect(() => {
    if (!activeQuestion) return;
    clearAttempt();
    clearRecording();
    setTaskResponse(taskModule.createInitialResponse(activeQuestion));
    setShowResult(false);
    setResultData(null);
    setMicError('');
    setLocalStatus('preparing');
    setRemainingPlays(null);
    if (isPublishedCms) {
      start(activeQuestion.id, 'timed').then((result) => {
        if (result && result.deadlineAt) {
          resetTimer(contract.timing.prepSeconds, result.deadlineAt);
        } else {
          const fakeDeadline = new Date(Date.now() + contract.timing.responseSeconds * 1000).toISOString();
          resetTimer(contract.timing.prepSeconds, fakeDeadline);
        }
      });
    } else {
      const fakeDeadline = new Date(Date.now() + contract.timing.responseSeconds * 1000).toISOString();
      resetTimer(contract.timing.prepSeconds, fakeDeadline);
    }
  }, [activeQuestion?.id]);

  // Auto-record for speaking
  useEffect(() => {
    if (phase === 'recording' && isSpeaking) {
      setMicError('');
      startRecording().catch(() => setMicError('Microphone access failed'));
    }
  }, [phase]);

  // Poll for result
  useEffect(() => {
    if (!resultData?.submissionId && !attempt.submissionId) return;
    const interval = setInterval(async () => {
      await refresh();
      const cur = attemptRef.current;
      if (cur.status === 'Completed' || cur.status === 'Grading_Failed') {
        clearInterval(interval);
        setShowResult(true);
        await fetchResult();
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [resultData?.submissionId, attempt.submissionId]);

  const handlePlayPrompt = useCallback(async () => {
    if (!attempt.attemptId) {
      // Demo mode fallback
      return;
    }
    try {
      const playback = await playPromptAudio(attempt.attemptId);
      if (playback.audioUrl) {
        new Audio(playback.audioUrl).play().catch(() => {});
      }
      setRemainingPlays(playback.remainingPlays);
    } catch {
      setRemainingPlays(0);
    }
  }, [attempt.attemptId]);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      if (isSpeaking) {
        if (!recordedBlob) { setMicError('A real recording is required'); setSubmitting(false); return; }
        if (!(await uploadAudio(recordedBlob))) throw new Error('Audio upload failed');
      }
      const success = await submit({ answerJson: JSON.stringify(taskResponse) });
      if (success) { setResultData({ submissionId: attempt.submissionId }); setLocalStatus('submitted'); }
    } catch (err: any) { setResultData({ error: err.message || 'Submission failed' });
    } finally { setSubmitting(false); }
  }, [isSpeaking, recordedBlob, uploadAudio, submit, taskResponse, attempt.submissionId]);

  const handleRetry = useCallback(() => {
    clearAttempt(); clearRecording();
    setShowResult(false); setResultData(null); setLocalStatus('idle');
    if (activeQuestion && isPublishedCms) {
      start(activeQuestion.id, 'timed').then((result) => {
        if (result?.deadlineAt) resetTimer(contract.timing.prepSeconds, result.deadlineAt);
      });
    }
  }, [activeQuestion, isPublishedCms, clearAttempt, clearRecording, start, contract, resetTimer]);

  const hasNoPublished = !loadingQuestions && items.length === 0 && total === 0;

  // Demo fallback when no published CMS questions exist
  const demoItem: PracticeItem | null = hasNoPublished ? (PRACTICE_ITEMS[activeCode] || PRACTICE_ITEMS['RA']) as any : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Task sidebar */}
        <div className="lg:w-1/4 space-y-4">
          <div className={`p-5 rounded-3xl border ${theme === 'dark' ? 'bg-gray-900/30 border-gray-850' : 'bg-white border-gray-200'}`}>
            <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-gray-400 mb-4 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-emerald-400" /> All 22 Task Types
            </h3>
            <div className="space-y-1 max-h-96 lg:max-h-[550px] overflow-y-auto pr-2">
              {PTE_TASK_TYPES.map(t => (
                <button key={t.code} onClick={() => setActiveCode(t.code)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${activeCode === t.code ? 'bg-emerald-500 text-white font-bold shadow' : theme === 'dark' ? 'hover:bg-gray-950 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'}`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${activeCode === t.code ? 'bg-white/20 text-white' : 'bg-emerald-500/10 text-emerald-400'}`}>{t.code}</span>
                    <span className="truncate max-w-[100px]">{t.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] opacity-60 uppercase font-mono">{t.section[0]}</span>
                    {taskCounts[t.code] !== undefined && (
                      <span className={`text-[9px] font-mono ${taskCounts[t.code] > 0 ? 'text-emerald-400' : 'text-gray-500'}`}>{taskCounts[t.code]}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 space-y-4">
          {/* Question navigation bar */}
          {!showResult && items.length > 0 && (
            <div className={`p-3 rounded-2xl border flex flex-wrap items-center gap-2 ${theme === 'dark' ? 'bg-gray-900/10 border-gray-850' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center gap-1 text-xs text-gray-400 mr-2">
                <span className="font-mono font-bold text-emerald-400">{total}</span> questions
              </div>
              {/* Search */}
              <div className="flex items-center gap-1 bg-gray-800 rounded-lg px-2 py-1">
                <Search className="w-3 h-3 text-gray-500" />
                <input type="text" placeholder="Search..." value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="bg-transparent text-xs text-white outline-none w-24 placeholder-gray-500" />
              </div>
              {/* Difficulty filter */}
              <select value={difficultyFilter} onChange={(e) => { setDifficultyFilter(e.target.value); setPage(1); }}
                className="bg-gray-800 text-xs text-gray-300 rounded-lg px-2 py-1 border-0 outline-none">
                <option value="">All</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              {/* Question index selector */}
              {items.slice(0, Math.min(items.length, 20)).map((item, idx) => (
                <button key={item.id} onClick={() => setQuestionIndex(idx)}
                  className={`text-[10px] font-mono font-bold w-7 h-7 rounded-lg transition-all cursor-pointer ${idx === questionIndex ? 'bg-emerald-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                  {page * PAGE_SIZE - PAGE_SIZE + idx + 1}
                </button>
              ))}
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center gap-1 ml-auto">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                    className="text-gray-400 hover:text-white disabled:opacity-30 p-1 cursor-pointer">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] font-mono text-gray-500">{page}/{totalPages}</span>
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                    className="text-gray-400 hover:text-white disabled:opacity-30 p-1 cursor-pointer">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          <AnimatePresence mode="wait">
            {!showResult ? (
              <motion.div key="sim" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className={`p-6 sm:p-8 rounded-3xl border relative ${theme === 'dark' ? 'bg-gray-900/10 border-gray-850' : 'bg-white border-gray-200 shadow-sm'}`}>
                {/* Demo content warning */}
                {hasNoPublished && demoItem && (
                  <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>No published questions available for this task yet. Showing demo content — scoring disabled.</span>
                  </div>
                )}

                {items.length > 0 && activeQuestion ? (
                  <PracticeTaskForm
                    activeCode={activeCode}
                    phase={phase}
                    theme={theme}
                    activeQuestion={activeQuestion as any}
                    taskResponse={taskResponse}
                    onResponseChange={setTaskResponse}
                    disabled={submitting || localStatus === 'submitted'}
                    isSpeaking={isSpeaking}
                    isRecording={isRecording}
                    recordedBlob={recordedBlob}
                    recordedAudioUrl={recordedAudioUrl}
                    micError={micError}
                    prepCountdown={prepCountdown}
                    countdown={countdown}
                    onStartRecording={() => { setMicError(''); startRecording().catch(() => setMicError('Microphone access failed')); }}
                    onStopRecording={stopRecording}
                    onClearRecording={clearRecording}
                    onPlayPrompt={handlePlayPrompt}
                    remainingPlays={remainingPlays}
                    attemptId={attempt.attemptId}
                    attemptLoading={attempt.loading}
                  />
                ) : hasNoPublished && demoItem ? (
                  <PracticeTaskForm
                    activeCode={activeCode}
                    phase={phase}
                    theme={theme}
                    activeQuestion={demoItem}
                    taskResponse={taskResponse}
                    onResponseChange={setTaskResponse}
                    disabled={submitting || localStatus === 'submitted'}
                    isSpeaking={isSpeaking}
                    isRecording={isRecording}
                    recordedBlob={recordedBlob}
                    recordedAudioUrl={recordedAudioUrl}
                    micError={micError}
                    prepCountdown={prepCountdown}
                    countdown={countdown}
                    onStartRecording={() => { setMicError(''); startRecording().catch(() => setMicError('Microphone access failed')); }}
                    onStopRecording={stopRecording}
                    onClearRecording={clearRecording}
                    onPlayPrompt={handlePlayPrompt}
                    remainingPlays={remainingPlays}
                    attemptId={attempt.attemptId}
                    attemptLoading={attempt.loading}
                  />
                ) : (
                  <div className="p-12 text-center">
                    <p className="text-gray-500 text-sm">No published questions available for this task yet.</p>
                    <p className="text-gray-600 text-xs mt-2">Try selecting a different task type.</p>
                  </div>
                )}

                {/* Navigation footer */}
                <div className="flex justify-between items-center border-t border-gray-850 pt-6 mt-6">
                  <div className="flex gap-2">
                    <button onClick={() => { const i = PTE_TASK_TYPES.findIndex(t => t.code === activeCode); if (i > 0) setActiveCode(PTE_TASK_TYPES[i - 1].code); }}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-gray-800 text-gray-300 hover:bg-gray-700 transition-all flex items-center gap-1 cursor-pointer">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg> Prev Task
                    </button>
                    <button onClick={() => { const i = PTE_TASK_TYPES.findIndex(t => t.code === activeCode); if (i < PTE_TASK_TYPES.length - 1) setActiveCode(PTE_TASK_TYPES[i + 1].code); }}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-gray-800 text-gray-300 hover:bg-gray-700 transition-all flex items-center gap-1 cursor-pointer">
                      Next Task <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </div>
                  <div className="flex gap-2">
                    {items.length > 0 && (
                      <>
                        <button onClick={() => { if (questionIndex > 0) setQuestionIndex((i) => i - 1); }}
                          disabled={questionIndex <= 0}
                          className="px-3 py-2 rounded-xl text-xs font-semibold bg-gray-800 text-gray-300 hover:bg-gray-700 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-30">
                          <ChevronLeft className="w-4 h-4" /> Prev Q
                        </button>
                        <button onClick={() => { if (questionIndex < items.length - 1) setQuestionIndex((i) => i + 1); }}
                          disabled={questionIndex >= items.length - 1}
                          className="px-3 py-2 rounded-xl text-xs font-semibold bg-gray-800 text-gray-300 hover:bg-gray-700 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-30">
                          Next Q <ChevronRight className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button onClick={handleSubmit} disabled={submitting || attempt.loading || localStatus === 'submitted' || (!isPublishedCms && hasNoPublished)}
                      className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold transition-all shadow shadow-emerald-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50">
                      {submitting ? 'Submitting...' : <><CheckCircle className="w-4 h-4" /> Submit</>}
                    </button>
                  </div>
                </div>
                {resultData?.error && (
                  <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /><span>{resultData.error}</span>
                  </div>
                )}
              </motion.div>
            ) : (
              <PracticeResultPanel
                scoredSubmission={attempt}
                theme={theme}
                activeItem={activeQuestion || PRACTICE_ITEMS[activeCode]}
                onRetry={handleRetry}
                onAdvance={() => setShowResult(false)}
              />
            )}
          </AnimatePresence>
          <PracticeSidePanels theme={theme} note={noteText} isNoteSaving={isNoteSaving} onNoteChange={handleNoteChange}
            serverSubmissions={serverSubmissions} questionHistory={questionHistory}
            itemId={activeQuestion?.id || ''} />
        </div>
      </div>
    </div>
  );
};
