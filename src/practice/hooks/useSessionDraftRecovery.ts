import { useEffect, useRef, useCallback } from 'react';
import { saveDraft, getDraft, clearDraft, clearAllSessionDrafts } from './sessionDraftStorage';

interface DraftRecoveryOptions {
  userId?: string;
  sessionId: string;
  questionId: string;
  taskCode: string;
  answerData: any;
  onRestore: (data: any) => void;
  enabled?: boolean;
}

export function useSessionDraftRecovery({
  userId,
  sessionId,
  questionId,
  taskCode,
  answerData,
  onRestore,
  enabled = true,
}: DraftRecoveryOptions) {
  const restoredRef = useRef(false);
  const prevQuestionRef = useRef<string>('');

  const draftKey = {
    userId,
    sessionId,
    questionId,
    taskCode,
  };

  useEffect(() => {
    if (!enabled) return;

    const currentQ = `${sessionId}:${questionId}`;
    if (currentQ !== prevQuestionRef.current) {
      prevQuestionRef.current = currentQ;
      restoredRef.current = false;
    }

    if (!restoredRef.current && answerData === null) {
      const draft = getDraft(draftKey);
      if (draft && draft.data) {
        restoredRef.current = true;
        onRestore(draft.data);
      }
    }
  }, [enabled, sessionId, questionId, taskCode, answerData, onRestore, draftKey]);

  useEffect(() => {
    if (!enabled || !answerData || restoredRef.current) return;
    saveDraft(draftKey, answerData);
  }, [enabled, answerData, draftKey]);

  const clearCurrent = useCallback(() => {
    clearDraft(draftKey);
  }, [draftKey]);

  const clearAll = useCallback(() => {
    clearAllSessionDrafts(sessionId, userId);
  }, [sessionId, userId]);

  return { clearCurrent, clearAll };
}
