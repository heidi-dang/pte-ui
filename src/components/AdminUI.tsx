/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useGlobalContext } from './ThemeContext';
import { STUDENT_LIST, MOCK_TESTS, COURSES } from '../data/mockData';
import { Shield, Users, Layers, Key, Database, Book, DollarSign, Settings, Trash2, Plus, Edit3, CheckCircle, Search, Filter } from 'lucide-react';
import { motion } from 'motion/react';

export const AdminUI: React.FC = () => {
  const { theme } = useGlobalContext();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'questions' | 'courses' | 'students' | 'settings'>('dashboard');

  // Question bank state
  const [questions, setQuestions] = useState([
    { id: 'Q-901', code: 'RA', title: 'Great Barrier Reef Ecosystem', section: 'Speaking', difficulty: 'Medium' },
    { id: 'Q-902', code: 'WE', title: 'Artificial Intelligence & Jobs', section: 'Writing', difficulty: 'Hard' },
    { id: 'Q-903', code: 'ROP', title: 'Evolution of Stellar Nebulae', section: 'Reading', difficulty: 'Medium' },
    { id: 'Q-904', code: 'WFD', title: 'Digital Library Research Materials', section: 'Listening', difficulty: 'Easy' }
  ]);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState({ code: 'RA', title: '', difficulty: 'Medium' });

  // Users lists
  const [students, setStudents] = useState(STUDENT_LIST);

  const stats = {
    mrr: 45290,
    totalStudents: 14209,
    activeTeachers: 18,
    activeSessions: 1204
  };

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.title) return;
    const item = {
      id: `Q-${Date.now().toString().slice(-3)}`,
      code: newQuestion.code,
      title: newQuestion.title,
      section: ['RA', 'DI', 'RS', 'RL'].includes(newQuestion.code) ? 'Speaking' : 'Writing',
      difficulty: newQuestion.difficulty
    };
    setQuestions([...questions, item]);
    setNewQuestion({ code: 'RA', title: '', difficulty: 'Medium' });
    setShowAddQuestionModal(false);
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const handleToggleUserStatus = (id: string) => {
    setStudents(
      students.map((st) => {
        if (st.id === id) {
          return { ...st, status: st.status === 'Active' ? 'Inactive' : 'Active' };
        }
        return st;
      })
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex flex-col lg:flex-row gap-8">
      {/* Admin Sidebar Navigation */}
      <div className="lg:w-1/5 space-y-4">
        <div className={`p-5 rounded-3xl border ${theme === 'dark' ? 'bg-[#0f1322] border-gray-850' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-2 mb-4 border-b border-gray-850 pb-3">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold font-mono tracking-widest uppercase text-gray-300">ADMIN CONTROL</h2>
          </div>
          <div className="space-y-1">
            {[
              { id: 'dashboard', label: 'Metrics', icon: DollarSign },
              { id: 'questions', label: 'Question Bank', icon: Database },
              { id: 'courses', label: 'Course Manager', icon: Book },
              { id: 'students', label: 'User Accounts', icon: Users },
              { id: 'settings', label: 'System Settings', icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-emerald-500 text-white shadow'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Admin canvas */}
      <div className="flex-1 space-y-6">
        {/* TAB 1: METRICS DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* KPI grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-gray-900/20 border-gray-850' : 'bg-white border-gray-200'}`}>
                <p className="text-2xl font-black text-emerald-400 font-mono">${stats.mrr.toLocaleString()}</p>
                <p className="text-[10px] text-gray-500 uppercase font-mono tracking-wider mt-1">Monthly Recurring Revenue</p>
              </div>
              <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-gray-900/20 border-gray-850' : 'bg-white border-gray-200'}`}>
                <p className="text-2xl font-black text-teal-400 font-mono">{stats.totalStudents.toLocaleString()}</p>
                <p className="text-[10px] text-gray-500 uppercase font-mono tracking-wider mt-1">Total Enrolled Students</p>
              </div>
              <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-gray-900/20 border-gray-850' : 'bg-white border-gray-200'}`}>
                <p className="text-2xl font-black text-sky-400 font-mono">{stats.activeTeachers}</p>
                <p className="text-[10px] text-gray-500 uppercase font-mono tracking-wider mt-1">Certified Faculty Tutors</p>
              </div>
              <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-gray-900/20 border-gray-850' : 'bg-white border-gray-200'}`}>
                <p className="text-2xl font-black text-orange-400 font-mono">{stats.activeSessions}</p>
                <p className="text-[10px] text-gray-500 uppercase font-mono tracking-wider mt-1">Active Study Sessions</p>
              </div>
            </div>

            {/* Quick telemetry logs and graphs */}
            <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-gray-900/20 border-gray-850' : 'bg-white border-gray-200'}`}>
              <h3 className="text-xs font-bold uppercase tracking-widest font-mono text-gray-400 mb-4">Acoustic Engine Telemetry Load</h3>
              <div className="space-y-3.5">
                {[
                  { name: 'Phonetic Alignment API', load: '32%', status: 'nominal', latency: '12ms' },
                  { name: 'Essay Grammar Engine', load: '58%', status: 'nominal', latency: '45ms' },
                  { name: 'Synthesizer Playbacks', load: '12%', status: 'nominal', latency: '2ms' }
                ].map((srv, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="font-bold">{srv.name}</span>
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-gray-500">Latency: {srv.latency}</span>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded uppercase font-bold">{srv.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: QUESTION BANK MANAGER */}
        {activeTab === 'questions' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase tracking-widest font-mono text-gray-400">PTE Question Repositories</h3>
              <button
                onClick={() => setShowAddQuestionModal(true)}
                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add New Task Item
              </button>
            </div>

            {/* Modal simulation for Add Question */}
            {showAddQuestionModal && (
              <div className="p-5 rounded-2xl border border-emerald-500/40 bg-emerald-500/5 mb-6">
                <form onSubmit={handleAddQuestion} className="grid sm:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-gray-400 mb-1">Task Code</label>
                    <select
                      value={newQuestion.code}
                      onChange={(e) => setNewQuestion({ ...newQuestion, code: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg text-xs bg-gray-950 border border-gray-850 text-white focus:outline-none"
                    >
                      <option value="RA">RA - Read Aloud</option>
                      <option value="WE">WE - Write Essay</option>
                      <option value="DI">DI - Describe Image</option>
                      <option value="SST">SST - Summarize Spoken Text</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-gray-400 mb-1">Question Title</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Cognitive Plasticity Studies"
                      value={newQuestion.title}
                      onChange={(e) => setNewQuestion({ ...newQuestion, title: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg text-xs bg-gray-950 border border-gray-850 text-white focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold">
                      Save Question
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddQuestionModal(false)}
                      className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Questions Table */}
            <div className={`overflow-hidden rounded-2xl border ${theme === 'dark' ? 'bg-[#0f1322] border-gray-850' : 'bg-white border-gray-200 shadow-sm'}`}>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b font-mono text-gray-500 uppercase tracking-wider text-[10px] ${theme === 'dark' ? 'bg-gray-950/40 border-gray-850' : 'bg-gray-50 border-gray-200'}`}>
                    <th className="p-4">ID</th>
                    <th className="p-4">Task Code</th>
                    <th className="p-4">Question Title</th>
                    <th className="p-4">Section</th>
                    <th className="p-4">Difficulty</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-850">
                  {questions.map((q) => (
                    <tr key={q.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-mono font-bold text-gray-500">{q.id}</td>
                      <td className="p-4 font-mono"><span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">{q.code}</span></td>
                      <td className="p-4 font-bold">{q.title}</td>
                      <td className="p-4 text-gray-400">{q.section}</td>
                      <td className="p-4 font-mono text-gray-400">{q.difficulty}</td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: COURSE MANAGER */}
        {activeTab === 'courses' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest font-mono text-gray-400">Dynamic Course Library</h3>
            <div className="grid sm:grid-cols-3 gap-6">
              {COURSES.map((c) => (
                <div key={c.id} className={`p-5 rounded-2xl border flex flex-col justify-between ${theme === 'dark' ? 'bg-[#0f1322] border-gray-850' : 'bg-white border-gray-200'}`}>
                  <div>
                    <span className="text-[9px] font-mono tracking-widest bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full font-bold uppercase">{c.level}</span>
                    <h4 className="text-sm font-bold mt-2.5">{c.title}</h4>
                    <p className="text-[11px] text-gray-400 leading-normal mt-1.5">{c.description}</p>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-mono text-gray-500 border-t border-gray-850 pt-3 mt-4">
                    <span>{c.lessonsCount} lesson entries</span>
                    <button className="text-emerald-400 hover:underline font-bold flex items-center gap-1">
                      Configure Lessons <Edit3 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: STUDENT USER MANAGER */}
        {activeTab === 'students' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest font-mono text-gray-400">Registered Students</h3>
            <div className={`overflow-hidden rounded-2xl border ${theme === 'dark' ? 'bg-[#0f1322] border-gray-850' : 'bg-white border-gray-200 shadow-sm'}`}>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b font-mono text-gray-500 uppercase tracking-wider text-[10px] ${theme === 'dark' ? 'bg-gray-950/40 border-gray-850' : 'bg-gray-50 border-gray-200'}`}>
                    <th className="p-4">Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Target Score</th>
                    <th className="p-4">Active Plan</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-850">
                  {students.map((st) => (
                    <tr key={st.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-bold">{st.name}</td>
                      <td className="p-4 text-gray-400 font-mono">{st.email}</td>
                      <td className="p-4 font-mono font-bold text-emerald-400">PTE {st.targetScore}</td>
                      <td className="p-4 font-mono text-gray-400">{st.subscription}</td>
                      <td className="p-4">
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                          st.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {st.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleToggleUserStatus(st.id)}
                          className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-[10px] font-mono font-bold cursor-pointer"
                        >
                          Toggle status
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: SYSTEM SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-widest font-mono text-gray-400">Administrative Settings</h3>
            <div className={`p-6 rounded-3xl border space-y-6 ${theme === 'dark' ? 'bg-[#0f1322] border-gray-850' : 'bg-white border-gray-200 shadow-sm'}`}>
              <div className="grid sm:grid-cols-2 gap-6 border-b border-gray-850 pb-6">
                <div>
                  <h4 className="text-xs font-bold mb-1">Mock Exam Strict Pacing Mode</h4>
                  <p className="text-[10px] text-gray-500 leading-normal mb-3">Force auto-next navigation immediately upon exam timers reaching 0.</p>
                  <button className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold uppercase font-mono">
                    Enabled ✓
                  </button>
                </div>
                <div>
                  <h4 className="text-xs font-bold mb-1">Dual Micro-Phonetic Filter</h4>
                  <p className="text-[10px] text-gray-500 leading-normal mb-3">Enforce high dynamic acoustic capture constraints for female vocal streams.</p>
                  <button className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold uppercase font-mono">
                    Enabled ✓
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-red-400 mb-1">Platform Maintenance Controls</h4>
                <p className="text-[10px] text-gray-500 leading-normal mb-3">Initiate data purge sweeps or system reboot parameters.</p>
                <div className="flex gap-2">
                  <button onClick={() => alert('Platform cached buffers flushed.')} className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold hover:bg-red-500 hover:text-white transition-all cursor-pointer">
                    Flush Buffers
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
