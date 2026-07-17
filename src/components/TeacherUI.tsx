/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useGlobalContext } from './ThemeContext';
import { STUDENT_LIST } from '../data/mockData';
import { Submission } from '../types';
import { Award, Users, FileText, CheckCircle, PlusCircle, Volume2, Star, Send, Play, ClipboardList, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export const TeacherUI: React.FC = () => {
  const { theme, apiFetch, role } = useGlobalContext();
  const [activeTab, setActiveTab] = useState<'queue' | 'students' | 'customTask' | 'analytics'>('queue');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [students, setStudents] = useState<any[]>(STUDENT_LIST);
  const [activeSubId, setActiveSubId] = useState<string | null>(null);

  // Custom task form states
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCode, setTaskCode] = useState('RA');
  const [taskSection, setTaskSection] = useState('Speaking');
  const [taskPrompt, setTaskPrompt] = useState('');
  const [taskSample, setTaskSample] = useState('');
  const [isTaskSubmitting, setIsTaskSubmitting] = useState(false);
  const [taskSuccess, setTaskSuccess] = useState('');
  const [taskError, setTaskError] = useState('');
  const [deployedTasks, setDeployedTasks] = useState<any[]>([]);

  // Interactive grading state
  const [gradeScore, setGradeScore] = useState(75);
  const [gradeFluency, setGradeFluency] = useState(80);
  const [gradePronunciation, setGradePronunciation] = useState(70);
  const [gradeComment, setGradeComment] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Fetch real submissions & student roster on mount
  const loadTeacherData = async () => {
    if (role !== 'teacher' && role !== 'admin') return;
    try {
      const subsData = await apiFetch('/api/teacher/submissions');
      const mappedSubs = subsData.map((s: any) => ({
        id: s.id,
        code: s.taskCode,
        studentName: s.user?.name || 'Student',
        taskTitle: s.title,
        submittedAt: new Date(s.submittedAt).toLocaleString(),
        answerText: s.answerText,
        status: s.status,
        score: s.score || 0,
        feedback: s.feedback || '',
        section: s.section,
      }));
      setSubmissions(mappedSubs);
      if (mappedSubs.length > 0 && !activeSubId) {
        setActiveSubId(mappedSubs[0].id);
      }

      const rosterData = await apiFetch('/api/teacher/students');
      if (rosterData && rosterData.length > 0) {
        setStudents(rosterData);
      }

      // Fetch already deployed custom tasks
      const deployed = await apiFetch('/api/student/custom-questions');
      setDeployedTasks(deployed);
    } catch (err) {
      console.error('Failed to load teacher data:', err);
    }
  };

  useEffect(() => {
    loadTeacherData();
  }, [apiFetch, role]);

  const handleCreateCustomTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTaskSubmitting(true);
    setTaskSuccess('');
    setTaskError('');

    try {
      const response = await apiFetch('/api/teacher/custom-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskTitle,
          taskCode,
          section: taskSection,
          promptText: taskPrompt,
          sampleAnswer: taskSample,
        }),
      });

      if (response.success) {
        setTaskSuccess('Academic PTE task has been successfully generated and published to all students!');
        setTaskTitle('');
        setTaskPrompt('');
        setTaskSample('');
        // Reload deployed list
        await loadTeacherData();
      }
    } catch (err: any) {
      setTaskError(err.message || 'Failed to deploy custom academic question.');
    } finally {
      setIsTaskSubmitting(false);
    }
  };

  const selectedSub = submissions.find((s) => s.id === activeSubId);
  const pendingCount = submissions.filter((s) => s.status === 'pending').length;

  const handleSelectPresetComment = (comment: string) => {
    setGradeComment((prev) => (prev ? prev + ' ' + comment : comment));
  };

  const handleSubmitGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubId) return;

    try {
      await apiFetch('/api/teacher/grade', {
        method: 'PUT',
        body: JSON.stringify({
          submissionId: activeSubId,
          score: gradeScore,
          feedback: gradeComment || 'Excellent layout structure and lexical alignment.',
        }),
      });

      // Reload fresh submissions list
      await loadTeacherData();

      setShowToast(true);
      setGradeComment('');
      setTimeout(() => {
        setShowToast(false);
        const nextPending = submissions.find((s) => s.id !== activeSubId && s.status === 'pending');
        if (nextPending) {
          setActiveSubId(nextPending.id);
        }
      }, 1500);
    } catch (err) {
      console.error('Failed to submit grade metrics:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex flex-col lg:flex-row gap-8">
      {/* Teacher Navigation & Sub tabs */}
      <div className="lg:w-1/5 space-y-4">
        <div className={`p-5 rounded-3xl border ${theme === 'dark' ? 'bg-[#0f1322] border-gray-850' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-2 mb-4 border-b border-gray-850 pb-3">
            <ClipboardList className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold font-mono tracking-widest uppercase text-gray-300">TEACHER PORTAL</h2>
          </div>
          <div className="space-y-1">
            <button
              onClick={() => setActiveTab('queue')}
              className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'queue'
                  ? 'bg-emerald-500 text-white shadow font-bold'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                <span>Homework Queue</span>
              </div>
              {pendingCount > 0 && (
                <span className="text-[10px] bg-red-500 text-white font-black font-mono w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
                activeTab === 'students'
                  ? 'bg-emerald-500 text-white shadow font-bold'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Assigned Students</span>
            </button>
            <button
              onClick={() => setActiveTab('customTask')}
              className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
                activeTab === 'customTask'
                  ? 'bg-emerald-500 text-white shadow font-bold'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Publish Custom Task</span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-emerald-500 text-white shadow font-bold'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Cohort Analytics</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main evaluation view */}
      <div className="flex-1 space-y-6">
        {/* TAB 1: GRADING QUEUE */}
        {activeTab === 'queue' && (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left list: Submissions lists */}
            <div className="lg:col-span-1 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest font-mono text-gray-400">Submissions</h3>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {submissions.map((sub) => (
                  <div
                    key={sub.id}
                    onClick={() => setActiveSubId(sub.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      activeSubId === sub.id
                        ? 'border-emerald-500 bg-emerald-500/5'
                        : theme === 'dark' ? 'bg-gray-950/40 border-gray-850 hover:bg-gray-900' : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] font-mono tracking-wider bg-gray-800 text-gray-400 px-2 py-0.5 rounded uppercase font-bold">
                        {sub.code}
                      </span>
                      <span className={`text-[9px] font-mono font-bold uppercase ${
                        sub.status === 'pending' ? 'text-red-400' : 'text-emerald-400'
                      }`}>
                        {sub.status}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold truncate">{sub.studentName}</h4>
                    <p className="text-[10px] text-gray-500 font-mono mt-1 truncate">{sub.taskTitle}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right details: Active grading sheet */}
            <div className="lg:col-span-2">
              {showToast && (
                <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 animate-bounce">
                  <CheckCircle className="w-4 h-4" /> Homework submission evaluated and recorded successfully!
                </div>
              )}

              {selectedSub ? (
                <div className={`p-6 sm:p-8 rounded-3xl border space-y-6 ${theme === 'dark' ? 'bg-[#0f1322] border-gray-850' : 'bg-white border-gray-200'}`}>
                  {/* Student details header */}
                  <div className="flex justify-between items-start border-b border-gray-850 pb-4">
                    <div>
                      <span className="text-[9px] font-mono tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-bold uppercase">STUDENT HOMEWORK</span>
                      <h3 className="text-base font-bold mt-2">{selectedSub.studentName}</h3>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">{selectedSub.taskTitle} • {selectedSub.submittedAt}</p>
                    </div>
                  </div>

                  {/* Student response detail (text area or voice waveform) */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-widest font-mono text-gray-400">Student Response Answer</h4>
                    {selectedSub.section === 'Speaking' ? (
                      /* Audio Player wave simulator for speech tasks */
                      <div className={`p-4 rounded-xl border flex items-center gap-4 ${theme === 'dark' ? 'bg-gray-950/60 border-gray-850' : 'bg-gray-100 border-gray-200'}`}>
                        <button className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:scale-105 transition-transform cursor-pointer">
                          <Play className="w-4 h-4 fill-white ml-0.5" />
                        </button>
                        <div>
                          <p className="text-xs font-bold">VoiceRecording_AlexMercer_RA01.wav</p>
                          <span className="text-[10px] text-gray-500 font-mono">Format: standard WAV | duration: 24 seconds</span>
                        </div>
                      </div>
                    ) : (
                      /* Text snippet display for essay writings */
                      <p className={`p-4 rounded-xl border text-xs leading-relaxed whitespace-pre-wrap ${theme === 'dark' ? 'bg-gray-950 text-gray-300 border-gray-850' : 'bg-gray-50 text-gray-700'}`}>
                        "{selectedSub.answerText}"
                      </p>
                    )}
                  </div>

                  {/* Grading controllers */}
                  {selectedSub.status === 'pending' ? (
                    <form onSubmit={handleSubmitGrade} className="space-y-5 border-t border-gray-850 pt-5">
                      <h4 className="text-xs font-bold uppercase tracking-widest font-mono text-gray-400">Grading & Metric Evaluation</h4>

                      <div className="grid sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase font-mono text-gray-400 mb-1">Overall Band (0-90)</label>
                          <input
                            required
                            type="number"
                            min={10}
                            max={90}
                            value={gradeScore}
                            onChange={(e) => setGradeScore(Number(e.target.value))}
                            className="w-full px-3 py-1.5 rounded-lg text-xs bg-gray-950 border border-gray-850 text-white focus:outline-none"
                          />
                        </div>
                        {selectedSub.section === 'Speaking' && (
                          <>
                            <div>
                              <label className="block text-[10px] uppercase font-mono text-gray-400 mb-1">Oral Fluency (0-90)</label>
                              <input
                                required
                                type="number"
                                min={10}
                                max={90}
                                value={gradeFluency}
                                onChange={(e) => setGradeFluency(Number(e.target.value))}
                                className="w-full px-3 py-1.5 rounded-lg text-xs bg-gray-950 border border-gray-850 text-white focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] uppercase font-mono text-gray-400 mb-1">Pronunciation (0-90)</label>
                              <input
                                required
                                type="number"
                                min={10}
                                max={90}
                                value={gradePronunciation}
                                onChange={(e) => setGradePronunciation(Number(e.target.value))}
                                className="w-full px-3 py-1.5 rounded-lg text-xs bg-gray-950 border border-gray-850 text-white focus:outline-none"
                              />
                            </div>
                          </>
                        )}
                      </div>

                      {/* Comment section */}
                      <div className="space-y-2">
                        <label className="block text-[10px] uppercase font-mono text-gray-400">Teacher Evaluation Comments</label>
                        <textarea
                          rows={4}
                          value={gradeComment}
                          onChange={(e) => setGradeComment(e.target.value)}
                          placeholder="Provide specific, actionable diagnostic critique regarding vocabulary, pacing, or spellings..."
                          className={`w-full p-3 rounded-lg text-xs border focus:outline-none ${
                            theme === 'dark' ? 'bg-gray-950 border-gray-850 text-white' : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                        {/* Preset commentaries selectors */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {['Excellent oral phrasing!', 'Watch spelling plural forms.', 'Syntactic range is exceptional.', 'Minor pitch drop at consonants.'].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => handleSelectPresetComment(preset)}
                              className="px-2 py-1 bg-gray-800 text-gray-400 hover:text-white rounded text-[9px] font-mono transition-colors"
                            >
                              + {preset}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        Submit Grade Evaluation <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  ) : (
                    /* Display already graded reports */
                    <div className="space-y-4 border-t border-gray-850 pt-5">
                      <div className="flex items-center gap-2 text-emerald-400">
                        <CheckCircle className="w-5 h-5" />
                        <h4 className="text-xs font-bold uppercase tracking-widest font-mono">Feedback Transmitted</h4>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-gray-950/60 border-gray-850' : 'bg-gray-50 border-gray-200'}`}>
                          <p className="text-[10px] font-mono text-gray-500">Graded Score</p>
                          <p className="text-2xl font-black text-emerald-400 font-mono mt-1">{selectedSub.score} / 90</p>
                        </div>
                        <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-gray-950/60 border-gray-850' : 'bg-gray-50 border-gray-200'}`}>
                          <p className="text-[10px] font-mono text-gray-500">Criteria Standards</p>
                          <p className="text-xs font-bold text-emerald-400 mt-1">Spelling Range Acceptable</p>
                        </div>
                      </div>
                      <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-gray-950/60 border-gray-850' : 'bg-gray-50 border-gray-200'}`}>
                        <p className="text-[10px] font-mono text-gray-500">Feedback Critique</p>
                        <p className="text-xs mt-1.5 leading-relaxed">{selectedSub.feedback}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-20 text-gray-500">
                  <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-sm">No active submission selected from the queue.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ASSIGNED STUDENTS LIST */}
        {activeTab === 'students' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest font-mono text-gray-400">Your Student Roster</h3>
            <div className={`overflow-hidden rounded-2xl border ${theme === 'dark' ? 'bg-[#0f1322] border-gray-850' : 'bg-white border-gray-200 shadow-sm'}`}>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b font-mono text-gray-500 uppercase tracking-wider text-[10px] ${theme === 'dark' ? 'bg-gray-950/40 border-gray-850' : 'bg-gray-50 border-gray-200'}`}>
                    <th className="p-4">Name</th>
                    <th className="p-4">Target Band</th>
                    <th className="p-4">Current Average</th>
                    <th className="p-4">Last Activity</th>
                    <th className="p-4">Assigned Plan</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-850">
                  {students.map((st) => (
                    <tr key={st.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-bold">{st.name}</td>
                      <td className="p-4 font-mono text-emerald-400 font-bold">PTE {st.targetScore}</td>
                      <td className="p-4 font-mono">{st.currentAvg || st.score || 70} / 90</td>
                      <td className="p-4 text-gray-400">{st.lastActive || 'Today'}</td>
                      <td className="p-4 text-gray-400 font-mono">{st.subscription || 'Premium Plan'}</td>
                      <td className="p-4 text-right">
                        <button className="text-emerald-400 font-bold hover:underline cursor-pointer">
                          Message student
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: PUBLISH CUSTOM PRACTICE TASKS */}
        {activeTab === 'customTask' && (
          <div className="grid lg:grid-cols-12 gap-8">
            {/* Form */}
            <div className="lg:col-span-7">
              <form onSubmit={handleCreateCustomTask} className={`p-6 sm:p-8 rounded-3xl border space-y-5 ${theme === 'dark' ? 'bg-[#0f1322] border-gray-850' : 'bg-white border-gray-200'}`}>
                <div className="border-b border-gray-850 pb-3">
                  <h3 className="text-base font-bold">Deploy Custom Academic Task</h3>
                  <p className="text-xs text-gray-500 mt-1">Deploy custom items directly to your student practice lists.</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-mono uppercase text-gray-400">Task Title</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Technological singularity essay"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-950 border border-gray-850 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-mono uppercase text-gray-400">Task Format Code</label>
                    <select
                      value={taskCode}
                      onChange={(e) => setTaskCode(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-950 border border-gray-850 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="RA">Read Aloud (RA)</option>
                      <option value="WE">Write Essay (WE)</option>
                      <option value="DI">Describe Image (DI)</option>
                      <option value="FIB">Fill in Blanks (FIB)</option>
                      <option value="ROP">Re-order Paragraphs (ROP)</option>
                      <option value="SST">Summarize Spoken Text (SST)</option>
                      <option value="WFD">Write From Dictation (WFD)</option>
                    </select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-mono uppercase text-gray-400">PTE Section</label>
                    <select
                      value={taskSection}
                      onChange={(e) => setTaskSection(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-950 border border-gray-850 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Speaking">Speaking</option>
                      <option value="Writing">Writing</option>
                      <option value="Reading">Reading</option>
                      <option value="Listening">Listening</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-mono uppercase text-gray-400">Academic Prompt PromptText</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Provide the textual stimulus or instructions for the student..."
                    value={taskPrompt}
                    onChange={(e) => setTaskPrompt(e.target.value)}
                    className="w-full p-3 bg-gray-950 border border-gray-850 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-mono uppercase text-gray-400">Sample High-Score Answer (For AI calibration reference)</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Provide the benchmark answer reference used by DeepSeek AI model..."
                    value={taskSample}
                    onChange={(e) => setTaskSample(e.target.value)}
                    className="w-full p-3 bg-gray-950 border border-gray-850 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {taskError && <p className="text-[10px] text-rose-400 font-mono">{taskError}</p>}
                {taskSuccess && <p className="text-[10px] text-emerald-400 font-mono font-bold">{taskSuccess}</p>}

                <button
                  type="submit"
                  disabled={isTaskSubmitting}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/10"
                >
                  Publish & Deploy Task
                </button>
              </form>
            </div>

            {/* Currently Deployed */}
            <div className="lg:col-span-5 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest font-mono text-gray-400">Currently Deployed Questions</h3>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {deployedTasks.length === 0 ? (
                  <div className="p-8 rounded-2xl border border-dashed border-gray-800 text-center text-gray-500 text-xs">
                    No custom academic items have been deployed yet.
                  </div>
                ) : (
                  deployedTasks.map((t) => (
                    <div key={t.id} className="p-4 rounded-xl border border-gray-850 bg-gray-900/10 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[8px] font-mono tracking-widest bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded font-bold uppercase">
                          {t.taskCode}
                        </span>
                        <span className="text-[9px] text-gray-500 font-mono">
                          {new Date(t.createdAt || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white">{t.title}</h4>
                      <p className="text-[10px] text-gray-400 line-clamp-2">{t.promptText}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: COHORT ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'COHORT AVG BAND', val: '73.2 / 90', change: '+2.4 pts', desc: 'Avg score across active roster' },
                { label: 'PRACTICE SUBMISSIONS', val: submissions.length + ' tasks', change: 'Live', desc: 'Total submitted items' },
                { label: 'ASSIGNED STUDENTS', val: students.length + ' students', change: '+100%', desc: 'Active student licenses' },
                { label: 'CUSTOM DEPLOYED', val: deployedTasks.length + ' tasks', change: 'Active', desc: 'Custom published items' },
              ].map((stat, idx) => (
                <div key={idx} className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-[#0f1322] border-gray-850' : 'bg-white border-gray-200'}`}>
                  <p className="text-[8px] font-mono font-bold text-gray-500 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-xl font-black text-white font-mono mt-2">{stat.val}</p>
                  <span className="text-[9px] text-emerald-400 font-mono mt-0.5 block">{stat.change}</span>
                  <p className="text-[10px] text-gray-400 mt-2 leading-normal">{stat.desc}</p>
                </div>
              ))}
            </div>

            <div className={`p-6 sm:p-8 rounded-3xl border space-y-6 ${theme === 'dark' ? 'bg-[#0f1322] border-gray-850' : 'bg-white border-gray-200'}`}>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest font-mono text-gray-300">Cohort Target vs Actual Calibration</h3>
                <p className="text-xs text-gray-500 mt-1">Comparing each assigned student's target band score to their actual mock exam average.</p>
              </div>

              {/* Simple Tailwind Visual Chart */}
              <div className="space-y-4 pt-4 border-t border-gray-850/60">
                {students.map((st, index) => {
                  const target = st.targetScore || 79;
                  const current = st.currentAvg || st.score || 72;
                  const targetWidth = `${(target / 90) * 100}%`;
                  const currentWidth = `${(current / 90) * 100}%`;

                  return (
                    <div key={st.id || index} className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="font-bold text-gray-300">{st.name}</span>
                        <span className="text-gray-400">
                          Target: <strong className="text-emerald-400">PTE {target}</strong> | Current: <strong className="text-teal-400">{current}/90</strong>
                        </span>
                      </div>
                      <div className="h-5 w-full bg-gray-950 rounded-lg overflow-hidden relative flex flex-col justify-center">
                        {/* Target line block */}
                        <div
                          style={{ width: targetWidth }}
                          className="h-2 bg-emerald-500/10 border-r border-emerald-500/50 absolute top-0 left-0"
                        />
                        {/* Current bar block */}
                        <div
                          style={{ width: currentWidth }}
                          className="h-2 bg-teal-500 rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
