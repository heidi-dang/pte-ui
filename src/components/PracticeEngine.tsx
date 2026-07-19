import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useGlobalContext } from './ThemeContext';
import { PTE_TASK_TYPES, PRACTICE_ITEMS } from '../data/mockData';
import type { PTETaskCode, PracticeItem } from '../types';
import { listPracticeQuestions, getTaskCounts, playPromptAudio } from '../api/student.api';
import type { QuestionListItem, TaskCount } from '../shared/api/practice';
import { usePracticeAttempt } from '../practice/hooks/usePracticeAttempt';
import { useAudioRecorder } from '../practice/hooks/useAudioRecorder';
import { useTaskTimer } from '../practice/hooks/useTaskTimer';
import { useSubmissionHistory } from '../practice/hooks/useSubmissionHistory';
import { useQuestionNote } from '../practice/hooks/useQuestionNote';
import { usePracticeNavigation } from '../practice/hooks/usePracticeNavigation';
import { getTaskModule } from '../practice/tasks/registry';
import { PracticeMainPanel } from '../practice/components/PracticeMainPanel';
import { TaskSidebar } from '../practice/components/TaskSidebar';
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
        <TaskSidebar activeCode={activeCode} taskCounts={taskCounts} theme={theme} onTaskSelect={setActiveCode} />
        <PracticeMainPanel
          theme={theme} activeCode={activeCode} items={items} questionIndex={questionIndex}
          page={page} total={total} totalPages={totalPages} search={search}
          difficultyFilter={difficultyFilter} showResult={showResult}
          activeQuestion={activeQuestion} isPublishedCms={isPublishedCms}
          hasNoPublished={hasNoPublished} demoItem={demoItem}
          phase={phase} taskResponse={taskResponse} submitting={submitting}
          localStatus={localStatus} isSpeaking={isSpeaking} isRecording={isRecording}
          recordedBlob={recordedBlob} recordedAudioUrl={recordedAudioUrl}
          micError={micError} prepCountdown={prepCountdown} countdown={countdown}
          remainingPlays={remainingPlays} attemptId={attempt.attemptId}
          attemptLoading={attempt.loading} resultData={resultData}
          noteText={noteText} isNoteSaving={isNoteSaving}
          serverSubmissions={serverSubmissions} questionHistory={questionHistory}
          scoredSubmission={attempt}
          onTaskChange={setActiveCode}
          onSearchChange={(v) => { setSearch(v); setPage(1); }}
          onDifficultyChange={(v) => { setDifficultyFilter(v); setPage(1); }}
          onQuestionSelect={(idx) => setQuestionIndex(idx)}
          onPageChange={(p) => setPage(p)}
          onResponseChange={setTaskResponse}
          onSubmit={handleSubmit}
          onRetry={handleRetry}
          onAdvance={() => setShowResult(false)}
          onStartRecording={() => { setMicError(''); startRecording().catch(() => setMicError('Microphone access failed')); }}
          onStopRecording={stopRecording}
          onClearRecording={clearRecording}
          onPlayPrompt={handlePlayPrompt}
          onNoteChange={handleNoteChange}
        />
      </div>
    </div>
  );
};
