/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useGlobalContext } from './ThemeContext';
import { MOCK_TESTS, TEST_ATTEMPTS } from '../data/mockData';
import { MockTest, TestAttempt } from '../types';
import { Play, Pause, Save, CheckCircle, Clock, AlertCircle, RefreshCw, ChevronRight, Activity, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MockTestEngineProps {
  onNavigateReport: () => void;
}

export const MockTestEngine: React.FC<MockTestEngineProps> = ({ onNavigateReport }) => {
  const { theme } = useGlobalContext();
  const [activeTest, setActiveTest] = useState<MockTest | null>(null);
  const [testState, setTestState] = useState<'idle' | 'running' | 'paused' | 'review'>('idle');
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [activeTab, setActiveTab] = useState<'available' | 'history'>('available');

  const [testHistory, setTestHistory] = useState<TestAttempt[]>(TEST_ATTEMPTS);

  // Countdown timer
  useEffect(() => {
    let timerId: NodeJS.Timeout;
    if (testState === 'running' && secondsRemaining > 0) {
      timerId = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerId);
            setTestState('review');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [testState, secondsRemaining]);

  const handleStartTest = (test: MockTest) => {
    setActiveTest(test);
    setSecondsRemaining(test.duration * 60);
    setTestState('running');
    setCurrentQuestionIndex(0);
    setAnswers({});
  };

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs > 0 ? hrs + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePauseTest = () => {
    setTestState('paused');
  };

  const handleResumeTest = () => {
    setTestState('running');
  };

  const handleSubmitMockTest = () => {
    if (!activeTest) return;
    setTestState('idle');

    // Add simulated test attempt to history
    const score = Math.floor(Math.random() * 20) + 68; // Random score 68-88
    const newAttempt: TestAttempt = {
      id: `A-MOCK-${Date.now()}`,
      testId: activeTest.id,
      title: activeTest.title,
      type: activeTest.type,
      date: new Date().toISOString().split('T')[0],
      overallScore: score,
      speakingScore: Math.min(score + Math.floor(Math.random() * 5), 90),
      writingScore: Math.min(score - Math.floor(Math.random() * 3), 90),
      readingScore: Math.min(score + Math.floor(Math.random() * 4), 90),
      listeningScore: Math.min(score - Math.floor(Math.random() * 5), 90),
      status: 'Completed'
    };

    setTestHistory((prev) => [newAttempt, ...prev]);
    setActiveTest(null);
    onNavigateReport();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      {/* Dynamic layout depending on active running test status */}
      {testState === 'idle' ? (
        <div className="space-y-8">
          {/* Header section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-800/40 pb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">PTE Computerized Mock Exams</h1>
              <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Simulate Pearson environments precisely with adaptive, multi-section timing locks.
              </p>
            </div>
            <div className="flex gap-1.5 p-1 rounded-xl bg-gray-950/20 border border-white/5">
              <button
                onClick={() => setActiveTab('available')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap transition-all ${
                  activeTab === 'available' ? 'bg-emerald-500 text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                Available Tests
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap transition-all ${
                  activeTab === 'history' ? 'bg-emerald-500 text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                Exam History ({testHistory.length})
              </button>
            </div>
          </div>

          {/* Tab 1: Available Mock list */}
          {activeTab === 'available' && (
            <div className="grid md:grid-cols-3 gap-8">
              {MOCK_TESTS.map((test) => (
                <div
                  key={test.id}
                  className={`p-6 rounded-2xl border flex flex-col justify-between ${
                    theme === 'dark' ? 'bg-gray-900/30 border-gray-850' : 'bg-white border-gray-200'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <span className={`text-[9px] font-mono tracking-widest px-2.5 py-1 rounded-full uppercase font-bold ${
                        test.type === 'full' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-teal-500/10 text-teal-400'
                      }`}>
                        {test.type} Mock Exam
                      </span>
                      <span className="text-xs font-mono text-gray-500">{test.difficulty}</span>
                    </div>
                    <h3 className="text-sm font-bold mb-2">{test.title}</h3>
                    <p className={`text-xs leading-relaxed mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Simulates {test.questionsCount} consecutive Pearson-academic task formats with {test.duration} minutes of continuous timed pacing.
                    </p>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-850 pt-4 mt-4">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 font-mono">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" /> {test.duration} mins
                    </div>
                    <button
                      onClick={() => handleStartTest(test)}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      Start Test <Play className="w-3 h-3 fill-white" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 2: Test attempts list */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {testHistory.map((h) => (
                <div
                  key={h.id}
                  className={`p-5 rounded-2xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                    theme === 'dark' ? 'bg-gray-900/20 border-gray-850' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full font-bold uppercase">{h.type}</span>
                      <span className="text-xs text-gray-500 font-mono flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {h.date}</span>
                    </div>
                    <h4 className="text-sm font-bold">{h.title}</h4>
                    <div className="flex gap-4 text-[10px] text-gray-500 font-mono pt-2">
                      <span>Speaking: <strong className="text-emerald-400">{h.speakingScore}</strong></span>
                      <span>Writing: <strong className="text-emerald-400">{h.writingScore}</strong></span>
                      <span>Reading: <strong className="text-emerald-400">{h.readingScore}</strong></span>
                      <span>Listening: <strong className="text-emerald-400">{h.listeningScore}</strong></span>
                    </div>
                  </div>

                  <div className="text-center sm:text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto border-t sm:border-0 border-gray-850 pt-3 sm:pt-0">
                    <div>
                      <p className="text-[10px] font-mono text-gray-500">Overall PTE Mark</p>
                      <p className="text-2xl font-black text-emerald-400 font-mono">{h.overallScore}</p>
                    </div>
                    <button
                      onClick={onNavigateReport}
                      className="text-xs text-emerald-400 font-bold hover:underline mt-1 block"
                    >
                      View Full Analysis →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Immersive Exam Screen Layout */
        <div className="space-y-6">
          {/* Header bar controls */}
          <div className="flex justify-between items-center bg-gray-950/80 p-4 rounded-2xl border border-gray-800/60 shadow">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded uppercase">
                {activeTest?.title}
              </span>
              <span className="text-xs text-gray-400 font-mono hidden sm:inline">
                Question {currentQuestionIndex + 1} of {activeTest?.questionsCount}
              </span>
            </div>

            {/* Timers & Pause Toggles */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-red-400">
                <Clock className="w-4 h-4 animate-pulse" /> {formatTime(secondsRemaining)}
              </div>
              {testState === 'running' ? (
                <button
                  onClick={handlePauseTest}
                  className="p-2.5 bg-gray-900 border border-gray-850 rounded-xl hover:bg-gray-800 text-gray-300 transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                >
                  <Pause className="w-3.5 h-3.5 text-orange-500" /> Pause Exam
                </button>
              ) : (
                <button
                  onClick={handleResumeTest}
                  className="p-2.5 bg-emerald-500 rounded-xl hover:bg-emerald-600 text-white transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" /> Resume Exam
                </button>
              )}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {testState === 'paused' ? (
              /* Floating Pause Menu Drawer inside simulator container */
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-10 rounded-3xl border text-center space-y-6 bg-[#0f1322] border-orange-500/30 max-w-xl mx-auto`}
              >
                <div className="w-12 h-12 bg-orange-500/10 text-orange-400 rounded-full flex items-center justify-center mx-auto animate-pulse">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Mock Examination Suspended</h3>
                  <p className="text-xs text-gray-400 mt-1">Your response timers are locked. Resume to continue the practice segment.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={handleResumeTest}
                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Resume Exam session
                  </button>
                  <button
                    onClick={() => {
                      setTestState('idle');
                      setActiveTest(null);
                    }}
                    className="px-6 py-2.5 bg-red-500/15 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancel Session
                  </button>
                </div>
              </motion.div>
            ) : testState === 'review' ? (
              /* Question index review summary list before submitting */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`p-6 sm:p-8 rounded-3xl border space-y-6 ${theme === 'dark' ? 'bg-[#0f1322] border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}
              >
                <div className="text-center">
                  <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase bg-emerald-500/10 px-2.5 py-0.5 rounded font-bold">EXAM REVIEW SECTION</span>
                  <h3 className="text-lg font-bold mt-2">PTE Mock Session Summary</h3>
                  <p className="text-xs text-gray-400 mt-1">Please review your question answer list status prior to final grading submission.</p>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3.5 py-4 max-w-2xl mx-auto">
                  {Array.from({ length: activeTest?.questionsCount || 10 }).map((_, index) => {
                    const isAnswered = answers[index] !== undefined || index < 4; // Mock answer statuses
                    return (
                      <div
                        key={index}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          isAnswered
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 font-bold'
                            : 'border-gray-850 bg-gray-950/40 text-gray-400'
                        }`}
                      >
                        <p className="text-[10px] font-mono">Q{index + 1}</p>
                        <p className="text-[9px] uppercase font-mono mt-1 opacity-60">
                          {isAnswered ? 'Answer' : 'Blank'}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-center gap-4 pt-4 border-t border-gray-850">
                  <button
                    onClick={() => setTestState('running')}
                    className="px-6 py-2.5 bg-gray-800 text-gray-300 hover:bg-gray-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    ← Back to Questions
                  </button>
                  <button
                    onClick={handleSubmitMockTest}
                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow shadow-emerald-500/20 cursor-pointer"
                  >
                    Submit Exam for Scoring ✓
                  </button>
                </div>
              </motion.div>
            ) : (
              /* Selected question rendering */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`p-6 sm:p-8 rounded-3xl border ${theme === 'dark' ? 'bg-[#0e1220] border-gray-850' : 'bg-white border-gray-200'}`}
              >
                <div className="space-y-6">
                  <div>
                    <span className="text-[9px] font-mono tracking-widest text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 rounded font-bold">Question {currentQuestionIndex + 1} of {activeTest?.questionsCount}</span>
                    <h3 className="text-base font-bold mt-2">Write Essay: Economic Growth vs. Environmental Protection</h3>
                    <p className={`text-xs mt-2 leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Write a persuasive academic essay regarding the delicate balance between rapid economic development and environmental ecosystem safety. Recommend which parameter governments should prioritize. Write 200-300 words.
                    </p>
                  </div>

                  <textarea
                    rows={8}
                    value={answers[currentQuestionIndex] || ''}
                    onChange={(e) => setAnswers({ ...answers, [currentQuestionIndex]: e.target.value })}
                    placeholder="Type your exam essay response here..."
                    className={`w-full p-4 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:border-emerald-500 focus:ring-emerald-500 ${
                      theme === 'dark' ? 'bg-gray-950 border-gray-850 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />

                  {/* Navigation footer controls inside test */}
                  <div className="flex justify-between items-center border-t border-gray-850 pt-4">
                    <button
                      disabled={currentQuestionIndex === 0}
                      onClick={() => setCurrentQuestionIndex((prev) => Math.max(prev - 1, 0))}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-semibold disabled:opacity-30 cursor-pointer font-mono"
                    >
                      ← Previous
                    </button>

                    {currentQuestionIndex === (activeTest?.questionsCount || 10) - 1 ? (
                      <button
                        onClick={() => setTestState('review')}
                        className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-all shadow cursor-pointer font-mono"
                      >
                        Review & Submit →
                      </button>
                    ) : (
                      <button
                        onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                        className="px-4 py-2 bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg text-xs font-semibold transition-all cursor-pointer font-mono"
                      >
                        Next →
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
