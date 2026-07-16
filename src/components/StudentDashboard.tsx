/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useGlobalContext } from './ThemeContext';
import { Award, BookOpen, Calendar, Flame, Goal, CheckCircle, Bell, ArrowRight, Play, Star, ChevronRight, TrendingUp } from 'lucide-react';
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-8">
      {/* Welcome banner & Streak status */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 p-6 rounded-3xl border border-emerald-500/20">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Welcome back, {user?.name || 'Student'}!</h1>
          <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Your next exam simulation is scheduled for <span className="font-semibold text-emerald-400">August 12, 2026</span>. You are on track for a 79+ target score!
          </p>
        </div>
        <div className="flex items-center gap-4 bg-gray-950/20 p-3 rounded-2xl border border-white/5">
          <div className="flex items-center gap-2">
            <Flame className="w-6 h-6 text-orange-500 fill-orange-500 animate-pulse" />
            <div>
              <p className="text-xl font-black font-mono leading-none">{streakCount} Days</p>
              <p className="text-[10px] text-gray-400 font-mono tracking-widest uppercase">STREAK</p>
            </div>
          </div>
          <button
            onClick={addStreakDay}
            className="px-3.5 py-1.5 bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 rounded-xl text-xs font-bold transition-all border border-orange-500/20"
          >
            Claim Today
          </button>
        </div>
      </div>

      {/* Main Core Widgets Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Col 1 & 2: Main study dashboard */}
        <div className="lg:col-span-2 space-y-8">
          {/* Continue learning & Shortcuts */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-400" /> Continue Preparing
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-gray-900/30 border-gray-850 hover:border-emerald-500/30' : 'bg-white border-gray-200 hover:border-emerald-500'} transition-all flex flex-col justify-between group`}>
                <div>
                  <span className="text-[10px] font-mono tracking-wider bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full uppercase font-bold">Course Session</span>
                  <h3 className="text-sm font-bold mt-3">Chunking & Phrasing Secrets</h3>
                  <p className="text-xs text-gray-400 mt-1">Lesson 2 • PTE Speaking Mastery</p>
                </div>
                <div className="flex items-center justify-between mt-6">
                  <div className="w-2/3 bg-gray-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '40%' }}></div>
                  </div>
                  <button
                    onClick={() => onNavigateSection('learning')}
                    className="p-2 bg-emerald-500 text-white rounded-xl hover:scale-105 transition-transform"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                  </button>
                </div>
              </div>

              <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-gray-900/30 border-gray-850 hover:border-emerald-500/30' : 'bg-white border-gray-200 hover:border-emerald-500'} transition-all flex flex-col justify-between group`}>
                <div>
                  <span className="text-[10px] font-mono tracking-wider bg-orange-500/10 text-orange-400 px-2.5 py-1 rounded-full uppercase font-bold">Recommended Task</span>
                  <h3 className="text-sm font-bold mt-3">Describe Image (DI) practice</h3>
                  <p className="text-xs text-gray-400 mt-1">Focus on speaking pitch & pause templates</p>
                </div>
                <div className="flex items-center justify-between mt-6">
                  <span className="text-xs text-emerald-400 font-mono">Difficulty: Medium</span>
                  <button
                    onClick={() => onNavigateTask('DI')}
                    className="text-xs font-bold text-white bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl hover:bg-emerald-500 transition-all flex items-center gap-1"
                  >
                    Launch <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Analytics Graph */}
          <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-gray-900/20 border-gray-850' : 'bg-white border-gray-200'}`}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest font-mono text-gray-400 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-400" /> Scoring Progression
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Mock results spanning June - July 2026</p>
              </div>
              <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-mono font-bold">+10.2% Progress</span>
            </div>

            {/* Simulated Custom SVG Chart */}
            <div className="h-48 relative w-full">
              <svg className="w-full h-full" viewBox="0 0 500 150" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Horizontal gridlines */}
                <line x1="0" y1="30" x2="500" y2="30" stroke="#1f2937" strokeWidth="0.5" strokeDasharray="4" />
                <line x1="0" y1="75" x2="500" y2="75" stroke="#1f2937" strokeWidth="0.5" strokeDasharray="4" />
                <line x1="0" y1="120" x2="500" y2="120" stroke="#1f2937" strokeWidth="0.5" strokeDasharray="4" />

                {/* Filled area */}
                <path
                  d="M 10 150 Q 125 120, 250 85 T 490 35 L 490 150 Z"
                  fill="url(#chartGrad)"
                />

                {/* Curved line */}
                <path
                  d="M 10 150 Q 125 120, 250 85 T 490 35"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Data Points */}
                <circle cx="10" cy="150" r="5" fill="#10b981" />
                <circle cx="150" cy="115" r="5" fill="#10b981" />
                <circle cx="300" cy="78" r="5" fill="#10b981" />
                <circle cx="490" cy="35" r="6" fill="#10b981" className="animate-ping" />
                <circle cx="490" cy="35" r="4" fill="#059669" />
              </svg>

              {/* Chart labels */}
              <div className="absolute top-2 left-2 text-[10px] font-mono text-gray-500">PTE 90 (Perfect Score)</div>
              <div className="absolute top-[40%] left-2 text-[10px] font-mono text-emerald-500 font-bold">PTE 79 (Target)</div>
              <div className="absolute bottom-2 left-2 text-[10px] font-mono text-gray-500">PTE 50 (Foundation)</div>
            </div>

            <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono pt-4 border-t border-gray-800/40">
              <span>Week 1 (Diagnostic: 58)</span>
              <span>Week 3 (Practice: 66)</span>
              <span>Week 5 (Mock #1: 71)</span>
              <span>Today (Simulator Avg: 78)</span>
            </div>
          </div>
        </div>

        {/* Col 3: Sideboards, Calendar, Goals */}
        <div className="space-y-8">
          {/* Today's Study Planner / Calendar */}
          <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-gray-900/20 border-gray-850' : 'bg-white border-gray-200'}`}>
            <h3 className="text-sm font-bold uppercase tracking-widest font-mono text-gray-400 mb-4 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-400" /> Today\'s Plan
            </h3>
            <div className="grid grid-cols-7 gap-1.5 mb-5 text-center">
              {calendarDays.map((cal, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedDay(cal.day)}
                  className={`p-2 rounded-xl flex flex-col items-center justify-between transition-all ${
                    cal.today
                      ? 'bg-emerald-500 text-white font-bold'
                      : selectedDay === cal.day
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : theme === 'dark'
                      ? 'bg-gray-950/40 border border-gray-850 hover:bg-gray-900 text-gray-400'
                      : 'bg-gray-100 border border-gray-200 hover:bg-gray-200 text-gray-600'
                  }`}
                >
                  <span className="text-[9px] uppercase font-mono">{cal.day}</span>
                  <span className="text-xs font-bold font-mono mt-1">{cal.date}</span>
                </button>
              ))}
            </div>

            {/* List for active day */}
            <div className="space-y-3">
              <div className={`p-3.5 rounded-xl border flex justify-between items-center ${theme === 'dark' ? 'bg-gray-950/40 border-gray-850' : 'bg-gray-100 border-gray-200'}`}>
                <div>
                  <h4 className="text-xs font-bold">1. Speaking Session</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">Focus: Pitch & Pronunciation</p>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded uppercase font-bold">Done</span>
              </div>
              <div className={`p-3.5 rounded-xl border flex justify-between items-center ${theme === 'dark' ? 'bg-gray-950/40 border-gray-850' : 'bg-gray-100 border-gray-200'}`}>
                <div>
                  <h4 className="text-xs font-bold">2. Grammar Review</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">Noun agreement in SWT essays</p>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded uppercase font-bold">Done</span>
              </div>
              <div className={`p-3.5 rounded-xl border flex justify-between items-center ${theme === 'dark' ? 'bg-gray-950/40 border-gray-850' : 'bg-gray-100 border-gray-200'}`}>
                <div>
                  <h4 className="text-xs font-bold">3. Full Mock Prep</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">Section 2: Reading task drills</p>
                </div>
                <span className="text-[10px] font-mono text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded uppercase font-bold">Active</span>
              </div>
            </div>
          </div>

          {/* Goal tracker widget */}
          <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-gray-900/20 border-gray-850' : 'bg-white border-gray-200'}`}>
            <h3 className="text-sm font-bold uppercase tracking-widest font-mono text-gray-400 mb-4 flex items-center gap-1.5">
              <Goal className="w-4 h-4 text-emerald-400" /> Active Goals
            </h3>
            <div className="space-y-3">
              {goals.map((g) => (
                <div key={g.id} onClick={() => toggleGoal(g.id)} className="flex items-start gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded border mt-0.5 flex items-center justify-center transition-all flex-shrink-0 ${g.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-700 hover:border-emerald-500'}`}>
                    {g.done && <CheckCircle className="w-4 h-4 stroke-[2.5]" />}
                  </div>
                  <div className="flex-1">
                    <p className={`text-xs font-bold leading-tight ${g.done ? 'line-through text-gray-500' : ''}`}>{g.text}</p>
                    <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono mt-1">
                      <span>Progress: {g.current} / {g.target}</span>
                      <span>{Math.round((g.current / g.target) * 100)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Quick Metrics statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-gray-900/20 border-gray-850' : 'bg-white border-gray-200'}`}>
          <p className="text-3xl font-extrabold text-emerald-400 font-mono">{studyStats.averagePTE}</p>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-mono mt-1">Average PTE Grade</p>
        </div>
        <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-gray-900/20 border-gray-850' : 'bg-white border-gray-200'}`}>
          <p className="text-3xl font-extrabold text-teal-400 font-mono">{studyStats.tasksAttempted}</p>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-mono mt-1">Tasks Attempted</p>
        </div>
        <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-gray-900/20 border-gray-850' : 'bg-white border-gray-200'}`}>
          <p className="text-3xl font-extrabold text-sky-400 font-mono">{studyStats.lessonsCompleted}</p>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-mono mt-1">Lessons Completed</p>
        </div>
        <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-gray-900/20 border-gray-850' : 'bg-white border-gray-200'}`}>
          <p className="text-3xl font-extrabold text-orange-400 font-mono">{studyStats.totalHours}h</p>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-mono mt-1">Total Active Hours</p>
        </div>
      </div>
    </div>
  );
};
