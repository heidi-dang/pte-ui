import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useGlobalContext } from './ThemeContext';
import { PTE_TASK_TYPES, PRACTICE_ITEMS } from '../data/mockData';
import type { PTETaskCode, PracticeItem } from '../types';
import { getPublishedQuestions } from '../api/questions.api';
import { BookOpen, CheckCircle, AlertTriangle, Mic, Square, Play, StopCircle } from 'lucide-react';
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
import { playPromptAudio } from '../api/student.api';
import { getContract } from '../practice/contracts/registry';

interface PracticeEngineProps { initialTaskCode?: PTETaskCode; }

export const PracticeEngine: React.FC<PracticeEngineProps> = ({ initialTaskCode = 'RA' }) => {
  const { theme } = useGlobalContext();
  const { attempt, start, uploadAudio, submit, refresh, fetchResult, clear } = usePracticeAttempt();
  const { isRecording, recordedBlob, recordedAudioUrl, startRecording, stopRecording, clearRecording } = useAudioRecorder();
  const { phase, countdown, prepCountdown, reset: resetTimer } = useTaskTimer();

  const [activeCode, setActiveCode] = useState<PTETaskCode>(initialTaskCode);
  const [activeQuestion, setActiveQuestion] = useState<PracticeItem | null>(null);
  const [taskResponse, setTaskResponse] = useState<Record<string, unknown>>({});
  const [localStatus, setLocalStatus] = useState<'idle' | 'preparing' | 'recording' | 'answering' | 'submitted'>('idle');
  const [resultData, setResultData] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  const [micError, setMicError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const attemptRef = useRef(attempt);
  attemptRef.current = attempt;

  const taskModule = getTaskModule(activeCode);
  const contract = getContract(activeCode as any);
  const isSpeaking = contract.scoringMode === 'ai_speech' || contract.scoringMode === 'acoustic';
  const { note: noteText, isSaving: isNoteSaving, setNote: handleNoteChange } = useQuestionNote(activeQuestion?.id || '');
  const { serverSubmissions, questionHistory, loadServerSubmissions } = useSubmissionHistory();

  const isPublishedCms = !!(activeQuestion?.id && activeQuestion.id.length > 20);

  // Load CMS questions and start attempt
  useEffect(() => {
    let cancel = false;
    clear();
    setActiveQuestion(null);
    const fallback = PRACTICE_ITEMS[activeCode] || PRACTICE_ITEMS['RA'];
    (async () => {
      try {
        const items = await getPublishedQuestions({ taskCode: activeCode, limit: 10 });
        if (!cancel) setActiveQuestion(items?.[0] || fallback);
      } catch { if (!cancel) setActiveQuestion(fallback); }
    })();
    return () => { cancel = true; };
  }, [activeCode]);

  // Setup timer + response when question loads
  useEffect(() => {
    if (!activeQuestion) return;
    setTaskResponse(taskModule.createInitialResponse(activeQuestion));
    setShowResult(false);
    setResultData(null);
    clearRecording();
    setMicError('');
    setLocalStatus('preparing');
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
      if (activeQuestion?.audioUrl) {
        new Audio(activeQuestion.audioUrl).play().catch(() => {});
      }
      return;
    }
    const playback = await playPromptAudio(attempt.attemptId);
    if (playback.audioUrl) {
      new Audio(playback.audioUrl).play().catch(() => {});
    }
  }, [attempt.attemptId, activeQuestion]);

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
    clear(); clearRecording();
    setShowResult(false); setResultData(null); setLocalStatus('idle');
    if (activeQuestion && isPublishedCms) {
      start(activeQuestion.id, 'timed').then((result) => {
        if (result?.deadlineAt) {
          resetTimer(contract.timing.prepSeconds, result.deadlineAt);
        }
      });
    }
  }, [activeQuestion, isPublishedCms, clear, clearRecording, start, contract, resetTimer]);

  const isDemoContent = !isPublishedCms && activeQuestion?.id === PRACTICE_ITEMS[activeCode]?.id;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div className="flex flex-col lg:flex-row gap-8">
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
                    <span className="truncate max-w-[130px]">{t.name}</span>
                  </div>
                  <span className="text-[9px] opacity-60 uppercase font-mono">{t.section[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-6">
          <AnimatePresence mode="wait">
            {!showResult ? (
              <motion.div key="sim" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className={`p-6 sm:p-8 rounded-3xl border relative ${theme === 'dark' ? 'bg-gray-900/10 border-gray-850' : 'bg-white border-gray-200 shadow-sm'}`}>
                {isDemoContent && (
                  <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Demo content — scoring disabled</span>
                  </div>
                )}
                <PracticeTaskForm
                  activeCode={activeCode}
                  phase={phase}
                  theme={theme}
                  activeQuestion={activeQuestion}
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
                  attemptId={attempt.attemptId}
                  attemptLoading={attempt.loading}
                />
                <div className="flex justify-between items-center border-t border-gray-850 pt-6 mt-6">
                  <div className="flex gap-2">
                    <button onClick={() => { const i = PTE_TASK_TYPES.findIndex(t => t.code === activeCode); if (i > 0) setActiveCode(PTE_TASK_TYPES[i - 1].code); }}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-gray-800 text-gray-300 hover:bg-gray-700 transition-all flex items-center gap-1 cursor-pointer">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg> Prev
                    </button>
                    <button onClick={() => { const i = PTE_TASK_TYPES.findIndex(t => t.code === activeCode); if (i < PTE_TASK_TYPES.length - 1) setActiveCode(PTE_TASK_TYPES[i + 1].code); }}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-gray-800 text-gray-300 hover:bg-gray-700 transition-all flex items-center gap-1 cursor-pointer">
                      Next <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </div>
                  <button onClick={handleSubmit} disabled={submitting || attempt.loading || localStatus === 'submitted'}
                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold transition-all shadow shadow-emerald-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50">
                    {submitting ? 'Submitting...' : <><CheckCircle className="w-4 h-4" /> Submit</>}
                  </button>
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
