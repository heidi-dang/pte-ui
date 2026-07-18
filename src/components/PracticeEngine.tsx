/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useGlobalContext } from './ThemeContext';
import { PRACTICE_ITEMS_LIST, PTE_TASK_TYPES, PRACTICE_ITEMS } from '../data/mockData';
import { PTETaskCode, PracticeItem } from '../types';
import { getPublishedQuestions } from '../api/questions.api';
import { submitPracticeResponse, getPracticeSubmissions } from '../api/student.api';
import { Mic, CheckCircle, Square, Play, ChevronLeft, ChevronRight, RotateCcw, Award, FileText, AlertTriangle, ArrowRight, BookOpen, Star, FileEdit, History, Search, Calendar, BarChart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// ---------------------------------------------------------------------------
// Phase 1d: Tasks whose promptText is the audio content (never show before/during audio)
// ---------------------------------------------------------------------------
const PROMPT_HIDDEN_TASKS = new Set<PTETaskCode>(['RS', 'SST', 'FIBL', 'HCS', 'MCSSL', 'MCMSL', 'SMW', 'HIW', 'WFD']);

// Phase 1e: Tasks that allow only ONE audio play-through
const ONE_PLAY_TASKS = new Set<PTETaskCode>(['RS', 'RL', 'ASQ', 'SST', 'FIBL', 'HCS', 'MCSSL', 'MCMSL', 'SMW', 'HIW', 'WFD']);

interface PracticeEngineProps {
  initialTaskCode?: PTETaskCode;
}

interface AttemptRecord {
  id: string;
  questionId: string;
  score: number;
  date: string;
  answer: string;
}

export const PracticeEngine: React.FC<PracticeEngineProps> = ({ initialTaskCode = 'RA' }) => {
  const { theme, apiFetch, role } = useGlobalContext();
  const [activeCode, setActiveCode] = useState<PTETaskCode>(initialTaskCode);

  // Search questions state
  const [qSearchQuery, setQSearchQuery] = useState('');
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);


  // Default codeItems from mock data (will be overridden by CMS if available)
  const mockCodeItems = PRACTICE_ITEMS_LIST.filter(item => item.code === activeCode);

  // Track selected question index (0 to 4)
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  // Timers & States
  const [timer, setTimer] = useState(40);
  const [prepTimer, setPrepTimer] = useState(10);
  const [status, setStatus] = useState<'preparing' | 'recording' | 'answering' | 'completed'>('preparing');
  // Phase 1e: Real audio element + one-play enforcement
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioPlaybackProgress, setAudioPlaybackProgress] = useState(0);
  const [audioPlayed, setAudioPlayed] = useState(false);
  const promptAudioRef = useRef<HTMLAudioElement | null>(null);

  // User input states
  const [userTypedText, setUserTypedText] = useState('');
  const [userSelectedOption, setUserSelectedOption] = useState<string>('');
  const [userSelectedMultiple, setUserSelectedMultiple] = useState<string[]>([]);
  const [reorderedList, setReorderedList] = useState<string[]>([]);
  const [selectedBlanks, setSelectedBlanks] = useState<Record<number, string>>({});
  const [highlightedIncorrect, setHighlightedIncorrect] = useState<string[]>([]);

  // Real voice recording states
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isRecordingRealMic, setIsRecordingRealMic] = useState(false);
  const [isRecordedPlaybackPlaying, setIsRecordedPlaybackPlaying] = useState(false);
  const recordedAudioRef = useRef<HTMLAudioElement | null>(null);

  // Simulation fallback controls
  const [simulatedVoiceLevels, setSimulatedVoiceLevels] = useState<number[]>([]);

  // Score Screen
  const [showResult, setShowResult] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [scoredSubmission, setScoredSubmission] = useState<any>(null);

  // Bookmarks state (persistent)
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<string[]>(() => {
    const saved = localStorage.getItem('bookmarkedQuestions');
    return saved ? JSON.parse(saved) : [];
  });

  // Notes state (persistent, autosaved)
  const [questionNote, setQuestionNote] = useState('');
  const [isNoteSaving, setIsNoteSaving] = useState(false);

  // History state
  const [questionHistory, setQuestionHistory] = useState<AttemptRecord[]>([]);

  // Server-side scored submissions
  const [serverSubmissions, setServerSubmissions] = useState<any[]>([]);

  // CMS question bank state
  const [cmsQuestions, setCmsQuestions] = useState<any[]>([]);
  const [cmsLoading, setCmsLoading] = useState(false);
  const [cmsSource, setCmsSource] = useState<'cms' | 'fallback'>('fallback');
  const [currentCmsItemId, setCurrentCmsItemId] = useState<string | null>(null);

  // Refs for timers
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Defensive JSON parsing helpers for CMS data
  const parseJsonArray = (value: unknown): any[] => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
    }
    return [];
  };

  const parseTags = (value: unknown) =>
    parseJsonArray(value)
      .filter((t): t is string => typeof t === 'string')
      .map((t) => ({ phrase: t, meaning: '' }));

  // Map CMS question to PracticeItem shape
  const mapCmsToPracticeItem = (q: any): PracticeItem => ({
    id: q.id,
    code: q.taskCode as PTETaskCode,
    title: q.title,
    instruction: q.instruction,
    promptText: q.promptText,
    imageUrl: q.imageUrl || undefined,
    audioUrl: q.audioUrl || undefined,
    options: parseJsonArray(q.optionsJson),
    modelAnswer: q.sampleAnswer || '',
    tips: [],
    vocabulary: parseTags(q.tagsJson),
    templates: [],
  });

  // Create practice items array preferring CMS data
  const cmsPracticeItems: PracticeItem[] = cmsQuestions.map(mapCmsToPracticeItem);
  const hasCmsContent = cmsSource === 'cms' && cmsPracticeItems.length > 0;

  const effectiveCodeItems = hasCmsContent ? cmsPracticeItems : mockCodeItems;
  const effectiveActiveItem: PracticeItem = effectiveCodeItems[selectedQuestionIndex] || effectiveCodeItems[0] || PRACTICE_ITEMS[activeCode] || PRACTICE_ITEMS['RA'];

  // Update currentCmsItemId when active item changes
  const cmsItemIdForActive = hasCmsContent && effectiveActiveItem.id && effectiveActiveItem.id.length > 20 ? effectiveActiveItem.id : null;

  // Final codeItems and activeItem used throughout the component
  const codeItems = effectiveCodeItems;
  const activeItem: PracticeItem = effectiveActiveItem;

  const isBookmarked = bookmarkedQuestions.includes(activeItem.id);

  // Phase 1f: Reset ALL interactive state on task code change
  useEffect(() => {
    setSelectedQuestionIndex(0);
    const info = PTE_TASK_TYPES.find((t) => t.code === activeCode)!;

    setPrepTimer(info.prepTime);
    setTimer(info.attemptTime);
    setStatus(info.prepTime > 0 ? 'preparing' : 'answering');

    // Reset audio + recording state
    setAudioPlayed(false);
    setIsAudioPlaying(false);
    setAudioPlaybackProgress(0);
    setRecordedAudioUrl(null);
    setIsRecordingRealMic(false);
    stopRecording();

    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [activeCode]);

  // Load CMS questions for current task code
  useEffect(() => {
    let cancelled = false;

    setCmsQuestions([]);
    setCmsSource('fallback');

    const loadCms = async () => {
      setCmsLoading(true);
      try {
        const items = await getPublishedQuestions({ taskCode: activeCode, limit: 10 });
        if (!cancelled) {
          setCmsQuestions(items || []);
          setCmsSource(items?.length > 0 ? 'cms' : 'fallback');
        }
      } catch {
        if (!cancelled) {
          setCmsQuestions([]);
          setCmsSource('fallback');
        }
      } finally {
        if (!cancelled) setCmsLoading(false);
      }
    };
    loadCms();
    return () => { cancelled = true; };
  }, [activeCode]);

  // Fetch server-side scored submissions for the current task
  useEffect(() => {
    if (role !== 'student' && role !== 'teacher' && role !== 'admin') return;
    const loadSubmissions = async () => {
      try {
        const subs = await getPracticeSubmissions();
        setServerSubmissions((Array.isArray(subs) ? subs : []).filter((s: any) => s.status === 'graded'));
      } catch { /* non-critical */ }
    };
    loadSubmissions();
  }, [activeCode, role]);

  // Update currentCmsItemId when active item changes
  useEffect(() => {
    setCurrentCmsItemId(cmsItemIdForActive);
  }, [cmsItemIdForActive]);

  // Phase 1f: Reset ALL interactive state on question switch
  useEffect(() => {
    // Restore typed response drafts (autosave feature)
    const draft = localStorage.getItem(`practice_draft_${activeItem.id}`);
    setUserTypedText(draft || '');

    // Restore note
    const savedNote = localStorage.getItem(`practice_note_${activeItem.id}`) || '';
    setQuestionNote(savedNote);

    // Reset interaction inputs
    setUserSelectedOption('');
    setUserSelectedMultiple([]);
    setHighlightedIncorrect([]);
    setRecordedAudioUrl(null);
    setIsRecordedPlaybackPlaying(false);

    if (activeItem.code === 'ROP' && activeItem.options) {
      setReorderedList([...activeItem.options]);
    } else {
      setReorderedList([]);
    }

    setSelectedBlanks({});
    setShowResult(false);
    setIsGrading(false);
    setSubmitError('');

    // Phase 1e/1f: Reset audio state for each new question
    setIsAudioPlaying(false);
    setAudioPlaybackProgress(0);
    setAudioPlayed(false);

    // Phase 1f: Reset timer to correct values for this question's task code
    const info = PTE_TASK_TYPES.find((t) => t.code === activeItem.code)!;
    if (info) {
      setPrepTimer(info.prepTime);
      setTimer(info.attemptTime);
      setStatus(info.prepTime > 0 ? 'preparing' : 'answering');
    }

    // Phase 1f: Stop any in-progress recording when switching questions
    stopRecording();
    setIsRecordingRealMic(false);

    // Load custom history
    loadHistory();
  }, [activeItem.id]);

  // Autosave current written text draft
  useEffect(() => {
    if (userTypedText && ['SWT', 'WE', 'SST', 'WFD'].includes(activeCode)) {
      localStorage.setItem(`practice_draft_${activeItem.id}`, userTypedText);
    }
  }, [userTypedText, activeItem.id, activeCode]);

  // Load past attempt records
  const loadHistory = () => {
    const saved = localStorage.getItem('practiceHistory');
    if (saved) {
      const all: AttemptRecord[] = JSON.parse(saved);
      setQuestionHistory(all.filter((h) => h.questionId === activeItem.id));
    } else {
      setQuestionHistory([]);
    }
  };

  // Add submission to local attempt history
  const saveAttemptToHistory = (score: number, answerText: string) => {
    const record: AttemptRecord = {
      id: `H-${Date.now()}`,
      questionId: activeItem.id,
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
    loadHistory();
  };

  // Note auto-saver
  const handleSaveNote = (text: string) => {
    setQuestionNote(text);
    localStorage.setItem(`practice_note_${activeItem.id}`, text);
    setIsNoteSaving(true);
    const timer = setTimeout(() => setIsNoteSaving(false), 500);
    return () => clearTimeout(timer);
  };

  // Bookmark toggler
  const toggleBookmark = () => {
    const updated = isBookmarked
      ? bookmarkedQuestions.filter((id) => id !== activeItem.id)
      : [...bookmarkedQuestions, activeItem.id];
    setBookmarkedQuestions(updated);
    localStorage.setItem('bookmarkedQuestions', JSON.stringify(updated));
  };

  // Handle Prep Countdown Timer
  useEffect(() => {
    if (status === 'preparing') {
      const interval = setInterval(() => {
        setPrepTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            const info = PTE_TASK_TYPES.find((t) => t.code === activeCode)!;
            if (['RA', 'RS', 'DI', 'RL', 'ASQ', 'SGD', 'RTS'].includes(activeCode)) {
              setStatus('recording');
            } else {
              setStatus('answering');
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [status, activeCode]);

  // Handle Attempt Answering Timer
  useEffect(() => {
    if (status === 'recording' || status === 'answering') {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setStatus('completed');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [status]);

  // Handle real microphone and fallback simulator based on status
  useEffect(() => {
    let simInterval: NodeJS.Timeout | null = null;

    if (status === 'recording') {
      // Start Real Audio Recorder
      startRecording();

      // Trigger visual simulator as well
      simInterval = setInterval(() => {
        setSimulatedVoiceLevels(() =>
          Array.from({ length: 18 }, () => Math.floor(Math.random() * 40) + 10)
        );
      }, 150);
    } else if (status === 'completed' || status === 'preparing') {
      stopRecording();
      if (simInterval) clearInterval(simInterval);
    }

    return () => {
      if (simInterval) clearInterval(simInterval);
    };
  }, [status]);

  // Start real browser MediaRecorder
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedAudioUrl(url);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecordingRealMic(true);
    } catch (err) {
      console.warn('Microphone access blocked or unavailable in iframe. Using fallback acoustic engine.', err);
      setIsRecordingRealMic(false);
    }
  };

  // Stop real browser MediaRecorder
  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      try {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      } catch (err) {
        console.error('Error stopping MediaRecorder:', err);
      }
    }
  };

  // Playback recorded user voice
  const toggleRecordedPlayback = () => {
    if (recordedAudioRef.current) {
      if (isRecordedPlaybackPlaying) {
        recordedAudioRef.current.pause();
        setIsRecordedPlaybackPlaying(false);
      } else {
        recordedAudioRef.current.play();
        setIsRecordedPlaybackPlaying(true);
      }
    }
  };

  // Reorder controls for ROP
  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    const newList = [...reorderedList];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newList.length) {
      const temp = newList[index];
      newList[index] = newList[targetIndex];
      newList[targetIndex] = temp;
      setReorderedList(newList);
    }
  };

  // Multiple selection checks
  const handleToggleMultiple = (opt: string) => {
    setUserSelectedMultiple((prev) =>
      prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt]
    );
  };

  // Phase 1e: Real audio playback with one-play enforcement
  const handlePlayAudio = () => {
    if (ONE_PLAY_TASKS.has(activeCode) && audioPlayed) return;

    if (promptAudioRef.current) {
      promptAudioRef.current.currentTime = 0;
      promptAudioRef.current.play().catch((err) => {
        console.warn('Audio play failed:', err);
      });
      setIsAudioPlaying(true);
      setAudioPlayed(true);
    } else if (activeItem.audioUrl) {
      // Fallback: create audio element on demand
      const audio = new Audio(activeItem.audioUrl);
      promptAudioRef.current = audio;
      audio.addEventListener('timeupdate', () => {
        setAudioPlaybackProgress((audio.currentTime / (audio.duration || 1)) * 100);
      });
      audio.addEventListener('ended', () => {
        setIsAudioPlaying(false);
        setAudioPlaybackProgress(100);
      });
      audio.play().catch((err) => console.warn('Audio play failed:', err));
      setIsAudioPlaying(true);
      setAudioPlayed(true);
    }
  };

  const handleSubmitAnswering = async () => {
    setIsGrading(true);
    setSubmitError('');

    const taskSection = PTE_TASK_TYPES.find((t) => t.code === activeCode)?.section || 'Speaking';

    // Build answerJson from all interaction types
    const answerJsonObj = {
      typedText: userTypedText || null,
      selectedOption: userSelectedOption || null,
      selectedMultiple: userSelectedMultiple.length > 0 ? userSelectedMultiple : null,
      reorderedList: reorderedList.length > 0 ? reorderedList : null,
      blanks: Object.keys(selectedBlanks).length > 0 ? selectedBlanks : null,
      highlightedIncorrect: highlightedIncorrect.length > 0 ? highlightedIncorrect : null,
    };

    if (role === 'student' || role === 'teacher' || role === 'admin') {
      try {
        // Phase 1c: Single submission path — background job handles scoring.
        // Phase 1b: Server rejects placeholder speaking text and empty objective answers.
        const submission = await submitPracticeResponse({
          taskCode: activeCode,
          title: activeItem.title,
          section: taskSection,
          answerText: userTypedText || null,
          audioUrl: recordedAudioUrl || null,
          questionBankItemId: currentCmsItemId || undefined,
          answerJson: JSON.stringify(answerJsonObj),
        });

        // Save locally for history display (no score yet — grading is async)
        saveAttemptToHistory(0, userTypedText || '(selection)');

        // Store submission id so result screen can poll for score
        setScoredSubmission({ ...submission, _polling: true });
      } catch (err: any) {
        setSubmitError(err.message || 'Failed to submit practice response. Please try again.');
        setIsGrading(false);
        return;
      }
    }

    // Clear draft on success
    localStorage.removeItem(`practice_draft_${activeItem.id}`);

    setTimeout(() => {
      setIsGrading(false);
      setShowResult(true);
    }, 800);
  };

  // Search questions inside task bank
  const filteredCodeItems = codeItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(qSearchQuery.toLowerCase()) || 
                          item.instruction.toLowerCase().includes(qSearchQuery.toLowerCase());
    const matchesBookmark = !showBookmarkedOnly || bookmarkedQuestions.includes(item.id);
    return matchesSearch && matchesBookmark;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      {/* Real audio browser tag mapping */}
      {recordedAudioUrl && (
        <audio
          ref={recordedAudioRef}
          src={recordedAudioUrl}
          className="hidden"
          onEnded={() => setIsRecordedPlaybackPlaying(false)}
        />
      )}

      {/* 22-Task selector side menu */}
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* LEFT TASK TYPES BAR */}
        <div className="lg:w-1/4 space-y-4">
          <div className={`p-5 rounded-3xl border ${theme === 'dark' ? 'bg-gray-900/30 border-gray-850' : 'bg-white border-gray-200'}`}>
            <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-gray-400 mb-4 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-emerald-400" /> All 22 Task Types
            </h3>
            <div className="space-y-1 max-h-96 lg:max-h-[550px] overflow-y-auto pr-2 custom-scrollbar">
              {PTE_TASK_TYPES.map((t) => (
                <button
                  key={t.code}
                  onClick={() => setActiveCode(t.code)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                    activeCode === t.code
                      ? 'bg-emerald-500 text-white font-bold shadow'
                      : theme === 'dark'
                      ? 'hover:bg-gray-950 text-gray-400 hover:text-white'
                      : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      activeCode === t.code ? 'bg-white/20 text-white' : 'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      {t.code}
                    </span>
                    <span className="truncate max-w-[130px]">{t.name}</span>
                  </div>
                  <span className="text-[9px] opacity-60 uppercase font-mono">{t.section[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* PRACTICE CANVAS COLUMN */}
        <div className="flex-1 space-y-6">
          {/* Subskill Analytics Summary (from scored submissions) */}
          {serverSubmissions.length > 0 && (() => {
            const total = serverSubmissions.length;
            const avgScore = Math.round(serverSubmissions.reduce((a: number, s: any) => a + (s.score || 0), 0) / total);
            const sections: Record<string, { count: number; total: number }> = {};
            serverSubmissions.forEach((s: any) => {
              const sec = s.section || 'Other';
              if (!sections[sec]) sections[sec] = { count: 0, total: 0 };
              sections[sec].count++;
              sections[sec].total += s.score || 0;
            });
            return (
              <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-[#101424] border-gray-850' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <BarChart className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Your Analytics</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">{total} scored</span>
                  <span className="text-xs text-gray-500">Avg: <span className="text-white font-bold">{avgScore}/90</span></span>
                  {Object.entries(sections).slice(0, 4).map(([sec, data]) => (
                    <span key={sec} className="text-[10px] text-gray-400">
                      {sec}: <span className="text-emerald-400 font-mono">{Math.round(data.total / data.count)}</span>
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}
          <AnimatePresence mode="wait">
            {!showResult ? (
              /* Core Practice simulator screen */
              <motion.div
                key="simulator"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-6 sm:p-8 rounded-3xl border relative ${theme === 'dark' ? 'bg-gray-900/10 border-gray-850' : 'bg-white border-gray-200 shadow-sm'}`}
              >
                {/* Header indicators */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-gray-850 pb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase bg-emerald-500/10 px-2.5 py-1 rounded-full font-bold">
                        {PTE_TASK_TYPES.find((t) => t.code === activeCode)?.section} Section Task
                      </span>
                      <span className="text-[10px] font-mono text-gray-400 bg-gray-800 px-2.5 py-1 rounded-full">
                        ID: {activeItem.id}
                      </span>
                      {cmsSource === 'cms' && (
                        <span className="text-[10px] font-mono tracking-wider text-purple-400 uppercase bg-purple-500/10 px-2 py-0.5 rounded-full font-bold">
                          CMS Content
                        </span>
                      )}
                      {cmsLoading && (
                        <span className="text-[10px] font-mono text-gray-500 italic">Loading...</span>
                      )}
                      {/* Bookmark Button */}
                      <button
                        onClick={toggleBookmark}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          isBookmarked
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                            : 'border-gray-850 text-gray-500 hover:text-white'
                        }`}
                        title="Bookmark this Question"
                      >
                        <Star className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-400' : ''}`} />
                      </button>
                    </div>
                    <h2 className="text-xl font-bold tracking-tight mt-2 flex items-center gap-2">
                      {activeItem.title}
                    </h2>
                  </div>

                  {/* Dynamic Timer progress indicator */}
                  <div className="flex items-center gap-3">
                    {status === 'preparing' ? (
                      <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 px-3.5 py-1.5 rounded-xl text-orange-400 text-xs font-mono font-bold animate-pulse">
                        Preparation Countdown: {prepTimer}s
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-xl text-emerald-400 text-xs font-mono font-bold">
                        Answering Timer: {timer}s
                      </div>
                    )}
                  </div>
                </div>

                {/* Question Search / Filter & Multiple Selection */}
                <div className={`p-4 rounded-2xl border mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                  theme === 'dark' ? 'bg-gray-950/40 border-gray-850' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex flex-col gap-1 w-full md:w-auto">
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Select Question of this Task Type:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {/* Phase 1g: Use filteredCodeItems so search actually filters the buttons */}
                      {filteredCodeItems.map((item, idx) => {
                        const isSel = activeItem.id === item.id;
                        const isBook = bookmarkedQuestions.includes(item.id);
                        return (
                          <button
                            key={item.id}
                            onClick={() => setSelectedQuestionIndex(codeItems.indexOf(item))}
                            className={`px-3 py-1 rounded-xl text-xs font-mono tracking-tight transition-all border cursor-pointer flex items-center gap-1 ${
                              isSel
                                ? 'bg-emerald-500 border-emerald-500 text-white font-bold shadow'
                                : theme === 'dark' ? 'border-gray-800 bg-gray-900/30 text-gray-400 hover:bg-gray-900' : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            Q{idx + 1}
                            {isBook && <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 flex-shrink-0" />}
                          </button>
                        );
                      })}
                      {filteredCodeItems.length === 0 && (
                        <span className="text-[10px] text-gray-500 italic">No questions match your search.</span>
                      )}
                    </div>
                  </div>

                  {/* Micro search for active task type questions */}
                  <div className="relative w-full md:w-48">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                      <Search className="h-3 w-3 text-gray-500" />
                    </span>
                    <input
                      type="text"
                      placeholder="Search questions..."
                      value={qSearchQuery}
                      onChange={(e) => setQSearchQuery(e.target.value)}
                      className={`w-full pl-7 pr-3 py-1.5 rounded-lg text-[10px] border focus:outline-none ${
                        theme === 'dark' ? 'bg-gray-950 border-gray-850 text-white' : 'bg-white border-gray-300 text-gray-950'
                      }`}
                    />
                  </div>
                </div>

                {/* Instructions panel */}
                <div className={`p-4 rounded-xl mb-6 flex gap-3 items-start border text-xs leading-relaxed ${
                  theme === 'dark' ? 'bg-gray-950/40 border-gray-850 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}>
                  <AlertTriangle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold mb-1">Instructions:</p>
                    <p>{activeItem.instruction}</p>
                  </div>
                </div>

                {/* Practice material section */}
                <div className="space-y-6 mb-8">
                  {/* Image Display for Describe Image */}
                  {activeItem.imageUrl && (
                    <div className="flex justify-center border border-gray-800/40 rounded-2xl overflow-hidden max-w-md mx-auto">
                      <img referrerPolicy="no-referrer" src={activeItem.imageUrl} alt={activeItem.title} className="max-h-64 object-contain" />
                    </div>
                  )}

                  {/* Phase 1e: Real HTML audio element for prompt audio */}
                  {activeItem.audioUrl && (
                    <audio
                      ref={promptAudioRef}
                      src={activeItem.audioUrl}
                      className="hidden"
                      onTimeUpdate={(e) => {
                        const el = e.currentTarget;
                        setAudioPlaybackProgress((el.currentTime / (el.duration || 1)) * 100);
                      }}
                      onEnded={() => {
                        setIsAudioPlaying(false);
                        setAudioPlaybackProgress(100);
                      }}
                    />
                  )}

                  {/* Audio Player panel for Listening tasks */}
                  {activeItem.audioUrl && (
                    <div className={`p-5 rounded-2xl border flex flex-col gap-4 ${
                      theme === 'dark' ? 'bg-gray-950/60 border-gray-850' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-gray-400">LECTURE RECORDING</span>
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400 font-bold">{isAudioPlaying ? 'PLAYING' : audioPlayed ? 'COMPLETED' : 'IDLE'}</span>
                          {ONE_PLAY_TASKS.has(activeCode) && (
                            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${audioPlayed ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
                              {audioPlayed ? 'PLAYED — 1 PLAY ONLY' : '1 PLAY ALLOWED'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={handlePlayAudio}
                          disabled={ONE_PLAY_TASKS.has(activeCode) && audioPlayed}
                          title={ONE_PLAY_TASKS.has(activeCode) && audioPlayed ? 'Audio can only be played once per question' : 'Play audio'}
                          className={`w-10 h-10 rounded-full text-white flex items-center justify-center transition-all ${
                            ONE_PLAY_TASKS.has(activeCode) && audioPlayed
                              ? 'bg-gray-600 opacity-40 cursor-not-allowed'
                              : 'bg-emerald-500 hover:scale-105 cursor-pointer'
                          }`}
                        >
                          {isAudioPlaying ? <Square className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                        </button>
                        <div className="flex-1 bg-gray-800 h-2 rounded-full overflow-hidden relative">
                          <div className="bg-emerald-500 h-full transition-all duration-200" style={{ width: `${audioPlaybackProgress}%` }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Phase 1d: Prompt Text / Reading Passage — hide for audio-content tasks */}
                  {activeItem.promptText && !PROMPT_HIDDEN_TASKS.has(activeCode) && (
                    <div className={`p-6 rounded-2xl border text-sm leading-relaxed whitespace-pre-line ${
                      theme === 'dark' ? 'bg-gray-950/30 border-gray-850 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-800'
                    }`}>
                      {activeItem.promptText}
                    </div>
                  )}
                </div>

                {/* USER INTERACTION PANELS (Recording, Writing, Reading mechanics) */}
                <div className="mb-8">
                  {/* CATEGORY A: Speaking Vocal recorder wave simulation */}
                  {['RA', 'RS', 'DI', 'RL', 'ASQ', 'SGD', 'RTS'].includes(activeCode) && (
                    <div className={`p-6 rounded-2xl border text-center ${
                      status === 'recording' ? 'border-red-500/40 bg-red-500/5' : theme === 'dark' ? 'bg-gray-950/40 border-gray-850' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex justify-center mb-4">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                          status === 'recording' ? 'bg-red-500 text-white animate-pulse' : 'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          <Mic className="w-6 h-6" />
                        </div>
                      </div>
                      <p className="text-xs font-mono font-bold tracking-widest uppercase mb-4">
                        {status === 'preparing' && 'MIC STATUS: STANDBY'}
                        {status === 'recording' && `MIC STATUS: RECORDING... ${isRecordingRealMic ? '(REAL MICROPHONE ACTIVE)' : '(SIMULATED ACOUSTIC)'}`}
                        {status === 'completed' && 'MIC STATUS: CAPTURED'}
                      </p>

                      {/* Oscillating wave indicators */}
                      {status === 'recording' && (
                        <div className="h-10 flex items-center justify-center gap-1 mb-4">
                          {simulatedVoiceLevels.map((lvl, index) => (
                            <span key={index} style={{ height: `${lvl}%` }} className="w-1 bg-red-400 rounded-full transition-all duration-100" />
                          ))}
                        </div>
                      )}

                      <span className="text-[10px] text-gray-500 font-mono">
                        {status === 'preparing' && `Recording begins in ${prepTimer} seconds`}
                        {status === 'recording' && 'Speak clearly into your microphone now'}
                        {status === 'completed' && 'Voice response stored. Click submit.'}
                      </span>
                    </div>
                  )}

                  {/* CATEGORY B: Writing Rich text editor */}
                  {['SWT', 'WE', 'SST'].includes(activeCode) && (
                    <div className="space-y-2">
                      <textarea
                        rows={10}
                        value={userTypedText}
                        onChange={(e) => setUserTypedText(e.target.value)}
                        placeholder="Type your academic response here..."
                        className={`w-full p-4 rounded-2xl text-xs border focus:outline-none focus:ring-1 focus:border-emerald-500 focus:ring-emerald-500 ${
                          theme === 'dark' ? 'bg-gray-950 border-gray-850 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                      <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono">
                        <span>Words: {userTypedText ? userTypedText.trim().split(/\s+/).length : 0} | Characters: {userTypedText.length}</span>
                        <span>Constraint: {activeCode === 'SWT' ? '5 - 75 words' : activeCode === 'SST' ? '50 - 70 words' : '200 - 300 words'}</span>
                      </div>
                    </div>
                  )}

                  {/* CATEGORY C: Reading MCQs (MCS, MCM) */}
                  {['MCS', 'MCM', 'MCMSL', 'MCSSL', 'HCS', 'SMW'].includes(activeCode) && activeItem.options && (
                    <div className="space-y-3">
                      {activeItem.options.map((opt, idx) => {
                        const isSelected = activeCode === 'MCM' || activeCode === 'MCMSL'
                          ? userSelectedMultiple.includes(opt)
                          : userSelectedOption === opt;
                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              if (activeCode === 'MCM' || activeCode === 'MCMSL') {
                                handleToggleMultiple(opt);
                              } else {
                                setUserSelectedOption(opt);
                              }
                            }}
                            className={`w-full text-left p-4 rounded-xl text-xs font-semibold border flex justify-between items-center transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                                : theme === 'dark'
                                ? 'bg-gray-950/40 border-gray-850 hover:bg-gray-900 text-gray-300'
                                : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            <span>{opt}</span>
                            <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                              isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-700'
                            }`}>
                              {isSelected && <CheckCircle className="w-3.5 h-3.5" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* CATEGORY D: Reorder Paragraphs (ROP) */}
                  {activeCode === 'ROP' && reorderedList.length > 0 && (
                    <div className="space-y-3">
                      {reorderedList.map((item, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-xl border flex justify-between items-center text-xs leading-relaxed ${
                            theme === 'dark' ? 'bg-gray-950/40 border-gray-850' : 'bg-white border-gray-200 shadow-sm'
                          }`}
                        >
                          <span className="flex-1 pr-4">{item}</span>
                          <div className="flex flex-col gap-1.5 flex-shrink-0">
                            <button
                              disabled={index === 0}
                              onClick={() => handleMoveItem(index, 'up')}
                              className="px-2 py-1 text-[10px] bg-gray-800 text-gray-300 hover:bg-emerald-500 rounded disabled:opacity-30 cursor-pointer"
                            >
                              ▲ Move Up
                            </button>
                            <button
                              disabled={index === reorderedList.length - 1}
                              onClick={() => handleMoveItem(index, 'down')}
                              className="px-2 py-1 text-[10px] bg-gray-800 text-gray-300 hover:bg-emerald-500 rounded disabled:opacity-30 cursor-pointer"
                            >
                              ▼ Move Down
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* CATEGORY E: Fill in the Blanks (FIBR, FIBRW, FIBL) */}
                  {['FIBR', 'FIBRW', 'FIBL'].includes(activeCode) && activeItem.options && (
                    <div className="space-y-6">
                      <div className={`p-6 rounded-2xl border leading-relaxed text-xs leading-loose ${
                        theme === 'dark' ? 'bg-gray-950/40 border-gray-850 text-gray-300' : 'bg-white border-gray-200 text-gray-700'
                      }`}>
                        {activeItem.promptText?.split(/\[\d+\]/).map((part, idx, arr) => {
                          if (idx === arr.length - 1) return <span key={idx}>{part}</span>;
                          return (
                            <React.Fragment key={idx}>
                              <span>{part}</span>
                              <select
                                value={selectedBlanks[idx] || ''}
                                onChange={(e) => setSelectedBlanks({ ...selectedBlanks, [idx]: e.target.value })}
                                className="mx-2 px-2 py-1 rounded border bg-gray-950 text-emerald-400 font-bold font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              >
                                <option value="">Select Option</option>
                                {activeItem.options?.[idx]?.split(', ').map((opt) => (
                                  <option key={opt} value={opt}>{opt}</option>
                                )) || activeItem.options?.map((opt) => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* CATEGORY F: Highlight Incorrect Words (HIW) */}
                  {activeCode === 'HIW' && activeItem.options && (
                    <div className={`p-6 rounded-2xl border text-xs leading-loose ${
                      theme === 'dark' ? 'bg-gray-950/40 border-gray-850 text-gray-300' : 'bg-white border-gray-200'
                    }`}>
                      {activeItem.promptText?.split(' ').map((word, idx) => {
                        const cleanWord = word.replace(/[().,;[\]]/g, '');
                        const isHighlighted = highlightedIncorrect.includes(cleanWord);
                        return (
                          <span
                            key={idx}
                            onClick={() => {
                              setHighlightedIncorrect((prev) =>
                                prev.includes(cleanWord)
                                  ? prev.filter((w) => w !== cleanWord)
                                  : [...prev, cleanWord]
                              );
                            }}
                            className={`mx-1 px-1 rounded cursor-pointer transition-colors ${
                              isHighlighted ? 'bg-emerald-500/25 text-emerald-400 font-bold' : 'hover:bg-white/10'
                            }`}
                          >
                            {word}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* CATEGORY G: Write from Dictation (WFD) */}
                  {activeCode === 'WFD' && (
                    <div className="space-y-2">
                      <input
                        required
                        type="text"
                        value={userTypedText}
                        onChange={(e) => setUserTypedText(e.target.value)}
                        placeholder="Type the exact sentence you heard here..."
                        className={`w-full p-4 rounded-2xl text-xs border focus:outline-none focus:ring-1 focus:border-emerald-500 focus:ring-emerald-500 ${
                          theme === 'dark' ? 'bg-gray-950 border-gray-850 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                      <span className="text-[10px] text-gray-500 font-mono">Use standard capitalizations and punctuation (e.g. period).</span>
                    </div>
                  )}
                </div>

                {/* Submit Controls footer */}
                <div className="flex justify-between items-center border-t border-gray-850 pt-6">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const idx = PTE_TASK_TYPES.findIndex((t) => t.code === activeCode);
                        if (idx > 0) setActiveCode(PTE_TASK_TYPES[idx - 1].code);
                      }}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-gray-800 text-gray-300 hover:bg-gray-700 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" /> Prev Task Type
                    </button>
                    <button
                      onClick={() => {
                        const idx = PTE_TASK_TYPES.findIndex((t) => t.code === activeCode);
                        if (idx < PTE_TASK_TYPES.length - 1) setActiveCode(PTE_TASK_TYPES[idx + 1].code);
                      }}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-gray-800 text-gray-300 hover:bg-gray-700 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      Next Task Type <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={handleSubmitAnswering}
                    disabled={isGrading}
                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold transition-all shadow shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
                  >
                    {isGrading ? (
                      <>Submitting...</>
                    ) : (
                      <>
                        Submit Response <CheckCircle className="w-4 h-4" />
                      </>
                    )}
                  </button>
                  {submitError && (
                    <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>{submitError}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              /* Practice response scored */
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className={`p-6 sm:p-8 rounded-3xl border ${theme === 'dark' ? 'bg-[#101424] border-emerald-500/30' : 'bg-white border-emerald-500 shadow-xl'}`}
              >
                <div className="flex justify-between items-start mb-6 border-b border-gray-850 pb-4">
                  <div>
                    <span className="text-[10px] font-mono tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full font-bold uppercase">
                      {scoredSubmission ? 'AI EVALUATED' : 'SUBMITTED'}
                    </span>
                    <h2 className="text-xl font-bold tracking-tight mt-2">
                      {scoredSubmission ? 'Submission Scored' : 'Submission Saved Successfully'}
                    </h2>
                  </div>
                  <button
                    onClick={() => { setShowResult(false); setScoredSubmission(null); }}
                    className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Retry Practice
                  </button>
                </div>

                {scoredSubmission ? (
                  <>
                    {/* Phase 1c: If submission is pending grading, show polling message */}
                    {scoredSubmission._polling && !scoredSubmission.score && (
                      <div className={`p-5 rounded-2xl border mb-6 ${theme === 'dark' ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
                        <p className="text-sm text-amber-400 leading-relaxed">
                          ⏳ <strong>Grading in progress.</strong> Your response has been saved and is being evaluated by the AI scoring engine. Results typically appear within 60 seconds. Refresh the Submission History to check.
                        </p>
                      </div>
                    )}
                    <div className="grid md:grid-cols-3 gap-8 mb-8">
                      <div className={`p-6 rounded-2xl border text-center flex flex-col justify-center items-center ${
                        theme === 'dark' ? 'bg-gray-950/60 border-gray-850' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500">Score</p>
                        <p className="text-5xl font-black text-emerald-400 font-mono my-3">{scoredSubmission.score || '—'}</p>
                        <span className="text-xs font-semibold text-emerald-400/90 font-mono">out of 90</span>
                      </div>
                      <div className="md:col-span-2 space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-widest font-mono text-gray-400">Subskill Breakdown</h4>
                        {scoredSubmission.fluencyScore != null && (
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold">Oral Fluency</span>
                              <span className="font-mono text-emerald-400 font-bold">{scoredSubmission.fluencyScore}/90</span>
                            </div>
                            <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-emerald-500 h-full" style={{ width: `${(scoredSubmission.fluencyScore / 90) * 100}%` }}></div>
                            </div>
                          </div>
                        )}
                        {scoredSubmission.pronunciationScore != null && (
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold">Pronunciation</span>
                              <span className="font-mono text-emerald-400 font-bold">{scoredSubmission.pronunciationScore}/90</span>
                            </div>
                            <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-emerald-500 h-full" style={{ width: `${(scoredSubmission.pronunciationScore / 90) * 100}%` }}></div>
                            </div>
                          </div>
                        )}
                        {scoredSubmission.grammarIssues != null && scoredSubmission.grammarIssues > 0 && (
                          <p className="text-xs text-gray-400">Grammar issues detected: <span className="text-amber-400 font-bold">{scoredSubmission.grammarIssues}</span></p>
                        )}
                      </div>
                    </div>
                    {scoredSubmission.feedback && (
                      <div className="space-y-3 mb-6">
                        <h4 className="text-xs font-bold uppercase tracking-widest font-mono text-gray-400">Detailed Feedback</h4>
                        {scoredSubmission.feedback.split(/\*\*(.+?)\*\*/).reduce((acc: string[], part, i, parts) => {
                          if (i === 0) return acc; // skip leading empty
                          if (i % 2 === 1) {
                            // This is a heading
                            const heading = part.trim();
                            const body = (parts[i + 1] || '').trim();
                            if (heading && body) acc.push(JSON.stringify({ heading, body }));
                          }
                          return acc;
                        }, []).map((json: string, idx: number) => {
                          const { heading, body } = JSON.parse(json);
                          return (
                            <details key={idx} className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-gray-950/60 border-gray-850' : 'bg-gray-50 border-gray-200'}`}>
                              <summary className="text-xs font-bold text-emerald-400 cursor-pointer">{heading}</summary>
                              <div className={`mt-2 text-xs leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
                                style={{ whiteSpace: 'pre-wrap' }}>
                                {body}
                              </div>
                            </details>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <div className={`p-5 rounded-2xl border mb-6 ${theme === 'dark' ? 'bg-gray-950/60 border-gray-850' : 'bg-gray-50 border-gray-200'}`}>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      Evaluating your response... If scoring is delayed, your response has been saved and will be graded soon.
                    </p>
                  </div>
                )}

                {/* Review section: sample answer */}
                <div className="space-y-4 border-t border-gray-850 pt-6">
                  <h4 className="text-xs font-bold uppercase tracking-widest font-mono text-gray-400 mb-2">Learning Feedback</h4>
                  <div className="grid md:grid-cols-2 gap-6">
                    {activeItem.modelAnswer && (
                      <div>
                        <h5 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-emerald-400" /> Sample Answer
                        </h5>
                        <div className={`p-4 rounded-xl text-xs leading-relaxed ${theme === 'dark' ? 'bg-gray-950 text-gray-400' : 'bg-gray-50 text-gray-600'}`}>
                          {activeItem.modelAnswer}
                        </div>
                      </div>
                    )}
                    {activeItem.vocabulary?.length > 0 && (
                      <div>
                        <h5 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-emerald-400" /> Tags & Topics
                        </h5>
                        <div className="space-y-2">
                          {activeItem.vocabulary?.map((vocab, index) => (
                            <div key={index} className={`p-2.5 rounded-lg border text-xs ${theme === 'dark' ? 'bg-gray-950 border-gray-850' : 'bg-gray-50 border-gray-200'}`}>
                              <span className="font-bold text-emerald-400 font-mono">{vocab.phrase}</span>: <span className="text-gray-400">{vocab.meaning}</span>
                            </div>
                          )) || <p className="text-xs text-gray-500">None required for this task type.</p>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-850 mt-8">
                  <button
                    onClick={() => {
                      const idx = selectedQuestionIndex;
                      if (idx < codeItems.length - 1) {
                        setSelectedQuestionIndex(idx + 1);
                        setShowResult(false);
                      } else {
                        const nextCodeIdx = PTE_TASK_TYPES.findIndex((t) => t.code === activeCode);
                        if (nextCodeIdx < PTE_TASK_TYPES.length - 1) {
                          setActiveCode(PTE_TASK_TYPES[nextCodeIdx + 1].code);
                        } else {
                          setShowResult(false);
                        }
                      }
                    }}
                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    Advance to Next Question <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* SECONDARY UTILITIES GRID: Autosaved Question Notes & Past Attempt History */}
          <div className="grid md:grid-cols-2 gap-6 pt-4">
            {/* COLLAPSED NOTES PANEL */}
            <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-gray-900/10 border-gray-850' : 'bg-white border-gray-200 shadow-sm'}`}>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-gray-400 flex items-center gap-1.5">
                  <FileEdit className="w-4 h-4 text-emerald-400" /> Question Sticky Notes
                </h3>
                {isNoteSaving && (
                  <span className="text-[10px] text-emerald-400 font-mono animate-pulse">Saving note...</span>
                )}
              </div>
              <textarea
                rows={6}
                placeholder="Jot down quick phonetic layouts, response templates, or notes for this question... notes are persistent."
                value={questionNote}
                onChange={(e) => handleSaveNote(e.target.value)}
                className={`w-full p-3 rounded-2xl text-xs border focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 ${
                  theme === 'dark' ? 'bg-gray-950 border-gray-850 text-gray-300' : 'bg-white border-gray-300 text-gray-950'
                }`}
              />
              <p className="text-[10px] text-gray-500 font-mono mt-2">Notes auto-save instantly per practice item ID.</p>
            </div>

            {/* ATTEMPT HISTORY LIST PANEL */}
            <div className={`p-6 rounded-3xl border flex flex-col justify-between ${theme === 'dark' ? 'bg-gray-900/10 border-gray-850' : 'bg-white border-gray-200 shadow-sm'}`}>
              <div>
                <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-gray-400 mb-3 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-emerald-400" /> Submission History
                </h3>
                
                {serverSubmissions.length === 0 && questionHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                    <p className="text-xs">No submissions yet.</p>
                    <p className="text-[10px] opacity-60 mt-0.5">Submit a task to see your scored results.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-44 overflow-y-auto pr-1 custom-scrollbar">
                    {serverSubmissions.slice(0, 3).map((s: any) => (
                      <div key={s.id} className={`p-2.5 rounded-xl border text-[10px] flex justify-between items-center ${
                        theme === 'dark' ? 'bg-gray-950/60 border-gray-850 text-gray-300' : 'bg-gray-50 border-gray-250 text-gray-600'
                      }`}>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold truncate">{s.title} <span className="text-gray-500 font-normal">({s.taskCode})</span></p>
                          <div className="flex gap-2 items-center mt-0.5">
                            <span className="text-emerald-400 font-mono font-bold">{s.score}/90</span>
                            {s.fluencyScore != null && <span className="text-[9px] text-gray-500">F:{s.fluencyScore}</span>}
                            {s.pronunciationScore != null && <span className="text-[9px] text-gray-500">P:{s.pronunciationScore}</span>}
                          </div>
                        </div>
                        <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 uppercase font-bold flex-shrink-0">Graded</span>
                      </div>
                    ))}
                    {serverSubmissions.length === 0 && questionHistory.length > 0 && questionHistory.slice(0, 3).map((h) => (
                      <div key={h.id} className={`p-2.5 rounded-xl border text-[10px] flex justify-between items-center ${
                        theme === 'dark' ? 'bg-gray-950/60 border-gray-850 text-gray-300' : 'bg-gray-50 border-gray-250 text-gray-600'
                      }`}>
                        <div>
                          <p className="font-bold">Attempt Score: <span className="text-emerald-400 font-mono">{h.score}/90</span></p>
                          <span className="text-[9px] text-gray-500">{h.date}</span>
                        </div>
                        <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 uppercase font-bold">Local</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="text-[10px] text-gray-500 font-mono mt-3 border-t border-gray-800/40 pt-2">
                {serverSubmissions.length > 0
                  ? `${serverSubmissions.length} scored submission(s) across all tasks`
                  : `Tracks last 5 local evaluations for ID: ${activeItem.id}.`}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
