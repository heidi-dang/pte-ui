/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ThemeProvider, useGlobalContext } from './components/ThemeContext';
import { PublicWebsite } from './components/PublicWebsite';
import { Auth } from './components/Auth';
import { StudentDashboard } from './components/StudentDashboard';
import { LearningCentre } from './components/LearningCentre';
import { PracticeEngine } from './components/PracticeEngine';
import { MockTestEngine } from './components/MockTestEngine';
import { Reports } from './components/Reports';
import { TeacherUI } from './components/TeacherUI';
import { AdminUI } from './components/AdminUI';
import { PTETaskCode, Role } from './types';
import { Compass, BookOpen, Star, Sparkles, Moon, Sun, User, LogIn, Menu, X, Bell, LayoutDashboard, Database, HelpCircle, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function AppContent() {
  const { theme, toggleTheme, role, setRole, user, logout } = useGlobalContext();

  // Navigation states
  const [guestSection, setGuestSection] = useState('landing');
  const [studentTab, setStudentTab] = useState('dashboard');
  const [activePracticeTask, setActivePracticeTask] = useState<PTETaskCode>('RA');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auth modal state
  const [authModal, setAuthModal] = useState<{ open: boolean; view: 'login' | 'register' }>({ open: false, view: 'login' });

  // Notifications drawer state
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);

  const handleLaunchTask = (taskCode: string) => {
    setActivePracticeTask(taskCode as PTETaskCode);
    setStudentTab('practice');
  };

  return (
    <div className="relative min-h-screen">
      {/* 1. TOP GLOBAL NAVIGATION HEADER */}
      <nav className={`fixed top-0 inset-x-0 z-40 border-b backdrop-blur-md transition-colors duration-300 ${
        theme === 'dark' ? 'bg-[#0b0f19]/80 border-gray-800/60' : 'bg-white/80 border-gray-200 shadow-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo Brand */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => {
            if (role === 'guest') setGuestSection('landing');
            else setStudentTab('dashboard');
          }}>
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-display font-bold text-lg shadow-lg shadow-emerald-500/20">
              P
            </div>
            <span className="font-display font-extrabold text-sm sm:text-base tracking-tight text-white hidden sm:inline">
              PTE Academic <span className="text-emerald-400">Master</span>
            </span>
          </div>

          {/* Navigation Links based on Active Role */}
          <div className="hidden md:flex items-center gap-1">
            {role === 'guest' && (
              <>
                {[
                  { id: 'landing', label: 'Home' },
                  { id: 'features', label: 'Features' },
                  { id: 'pricing', label: 'Pricing' },
                  { id: 'reviews', label: 'Reviews' },
                  { id: 'blog', label: 'Blog' },
                  { id: 'faq', label: 'FAQ' }
                ].map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => setGuestSection(sec.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-colors cursor-pointer ${
                      guestSection === sec.id
                        ? 'text-emerald-400 bg-emerald-500/5'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {sec.label}
                  </button>
                ))}
              </>
            )}

            {role === 'student' && (
              <>
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                  { id: 'learning', label: 'Courses', icon: BookOpen },
                  { id: 'practice', label: '22 Practice Tasks', icon: Compass },
                  { id: 'mocks', label: 'Mock Exams', icon: Activity },
                  { id: 'reports', label: 'AI Scorecard', icon: Star }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setStudentTab(tab.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      studentTab === tab.id
                        ? 'text-emerald-400 bg-emerald-500/5'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" /> {tab.label}
                  </button>
                ))}
              </>
            )}

            {role === 'teacher' && (
              <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase bg-emerald-500/10 px-3 py-1 rounded-full">
                Assessment Queue Console
              </span>
            )}

            {role === 'admin' && (
              <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase bg-emerald-500/10 px-3 py-1 rounded-full">
                Administrative Control Panel
              </span>
            )}
          </div>

          {/* Right controls: Theme, Role Pill Switcher, profile */}
          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl transition-all border ${
                theme === 'dark'
                  ? 'border-gray-800 bg-gray-950/40 text-gray-400 hover:text-yellow-400'
                  : 'border-gray-200 bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Quick role test switcher pill */}
            <div className="hidden sm:flex items-center gap-1 p-1 bg-gray-950/40 border border-gray-800/60 rounded-xl">
              {(['guest', 'student', 'teacher', 'admin'] as Role[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`px-2.5 py-1 rounded-lg text-[9px] uppercase tracking-wider font-mono font-bold transition-all cursor-pointer ${
                    role === r
                      ? 'bg-emerald-500 text-white font-extrabold shadow'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Auth check or Profile dropdown */}
            {user ? (
              <div className="flex items-center gap-2 border-l border-gray-800/40 pl-3">
                <button
                  onClick={() => setShowNotificationPopup(!showNotificationPopup)}
                  className="p-2 text-gray-400 hover:text-emerald-400 relative"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500"></span>
                </button>
                <div onClick={logout} className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl cursor-pointer hover:bg-emerald-500/20 transition-all">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center text-[10px]">
                    H
                  </div>
                  <span className="text-xs font-bold text-gray-200 hidden lg:inline">{user.name}</span>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAuthModal({ open: true, view: 'login' })}
                className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-semibold tracking-wide bg-emerald-500 hover:bg-emerald-600 text-white transition-all shadow shadow-emerald-500/20 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 mr-1" /> Log In
              </button>
            )}

            {/* Mobile menu triggers */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* 2. MOBILE MENU DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-0 top-16 z-30 bg-[#0b0f19] border-b border-gray-800 p-4 md:hidden space-y-3">
          {/* Quick role switcher for mobile test */}
          <div className="flex items-center justify-between p-2.5 bg-gray-950/40 rounded-xl border border-gray-850">
            <span className="text-[10px] uppercase font-mono text-gray-500">Workspace Role:</span>
            <div className="flex gap-1">
              {(['guest', 'student', 'teacher', 'admin'] as Role[]).map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setRole(r);
                    setMobileMenuOpen(false);
                  }}
                  className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-mono font-bold ${
                    role === r ? 'bg-emerald-500 text-white' : 'text-gray-500'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            {role === 'guest' && (
              <>
                {[
                  { id: 'landing', label: 'Home' },
                  { id: 'features', label: 'Features' },
                  { id: 'pricing', label: 'Pricing' },
                  { id: 'reviews', label: 'Reviews' },
                  { id: 'blog', label: 'Blog' },
                  { id: 'faq', label: 'FAQ' }
                ].map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => {
                      setGuestSection(sec.id);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left p-2 rounded text-xs font-semibold text-gray-300 hover:bg-white/5"
                  >
                    {sec.label}
                  </button>
                ))}
              </>
            )}

            {role === 'student' && (
              <>
                {[
                  { id: 'dashboard', label: 'Dashboard' },
                  { id: 'learning', label: 'Courses' },
                  { id: 'practice', label: '22 Practice Tasks' },
                  { id: 'mocks', label: 'Mock Exams' },
                  { id: 'reports', label: 'AI Scorecard' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setStudentTab(tab.id);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left p-2 rounded text-xs font-semibold text-gray-300 hover:bg-white/5"
                  >
                    {tab.label}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* 3. DYNAMIC NOTIFICATIONS OVERLAY POPUP */}
      {showNotificationPopup && (
        <div className="fixed right-4 top-20 z-50 w-80 rounded-2xl border p-4 shadow-2xl bg-[#101424] border-gray-800 text-white">
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-850">
            <h4 className="text-xs font-bold font-mono uppercase text-gray-400">NOTIFICATIONS</h4>
            <button onClick={() => setShowNotificationPopup(false)} className="text-[10px] text-gray-500 hover:text-white">✕</button>
          </div>
          <div className="space-y-3">
            {[
              { id: 'n1', title: 'New Essay Graded', text: 'Your "Automation & Employment" essay was evaluated.', time: '10 mins ago' },
              { id: 'n2', title: 'Goal Achieved!', text: '15 speaking tasks completed this week.', time: '2 hours ago' }
            ].map((n) => (
              <div key={n.id} className="p-2.5 rounded-lg bg-gray-950/40 border border-gray-850 text-xs">
                <p className="font-bold">{n.title}</p>
                <p className="text-[10px] text-gray-400 mt-0.5 leading-normal">{n.text}</p>
                <span className="text-[9px] text-gray-500 font-mono mt-1 block">{n.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. MAIN WORKSPACE VIEW ROUTER */}
      <main>
        {role === 'guest' && (
          <PublicWebsite
            currentSection={guestSection}
            onNavigate={(sec) => setGuestSection(sec)}
            onOpenAuth={(view) => setAuthModal({ open: true, view: view })}
          />
        )}

        {role === 'student' && (
          <>
            {studentTab === 'dashboard' && (
              <StudentDashboard
                onNavigateSection={(sec) => setStudentTab(sec)}
                onNavigateTask={handleLaunchTask}
              />
            )}
            {studentTab === 'learning' && <LearningCentre />}
            {studentTab === 'practice' && <PracticeEngine initialTaskCode={activePracticeTask} />}
            {studentTab === 'mocks' && <MockTestEngine onNavigateReport={() => setStudentTab('reports')} />}
            {studentTab === 'reports' && <Reports />}
          </>
        )}

        {role === 'teacher' && <TeacherUI />}

        {role === 'admin' && <AdminUI />}
      </main>

      {/* 5. MODAL WORKFLOWS: LOGIN/REGISTER CREDENTIALS */}
      {authModal.open && (
        <Auth
          initialView={authModal.view}
          onClose={() => setAuthModal({ open: false, view: 'login' })}
        />
      )}

      {/* 6. BOTTOM FOOTER CHEAT SHEET LINKS */}
      <footer className={`border-t py-8 text-center text-[10px] tracking-wide font-mono transition-colors duration-300 ${
        theme === 'dark' ? 'bg-[#090b12] border-gray-900 text-gray-600' : 'bg-gray-100 border-gray-200 text-gray-400'
      }`}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© 2026 PTE Academic Master. Built with absolute compliance for university visa prep portfolios.</p>
          <div className="flex gap-4">
            <button onClick={() => { setRole('guest'); setGuestSection('terms'); }} className="hover:text-emerald-400">Terms of service</button>
            <span>•</span>
            <button onClick={() => { setRole('guest'); setGuestSection('privacy'); }} className="hover:text-emerald-400">Privacy policy</button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
