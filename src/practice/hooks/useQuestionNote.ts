import { useState, useCallback, useEffect, useRef } from 'react';

export interface UseQuestionNoteReturn {
  note: string;
  isSaving: boolean;
  setNote: (text: string) => void;
}

export function useQuestionNote(itemId: string): UseQuestionNoteReturn {
  const [note, setNoteRaw] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(`practice_note_${itemId}`) || '';
    setNoteRaw(saved);
  }, [itemId]);

  const setNote = useCallback((text: string) => {
    setNoteRaw(text);
    localStorage.setItem(`practice_note_${itemId}`, text);
    setIsSaving(true);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => setIsSaving(false), 500);
  }, [itemId]);

  return { note, isSaving, setNote };
}
