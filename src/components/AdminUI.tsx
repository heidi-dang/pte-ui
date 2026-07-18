/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useGlobalContext } from './ThemeContext';
import { STUDENT_LIST, MOCK_TESTS, COURSES } from '../data/mockData';
import { Shield, Users, Layers, Key, Database, Book, DollarSign, Settings, Trash2, Plus, Edit3, CheckCircle, Search, Filter, Archive, Eye } from 'lucide-react';
import { motion } from 'motion/react';

export const AdminUI: React.FC = () => {
  const { theme, apiFetch, role } = useGlobalContext();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'questions' | 'courses' | 'students' | 'audit' | 'settings'>('dashboard');

  // Question bank state
  const [questionBankItems, setQuestionBankItems] = useState<any[]>([]);
  const [questionBankLoading, setQuestionBankLoading] = useState(false);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [questionForm, setQuestionForm] = useState({
    taskCode: 'RA', section: 'Speaking', title: '', instruction: '', promptText: '',
    difficulty: 'medium', status: 'draft', optionsJson: '', answerKeyJson: '',
    sampleAnswer: '', explanation: '', promptHtml: '', audioUrl: '', imageUrl: '',
    passageText: '', tagsJson: '', source: '',
  });
  const [questionFormError, setQuestionFormError] = useState('');
  const [questionFormSuccess, setQuestionFormSuccess] = useState('');

  // Coupon manager states
  const [coupons, setCoupons] = useState<any[]>([]);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDiscount, setNewCouponDiscount] = useState(15);
  const [newCouponMaxUses, setNewCouponMaxUses] = useState(50);
  const [couponSuccess, setCouponSuccess] = useState('');
  const [couponError, setCouponError] = useState('');

  // Database Backups states
  const [backupsList, setBackupsList] = useState<any[]>([]);
  const [isBackupLoading, setIsBackupLoading] = useState(false);
  const [backupSuccessMessage, setBackupSuccessMessage] = useState('');

  // Audit and Automated Emails lists
  const [auditLogsList, setAuditLogsList] = useState<any[]>([]);

  // Users lists
  const [students, setStudents] = useState<any[]>([]);
  const [liveJobs, setLiveJobs] = useState<any[]>([]);
  const [liveLogs, setLiveLogs] = useState<any[]>([]);

  const loadAdminTelemetry = async () => {
    if (role !== 'admin') return;
    try {
      const usersData = await apiFetch('/api/admin/users');
      setStudents(usersData);

      const jobsData = await apiFetch('/api/admin/jobs');
      setLiveJobs(jobsData);

      const logsData = await apiFetch('/api/admin/logs');
      setLiveLogs(logsData);

      const couponsData = await apiFetch('/api/admin/coupons');
      setCoupons(couponsData || []);

      const auditLogs = await apiFetch('/api/admin/audit-logs');
      setAuditLogsList(auditLogs || []);

      // Load question bank items
      try {
        const qData = await apiFetch('/api/admin/question-bank');
        setQuestionBankItems(qData || []);
      } catch (e) { /* silently fail — question bank may be empty */ }

      // Filter and map backup snap history from audit trails
      const backupAudits = (auditLogs || [])
        .filter((l: any) => l.category === 'Backup')
        .map((l: any) => {
          try {
            const meta = JSON.parse(l.metadata || '{}');
            return {
              filename: meta.filename || 'db_snapshot.sql.gz',
              size: meta.sizeMb || '1.20 MB',
              timestamp: l.timestamp,
            };
          } catch(e) {
            return {
              filename: 'db_snapshot_manual.sql.gz',
              size: '1.45 MB',
              timestamp: l.timestamp,
            };
          }
        });
      setBackupsList(backupAudits);
    } catch (err) {
      console.error('Failed to load admin telemetry:', err);
    }
  };

  useEffect(() => {
    loadAdminTelemetry();
    const interval = setInterval(loadAdminTelemetry, 7000); // Poll every 7s for live logging updates
    return () => clearInterval(interval);
  }, [apiFetch, role]);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponSuccess('');
    setCouponError('');
    try {
      const resp = await apiFetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCouponCode.trim().toUpperCase(),
          discountPercent: Number(newCouponDiscount),
          maxUses: Number(newCouponMaxUses),
        }),
      });
      if (resp.success) {
        setCouponSuccess(`Coupon code ${resp.coupon.code} successfully deployed!`);
        setNewCouponCode('');
        // Reload list
        const freshCoupons = await apiFetch('/api/admin/coupons');
        setCoupons(freshCoupons || []);
      }
    } catch (err: any) {
      setCouponError(err.message || 'Failed to create promo coupon.');
    }
  };

  const handleTriggerBackup = async () => {
    setIsBackupLoading(true);
    setBackupSuccessMessage('');
    try {
      const resp = await apiFetch('/api/admin/backup', {
        method: 'POST',
      });
      if (resp.success) {
        setBackupSuccessMessage(`Snapshot created: ${resp.filename} (${resp.size})`);
        // Reload telemetry
        await loadAdminTelemetry();
      }
    } catch (err: any) {
      alert('Backup failed: ' + err.message);
    } finally {
      setIsBackupLoading(false);
    }
  };

  const stats = {
    mrr: 45290,
    totalStudents: students.length || 8,
    activeTeachers: students.filter((u) => u.role === 'teacher').length || 2,
    activeSessions: liveJobs.length || 4
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuestionFormError('');
    setQuestionFormSuccess('');
    if (!questionForm.title || !questionForm.taskCode) return;

    try {
      const resp = await apiFetch('/api/admin/question-bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questionForm),
      });
      if (resp.success) {
        setQuestionFormSuccess(`Created: ${resp.item.title}`);
        setQuestionForm({
          taskCode: 'RA', section: 'Speaking', title: '', instruction: '', promptText: '',
          difficulty: 'medium', status: 'draft', optionsJson: '', answerKeyJson: '',
          sampleAnswer: '', explanation: '', promptHtml: '', audioUrl: '', imageUrl: '',
          passageText: '', tagsJson: '', source: '',
        });
        loadAdminTelemetry();
      }
    } catch (err: any) {
      setQuestionFormError(err.message || 'Failed to create question');
    }
  };

  const handleQuestionAction = async (id: string, action: 'publish' | 'draft' | 'archive') => {
    try {
      await apiFetch(`/api/admin/question-bank/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action === 'draft' ? 'draft' : action === 'publish' ? 'published' : 'archived' }),
      });
      loadAdminTelemetry();
    } catch (err: any) {
      console.error('Question action failed:', err);
    }
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
              { id: 'audit', label: 'Audit & Emails', icon: Shield },
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

            {/* Live background grading queue */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-[#0f1322] border-gray-850' : 'bg-white border-gray-200'}`}>
                <h3 className="text-xs font-bold uppercase tracking-widest font-mono text-gray-400 mb-4 flex justify-between items-center">
                  <span>Asynchronous Grading Worker Queue</span>
                  <span className="text-[10px] font-bold text-emerald-400 font-mono animate-pulse">● POLLING</span>
                </h3>
                <div className="space-y-2.5 max-h-48 overflow-y-auto custom-scrollbar">
                  {liveJobs.length === 0 ? (
                    <p className="text-xs text-gray-500 italic py-4 text-center">No active background jobs in queue.</p>
                  ) : (
                    liveJobs.map((job) => {
                      let submissionId = '';
                      let taskCode = '';
                      try {
                        const parsed = JSON.parse(job.data || '{}');
                        submissionId = parsed.submissionId || '';
                        taskCode = parsed.taskCode || '';
                      } catch (e) {}
                      
                      const jobIdStr = job.id || '';
                      const displayJobName = job.name === 'grade_submission' ? 'Grading Worker' : (job.name || 'Worker');
                      const displaySubInfo = submissionId 
                        ? `Submission #${submissionId.slice(-6)}` 
                        : 'System Maintenance';

                      return (
                        <div key={job.id} className="p-2.5 rounded-lg bg-gray-950/40 border border-gray-850 text-xs flex justify-between items-center">
                          <div>
                            <p className="font-bold">Job #{jobIdStr.slice(-6)} • {displayJobName}</p>
                            <span className="text-[9px] text-gray-500 font-mono">
                              {displaySubInfo} {taskCode ? `(${taskCode})` : ''}
                            </span>
                          </div>
                          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                            job.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-orange-500/10 text-orange-400 animate-pulse'
                          }`}>
                            {job.status}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Live server logs database */}
              <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-[#0f1322] border-gray-850' : 'bg-white border-gray-200'}`}>
                <h3 className="text-xs font-bold uppercase tracking-widest font-mono text-gray-400 mb-4">Live Database Audit System Logs</h3>
                <div className="space-y-2.5 max-h-48 overflow-y-auto custom-scrollbar font-mono text-[10px]">
                  {liveLogs.length === 0 ? (
                    <p className="text-xs text-gray-500 italic py-4 text-center">No system log logs retrieved.</p>
                  ) : (
                    liveLogs.slice(0, 8).map((log) => (
                      <div key={log.id} className="border-b border-gray-850/60 pb-1.5 last:border-0">
                        <div className="flex justify-between text-[9px] text-gray-500">
                          <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                          <span className={log.level === 'ERROR' ? 'text-red-400 font-bold' : log.level === 'WARN' ? 'text-yellow-400' : 'text-emerald-400'}>
                            [{log.level}]
                          </span>
                        </div>
                        <p className={`mt-0.5 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{log.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: QUESTION BANK MANAGER */}
        {activeTab === 'questions' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase tracking-widest font-mono text-gray-400">Question Bank CMS</h3>
              <button
                onClick={() => setShowAddQuestionModal(!showAddQuestionModal)}
                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> New Question
              </button>
            </div>

            {showAddQuestionModal && (
              <div className={`p-5 rounded-2xl border border-emerald-500/40 bg-emerald-500/5 mb-6 ${theme === 'dark' ? '' : 'bg-white border-emerald-200'}`}>
                {questionFormError && (
                  <div className="mb-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">{questionFormError}</div>
                )}
                {questionFormSuccess && (
                  <div className="mb-3 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">{questionFormSuccess}</div>
                )}
                <form onSubmit={handleAddQuestion} className="space-y-3">
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[9px] font-mono text-gray-400 mb-0.5">Task Code *</label>
                      <select value={questionForm.taskCode} onChange={(e) => {
                        const code = e.target.value;
                        const section = ['RA','RS','DI','RL','ASQ','SGD','RTS'].includes(code) ? 'Speaking' :
                          ['SWT','WE'].includes(code) ? 'Writing' :
                          ['MCS','MCM','ROP','FIBR','FIBRW'].includes(code) ? 'Reading' : 'Listening';
                        setQuestionForm({ ...questionForm, taskCode: code, section });
                      }} className="w-full px-2 py-1.5 rounded text-xs bg-gray-950 border border-gray-850 text-white">
                        <option value="RA">RA - Read Aloud</option><option value="RS">RS - Repeat Sentence</option>
                        <option value="DI">DI - Describe Image</option><option value="RL">RL - Retell Lecture</option>
                        <option value="ASQ">ASQ - Answer Short Question</option><option value="SGD">SGD - Summarize Group Discussion</option>
                        <option value="RTS">RTS - Respond to a Situation</option><option value="SWT">SWT - Summarize Written Text</option>
                        <option value="WE">WE - Write Essay</option><option value="MCS">MCS - Multiple Choice (Single)</option>
                        <option value="MCM">MCM - Multiple Choice (Multiple)</option><option value="ROP">ROP - Re-order Paragraphs</option>
                        <option value="FIBR">FIBR - Fill in the Blanks (R)</option><option value="FIBRW">FIBRW - Fill in the Blanks (RW)</option>
                        <option value="SST">SST - Summarize Spoken Text</option><option value="MCMSL">MCMSL - Multiple Choice (L)</option>
                        <option value="FIBL">FIBL - Fill in the Blanks (L)</option><option value="HCS">HCS - Highlight Correct Summary</option>
                        <option value="MCSSL">MCSSL - Multiple Choice Single (L)</option><option value="SMW">SMW - Select Missing Word</option>
                        <option value="HIW">HIW - Highlight Incorrect Words</option><option value="WFD">WFD - Write from Dictation</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-gray-400 mb-0.5">Section</label>
                      <input readOnly value={questionForm.section} className="w-full px-2 py-1.5 rounded text-xs bg-gray-950 border border-gray-850 text-gray-400" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-gray-400 mb-0.5">Difficulty *</label>
                      <select value={questionForm.difficulty} onChange={(e) => setQuestionForm({ ...questionForm, difficulty: e.target.value })} className="w-full px-2 py-1.5 rounded text-xs bg-gray-950 border border-gray-850 text-white">
                        <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono text-gray-400 mb-0.5">Title *</label>
                    <input required value={questionForm.title} onChange={(e) => setQuestionForm({ ...questionForm, title: e.target.value })} placeholder="e.g. Urban Sustainability Debate" className="w-full px-3 py-1.5 rounded text-xs bg-gray-950 border border-gray-850 text-white" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono text-gray-400 mb-0.5">Instruction *</label>
                    <input required value={questionForm.instruction} onChange={(e) => setQuestionForm({ ...questionForm, instruction: e.target.value })} placeholder="e.g. Read the passage aloud with proper pronunciation" className="w-full px-3 py-1.5 rounded text-xs bg-gray-950 border border-gray-850 text-white" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono text-gray-400 mb-0.5">Prompt Text *</label>
                    <textarea required value={questionForm.promptText} onChange={(e) => setQuestionForm({ ...questionForm, promptText: e.target.value })} placeholder="The full question prompt text..." rows={3} className="w-full px-3 py-1.5 rounded text-xs bg-gray-950 border border-gray-850 text-white resize-none" />
                  </div>
                  <details className="text-xs text-gray-500">
                    <summary className="cursor-pointer py-1">Optional Fields</summary>
                    <div className="grid sm:grid-cols-2 gap-3 mt-2">
                      <div>
                        <label className="block text-[9px] font-mono text-gray-400 mb-0.5">Sample Answer</label>
                        <textarea value={questionForm.sampleAnswer} onChange={(e) => setQuestionForm({ ...questionForm, sampleAnswer: e.target.value })} placeholder="Model answer text..." rows={2} className="w-full px-3 py-1.5 rounded text-xs bg-gray-950 border border-gray-850 text-white resize-none" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-gray-400 mb-0.5">Explanation</label>
                        <textarea value={questionForm.explanation} onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })} placeholder="Reasons for the answer..." rows={2} className="w-full px-3 py-1.5 rounded text-xs bg-gray-950 border border-gray-850 text-white resize-none" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-gray-400 mb-0.5">Options JSON</label>
                        <textarea value={questionForm.optionsJson} onChange={(e) => setQuestionForm({ ...questionForm, optionsJson: e.target.value })} placeholder='["Option A", "Option B"]' rows={2} className="w-full px-3 py-1.5 rounded text-xs bg-gray-950 border border-gray-850 text-white resize-none" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-gray-400 mb-0.5">Answer Key JSON</label>
                        <textarea value={questionForm.answerKeyJson} onChange={(e) => setQuestionForm({ ...questionForm, answerKeyJson: e.target.value })} placeholder='{"correct": "A"}' rows={2} className="w-full px-3 py-1.5 rounded text-xs bg-gray-950 border border-gray-850 text-white resize-none" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-gray-400 mb-0.5">Tags JSON</label>
                        <input value={questionForm.tagsJson} onChange={(e) => setQuestionForm({ ...questionForm, tagsJson: e.target.value })} placeholder='["academic","science"]' className="w-full px-3 py-1.5 rounded text-xs bg-gray-950 border border-gray-850 text-white" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-gray-400 mb-0.5">Source</label>
                        <input value={questionForm.source} onChange={(e) => setQuestionForm({ ...questionForm, source: e.target.value })} placeholder="original_sample" className="w-full px-3 py-1.5 rounded text-xs bg-gray-950 border border-gray-850 text-white" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-gray-400 mb-0.5">Status</label>
                        <select value={questionForm.status} onChange={(e) => setQuestionForm({ ...questionForm, status: e.target.value })} className="w-full px-2 py-1.5 rounded text-xs bg-gray-950 border border-gray-850 text-white">
                          <option value="draft">Draft</option><option value="published">Published</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-gray-400 mb-0.5">Audio URL</label>
                        <input value={questionForm.audioUrl} onChange={(e) => setQuestionForm({ ...questionForm, audioUrl: e.target.value })} placeholder="/uploads/sample.wav" className="w-full px-3 py-1.5 rounded text-xs bg-gray-950 border border-gray-850 text-white" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-gray-400 mb-0.5">Image URL</label>
                        <input value={questionForm.imageUrl} onChange={(e) => setQuestionForm({ ...questionForm, imageUrl: e.target.value })} placeholder="/uploads/sample.png" className="w-full px-3 py-1.5 rounded text-xs bg-gray-950 border border-gray-850 text-white" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-gray-400 mb-0.5">Passage Text</label>
                        <textarea value={questionForm.passageText} onChange={(e) => setQuestionForm({ ...questionForm, passageText: e.target.value })} placeholder="Longer passage text..." rows={2} className="w-full px-3 py-1.5 rounded text-xs bg-gray-950 border border-gray-850 text-white resize-none" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-gray-400 mb-0.5">Prompt HTML</label>
                        <textarea value={questionForm.promptHtml} onChange={(e) => setQuestionForm({ ...questionForm, promptHtml: e.target.value })} placeholder="<p>Formatted prompt</p>" rows={2} className="w-full px-3 py-1.5 rounded text-xs bg-gray-950 border border-gray-850 text-white resize-none" />
                      </div>
                    </div>
                  </details>
                  <div className="flex gap-2 pt-2">
                    <button type="submit" className="flex-1 py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600">Save Question</button>
                    <button type="button" onClick={() => setShowAddQuestionModal(false)} className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-xs">Cancel</button>
                  </div>
                </form>
              </div>
            )}

            <div className={`overflow-hidden rounded-2xl border ${theme === 'dark' ? 'bg-[#0f1322] border-gray-850' : 'bg-white border-gray-200 shadow-sm'}`}>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b font-mono text-gray-500 uppercase tracking-wider text-[10px] ${theme === 'dark' ? 'bg-gray-950/40 border-gray-850' : 'bg-gray-50 border-gray-200'}`}>
                    <th className="p-4">Title</th>
                    <th className="p-4">Task</th>
                    <th className="p-4">Section</th>
                    <th className="p-4">Difficulty</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-850">
                  {questionBankItems.length === 0 && (
                    <tr><td colSpan={6} className="p-8 text-center text-gray-500 text-xs">No items yet. Create your first question above.</td></tr>
                  )}
                  {questionBankItems.map((q: any) => (
                    <tr key={q.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-bold max-w-xs truncate">{q.title}</td>
                      <td className="p-4 font-mono"><span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">{q.taskCode}</span></td>
                      <td className="p-4 text-gray-400">{q.section}</td>
                      <td className="p-4 font-mono text-gray-400 capitalize">{q.difficulty}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          q.status === 'published' ? 'bg-green-500/10 text-green-400' :
                          q.status === 'archived' ? 'bg-gray-500/10 text-gray-400' :
                          'bg-yellow-500/10 text-yellow-400'
                        }`}>{q.status}</span>
                      </td>
                      <td className="p-4 text-right space-x-1">
                        {q.status !== 'published' && (
                          <button onClick={() => handleQuestionAction(q.id, 'publish')} className="p-1.5 bg-green-500/10 hover:bg-green-500 text-green-400 hover:text-white rounded-lg transition-colors cursor-pointer" title="Publish">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {q.status === 'published' && (
                          <button onClick={() => handleQuestionAction(q.id, 'draft')} className="p-1.5 bg-yellow-500/10 hover:bg-yellow-500 text-yellow-400 hover:text-white rounded-lg transition-colors cursor-pointer" title="Unpublish">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {q.status !== 'archived' && (
                          <button onClick={() => handleQuestionAction(q.id, 'archive')} className="p-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg transition-colors cursor-pointer" title="Archive">
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        )}
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

        {/* TAB 4.5: AUDIT & EMAIL AUTOMATION LOGS */}
        {activeTab === 'audit' && (
          <div className="grid lg:grid-cols-12 gap-8">
            {/* Left: Administrative Audit Log */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest font-mono text-gray-400">System Audit Trails</h3>
              <div className={`p-6 rounded-3xl border space-y-4 ${theme === 'dark' ? 'bg-[#0f1322] border-gray-850' : 'bg-white border-gray-200'}`}>
                <p className="text-xs text-gray-500">Live transaction records tracking student billing tier updates, coupon activations, and manual backups.</p>
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {auditLogsList.length === 0 ? (
                    <p className="text-xs text-gray-500 italic py-6 text-center">No transactions recorded in system database.</p>
                  ) : (
                    auditLogsList.map((log) => (
                      <div key={log.id} className="p-3 bg-gray-950/40 border border-gray-850 rounded-xl space-y-1.5 font-mono text-[10px]">
                        <div className="flex justify-between text-gray-500">
                          <span className="font-bold text-emerald-400 uppercase">[{log.category || 'General'}] {log.action}</span>
                          <span>{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-gray-300 text-xs font-sans leading-relaxed">{log.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right: Automated Emails Delivery Log */}
            <div className="lg:col-span-5 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest font-mono text-gray-400">Automated Emails Log</h3>
              <div className={`p-6 rounded-3xl border space-y-4 ${theme === 'dark' ? 'bg-[#0f1322] border-gray-850' : 'bg-white border-gray-200'}`}>
                <p className="text-xs text-gray-500">Outbox tracking of automated mail triggers (registration verification, invoice PDFs, assessment grading alerts).</p>
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar font-mono text-[10px]">
                  {[
                    { recipient: 'heidi.dang.dev@gmail.com', template: 'welcome_verification_code.html', trigger: 'USER_REGISTRATION', status: 'DELIVERED', time: '10 mins ago' },
                    { recipient: 'alex.mercer@gmail.com', template: 'homework_feedback_graded.html', trigger: 'TEACHER_GRADE_SUBMISSION', status: 'DELIVERED', time: '1 hour ago' },
                    { recipient: 'heidi.dang.dev@gmail.com', template: 'premium_invoice_inv_2026_901.html', trigger: 'SUBSCRIPTION_COMPLETED', status: 'DELIVERED', time: '2 hours ago' },
                    { recipient: 'lisa.vance@gmail.com', template: 'weekly_cohort_report_digest.html', trigger: 'COHORT_DIGEST_CHRON', status: 'DELIVERED', time: '1 day ago' },
                    { recipient: 'heidi.dang.dev@gmail.com', template: 'mock_exam_completion_alert.html', trigger: 'MOCK_EXAM_SUBMITTED', status: 'DELIVERED', time: '2 days ago' }
                  ].map((mail, idx) => (
                    <div key={idx} className="p-3 bg-gray-950/40 border border-gray-850 rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-gray-500">
                        <span>{mail.time}</span>
                        <span className="text-emerald-400 font-bold px-1.5 py-0.5 bg-emerald-500/10 rounded uppercase text-[8px] tracking-wider">
                          {mail.status}
                        </span>
                      </div>
                      <div>
                        <p className="text-gray-300 font-sans font-bold text-xs truncate">{mail.recipient}</p>
                        <p className="text-[9px] text-gray-500 mt-1">
                          Template: <span className="text-gray-400">{mail.template}</span>
                        </p>
                        <p className="text-[9px] text-gray-500">
                          Trigger: <span className="text-teal-400">{mail.trigger}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SYSTEM SETTINGS & UTILITIES */}
        {activeTab === 'settings' && (
          <div className="space-y-8">
            <h3 className="text-sm font-bold uppercase tracking-widest font-mono text-gray-400">Administrative Console & Utilities</h3>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Coupon Creator */}
              <div className={`p-6 sm:p-8 rounded-3xl border space-y-5 ${theme === 'dark' ? 'bg-[#0f1322] border-gray-850' : 'bg-white border-gray-200'}`}>
                <div className="border-b border-gray-850 pb-3">
                  <h4 className="text-sm font-bold">Coupon Code Generator</h4>
                  <p className="text-xs text-gray-500 mt-1">Generate promotional and teacher referral discount codes.</p>
                </div>

                <form onSubmit={handleCreateCoupon} className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-mono uppercase text-gray-400">Promo Code</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. LAUNCH30"
                      value={newCouponCode}
                      onChange={(e) => setNewCouponCode(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-950 border border-gray-850 rounded-xl text-xs text-white uppercase focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-mono uppercase text-gray-400">Discount Percent (%)</label>
                      <input
                        required
                        type="number"
                        min={5}
                        max={100}
                        value={newCouponDiscount}
                        onChange={(e) => setNewCouponDiscount(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-gray-950 border border-gray-850 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] font-mono uppercase text-gray-400">Max Active Redemptions</label>
                      <input
                        required
                        type="number"
                        min={1}
                        max={1000}
                        value={newCouponMaxUses}
                        onChange={(e) => setNewCouponMaxUses(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-gray-950 border border-gray-850 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {couponError && <p className="text-[10px] text-rose-400 font-mono">{couponError}</p>}
                  {couponSuccess && <p className="text-[10px] text-emerald-400 font-mono font-bold">{couponSuccess}</p>}

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
                  >
                    Deploy Promo Code
                  </button>
                </form>

                {/* Active coupons */}
                <div className="pt-4 border-t border-gray-850/60 space-y-3">
                  <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider font-bold">ACTIVE DEPLOYED COUPONS:</p>
                  <div className="space-y-2 max-h-36 overflow-y-auto custom-scrollbar">
                    {coupons.length === 0 ? (
                      <p className="text-xs text-gray-500 italic">No coupons active.</p>
                    ) : (
                      coupons.map((cp) => (
                        <div key={cp.id} className="p-2.5 rounded-lg bg-gray-950/40 border border-gray-850 text-xs flex justify-between items-center font-mono">
                          <div>
                            <span className="font-bold text-emerald-400">{cp.code}</span>
                            <span className="text-gray-400 ml-2">({cp.discountPercent}% off)</span>
                          </div>
                          <span className="text-gray-500 text-[10px]">
                            Used: {cp.usedCount || 0} / {cp.maxUses}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Database Backups Console */}
              <div className={`p-6 sm:p-8 rounded-3xl border space-y-5 ${theme === 'dark' ? 'bg-[#0f1322] border-[#1d263b]' : 'bg-white border-gray-200'}`}>
                <div className="border-b border-gray-850 pb-3">
                  <h4 className="text-sm font-bold">SQLite Backup & Snapshot Console</h4>
                  <p className="text-xs text-gray-500 mt-1">Take on-demand database snapshots and manage restore archives.</p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleTriggerBackup}
                    disabled={isBackupLoading}
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/10"
                  >
                    {isBackupLoading ? 'Creating snapshot...' : 'Trigger Secure DB Snapshot'}
                  </button>
                  {backupSuccessMessage && (
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
                      {backupSuccessMessage}
                    </div>
                  )}
                </div>

                {/* Backups List */}
                <div className="pt-4 border-t border-[#1d263b] space-y-3">
                  <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider font-bold">SNAPSHOT REPOSITORY HISTORY:</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar font-mono text-[10px]">
                    {backupsList.length === 0 ? (
                      <p className="text-xs text-gray-500 italic">No snapshots available in storage directory.</p>
                    ) : (
                      backupsList.map((bk, idx) => (
                        <div key={idx} className="p-2 bg-gray-950/40 border border-gray-850 rounded-lg flex justify-between items-center text-gray-400">
                          <span className="truncate max-w-xs">{bk.filename}</span>
                          <span className="text-emerald-400 shrink-0">{bk.size}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* General Settings Controls */}
            <div className={`p-6 sm:p-8 rounded-3xl border space-y-6 ${theme === 'dark' ? 'bg-[#0f1322] border-gray-850' : 'bg-white border-gray-200 shadow-sm'}`}>
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
