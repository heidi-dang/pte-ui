/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useGlobalContext } from './ThemeContext';
import { PRACTICE_ITEMS, PTE_TASK_TYPES } from '../data/mockData';
import { PTETaskCode, PracticeItem } from '../types';
import { Mic, CheckCircle, Volume2, Square, Play, Sparkles, ChevronLeft, ChevronRight, RotateCcw, Award, FileText, AlertTriangle, ArrowRight, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PracticeEngineProps {
  initialTaskCode?: PTETaskCode;
}

export const PracticeEngine: React.FC<PracticeEngineProps> = ({ initialTaskCode = 'RA' }) => {
  const { theme, apiFetch, role } = useGlobalContext();
  const [activeCode, setActiveCode] = useState<PTETaskCode>(initialTaskCode);

  // Load the practice item
  const activeItem: PracticeItem = PRACTICE_ITEMS[activeCode] || PRACTICE_ITEMS['RA'];

  // Timers & States
  const [timer, setTimer] = useState(40);
  const [prepTimer, setPrepTimer] = useState(10);
  const [status, setStatus] = useState<'preparing' | 'recording' | 'answering' | 'completed'>('preparing');
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioPlaybackProgress, setAudioPlaybackProgress] = useState(0);

  // User input states
  const [userTypedText, setUserTypedText] = useState('');
  const [userSelectedOption, setUserSelectedOption] = useState<string>('');
  const [userSelectedMultiple, setUserSelectedMultiple] = useState<string[]>([]);
  const [reorderedList, setReorderedList] = useState<string[]>([]);
  const [selectedBlanks, setSelectedBlanks] = useState<Record<number, string>>({});
  const [highlightedIncorrect, setHighlightedIncorrect] = useState<string[]>([]);

  // Simulation controls
  const [simulatedVoiceLevels, setSimulatedVoiceLevels] = useState<number[]>([]);
  const [vocalVolume, setVocalVolume] = useState(30);

  // Score Screen
  const [showResult, setShowResult] = useState(false);
  const [isGrading, setIsGrading] = useState(false);

  // Refs for timers
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Reset task states when active code changes
  useEffect(() => {
    setActiveCode(activeCode);
    const item = PRACTICE_ITEMS[activeCode] || PRACTICE_ITEMS['RA'];
    const info = PTE_TASK_TYPES.find((t) => t.code === activeCode)!;

    setPrepTimer(info.prepTime);
    setTimer(info.attemptTime);
    setStatus(info.prepTime > 0 ? 'preparing' : 'answering');
    setUserTypedText('');
    setUserSelectedOption('');
    setUserSelectedMultiple([]);
    setHighlightedIncorrect([]);
    setShowResult(false);
    setIsGrading(false);
    setIsAudioPlaying(false);
    setAudioPlaybackProgress(0);

    // Initial setup for reorder
    if (item.code === 'ROP' && item.options) {
      setReorderedList([...item.options]);
    } else {
      setReorderedList([]);
    }

    // Reset blanks
    setSelectedBlanks({});

    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [activeCode]);

  // Handle Prep Countdown Timer
  useEffect(() => {
    if (status === 'preparing') {
      const interval = setInterval(() => {
        setPrepTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            const info = PTE_TASK_TYPES.find((t) => t.code === activeCode)!;
            // Transition to recording or answering
            if (['RA', 'RS', 'DI', 'RL', 'ASQ', 'SGD', 'RTS'].includes(activeCode)) {
              setStatus('recording');
              triggerVoiceRecordingSimulation();
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

  const triggerVoiceRecordingSimulation = () => {
    // Generate simulated audio frequencies for wave meter
    const timerInterval = setInterval(() => {
      setSimulatedVoiceLevels(() =>
        Array.from({ length: 18 }, () => Math.floor(Math.random() * 40) + 10)
      );
    }, 150);
    // Kill simulation when status is completed
    return () => clearInterval(timerInterval);
  };

  // Reorder controls
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

  // Audio Playback trigger
  const handlePlayAudio = () => {
    setIsAudioPlaying(true);
    let progress = 0;
    const playInterval = setInterval(() => {
      progress += 5;
      setAudioPlaybackProgress(progress);
      if (progress >= 100) {
        clearInterval(playInterval);
        setIsAudioPlaying(false);
      }
    }, 200);
  };

  const handleSubmitAnswering = async () => {
    setIsGrading(true);

    let answer = userTypedText || '';
    if (!answer && userSelectedOption) {
      answer = `Selected Option: ${userSelectedOption}`;
    } else if (!answer && userSelectedMultiple.length > 0) {
      answer = `Selected Options: ${userSelectedMultiple.join(', ')}`;
    } else if (!answer && reorderedList.length > 0) {
      answer = `Order: ${reorderedList.join(' -> ')}`;
    } else if (!answer && Object.keys(selectedBlanks).length > 0) {
      answer = `Blanks: ${Object.values(selectedBlanks).join(', ')}`;
    } else if (['RA', 'RS', 'DI', 'RL', 'ASQ', 'SGD', 'RTS'].includes(activeCode)) {
      answer = `[Speaking audio recorded successfully]`;
    }

    const taskSection = PTE_TASK_TYPES.find((t) => t.code === activeCode)?.section || 'Speaking';

    if (role === 'student' || role === 'teacher' || role === 'admin') {
      try {
        await apiFetch('/api/student/practice/submit', {
          method: 'POST',
          body: JSON.stringify({
            taskCode: activeCode,
            title: activeItem.title,
            section: taskSection,
            answerText: answer,
            audioUrl: ['RA', 'RS', 'DI', 'RL'].includes(activeCode) ? '/uploads/mock-student-recording.wav' : null,
          }),
        });
      } catch (err) {
        console.error('Failed to submit practice to server:', err);
      }
    }

    // Loader delay and then transition to result screen
    setTimeout(() => {
      setIsGrading(false);
      setShowResult(true);
    }, 1500);
  };

  // Custom AI feedback text based on Task Section
  const generateMockAIFeedback = () => {
    const section = PTE_TASK_TYPES.find((t) => t.code === activeCode)?.section || 'Speaking';
    if (section === 'Speaking') {
      return {
        overall: 78,
        details: [
          { label: 'Oral Fluency', score: 82, text: 'Stable word chunks. Pause frequencies were highly appropriate.' },
          { label: 'Pronunciation', score: 74, text: 'Excellent consonant clarity, although plural endings had minor drops.' },
          { label: 'Content', score: 80, text: 'Extracted all key statistics and structural nouns perfectly.' }
        ],
        diagnostic: 'Your speech envelope matches standard native phonetics closely. Try lowering your vocal pitch by 10Hz to stabilize microphone resonance on high consonants.'
      };
    } else if (section === 'Writing') {
      return {
        overall: 82,
        details: [
          { label: 'Grammar', score: 85, text: 'Complex coordinate clauses used with 98% accuracy.' },
          { label: 'Vocabulary Range', score: 78, text: 'Strong lexical diversity. Strong use of linking transition words.' },
          { label: 'Form & Spelling', score: 90, text: 'Zero misspelled terms, word limit criteria met.' }
        ],
        diagnostic: 'A magnificent submission. To approach a perfect 90/90, incorporate additional advanced relative pronouns (e.g. "wherein", "whereby") to elevate syntactic range.'
      };
    } else {
      return {
        overall: 74,
        details: [
          { label: 'Answering Match', score: 75, text: 'Identified core semantic keys.' },
          { label: 'Time Efficiency', score: 70, text: 'Completed task within average parameters.' }
        ],
        diagnostic: 'Excellent work. Keep practicing with collocations list to guarantee swift logical paragraph mapping.'
      };
    }
  };

  const aiFeedback = generateMockAIFeedback();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      {/* 22-Task selector side menu */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Task sidebar listing all 22 tasks */}
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

        {/* Practice Canvas and score screen */}
        <div className="flex-1 space-y-6">
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
                  <div>
                    <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase bg-emerald-500/10 px-2.5 py-1 rounded-full font-bold">
                      {PTE_TASK_TYPES.find((t) => t.code === activeCode)?.section} Section Task
                    </span>
                    <h2 className="text-xl font-bold tracking-tight mt-2">{activeItem.title}</h2>
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

                  {/* Audio Player panel for Listening tasks */}
                  {activeItem.audioUrl && (
                    <div className={`p-5 rounded-2xl border flex flex-col gap-4 ${
                      theme === 'dark' ? 'bg-gray-950/60 border-gray-850' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-gray-400">LECTURE RECORDING</span>
                        <span className="text-emerald-400 font-bold">{isAudioPlaying ? 'PLAYING' : 'IDLE'}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={handlePlayAudio}
                          className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:scale-105 transition-transform"
                        >
                          {isAudioPlaying ? <Square className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                        </button>
                        <div className="flex-1 bg-gray-800 h-2 rounded-full overflow-hidden relative">
                          <div className="bg-emerald-500 h-full transition-all duration-200" style={{ width: `${audioPlaybackProgress}%` }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Prompt Text / Reading Passage */}
                  {activeItem.promptText && activeCode !== 'RS' && (
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
                      status === 'recording' ? 'border-emerald-500/40 bg-emerald-500/5' : theme === 'dark' ? 'bg-gray-950/40 border-gray-850' : 'bg-gray-50 border-gray-200'
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
                        {status === 'recording' && 'MIC STATUS: RECORDING...'}
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
                              className="px-2 py-1 text-[10px] bg-gray-800 text-gray-300 hover:bg-emerald-500 rounded disabled:opacity-30"
                            >
                              ▲ Move Up
                            </button>
                            <button
                              disabled={index === reorderedList.length - 1}
                              onClick={() => handleMoveItem(index, 'down')}
                              className="px-2 py-1 text-[10px] bg-gray-800 text-gray-300 hover:bg-emerald-500 rounded disabled:opacity-30"
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
                        {/* Render simple blanks selection */}
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
                      <ChevronLeft className="w-4 h-4" /> Prev Task
                    </button>
                    <button
                      onClick={() => {
                        const idx = PTE_TASK_TYPES.findIndex((t) => t.code === activeCode);
                        if (idx < PTE_TASK_TYPES.length - 1) setActiveCode(PTE_TASK_TYPES[idx + 1].code);
                      }}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-gray-800 text-gray-300 hover:bg-gray-700 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      Next Task <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={handleSubmitAnswering}
                    disabled={isGrading}
                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold transition-all shadow shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
                  >
                    {isGrading ? (
                      <>Evaluating Responses...</>
                    ) : (
                      <>
                        Submit & Get Score <Sparkles className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ) : (
              /* High fidelity evaluation result and review screen */
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className={`p-6 sm:p-8 rounded-3xl border ${theme === 'dark' ? 'bg-[#101424] border-emerald-500/30' : 'bg-white border-emerald-500 shadow-xl'}`}
              >
                {/* Header overview */}
                <div className="flex justify-between items-start mb-8 border-b border-gray-850 pb-4">
                  <div>
                    <span className="text-[10px] font-mono tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full font-bold uppercase">AI DIAGNOSTIC REPORT</span>
                    <h2 className="text-xl font-bold tracking-tight mt-2">Submission Evaluated Successfully!</h2>
                  </div>
                  <button
                    onClick={() => setShowResult(false)}
                    className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Retry Practice
                  </button>
                </div>

                {/* Dual column: overall marks and subskills */}
                <div className="grid md:grid-cols-3 gap-8 mb-8">
                  <div className={`p-6 rounded-2xl border text-center flex flex-col justify-center items-center ${
                    theme === 'dark' ? 'bg-gray-950/60 border-gray-850' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500">Overall PTE Grade</p>
                    <p className="text-5xl font-black text-emerald-400 font-mono my-3">{aiFeedback.overall}</p>
                    <span className="text-xs font-semibold text-emerald-400/90 font-mono">CEFR equivalent: C1 Expert</span>
                  </div>

                  <div className="md:col-span-2 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-widest font-mono text-gray-400">Subskill Analytics</h4>
                    <div className="space-y-3.5">
                      {aiFeedback.details.map((detail, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold">{detail.label}</span>
                            <span className="font-mono text-emerald-400 font-bold">{detail.score}/90</span>
                          </div>
                          <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full" style={{ width: `${(detail.score / 90) * 100}%` }}></div>
                          </div>
                          <p className="text-[10px] text-gray-400">{detail.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* AI advice transcript */}
                <div className={`p-5 rounded-2xl border mb-8 bg-emerald-500/5 border-emerald-500/20 text-xs leading-relaxed`}>
                  <p className="font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> Real-time Speech & Script Advice:
                  </p>
                  <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>{aiFeedback.diagnostic}</p>
                </div>

                {/* Review section: prompt text vs correct/model answers */}
                <div className="space-y-4 border-t border-gray-850 pt-6">
                  <h4 className="text-xs font-bold uppercase tracking-widest font-mono text-gray-400 mb-2">Detailed Review & Cheat sheets</h4>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-emerald-400" /> Reference Model Answer
                      </h5>
                      <div className={`p-4 rounded-xl text-xs leading-relaxed ${theme === 'dark' ? 'bg-gray-950 text-gray-400' : 'bg-gray-50 text-gray-600'}`}>
                        {activeItem.modelAnswer}
                      </div>
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-emerald-400" /> Essential Vocabulary / Collocations
                      </h5>
                      <div className="space-y-2">
                        {activeItem.vocabulary?.map((vocab, index) => (
                          <div key={index} className={`p-2.5 rounded-lg border text-xs ${theme === 'dark' ? 'bg-gray-950 border-gray-850' : 'bg-gray-50 border-gray-200'}`}>
                            <span className="font-bold text-emerald-400 font-mono">{vocab.phrase}</span>: <span className="text-gray-400">{vocab.meaning}</span>
                          </div>
                        )) || <p className="text-xs text-gray-500">None required for this task type.</p>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-850 mt-8">
                  <button
                    onClick={() => {
                      const idx = PTE_TASK_TYPES.findIndex((t) => t.code === activeCode);
                      if (idx < PTE_TASK_TYPES.length - 1) {
                        setActiveCode(PTE_TASK_TYPES[idx + 1].code);
                      } else {
                        setShowResult(false);
                      }
                    }}
                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    Advance to Next Task Type <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
