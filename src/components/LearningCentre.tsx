/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useGlobalContext } from './ThemeContext';
import { COURSES, LESSONS, FLASHCARDS } from '../data/mockData';
import { BookOpen, Video, FileText, Sparkles, Filter, CheckCircle, ChevronLeft, ChevronRight, Copy, Check, RotateCw, Award } from 'lucide-react';
import { motion } from 'motion/react';

export const LearningCentre: React.FC = () => {
  const { theme } = useGlobalContext();
  const [activeTab, setActiveTab] = useState<'courses' | 'templates' | 'flashcards' | 'tips'>('courses');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<string>('All');

  // Flashcards state
  const [cards, setCards] = useState(FLASHCARDS);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // Clipboard success state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredCourses = levelFilter === 'All'
    ? COURSES
    : COURSES.filter((c) => c.level === levelFilter);

  const activeCourse = COURSES.find((c) => c.id === selectedCourseId);
  const courseLessons = LESSONS.filter((l) => l.courseId === selectedCourseId);
  const activeLesson = LESSONS.find((l) => l.id === activeLessonId);

  const handleCopyTemplate = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFlashcardReview = (mastered: boolean) => {
    setCards((prev) =>
      prev.map((c, idx) => {
        if (idx === currentCardIndex) {
          return { ...c, mastered: mastered };
        }
        return c;
      })
    );
    setIsCardFlipped(false);
    setTimeout(() => {
      setCurrentCardIndex((prev) => (prev + 1) % cards.length);
    }, 200);
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
            { id: 'tips', label: 'AI Tips', icon: Sparkles }
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
              <div className="flex items-center gap-2.5">
                <Filter className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono font-bold uppercase text-gray-400">Level Filter:</span>
                <div className="flex gap-2">
                  {['All', 'Foundation', 'Intermediate', 'Target 79+'].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setLevelFilter(lvl)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-mono tracking-wider transition-all border ${
                        levelFilter === lvl
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 font-bold'
                          : 'border-gray-800 bg-gray-950/20 text-gray-400 hover:bg-gray-900'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {filteredCourses.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setSelectedCourseId(c.id);
                      setActiveLessonId(null);
                    }}
                    className={`rounded-2xl overflow-hidden border cursor-pointer hover:scale-[1.01] transition-all flex flex-col justify-between ${
                      theme === 'dark' ? 'bg-gray-900/30 border-gray-850 hover:border-emerald-500/30' : 'bg-white border-gray-200 hover:border-emerald-400'
                    }`}
                  >
                    <div>
                      <img referrerPolicy="no-referrer" src={c.image} alt={c.title} className="h-40 w-full object-cover border-b border-gray-800/40" />
                      <div className="p-6">
                        <span className="text-[9px] font-mono tracking-wider bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full uppercase font-bold">
                          {c.level}
                        </span>
                        <h3 className="text-lg font-bold mt-3 mb-2">{c.title}</h3>
                        <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{c.description}</p>
                      </div>
                    </div>
                    <div className={`px-6 py-4 border-t flex justify-between items-center text-xs font-mono ${theme === 'dark' ? 'border-gray-850 text-gray-500' : 'border-gray-100 text-gray-400'}`}>
                      <span>{c.lessonsCount} lessons</span>
                      <span className="text-emerald-400 font-bold">{c.progress}% completed</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : !activeLessonId ? (
            /* Lessons Directory Inside Course */
            <div className="space-y-6">
              <button
                onClick={() => setSelectedCourseId(null)}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-emerald-400 font-semibold"
              >
                <ChevronLeft className="w-4 h-4" /> Back to courses
              </button>
              <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-1/3 space-y-4">
                  <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-gray-900/30 border-gray-850' : 'bg-white border-gray-200'}`}>
                    <span className="text-[10px] font-mono tracking-wider bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded uppercase font-bold">{activeCourse?.level}</span>
                    <h2 className="text-xl font-bold mt-3">{activeCourse?.title}</h2>
                    <p className={`text-xs mt-2 leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{activeCourse?.description}</p>
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest font-mono text-gray-400">Course Lessons Syllabus</h3>
                  <div className="space-y-3">
                    {courseLessons.map((l, index) => (
                      <div
                        key={l.id}
                        onClick={() => setActiveLessonId(l.id)}
                        className={`p-4 rounded-xl border flex justify-between items-center cursor-pointer hover:border-emerald-500/40 transition-all ${
                          theme === 'dark' ? 'bg-gray-900/20 border-gray-850' : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold ${
                            l.completed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-850 text-gray-400'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold">{l.title}</h4>
                            <span className="text-[10px] text-gray-500 font-mono">{l.duration}</span>
                          </div>
                        </div>
                        {l.completed ? (
                          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <Video className="w-5 h-5 text-gray-500 flex-shrink-0 hover:text-emerald-400" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Selected Interactive Lesson Player */
            <div className="space-y-6">
              <button
                onClick={() => setActiveLessonId(null)}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-emerald-400 font-semibold"
              >
                <ChevronLeft className="w-4 h-4" /> Back to lessons list
              </button>

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
                  <div className={`p-6 rounded-3xl border space-y-4 ${theme === 'dark' ? 'bg-gray-900/20 border-gray-850' : 'bg-white border-gray-200'}`}>
                    <h2 className="text-xl font-bold tracking-tight">{activeLesson?.title}</h2>
                    <div className={`text-xs leading-relaxed space-y-4 whitespace-pre-line ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {activeLesson?.content}
                    </div>
                  </div>
                </div>

                {/* Right panel: Grammar rules checklists and quick tasks */}
                <div className="space-y-6">
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

          {/* Core CSS Flip Card container */}
          <div
            className="h-64 cursor-pointer relative select-none perspective-1000"
            onClick={() => setIsCardFlipped(!isCardFlipped)}
          >
            <div
              className={`w-full h-full duration-500 transform-style-3d relative ${
                isCardFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* Front side */}
              <div className={`absolute inset-0 backface-hidden rounded-3xl border-2 p-8 flex flex-col justify-between shadow-lg ${
                theme === 'dark' ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'
              }`}>
                <span className="text-[9px] font-mono tracking-widest text-emerald-400 uppercase">{cards[currentCardIndex].category}</span>
                <div className="text-center">
                  <h3 className="text-2xl font-black font-sans leading-none tracking-tight">{cards[currentCardIndex].front}</h3>
                  <p className="text-[10px] text-gray-500 font-mono mt-4">TAP TO FLIP</p>
                </div>
                <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono">
                  <span>Card {currentCardIndex + 1} of {cards.length}</span>
                  <span>{cards[currentCardIndex].mastered ? '★ MASTERED' : '☆ STUDYING'}</span>
                </div>
              </div>

              {/* Back side */}
              <div className={`absolute inset-0 backface-hidden rotate-y-180 rounded-3xl border-2 p-8 flex flex-col justify-between shadow-lg ${
                theme === 'dark' ? 'bg-gray-950 border-emerald-500/40 text-gray-100' : 'bg-emerald-50/20 border-emerald-400 text-gray-900'
              }`}>
                <span className="text-[9px] font-mono tracking-widest text-emerald-400 uppercase">MEANING</span>
                <div className="text-center">
                  <p className="text-sm leading-relaxed font-medium">{cards[currentCardIndex].back}</p>
                </div>
                <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono">
                  <span>TAP TO FLIP BACK</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => handleFlashcardReview(false)}
              className="px-6 py-2.5 rounded-xl text-xs font-semibold border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
            >
              Needs Study
            </button>
            <button
              onClick={() => handleFlashcardReview(true)}
              className="px-6 py-2.5 rounded-xl text-xs font-semibold border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all cursor-pointer"
            >
              Mastered ★
            </button>
          </div>
        </div>
      )}

      {/* 4. AI TIPS */}
      {activeTab === 'tips' && (
        <div className="space-y-8 max-w-4xl mx-auto">
          <div className="text-center">
            <h2 className="text-xl font-bold">Acoustic & Semantic AI Grading Tips</h2>
            <p className="text-xs text-gray-400 mt-1">Direct scoring factors of Pearson computerized assessment systems.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: 'Fluency is King in Speaking',
                desc: 'Pearson AI rewards continuous, smooth, natural speech flow over hyper-accurate pronunciation. If you stutter, double-back, or self-correct, your Oral Fluency scores degrade instantly. Speak with standard rhythmic chunks.'
              },
              {
                title: 'The Written SWT Singular Sentence Constraint',
                desc: 'In Summarize Written Text, you MUST write exactly ONE single sentence. If you write multiple sentences, or fail to place exactly one full stop at the end, your entire SWT score registers as zero. Use subordinate clauses instead.'
              },
              {
                title: 'High-Weight Focus on Write From Dictation',
                desc: 'Write From Dictation is heavily weighted across both Listening and Writing. Spell every word correctly. If you are unsure of a plural (e.g., "libraries" vs "library"), write both side-by-side; the Pearson machine rewards the match without penalizing the redundant word.'
              },
              {
                title: 'Pitch Stabilization for Women',
                desc: 'Many high-pitched voices (especially female non-native speakers) register poorly on low-quality exam mics, causing the AI algorithm to drop consonants. Stabilize your vocal pitch, speak from the chest, and keep a steady distance from your mic.'
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
    </div>
  );
};
