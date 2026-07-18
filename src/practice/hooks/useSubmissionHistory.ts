import { useState, useCallback } from 'react';
import { getPracticeSubmissions } from '../../api/student.api';

export interface AttemptRecord {
  id: string;
  questionId: string;
  score: number;
  date: string;
  answer: string;
}

export interface UseSubmissionHistoryReturn {
  serverSubmissions: any[];
  questionHistory: AttemptRecord[];
  loadServerSubmissions: () => Promise<void>;
  loadLocalHistory: (questionId: string) => void;
  saveLocalAttempt: (questionId: string, score: number, answerText: string) => void;
}

export function useSubmissionHistory(): UseSubmissionHistoryReturn {
  const [serverSubmissions, setServerSubmissions] = useState<any[]>([]);
  const [questionHistory, setQuestionHistory] = useState<AttemptRecord[]>([]);

  const loadServerSubmissions = useCallback(async () => {
    try {
      const subs = await getPracticeSubmissions();
      setServerSubmissions((Array.isArray(subs) ? subs : []).filter((s: any) => s.status === 'graded'));
    } catch {
      // non-critical
    }
  }, []);

  const loadLocalHistory = useCallback((questionId: string) => {
    try {
      const saved = localStorage.getItem('practiceHistory');
      if (saved) {
        const all: AttemptRecord[] = JSON.parse(saved);
        setQuestionHistory(all.filter((h) => h.questionId === questionId));
      } else {
        setQuestionHistory([]);
      }
    } catch {
      setQuestionHistory([]);
    }
  }, []);

  const saveLocalAttempt = useCallback((questionId: string, score: number, answerText: string) => {
    const record: AttemptRecord = {
      id: `H-${Date.now()}`,
      questionId,
      score,
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      answer: answerText,
    };
    const saved = localStorage.getItem('practiceHistory');
    const all = saved ? JSON.parse(saved) : [];
    all.unshift(record);
    localStorage.setItem('practiceHistory', JSON.stringify(all));
    const filtered = all.filter((r: AttemptRecord) => r.questionId === questionId);
    setQuestionHistory(filtered);
  }, []);

  return {
    serverSubmissions,
    questionHistory,
    loadServerSubmissions,
    loadLocalHistory,
    saveLocalAttempt,
  };
}
