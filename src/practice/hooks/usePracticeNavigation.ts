import { useState, useCallback, useEffect } from 'react';
import { PTETaskCode, PracticeItem } from '../../types';
import { PTE_TASK_TYPES } from '../../data/mockData';

export interface UsePracticeNavigationReturn {
  activeCode: PTETaskCode;
  selectedQuestionIndex: number;
  qSearchQuery: string;
  showBookmarkedOnly: boolean;
  setActiveCode: (code: PTETaskCode) => void;
  setSelectedQuestionIndex: (idx: number) => void;
  setQSearchQuery: (q: string) => void;
  setShowBookmarkedOnly: (v: boolean) => void;
  goToPrevTask: () => void;
  goToNextTask: () => void;
  goToNextQuestion: (total: number) => void;
  filteredItems: PracticeItem[];
}

export function usePracticeNavigation(
  codeItems: PracticeItem[],
  bookmarkedQuestions: string[],
): UsePracticeNavigationReturn {
  const [activeCode, setActiveCode] = useState<PTETaskCode>('RA');
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [qSearchQuery, setQSearchQuery] = useState('');
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);

  useEffect(() => {
    setSelectedQuestionIndex(0);
  }, [activeCode]);

  const goToPrevTask = useCallback(() => {
    const idx = PTE_TASK_TYPES.findIndex((t) => t.code === activeCode);
    if (idx > 0) setActiveCode(PTE_TASK_TYPES[idx - 1].code);
  }, [activeCode]);

  const goToNextTask = useCallback(() => {
    const idx = PTE_TASK_TYPES.findIndex((t) => t.code === activeCode);
    if (idx < PTE_TASK_TYPES.length - 1) setActiveCode(PTE_TASK_TYPES[idx + 1].code);
  }, [activeCode]);

  const goToNextQuestion = useCallback((total: number) => {
    setSelectedQuestionIndex((prev) => {
      if (prev < total - 1) return prev + 1;
      return prev;
    });
  }, []);

  const filteredItems = codeItems.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(qSearchQuery.toLowerCase()) ||
      item.instruction.toLowerCase().includes(qSearchQuery.toLowerCase());
    const matchesBookmark = !showBookmarkedOnly || bookmarkedQuestions.includes(item.id);
    return matchesSearch && matchesBookmark;
  });

  return {
    activeCode,
    selectedQuestionIndex,
    qSearchQuery,
    showBookmarkedOnly,
    setActiveCode,
    setSelectedQuestionIndex,
    setQSearchQuery,
    setShowBookmarkedOnly,
    goToPrevTask,
    goToNextTask,
    goToNextQuestion,
    filteredItems,
  };
}
