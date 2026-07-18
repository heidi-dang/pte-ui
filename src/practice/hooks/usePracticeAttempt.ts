import { useState, useCallback } from 'react';
import {
  startPracticeAttempt,
  uploadPracticeResponseAudio,
  submitPracticeAttempt,
  getPracticeAttempt,
  getPracticeAttemptResult,
} from '../../api/student.api';
import type { PracticeStatus } from '../../shared/api/practice';

export interface AttemptState {
  attemptId: string | null;
  status: PracticeStatus | string;
  submissionId: string | null;
  submissionStatus: string | null;
  score: number | null;
  maxScore: number | null;
  earnedScore: number | null;
  normalizedScore: number | null;
  fluencyScore: number | null;
  pronunciationScore: number | null;
  feedback: string | null;
  transcript: string | null;
  loading: boolean;
  error: string;
  deadlineAt: string | null;
  timing: { prepSeconds: number; responseSeconds: number } | null;
  playbackPolicy: Record<string, unknown> | null;
  question: Record<string, unknown> | null;
}

export interface UsePracticeAttemptReturn {
  attempt: AttemptState;
  start: (questionBankItemId: string, mode?: string) => Promise<{ attemptId: string; deadlineAt: string | null; timing: { prepSeconds: number; responseSeconds: number } } | null>;
  uploadAudio: (blob: Blob) => Promise<boolean>;
  submit: (data?: any) => Promise<boolean>;
  refresh: () => Promise<void>;
  fetchResult: () => Promise<void>;
  clear: () => void;
}

const INITIAL: AttemptState = {
  attemptId: null,
  status: 'idle',
  submissionId: null,
  submissionStatus: null,
  score: null,
  maxScore: null,
  earnedScore: null,
  normalizedScore: null,
  fluencyScore: null,
  pronunciationScore: null,
  feedback: null,
  transcript: null,
  loading: false,
  error: '',
  deadlineAt: null,
  timing: null,
  playbackPolicy: null,
  question: null,
};

export function usePracticeAttempt(): UsePracticeAttemptReturn {
  const [attempt, setAttempt] = useState<AttemptState>(INITIAL);

  const start = useCallback(async (questionBankItemId: string, mode = 'timed') => {
    setAttempt((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const result = await startPracticeAttempt({ questionBankItemId, mode });
      setAttempt((prev) => ({
        ...prev,
        attemptId: result.attemptId,
        status: result.status,
        deadlineAt: result.deadlineAt,
        timing: result.timing,
        playbackPolicy: result.playbackPolicy,
        question: result.question as any,
        loading: false,
      }));
      return { attemptId: result.attemptId, deadlineAt: result.deadlineAt, timing: result.timing };
    } catch (err: any) {
      setAttempt((prev) => ({ ...prev, loading: false, error: err.message || 'Failed to start attempt' }));
      return null;
    }
  }, []);

  const uploadAudio = useCallback(async (blob: Blob): Promise<boolean> => {
    const { attemptId } = attempt;
    if (!attemptId) {
      setAttempt((prev) => ({ ...prev, error: 'No active attempt' }));
      return false;
    }
    setAttempt((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      await uploadPracticeResponseAudio(attemptId, blob);
      setAttempt((prev) => ({ ...prev, loading: false }));
      return true;
    } catch (err: any) {
      setAttempt((prev) => ({ ...prev, loading: false, error: err.message || 'Upload failed' }));
      return false;
    }
  }, [attempt.attemptId]);

  const submit = useCallback(async (data?: any): Promise<boolean> => {
    const { attemptId } = attempt;
    if (!attemptId) {
      setAttempt((prev) => ({ ...prev, error: 'No active attempt' }));
      return false;
    }
    setAttempt((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const result = await submitPracticeAttempt(attemptId, data || {});
      setAttempt((prev) => ({
        ...prev,
        submissionId: result.submissionId,
        status: result.status,
        loading: false,
      }));
      return true;
    } catch (err: any) {
      setAttempt((prev) => ({ ...prev, loading: false, error: err.message || 'Submit failed' }));
      return false;
    }
  }, [attempt.attemptId]);

  const refresh = useCallback(async () => {
    const { attemptId } = attempt;
    if (!attemptId) return;
    try {
      const state = await getPracticeAttempt(attemptId);
      setAttempt((prev) => ({
        ...prev,
        status: state.status,
        submissionId: state.submissionId,
        submissionStatus: state.submissionStatus,
      }));
    } catch {
      // non-critical
    }
  }, [attempt.attemptId]);

  const fetchResult = useCallback(async () => {
    const { attemptId } = attempt;
    if (!attemptId) return;
    setAttempt((prev) => ({ ...prev, loading: true }));
    try {
      const data = await getPracticeAttemptResult(attemptId);
      setAttempt((prev) => ({
        ...prev,
        status: data.status,
        score: data.result?.score ?? null,
        maxScore: data.result?.maxScore ?? null,
        earnedScore: data.result?.earnedScore ?? null,
        normalizedScore: data.result?.normalizedScore ?? null,
        fluencyScore: data.result?.fluencyScore ?? null,
        pronunciationScore: data.result?.pronunciationScore ?? null,
        feedback: data.result?.feedback ?? null,
        transcript: data.result?.transcript ?? null,
        loading: false,
      }));
    } catch (err: any) {
      setAttempt((prev) => ({ ...prev, loading: false, error: err.message }));
    }
  }, [attempt.attemptId]);

  const clear = useCallback(() => {
    setAttempt({ ...INITIAL });
  }, []);

  return { attempt, start, uploadAudio, submit, refresh, fetchResult, clear };
}
