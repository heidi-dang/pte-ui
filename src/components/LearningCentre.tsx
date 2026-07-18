/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useGlobalContext } from './ThemeContext';
import { FLASHCARDS } from '../data/mockData';
import { BookOpen, Video, FileText, Sparkles, Filter, CheckCircle, ChevronLeft, ChevronRight, Copy, Check, RotateCw, Award, Search, Star, FileEdit, Trash2, Lock, ShieldAlert, X } from 'lucide-react';
import { motion } from 'motion/react';

export const LearningCentre: React.FC = () => {
  const { theme, user, role, apiFetch } = useGlobalContext();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'courses' | 'templates' | 'flashcards' | 'tips' | 'plan'>('courses');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [courses, setCourses] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [flashcards, setFlashcards] = useState<any[]>(FLASHCARDS);
  const [studyPlan, setStudyPlan] = useState<any>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState('');
  const [learningOverview, setLearningOverview] = useState<any>(null);
  const pageSize = 6;

  // Fetch courses and progress from backend
  const loadCourses = async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const data = await apiFetch('/api/student/courses');
      setCourses(data || []);
    } catch (err: any) {
      setLoadError('Failed to load courses. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch lessons for selected course
  useEffect(() => {
    if (!selectedCourseId) { setLessons([]); return; }
    const loadLessons = async () => {
      try {
        const data = await apiFetch(`/api/student/courses/${selectedCourseId}/lessons`);
        setLessons(data || []);
      } catch { setLessons([]); }
    };
    loadLessons();
  }, [selectedCourseId, apiFetch]);

  // Fetch flashcards from backend
  useEffect(() => {
    const loadFlashcards = async () => {
      try {
        const data = await apiFetch('/api/student/flashcards');
        if (data?.length > 0) setFlashcards(data);
      } catch { /* keep static fallback */ }
    };
    loadFlashcards();
  }, [apiFetch]);

  // Load courses on mount
  useEffect(() => { loadCourses(); }, [apiFetch]);

  // Load learning overview
  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch('/api/student/learning/overview');
        setLearningOverview(data);
      } catch { /* non-critical */ }
    };
    load();
  }, [apiFetch]);

  // Load study plan
  const loadStudyPlan = async () => {
    setPlanLoading(true);
    setPlanError('');
    try {
      const plan = await apiFetch('/api/student/study-plan');
      setStudyPlan(plan);
    } catch (err: any) {
      setPlanError('Failed to load study plan. Please try again.');
    } finally {
      setPlanLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'plan') loadStudyPlan();
  }, [activeTab, apiFetch]);

  // Completed lessons from API data (computed from lessons array)
  const completedLessons = lessons.filter(l => l.completed).map((l: any) => l.id);

  // Handle lesson completion toggle via API
  const handleToggleLesson = async (lessonId: string) => {
    try {
      const res = await apiFetch(`/api/student/lessons/${lessonId}/toggle`, { method: 'POST' });
      // Refresh lessons to get updated completion state
      if (selectedCourseId) {
        const data = await apiFetch(`/api/student/courses/${selectedCourseId}/lessons`);
        setLessons(data || []);
      }
    } catch (err: any) {
      console.error('Failed to toggle lesson:', err);
    }
    loadCourses();
  };

  // Bookmarked courses state
  const [bookmarkedCourses, setBookmarkedCourses] = useState<string[]>(() => {
    const saved = localStorage.getItem('bookmarkedCourses');
    return saved ? JSON.parse(saved) : [];
  });

  // Local note cache (temporary non-authoritative storage)
  const [currentNote, setCurrentNote] = useState('');

  const toggleCourseBookmark = (courseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = bookmarkedCourses.includes(courseId)
      ? bookmarkedCourses.filter(id => id !== courseId)
      : [...bookmarkedCourses, courseId];
    setBookmarkedCourses(updated);
    localStorage.setItem('bookmarkedCourses', JSON.stringify(updated));
  };

  // Get dynamic course progress from API-loaded data
  const getCourseProgress = (courseId: string) => {
    const c = courses.find(c => c.id === courseId);
    return c?.progress || 0;
  };

  // Reset pagination on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [levelFilter, searchQuery, onlyBookmarked]);

  // Flashcards state
  const [cards, setCards] = useState(FLASHCARDS);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // Clipboard success state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter courses based on Search + Level + Bookmarks
  const filteredCourses = courses.filter((c: any) => {
    const matchesLevel = levelFilter === 'All' || c.level === levelFilter;
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBookmark = !onlyBookmarked || bookmarkedCourses.includes(c.id);
    return matchesLevel && matchesSearch && matchesBookmark;
  });

  // Pagination slicing
  const totalCourses = filteredCourses.length;
  const totalPages = Math.max(1, Math.ceil(totalCourses / pageSize));
  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const activeCourse = courses.find((c: any) => c.id === selectedCourseId);
  const courseLessons = lessons;
  const activeLesson = lessons.find((l: any) => l.id === activeLessonId);

  const handleCopyTemplate = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFlashcardReview = async (mastered: boolean) => {
    const card = flashcards[currentCardIndex];
    if (!card) return;
    try {
      const res = await apiFetch(`/api/student/flashcards/${card.id}/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mastered }),
      });
      setFlashcards(prev =>
        prev.map((c, idx) => (idx === currentCardIndex ? { ...c, mastered: res?.mastered ?? mastered } : c))
      );
      setIsCardFlipped(false);
      setTimeout(() => {
        setCurrentCardIndex((prev) => (prev + 1) % Math.max(1, flashcards.length));
      }, 200);
    } catch {
      alert('Failed to update flashcard state. Please try again.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      {/* Tab bar header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-gray-800/40 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Academic Learning Centre</h1>
          <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Master core grammars, practice collocations, and review high-scoring templates.
          </p>
        </div>
        <div className="flex gap-1.5 p-1 rounded-xl bg-gray-950/20 border border-white/5 overflow-x-auto max-w-full">
          {[
            { id: 'courses', label: 'Courses', icon: BookOpen },
            { id: 'templates', label: 'Templates', icon: FileText },
            { id: 'flashcards', label: 'Flashcards', icon: RotateCw },
            { id: 'tips', label: 'Exam Tips', icon: Sparkles },
            { id: 'plan', label: 'Study Plan', icon: Award }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setSelectedCourseId(null);
                setActiveLessonId(null);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-emerald-500 text-white shadow'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. COURSES AND LESSONS WORKFLOW */}
      {activeTab === 'courses' && (
        <div>
          {!selectedCourseId ? (
            /* Courses List */
            <div className="space-y-6">
              {/* Filter and Search Bar */}
              <div className={`p-4 rounded-2xl border flex flex-col md:flex-row justify-between gap-4 items-start md:items-center ${
                theme === 'dark' ? 'bg-gray-900/10 border-gray-850' : 'bg-gray-50 border-gray-250 shadow-sm'
              }`}>
                {/* Search query */}
                <div className="relative w-full md:w-80">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-500" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search courses or topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                      theme === 'dark' ? 'bg-gray-950 border-gray-850 text-white' : 'bg-white border-gray-300 text-gray-950'
                    }`}
                  />
                </div>

                {/* Level selection & Bookmark filtering */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] font-mono font-bold uppercase text-gray-400 mr-1.5">Levels:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['All', 'Foundation', 'Intermediate', 'Target 79+'].map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setLevelFilter(lvl)}
                        className={`px-3 py-1 rounded-lg text-[10px] font-mono tracking-wider transition-all border cursor-pointer ${
                          levelFilter === lvl
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 font-bold'
                            : theme === 'dark' ? 'border-gray-800 bg-gray-950/20 text-gray-400 hover:bg-gray-900' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>

                  {/* Bookmark filter toggle */}
                  <button
                    onClick={() => setOnlyBookmarked(!onlyBookmarked)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-mono tracking-wider transition-all border flex items-center gap-1 cursor-pointer ${
                      onlyBookmarked
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 font-bold'
                        : theme === 'dark' ? 'border-gray-800 bg-gray-950/20 text-gray-400 hover:bg-gray-900' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Star className={`w-3 h-3 ${onlyBookmarked ? 'fill-amber-400' : ''}`} /> Bookmarked Only
                  </button>
                </div>
              </div>

              {paginatedCourses.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-gray-800 rounded-3xl">
                  <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-sm font-semibold">No Courses Found</p>
                  <p className="text-xs text-gray-500 mt-1">Try adjusting your filters or search terms.</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-3 gap-8">
                  {paginatedCourses.map((c) => {
                    const isBookmarked = bookmarkedCourses.includes(c.id);
                    const dynamicProgress = getCourseProgress(c.id);
                    const isLocked = c.level === 'Target 79+' && user?.subTier !== 'premium' && role === 'student';
                    return (
                      <div
                        key={c.id}
                        onClick={() => {
                          if (isLocked) {
                            setShowUpgradeModal(true);
                          } else {
                            setSelectedCourseId(c.id);
                            setActiveLessonId(null);
                          }
                        }}
                        className={`rounded-2xl overflow-hidden border cursor-pointer hover:scale-[1.01] transition-all flex flex-col justify-between relative group ${
                          isLocked
                            ? 'opacity-85 border-amber-500/20 bg-gray-950/20'
                            : theme === 'dark' ? 'bg-gray-900/30 border-gray-850 hover:border-emerald-500/30' : 'bg-white border-gray-200 hover:border-emerald-400 shadow-sm'
                        }`}
                      >
                        {/* Bookmark badge trigger */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isLocked) {
                              setShowUpgradeModal(true);
                            } else {
                              toggleCourseBookmark(c.id, e);
                            }
                          }}
                          className="absolute top-3 right-3 p-1.5 rounded-lg bg-gray-950/80 hover:bg-gray-950 text-amber-400 transition-all border border-white/5 z-10 cursor-pointer"
                        >
                          <Star className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-400' : 'text-gray-400'}`} />
                        </button>

                        <div>
                          <div className="relative h-40 w-full overflow-hidden border-b border-gray-800/40">
                            <img referrerPolicy="no-referrer" src={c.image} alt={c.title} className="h-full w-full object-cover" />
                            {isLocked && (
                              <div className="absolute inset-0 bg-gray-950/75 backdrop-blur-[1px] flex flex-col items-center justify-center text-amber-400 font-mono text-[10px] font-bold gap-1.5">
                                <Lock className="w-5 h-5 text-amber-400 animate-bounce" />
                                <span>UPGRADE TO UNLOCK</span>
                              </div>
                            )}
                          </div>
                          <div className="p-6">
                            <div className="flex justify-between items-center">
                              <span className={`text-[9px] font-mono tracking-wider px-2.5 py-1 rounded-full uppercase font-bold ${
                                isLocked ? 'bg-amber-500/10 text-amber-400 font-bold' : 'bg-emerald-500/10 text-emerald-400 font-bold'
                              }`}>
                                {c.level}
                              </span>
                              {isLocked && (
                                <span className="text-[9px] font-bold font-mono text-amber-400 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded">
                                  PRO FEATURE ✨
                                </span>
                              )}
                            </div>
                            <h3 className="text-lg font-bold mt-3 mb-2">{c.title}</h3>
                            <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{c.description}</p>
                          </div>
                        </div>
                        <div className={`px-6 py-4 border-t flex justify-between items-center text-xs font-mono ${theme === 'dark' ? 'border-gray-850 text-gray-500' : 'border-gray-100 text-gray-400'}`}>
                          <span>{c.lessonsCount} lessons</span>
                          <span className={`${dynamicProgress > 0 ? 'text-emerald-400 font-bold' : ''}`}>{dynamicProgress}% completed</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination indicators */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center pt-4 border-t border-gray-800/20">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    className="px-3.5 py-1.5 rounded-xl text-xs bg-gray-900 text-gray-400 border border-gray-850 hover:text-white disabled:opacity-40 transition-all cursor-pointer flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Previous Page
                  </button>
                  <span className="text-xs font-mono text-gray-500">
                    Page {currentPage} of {totalPages} ({totalCourses} total)
                  </span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className="px-3.5 py-1.5 rounded-xl text-xs bg-gray-900 text-gray-400 border border-gray-850 hover:text-white disabled:opacity-40 transition-all cursor-pointer flex items-center gap-1"
                  >
                    Next Page <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ) : !activeLessonId ? (
            /* Lessons Directory Inside Course */
            <div className="space-y-6">
              <button
                onClick={() => setSelectedCourseId(null)}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-emerald-400 font-semibold cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Back to courses
              </button>
              <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-1/3 space-y-4">
                  <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-gray-900/30 border-gray-850' : 'bg-white border-gray-200'}`}>
                    <span className="text-[10px] font-mono tracking-wider bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded uppercase font-bold">{activeCourse?.level}</span>
                    <h2 className="text-xl font-bold mt-3">{activeCourse?.title}</h2>
                    <p className={`text-xs mt-2 leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{activeCourse?.description}</p>
                    <div className="mt-4 pt-4 border-t border-gray-800/40">
                      <p className="text-[10px] font-mono text-gray-500 uppercase">COURSE PROGRESS</p>
                      <p className="text-lg font-black font-mono text-emerald-400 mt-0.5">
                        {getCourseProgress(activeCourse?.id || '')}%
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest font-mono text-gray-400">Course Lessons Syllabus</h3>
                  <div className="space-y-3">
                    {courseLessons.map((l, index) => {
                      const isComplete = completedLessons.includes(l.id);
                      return (
                        <div
                          key={l.id}
                          onClick={() => setActiveLessonId(l.id)}
                          className={`p-4 rounded-xl border flex justify-between items-center cursor-pointer hover:border-emerald-500/40 transition-all ${
                            theme === 'dark' ? 'bg-gray-900/20 border-gray-850' : 'bg-white border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold ${
                              isComplete ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-850 text-gray-400'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold">{l.title}</h4>
                              <span className="text-[10px] text-gray-500 font-mono">{l.duration}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleToggleLesson(l.id)}
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                isComplete
                                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                                  : 'border-gray-800 text-gray-500 hover:text-emerald-400'
                              }`}
                              title={isComplete ? 'Mark Incomplete' : 'Mark Completed'}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <Video className="w-5 h-5 text-gray-500 flex-shrink-0" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Selected Interactive Lesson Player */
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setActiveLessonId(null)}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-emerald-400 font-semibold cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Back to lessons list
                </button>

                {/* Mark lesson completed button */}
                <button
                  onClick={() => handleToggleLesson(activeLesson?.id || '')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    completedLessons.includes(activeLesson?.id || '')
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : 'border-gray-800 bg-gray-950/20 text-gray-400 hover:text-emerald-400'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  {completedLessons.includes(activeLesson?.id || '') ? 'Completed' : 'Mark Completed'}
                </button>
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                {/* Left panel: Video player and rich reading content */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Video Player Frame */}
                  <div className="aspect-video bg-black rounded-3xl overflow-hidden border border-gray-800 relative group flex items-center justify-center">
                    <video
                      controls
                      src={activeLesson?.videoUrl}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Lesson Transcript / Materials */}
                  <div className={`p-6 rounded-3xl border space-y-4 ${theme === 'dark' ? 'bg-gray-900/20 border-gray-850' : 'bg-white border-gray-200 shadow-sm'}`}>
                    <h2 className="text-xl font-bold tracking-tight">{activeLesson?.title}</h2>
                    <div className={`text-xs leading-relaxed space-y-4 whitespace-pre-line ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {activeLesson?.content}
                    </div>
                  </div>
                </div>

                {/* Right panel: Grammar rules, checklist & Notes taking */}
                <div className="space-y-6">
                  {/* Grammar Rules */}
                  <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-gray-900/20 border-gray-850' : 'bg-white border-gray-200'}`}>
                    <h3 className="text-sm font-bold uppercase tracking-widest font-mono text-gray-400 mb-4 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-emerald-400" /> Key Grammar Guidelines
                    </h3>
                    <ul className="space-y-3">
                      {activeLesson?.grammarRules?.map((rule, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs">
                          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Dynamic Notes Section */}
                  <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-gray-900/20 border-gray-850' : 'bg-white border-gray-200'}`}>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-xs font-bold uppercase tracking-widest font-mono text-gray-400 flex items-center gap-1.5">
                        <FileEdit className="w-4 h-4 text-emerald-400" /> Lesson Study Notes
                      </h3>
                    </div>
                     <textarea
                      rows={8}
                      placeholder="Type your study notes here..."
                      value={currentNote}
                      onChange={(e) => setCurrentNote(e.target.value)}
                      className={`w-full p-3 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 ${
                        theme === 'dark' ? 'bg-gray-950 border-gray-850 text-gray-300' : 'bg-white border-gray-300 text-gray-850'
                      }`}
                    />
                    <p className="text-[10px] text-gray-500 font-mono mt-1.5">Notes are stored locally for this session.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. PRE-APPROVED TEMPLATES CHEAT SHEET */}
      {activeTab === 'templates' && (
        <div className="space-y-8 max-w-4xl mx-auto">
          <div className="text-center">
            <h2 className="text-xl font-bold">Standardized 90/90 Structural Templates</h2>
            <p className="text-xs text-gray-400 mt-1">Pre-tested templates optimized for key vocabulary density and phonetic grading parameters.</p>
          </div>

          <div className="space-y-6">
            {[
              {
                id: 'T-01',
                task: 'Write Essay (WE)',
                title: 'Persuasive Academic Model',
                instructions: 'Use this 4-paragraph layout. Insert your specific thesis in the brackets.',
                text: 'In the contemporary era, the rapid acceleration of [Topic] has initiated a rigorous debate regarding [Subject]. While skeptics argue that [Opposite point], proponents contend that [Your point]. In my view, [Thesis].\n\nOn the one hand, critics are justified in their anxiety regarding [Issue]. For instance, [Real world example]. Consequently, [Resulting effect].\n\nOn the other hand, proponents highlight the favorable ramifications. To illustrate, [Positive example]. Ultimately, [Positive conclusion].\n\nIn conclusion, despite the tangible hurdles, [Restate thesis]. It is anticipated that [Future prediction].'
              },
              {
                id: 'T-02',
                task: 'Describe Image (DI)',
                title: 'The Universal Graph/Map Layout',
                instructions: 'Focus on oral fluency. Speak continuously for 35 seconds without structural self-correction.',
                text: 'This beautiful illustration presents the detailed distribution of [Topic] represented across various data coordinates.\n\nThe dominant share is held by [Highest Category] at approximately [Highest Value], followed by [Second Category] which exhibits a steady trend. In sharp contrast, [Lowest Category] occupies the minimal portion of the overall statistics.\n\nIn conclusion, it is highly apparent that the figures present a significant momentum regarding [Trend Keyword].'
              },
              {
                id: 'T-03',
                task: 'Retell Lecture (RL)',
                title: 'Oral Summarizer Frame',
                instructions: 'Incorporate 5-6 academic noun phrases extracted during the lecture playback.',
                text: 'The speaker in this academic presentation discussed the primary concepts surrounding [Topic].\n\nFirstly, she highlighted the critical importance of [Noun phrase 1] and how it relates to [Noun phrase 2]. Furthermore, the lecture emphasized [Noun phrase 3] as a primary factor.\n\nIn addition, the presenter discussed the core ramifications of [Noun phrase 4] and [Noun phrase 5].\n\nUltimately, the lecture provides a sophisticated overview of [Topic], emphasizing that [Final summary keyword].'
              }
            ].map((tmpl) => (
              <div key={tmpl.id} className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-gray-900/30 border-gray-850' : 'bg-white border-gray-200'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[9px] font-mono tracking-wider bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase">{tmpl.task}</span>
                    <h3 className="text-sm font-bold mt-1.5">{tmpl.title}</h3>
                    <p className="text-[10px] text-gray-500 mt-0.5">{tmpl.instructions}</p>
                  </div>
                  <button
                    onClick={() => handleCopyTemplate(tmpl.text, tmpl.id)}
                    className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500 hover:text-white transition-all cursor-pointer"
                  >
                    {copiedId === tmpl.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <pre className={`p-4 rounded-xl text-xs font-mono whitespace-pre-wrap leading-relaxed ${theme === 'dark' ? 'bg-gray-950 text-gray-300' : 'bg-gray-100 text-gray-800'}`}>
                  {tmpl.text}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. DYNAMIC FLASHCARDS MODULE */}
      {activeTab === 'flashcards' && (
        <div className="space-y-8 max-w-md mx-auto py-4">
          <div className="text-center">
            <h2 className="text-xl font-bold">Collocation & Vocabulary Cards</h2>
            <p className="text-xs text-gray-400 mt-1">Flip the card to review meanings, then mark mastered to filter your pile.</p>
          </div>

          {!flashcards || flashcards.length === 0 || !flashcards[currentCardIndex] ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-sm">No flashcards available yet.</p>
            </div>
          ) : (
            <>
              <div
                className="h-64 cursor-pointer relative select-none perspective-1000"
                onClick={() => setIsCardFlipped(!isCardFlipped)}
              >
                <div className={`w-full h-full duration-500 transform-style-3d relative ${isCardFlipped ? 'rotate-y-180' : ''}`}>
                  <div className={`absolute inset-0 backface-hidden rounded-3xl border-2 p-8 flex flex-col justify-between shadow-lg ${
                    theme === 'dark' ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
                  }`}>
                    <span className="text-[9px] font-mono tracking-widest text-emerald-400 uppercase">{flashcards[currentCardIndex].category}</span>
                    <div className="text-center">
                      <h3 className="text-2xl font-black font-sans leading-none tracking-tight">{flashcards[currentCardIndex].front}</h3>
                      <p className="text-[10px] text-gray-500 font-mono mt-4">TAP TO FLIP</p>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono">
                      <span>Card {currentCardIndex + 1} of {flashcards.length}</span>
                      <span>{flashcards[currentCardIndex].mastered ? '★ MASTERED' : '☆ STUDYING'}</span>
                    </div>
                  </div>
                  <div className={`absolute inset-0 backface-hidden rotate-y-180 rounded-3xl border-2 p-8 flex flex-col justify-between shadow-lg ${
                    theme === 'dark' ? 'bg-gray-950 border-emerald-500/40 text-gray-100' : 'bg-emerald-50/20 border-emerald-400 text-gray-900'
                  }`}>
                    <span className="text-[9px] font-mono tracking-widest text-emerald-400 uppercase">MEANING</span>
                    <div className="text-center">
                      <p className="text-sm leading-relaxed font-medium">{flashcards[currentCardIndex].back}</p>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono">
                      <span>TAP TO FLIP BACK</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-4 justify-center">
                <button onClick={() => handleFlashcardReview(false)} className="px-6 py-2.5 rounded-xl text-xs font-semibold border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all cursor-pointer">Needs Study</button>
                <button onClick={() => handleFlashcardReview(true)} className="px-6 py-2.5 rounded-xl text-xs font-semibold border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all cursor-pointer">Mastered ★</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* 4. EXAM TIPS */}
      {activeTab === 'tips' && (
        <div className="space-y-8 max-w-4xl mx-auto">
          <div className="text-center">
            <h2 className="text-xl font-bold">PTE Exam Strategy Tips</h2>
            <p className="text-xs text-gray-400 mt-1">Practice strategies and common preparation guidance for PTE tasks.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: 'Fluency is King in Speaking',
                desc: 'Smooth, natural speech flow is important for speaking tasks. If you stutter or self-correct frequently, your fluency may be affected. Practice speaking in standard rhythmic chunks.'
              },
              {
                title: 'The Written SWT Singular Sentence Constraint',
                desc: 'In Summarize Written Text, you MUST write exactly ONE single sentence. If you write multiple sentences, or fail to place exactly one full stop at the end, your entire SWT score registers as zero. Use subordinate clauses instead.'
              },
              {
                title: 'High-Weight Focus on Write From Dictation',
                desc: 'Write From Dictation is important across both Listening and Writing. Spell every word correctly. Practice with sample dictation exercises to build accuracy.'
              },
              {
                title: 'Microphone Technique and Vocal Clarity',
                desc: 'Practice with steady volume and distance from your microphone. Recording quality may affect playback and review. Speak from the chest and maintain consistent vocal pitch for clearer audio capture.'
              }
            ].map((tip, idx) => (
              <div key={idx} className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-gray-900/30 border-gray-850' : 'bg-white border-gray-200'}`}>
                <h3 className="text-sm font-bold text-emerald-400 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 flex-shrink-0" /> {tip.title}
                </h3>
                <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{tip.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. STUDY PLAN */}
      {activeTab === 'plan' && (
        <div className="space-y-6 max-w-3xl mx-auto">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Your Study Plan</h2>
            {learningOverview && (
              <span className="text-xs text-gray-400">{learningOverview.completedLessons} lessons, {learningOverview.masteredFlashcards} cards mastered</span>
            )}
          </div>

          {planLoading && <p className="text-center text-gray-400 py-12">Loading your study plan...</p>}
          {planError && (
            <div className="text-center py-8">
              <p className="text-red-400 text-sm">{planError}</p>
              <button onClick={loadStudyPlan} className="mt-3 px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-semibold">Retry</button>
            </div>
          )}

          {studyPlan && !planLoading && (
            <>
              {studyPlan.isFallback && (
                <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-xs text-amber-400">
                  Starter plan based on incomplete activity data. Complete practice submissions and mock tests for a personalised plan.
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                {/* Daily Tasks */}
                <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-gray-900/30 border-gray-850' : 'bg-white border-gray-200'}`}>
                  <h3 className="text-sm font-bold text-emerald-400 mb-3">Today's Tasks</h3>
                  {studyPlan.dailyTasks?.length > 0 ? studyPlan.dailyTasks.map((t: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 py-2 border-b border-gray-800/30 last:border-0">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${t.priority === 'high' ? 'bg-red-500/10 text-red-400' : t.priority === 'medium' ? 'bg-amber-500/10 text-amber-400' : 'bg-gray-500/10 text-gray-400'}`}>{t.priority}</span>
                      <div className="text-xs">
                        <p className="font-semibold">{t.title}</p>
                        <p className="text-gray-500 text-[10px]">{t.reason}</p>
                      </div>
                    </div>
                  )) : <p className="text-xs text-gray-500">No tasks yet. Generate a plan.</p>}
                </div>

                {/* Weak Areas */}
                <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-gray-900/30 border-gray-850' : 'bg-white border-gray-200'}`}>
                  <h3 className="text-sm font-bold text-emerald-400 mb-3">Weak Areas</h3>
                  {studyPlan.weakAreas?.map((w: any, i: number) => (
                    <div key={i} className="py-2 border-b border-gray-800/30 last:border-0">
                      <p className="text-xs font-semibold">{w.section}</p>
                      <p className="text-gray-500 text-[10px]">{w.message}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {w.suggestedTasks?.slice(0, 3).map((t: string, j: number) => (
                          <span key={j} className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">{t}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>Based on {studyPlan.sourceData?.totalSubmissions || 0} submissions, {studyPlan.sourceData?.totalTests || 0} tests, {studyPlan.sourceData?.completedLessons || 0} lessons</span>
                <span>Generated {new Date(studyPlan.generatedAt).toLocaleDateString()}</span>
              </div>

              {/* Weekly Plan */}
              {studyPlan.weeklyPlan && studyPlan.weeklyPlan.length > 0 && (
                <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-gray-900/30 border-gray-850' : 'bg-white border-gray-200'}`}>
                  <h3 className="text-sm font-bold text-emerald-400 mb-3">Weekly Plan</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                    {studyPlan.weeklyPlan.map((d: any, i: number) => (
                      <div key={i} className={`p-3 rounded-xl border text-center ${theme === 'dark' ? 'bg-gray-950/60 border-gray-850' : 'bg-gray-50 border-gray-200'}`}>
                        <span className="text-[10px] font-bold text-gray-500">{d.day}</span>
                        {d.tasks?.map((t: any, j: number) => (
                          <div key={j} className="mt-1">
                            <p className="text-[9px] font-semibold leading-tight">{t.title?.substring(0, 25) || 'Task'}</p>
                            <span className={`text-[8px] ${t.priority === 'high' ? 'text-red-400' : t.priority === 'medium' ? 'text-amber-400' : 'text-gray-500'}`}>{t.priority}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-center">
                <button
                  onClick={async () => {
                    setPlanLoading(true);
                    setPlanError('');
                    try {
                      const plan = await apiFetch('/api/student/study-plan/regenerate', { method: 'POST' });
                      setStudyPlan(plan);
                    } catch {
                      setPlanError('Failed to regenerate study plan. Please try again.');
                    } finally { setPlanLoading(false); }
                  }}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold transition-all"
                >
                  Regenerate Plan
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Upgrade Premium Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg overflow-hidden border rounded-3xl bg-[#0f1322] border-gray-850 p-6 sm:p-8 space-y-6 shadow-2xl text-white">
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-900/60"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center mx-auto border border-amber-500/20">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-extrabold tracking-tight">Unlock Advanced PTE Prep</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Courses targetting PTE Band scores of <span className="font-bold text-emerald-400">79+ (C1/C2 IELTS equivalent)</span> require a Premium subscription license.
              </p>
            </div>

            <div className="space-y-3.5">
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider font-bold">UPGRADING TO PREMIUM UNLOCKS:</p>
              <div className="space-y-2 text-xs">
                {[
                  '20+ Comprehensive Courses and 50+ Practice Lessons',
                  'Real-Sim Mock Exam Engine with interactive grading',
                  'Practice-ready scoring preparation guides',
                  'Unlimited practice submissions with immediate teacher evaluations',
                ].map((feat, idx) => (
                  <div key={idx} className="flex gap-2.5 items-start">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-gray-300">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-gray-850 flex flex-col gap-2">
              <button
                onClick={() => {
                  setShowUpgradeModal(false);
                  alert('Please navigate to the "Premium ✨" tab in the top navigation bar to complete checkout!');
                }}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-xs font-bold transition-all text-center cursor-pointer shadow-lg shadow-emerald-500/10"
              >
                View Pricing & Plans ✨
              </button>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="w-full py-2 bg-gray-900 border border-gray-800 hover:bg-gray-850 text-gray-400 hover:text-white rounded-xl text-xs font-bold transition-all"
              >
                Keep Browsing Foundation courses
              </button>
            </div>
            </div>
        </div>
      )}
    </div>
  );
};
