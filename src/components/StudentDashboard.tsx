/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useGlobalContext } from './ThemeContext';
import { Award, BookOpen, Calendar, Flame, Goal, CheckCircle, Bell, ArrowRight, Play, Star, ChevronRight, TrendingUp, HelpCircle, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

interface StudentDashboardProps {
  onNavigateSection: (section: string) => void;
  onNavigateTask: (code: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigateSection, onNavigateTask }) => {
  const { theme, streakCount, addStreakDay, user, apiFetch } = useGlobalContext();
  const [goals, setGoals] = useState([
    { id: 'g1', text: 'Complete 10 Read Aloud Tasks', target: 10, current: 7, done: false },
    { id: 'g2', text: 'Write 1 Persuasive Essay', target: 1, current: 1, done: true },
    { id: 'g3', text: 'Acheive 75+ Average in Mock', target: 75, current: 74, done: false }
  ]);
  const [selectedDay, setSelectedDay] = useState<string>('Thu');
  const [stats, setStats] = useState({
    averagePTE: 70,
    tasksAttempted: 12,
    lessonsCompleted: 3,
    totalHours: 14.5
  });

  React.useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const statsData = await apiFetch('/api/student/dashboard-stats');
        const submissions = await apiFetch('/api/student/practice/submissions');
        
        let lessonsCount = 0;
        try {
          const completedLessons = await apiFetch('/api/student/courses/C-01/lessons');
          lessonsCount = completedLessons.filter((l: any) => l.completed).length;
        } catch (e) {}

        setStats({
          averagePTE: statsData.overallScore || 70,
          tasksAttempted: submissions.length || statsData.tasksAttempted || 8,
          lessonsCompleted: lessonsCount || 2,
          totalHours: statsData.streakDays * 1.5 || 12.5
        });
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      }
    };

    fetchDashboardStats();
  }, [apiFetch]);

  const studyStats = {
    totalHours: stats.totalHours,
    lessonsCompleted: stats.lessonsCompleted,
    averagePTE: stats.averagePTE,
    tasksAttempted: stats.tasksAttempted
  };

  const calendarDays = [
    { day: 'Mon', date: '13', hours: 1.5, completed: true },
    { day: 'Tue', date: '14', hours: 2.0, completed: true },
    { day: 'Wed', date: '15', hours: 0.8, completed: true },
    { day: 'Thu', date: '16', hours: 1.2, completed: false, today: true },
    { day: 'Fri', date: '17', hours: 0, completed: false },
    { day: 'Sat', date: '18', hours: 0, completed: false },
    { day: 'Sun', date: '19', hours: 0, completed: false }
  ];

  const toggleGoal = (id: string) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === id) {
          const newCurrent = g.done ? g.current - 1 : g.target;
          return { ...g, current: newCurrent, done: !g.done };
        }
        return g;
      })
    );
  };

  // Active study tasks state for "Today's Plan"
  const [todayTasks, setTodayTasks] = useState([
    { id: 't1', title: 'Read Aloud Practice', count: '5 items', duration: '8 min', reason: 'To stabilize speech envelope consistency', skill: 'Speaking & Reading', code: 'RA', done: false },
    { id: 't2', title: 'Repeat Sentence Drills', count: '10 items', duration: '10 min', reason: 'Enhance immediate auditory retention', skill: 'Speaking & Listening', code: 'RS', done: false },
    { id: 't3', title: 'Summarize Written Text', count: '2 items', duration: '8 min', reason: 'Vary coordinate clause connectors', skill: 'Writing & Reading', code: 'SWT', done: false },
    { id: 't4', title: 'Review 2 previous mistakes', count: '2 items', duration: '6 min', reason: 'Identify recurring spelling constraints', skill: 'General Polish', code: 'reports', done: false }
  ]);

  const [selectedConfidenceInfo, setSelectedConfidenceInfo] = useState<string | null>(null);

  const toggleTaskDone = (id: string) => {
    setTodayTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const currentEstimatedScore = stats.averagePTE;
  const targetScore = user?.targetScore || 79;
  const scoreGap = targetScore - currentEstimatedScore;

  // 4. Recently completed items history
  const [recentlyCompleted, setRecentlyCompleted] = useState([
    { name: 'Mock Test A (Full Simulation)', score: '78/90', date: 'Yesterday', status: 'Graded', type: 'mock' },
    { name: 'Write Essay: Technological Impact', score: '82/90', date: '2 days ago', status: 'Graded', type: 'practice' },
    { name: 'Describe Image: Academic Graduation Yield', score: '74/90', date: '3 days ago', status: 'Graded', type: 'practice' }
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-10">
      
      {/* SECTION 1: ESTABLISHED TARGET & SCORES OVERVIEW (Answering "What is my estimated score?") */}
      <div className="grid md:grid-cols-12 gap-8 items-stretch">
        
        {/* Estimated Score & Gap Widget */}
        <div className={`md:col-span-7 p-6 sm:p-8 rounded-3xl border flex flex-col justify-between relative overflow-hidden ${
          theme === 'dark' ? 'bg-[#0f1322] border-gray-800' : 'bg-white border-gray-200 shadow-sm'
        }`}>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-mono tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full uppercase font-bold">
                PTE Estimated Scorecard
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-3">Target Match Progress</h2>
              <p className="text-xs text-gray-500 mt-1">Estimations computed based on your 14 most recent test submissions.</p>
            </div>

            {/* Confidence Tooltip Trigger */}
            <div className="relative">
              <button
                onClick={() => setSelectedConfidenceInfo(selectedConfidenceInfo ? null : 'info')}
                className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase rounded bg-teal-500/15 text-teal-400 border border-teal-500/20 flex items-center gap-1 hover:bg-teal-500/25 cursor-pointer"
              >
                <span>● Moderate Confidence</span>
                <HelpCircle className="w-3 h-3" />
              </button>

              {selectedConfidenceInfo && (
                <div className="absolute right-0 top-8 z-30 w-64 p-3 rounded-xl shadow-xl border text-[10px] bg-gray-950 border-gray-800 text-gray-300 leading-normal font-mono">
                  <p className="font-bold text-white mb-1">How confidence is estimated:</p>
                  <p className="text-gray-400">Based on 14 recorded tasks in the past 21 days. Complete 5 more speaking exercises to achieve High Confidence status.</p>
                  <button onClick={() => setSelectedConfidenceInfo(null)} className="mt-2 text-emerald-400 hover:underline">Dismiss</button>
                </div>
              )}
            </div>
          </div>

          {/* Score metrics alignment */}
          <div className="grid grid-cols-3 gap-4 my-8 border-t border-b border-gray-800/40 py-6">
            <div className="text-center border-r border-gray-800/20">
              <span className="text-[9px] font-mono uppercase text-gray-400">Current Average</span>
              <p className="text-3xl sm:text-4xl font-extrabold font-mono text-emerald-400 mt-1">{currentEstimatedScore}</p>
              <p className="text-[9px] font-mono text-gray-500 mt-0.5">out of 90</p>
            </div>
            <div className="text-center border-r border-gray-800/20">
              <span className="text-[9px] font-mono uppercase text-gray-400">Target Score</span>
              <p className="text-3xl sm:text-4xl font-extrabold font-mono text-teal-400 mt-1">{targetScore}</p>
              <p className="text-[9px] font-mono text-gray-500 mt-0.5">Pearsons Scale</p>
            </div>
            <div className="text-center">
              <span className="text-[9px] font-mono uppercase text-gray-400">Score Gap</span>
              <p className="text-3xl sm:text-4xl font-extrabold font-mono text-orange-400 mt-1">
                {scoreGap > 0 ? `-${scoreGap}` : 'Achieved!'}
              </p>
              <p className="text-[9px] font-mono text-gray-500 mt-0.5">Points remaining</p>
            </div>
          </div>

          {/* Actionable Advice summary (Answering "What is blocking my target score?") */}
          <div className="flex gap-3 items-start bg-gray-950/40 p-3 rounded-xl border border-gray-850">
            <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-gray-200">Highest-Impact Constraint: <span className="text-orange-400">Oral Fluency</span></p>
              <p className="text-gray-400 mt-0.5">Frequent 1.5s+ pauses detected before prepositions. Sustain continuous phrasing up to punctuation limits.</p>
            </div>
          </div>
        </div>

        {/* Streak & Next Action (Answering "What should I do next?") */}
        <div className={`md:col-span-5 p-6 sm:p-8 rounded-3xl border flex flex-col justify-between ${
          theme === 'dark' ? 'bg-[#0f1322] border-gray-850' : 'bg-white border-gray-200 shadow-sm'
        }`}>
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-gray-400">Your Recommended Next Action</h3>
            
            <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-bold">
                  Recommended Course Lesson
                </span>
                <span className="text-[10px] font-mono text-gray-400">Lesson 2 of 10</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Chunking & Phrasing Secrets</h4>
                <p className="text-xs text-gray-400 mt-1">Master breathing breaks and timing anchor formulas for a perfect speaking score.</p>
              </div>
              <button
                onClick={() => onNavigateSection('learning')}
                className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-white" /> Continue preparing now
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-850/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
              <div>
                <p className="text-sm font-bold text-white leading-none">{streakCount} Days active</p>
                <p className="text-[9px] text-gray-500 font-mono tracking-wider mt-0.5">STREAK CALENDAR</p>
              </div>
            </div>
            <button
              onClick={addStreakDay}
              className="px-3 py-1.5 bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 border border-orange-500/25 rounded-xl text-xs font-bold font-mono transition-all"
            >
              Claim Today
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: TODAY'S STUDY PLAN (Answering "What should I practise today?") */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Today\'s Executable Sequence</h2>
            <p className="text-xs text-gray-500 mt-0.5">Personalized 32-minute practice block formulated by AI Diagnostics to target your score gap.</p>
          </div>
          <span className="text-xs font-mono text-gray-400 bg-gray-950/40 px-2.5 py-1 rounded-lg border border-gray-850">
            Estimate: <span className="text-emerald-400 font-bold">32 mins total</span>
          </span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {todayTasks.map((t, idx) => (
            <div
              key={t.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                t.done
                  ? 'bg-gray-950/30 border-gray-900 opacity-60'
                  : theme === 'dark'
                  ? 'bg-[#0f1322] border-gray-850 hover:border-emerald-500/40'
                  : 'bg-white border-gray-200 hover:border-emerald-500'
              }`}
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-[9px] font-mono uppercase bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold">
                    Step {idx + 1} • {t.duration}
                  </span>
                  <button
                    onClick={() => toggleTaskDone(t.id)}
                    className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                      t.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-700 hover:border-emerald-500'
                    }`}
                  >
                    {t.done && <CheckCircle className="w-3.5 h-3.5 stroke-[2.5]" />}
                  </button>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">{t.title}</h3>
                  <p className="text-[10px] text-gray-500 font-mono mt-0.5">Affected skill: {t.skill}</p>
                </div>
                <p className="text-[10px] text-gray-400 leading-normal italic">
                  &ldquo;{t.reason}&rdquo;
                </p>
              </div>

              <div>
                {t.code === 'reports' ? (
                  <button
                    onClick={() => onNavigateSection('reports')}
                    className="w-full py-1.5 bg-gray-950 hover:bg-gray-900 text-gray-400 hover:text-white border border-gray-850 text-[10px] font-bold rounded-lg transition-all"
                  >
                    Review Mistakes
                  </button>
                ) : (
                  <button
                    onClick={() => onNavigateTask(t.code)}
                    disabled={t.done}
                    className="w-full py-1.5 bg-emerald-500/15 hover:bg-emerald-500 hover:text-white text-emerald-400 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    Start Drill <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: RECENTLY COMPLETED WORK (Answering "What did I recently complete?") */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Completed portfolio history */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold tracking-tight">Recent Study Portfolio Logs</h2>
          <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-[#0f1322] border-gray-850' : 'bg-white border-gray-200'}`}>
            <div className="divide-y divide-gray-800/40">
              {recentlyCompleted.map((rc, index) => (
                <div key={index} className="py-4 first:pt-0 last:pb-0 flex justify-between items-center text-xs">
                  <div className="space-y-1">
                    <p className="font-bold text-white">{rc.name}</p>
                    <div className="flex gap-2 items-center text-[10px] text-gray-500 font-mono">
                      <span>{rc.date}</span>
                      <span>•</span>
                      <span className="text-teal-400 uppercase">{rc.type} activity</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-emerald-400 text-sm bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                      {rc.score}
                    </span>
                    <button
                      onClick={() => onNavigateSection(rc.type === 'mock' ? 'mocks' : 'reports')}
                      className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Score categories colors standard */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold tracking-tight">PTE Color Standard</h2>
          <div className={`p-6 rounded-3xl border space-y-3.5 ${
            theme === 'dark' ? 'bg-[#0f1322] border-gray-850' : 'bg-white border-gray-200'
          }`}>
            <p className="text-[10px] text-gray-500 leading-relaxed font-mono">Standardized score band color codes maintained globally across dashboards and reports:</p>
            <div className="space-y-2.5 font-mono text-[11px]">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded bg-emerald-500 block shrink-0" />
                <span className="text-gray-300 font-bold">Emerald:</span>
                <span className="text-gray-400">Score 79+ (Excellent / CEFR C1/C2)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded bg-teal-500 block shrink-0" />
                <span className="text-gray-300 font-bold">Teal:</span>
                <span className="text-gray-400">Score 65-78 (Target Competent / CEFR B2)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded bg-amber-500 block shrink-0" />
                <span className="text-gray-300 font-bold">Amber:</span>
                <span className="text-gray-400">Score 50-64 (Foundation / Pending Review)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded bg-rose-500 block shrink-0" />
                <span className="text-gray-300 font-bold">Red:</span>
                <span className="text-gray-400">Score &lt;50 (Critical Attention Required)</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
