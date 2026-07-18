import { useState, useCallback } from 'react';
import {
  startPracticeAttempt,
  uploadPracticeResponseAudio,
  submitPracticeAttempt,
  getPracticeAttempt,
  getPracticeAttemptResult,
} from '../../api/student.api';

export interface AttemptState {
  attemptId: string | null;
  status: string;
  submissionId: string | null;
  submissionStatus: string | null;
  score: number | null;
  fluencyScore: number | null;
  pronunciationScore: number | null;
  feedback: string | null;
  loading: boolean;
  error: string;
}

export interface UsePracticeAttemptReturn {
  attempt: AttemptState;
  start: (questionBankItemId: string, mode?: string) => Promise<string | null>;
  uploadAudio: (blob: Blob) => Promise<boolean>;
  submit: (data?: Record<string, unknown>) => Promise<boolean>;
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
  fluencyScore: null,
  pronunciationScore: null,
  feedback: null,
  loading: false,
  error: '',
};

export function usePracticeAttempt(): UsePracticeAttemptReturn {
  const [attempt, setAttempt] = useState<AttemptState>(INITIAL);

  const start = useCallback(async (questionBankItemId: string, mode = 'timed'): Promise<string | null> => {
    setAttempt((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const result = await startPracticeAttempt({ questionBankItemId, mode });
      if (!result.success) throw new Error('Failed to start attempt');
      setAttempt((prev) => ({
        ...prev,
        attemptId: result.attemptId,
        status: 'In_Progress',
        loading: false,
      }));
      return result.attemptId;
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
      const result = await uploadPracticeResponseAudio(attemptId, blob);
      if (!result.success) throw new Error('Upload failed');
      setAttempt((prev) => ({ ...prev, loading: false }));
      return true;
    } catch (err: any) {
      setAttempt((prev) => ({ ...prev, loading: false, error: err.message || 'Upload failed' }));
      return false;
    }
  }, [attempt.attemptId]);

  const submit = useCallback(async (data?: Record<string, unknown>): Promise<boolean> => {
    const { attemptId } = attempt;
    if (!attemptId) {
      setAttempt((prev) => ({ ...prev, error: 'No active attempt' }));
      return false;
    }
    setAttempt((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const result = await submitPracticeAttempt(attemptId, data || {});
      if (!result.success) throw new Error('Submit failed');
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
      const result = await getPracticeAttemptResult(attemptId);
      setAttempt((prev) => ({
        ...prev,
        score: result.score,
        fluencyScore: result.fluencyScore,
        pronunciationScore: result.pronunciationScore,
        feedback: result.feedback,
        status: result.status,
        loading: false,
      }));
    } catch (err: any) {
      setAttempt((prev) => ({ ...prev, loading: false, error: err.message }));
    }
  }, [attempt.attemptId]);

  const clear = useCallback(() => {
    setAttempt(INITIAL);
  }, []);

  return { attempt, start, uploadAudio, submit, refresh, fetchResult, clear };
}
