import React, { useState, useEffect } from 'react';
import { useGlobalContext } from './ThemeContext';
import { Award, BarChart, BookOpen, Clock, AlertTriangle, Lightbulb, RefreshCw, ChevronLeft } from 'lucide-react';
import { motion } from 'motion/react';

export const Reports: React.FC = () => {
  const { theme, apiFetch, role } = useGlobalContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [overview, setOverview] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [progress, setProgress] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [readiness, setReadiness] = useState<any>(null);
  const [testHistory, setTestHistory] = useState<any[]>([]);
  const [selectedAttempt, setSelectedAttempt] = useState<any | null>(null);

  const loadReports = async () => {
    if (role === 'guest') { setLoading(false); return; }
    setLoading(true);
    setError('');
    try {
      const [over, sec, tsk, prog, act, ready, history] = await Promise.all([
        apiFetch('/api/student/reports/overview'),
        apiFetch('/api/student/reports/sections'),
        apiFetch('/api/student/reports/tasks'),
        apiFetch('/api/student/reports/progress'),
        apiFetch('/api/student/reports/recent-activity'),
        apiFetch('/api/student/reports/readiness'),
        apiFetch('/api/student/mock-tests/attempts'),
      ]);
      setOverview(over);
      setSections(sec || []);
      setTasks(tsk || []);
      setProgress(prog);
      setActivity(act || []);
      setReadiness(ready);
      setTestHistory(history || []);
    } catch (err: any) {
      setError('Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReports(); }, [apiFetch, role]);

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-24 text-center text-gray-400">Loading reports...</div>;
  if (error) return (
    <div className="max-w-7xl mx-auto px-4 py-24 text-center">
      <p className="text-red-400 text-sm mb-4">{error}</p>
      <button onClick={loadReports} className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-semibold"><RefreshCw className="w-3.5 h-3.5 inline mr-1" /> Retry</button>
    </div>
  );

  const hasData = overview && (overview.scoredSubmissions > 0 || overview.completedTests > 0 || overview.completedLessons > 0);

  return (
    selectedAttempt ? (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-6">
        <button
          onClick={() => setSelectedAttempt(null)}
          className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:underline cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className={`p-6 rounded-3xl border shadow-xl ${
          theme === 'dark' ? 'bg-[#101424] border-gray-850 text-white' : 'bg-white border-gray-200 text-slate-950'
        }`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-800/20 pb-4 mb-4">
            <div>
              <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full font-bold uppercase font-sans">
                {selectedAttempt.type} Mock Exam
              </span>
              <h2 className="text-xl font-extrabold tracking-tight mt-1">{selectedAttempt.title}</h2>
              <p className="text-xs text-gray-500 mt-0.5">Submitted on {selectedAttempt.date}</p>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-[10px] font-mono text-gray-500">Overall Score</p>
              <p className="text-4xl font-black text-emerald-400 font-mono">{selectedAttempt.overallScore}/90</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 text-center text-xs font-mono">
            {[
              { label: 'Speaking', val: selectedAttempt.speakingScore },
              { label: 'Writing', val: selectedAttempt.writingScore },
              { label: 'Reading', val: selectedAttempt.readingScore },
              { label: 'Listening', val: selectedAttempt.listeningScore },
            ].map(sec => (
              <div key={sec.label} className="p-3 bg-gray-950/20 border border-gray-850 rounded-2xl">
                <span className="text-gray-500 text-[10px] uppercase font-bold">{sec.label}</span>
                <p className="text-lg font-bold text-emerald-400 mt-1">{sec.val}/90</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-base font-bold text-white border-b border-gray-850 pb-2">Question-by-Question Review</h3>
          {(() => {
            let questions: any[] = [];
            let answers: Record<string, string> = {};
            try {
              questions = typeof selectedAttempt.questionsJson === 'string'
                ? JSON.parse(selectedAttempt.questionsJson)
                : selectedAttempt.questionsJson || [];
              answers = typeof selectedAttempt.answersJson === 'string'
                ? JSON.parse(selectedAttempt.answersJson)
                : selectedAttempt.answersJson || {};
            } catch (e) {
              console.error(e);
            }

            const formatAnswer = (ans: string, taskCode: string) => {
              if (!ans) return <span className="text-gray-500 italic">No response provided.</span>;
              if (ans.startsWith('/uploads/')) {
                return (
                  <div className="mt-2">
                    <audio controls src={ans} className="w-full max-w-md" />
                  </div>
                );
              }
              try {
                const parsed = JSON.parse(ans);
                if (Array.isArray(parsed)) {
                  return <span className="font-mono text-emerald-400 font-bold">{parsed.join(' -> ')}</span>;
                }
                if (typeof parsed === 'object') {
                  return (
                    <div className="space-y-1">
                      {Object.entries(parsed).map(([k, v]: any) => (
                        <div key={k} className="text-xs">
                          Blank {Number(k) + 1}: <strong className="text-emerald-400">{v}</strong>
                        </div>
                      ))}
                    </div>
                  );
                }
              } catch {}
              return <p className="whitespace-pre-line font-sans text-gray-300 bg-gray-950/40 p-3 rounded-xl border border-gray-850">{ans}</p>;
            };

            return questions.map((q: any, idx: number) => {
              const taskCode = q.code || q.taskCode || 'RA';
              const promptText = q.promptText || q.passageText || '';
              const answer = answers[idx] || '';

              return (
                <div
                  key={idx}
                  className={`p-6 rounded-2xl border ${
                    theme === 'dark' ? 'bg-[#101424] border-gray-850 text-white' : 'bg-white border-gray-200 text-slate-950'
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded uppercase font-bold">
                        Q{idx + 1} ● {taskCode}
                      </span>
                      <h4 className="text-sm font-bold mt-1.5">{q.title || `Task item ${idx + 1}`}</h4>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 mt-2 bg-gray-950/20 border border-gray-850/55 p-3 rounded-xl leading-relaxed">
                    <span className="font-bold block text-gray-500 mb-0.5 text-[10px] uppercase tracking-wider">Prompt Context / Passage:</span>
                    {promptText}
                  </p>

                  <div className="grid md:grid-cols-2 gap-6 mt-4">
                    <div>
                      <span className="font-bold text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Your Response:</span>
                      {formatAnswer(answer, taskCode)}
                    </div>
                    <div>
                      {q.sampleAnswer && (
                        <>
                          <span className="font-bold text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Model / Sample Answer:</span>
                          <p className="text-xs text-gray-400 bg-gray-950/30 p-3 rounded-xl border border-gray-850 leading-relaxed font-sans">{q.sampleAnswer}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>
    ) : (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-8">
      <div className="border-b border-gray-800/40 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Practice Reports & Analytics</h1>
        <p className="text-xs text-gray-400 mt-1">Based on your practice submissions and mock test attempts.</p>
      </div>

      {!hasData ? (
        <div className="text-center py-16 text-gray-500">
          <BarChart className="w-12 h-12 mx-auto mb-4 text-gray-700" />
          <p className="text-sm">No report data available yet.</p>
          <p className="text-xs mt-1">Complete practice submissions and mock tests to see your analytics.</p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Scored', value: overview.scoredSubmissions || 0, color: 'emerald' },
              { label: 'Pending', value: overview.pendingSubmissions || 0, color: 'amber' },
              { label: 'Mock Tests', value: overview.completedTests || 0, color: 'blue' },
              { label: 'Lessons', value: overview.completedLessons || 0, color: 'purple' },
            ].map(c => (
              <div key={c.label} className={`p-4 rounded-2xl border text-center ${theme === 'dark' ? 'bg-[#101424] border-gray-850' : 'bg-white border-gray-200'}`}>
                <p className="text-[10px] font-mono uppercase text-gray-500">{c.label}</p>
                <p className={`text-2xl font-black text-${c.color}-400 mt-1`}>{c.value}</p>
              </div>
            ))}
          </div>

          {/* Task breakdown */}
          {tasks.length > 0 && (
            <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-[#101424] border-gray-850' : 'bg-white border-gray-200'}`}>
              <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-widest font-mono">Task Breakdown</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {tasks.map((t: any) => (
                  <div key={t.taskCode} className="flex items-center justify-between py-2 border-b border-gray-800/20 last:border-0 text-xs">
                    <div>
                      <span className="font-bold text-emerald-400">{t.taskCode}</span>
                      <span className="text-gray-500 ml-2">{t.section}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-gray-500">scored: {t.scored}</span>
                      {t.pending > 0 && <span className="text-amber-400">pending: {t.pending}</span>}
                      {t.averageScore != null && <span className="font-mono text-emerald-400">{t.averageScore}/90</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress trends */}
          {progress && (progress.practiceTrend?.length > 0 || progress.mockTrend?.length > 0) && (
            <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-[#101424] border-gray-850' : 'bg-white border-gray-200'}`}>
              <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-widest font-mono">Score Trends</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {progress.practiceTrend?.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Practice (avg/day)</p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {progress.practiceTrend.slice(-7).map((pt: any, i: number) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-gray-500">{pt.date}</span>
                          <span className="font-mono text-emerald-400">{pt.averageScore}/90 ({pt.count})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {progress.mockTrend?.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Mock Tests (avg/day)</p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {progress.mockTrend.slice(-7).map((mt: any, i: number) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-gray-500">{mt.date}</span>
                          <span className="font-mono text-emerald-400">{mt.averageScore}/90 ({mt.count})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {progress.pendingCount > 0 && <p className="text-xs text-amber-400 mt-3">{progress.pendingCount} submission(s) pending scoring.</p>}
            </div>
          )}

          {/* Mock Exam Attempts list */}
          {testHistory.length > 0 && (
            <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-[#101424] border-gray-850' : 'bg-white border-gray-200'}`}>
              <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-widest font-mono">Mock Exam Attempts</h3>
              <div className="space-y-4">
                {testHistory.map((h: any) => (
                  <div
                    key={h.id}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-3 border-b border-gray-800/20 last:border-0 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase">
                          {h.type}
                        </span>
                        <span className="text-gray-500 font-mono">{h.date}</span>
                      </div>
                      <h4 className="font-bold text-sm mt-1">{h.title}</h4>
                      <div className="flex gap-4 text-[10px] text-gray-400 font-mono pt-1.5">
                        {h.overallScore === 0 ? (
                          <span className="text-amber-400 font-bold animate-pulse">AI Grading in progress...</span>
                        ) : (
                          <>
                            <span>Speaking: <strong className="text-emerald-400">{h.speakingScore}</strong></span>
                            <span>Writing: <strong className="text-emerald-400">{h.writingScore}</strong></span>
                            <span>Reading: <strong className="text-emerald-400">{h.readingScore}</strong></span>
                            <span>Listening: <strong className="text-emerald-400">{h.listeningScore}</strong></span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-left sm:text-right">
                        <p className="text-[9px] text-gray-500 uppercase tracking-widest">Score</p>
                        {h.overallScore === 0 ? (
                          <span className="text-[10px] font-bold text-amber-400 uppercase animate-pulse">Pending</span>
                        ) : (
                          <span className="font-mono font-black text-emerald-400 text-lg">{h.overallScore}/90</span>
                        )}
                      </div>
                      {h.overallScore > 0 && (
                        <button
                          onClick={() => setSelectedAttempt(h)}
                          className="px-3.5 py-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl text-[10px] font-bold hover:bg-emerald-500 hover:text-white transition-all cursor-pointer"
                        >
                          Review Attempt
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sections */}
          {sections.length > 0 && (
            <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-[#101424] border-gray-850' : 'bg-white border-gray-200'}`}>
              <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-widest font-mono">Section Averages</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {sections.map((s: any) => (
                  <div key={s.section} className="flex items-center gap-3">
                    <span className="text-xs font-bold w-24">{s.section}</span>
                    <div className="flex-1 bg-gray-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full" style={{ width: `${(s.average / 90) * 100}%` }} />
                    </div>
                    <span className="text-xs font-mono text-emerald-400 w-16 text-right">{s.average}/90</span>
                    <span className="text-[10px] text-gray-500">({s.count})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Readiness */}
          {readiness && (
            <div className={`p-5 rounded-2xl border ${readiness.ready ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
              <div className="flex items-center gap-2 mb-2">
                {readiness.ready ? <Award className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-amber-400" />}
                <span className="text-xs font-bold uppercase tracking-widest font-mono text-gray-400">Readiness Estimate</span>
              </div>
              <p className="text-sm text-gray-300">{readiness.message}</p>
              {readiness.ready && readiness.estimatedScore != null && (
                <p className="text-2xl font-black text-emerald-400 mt-2">{readiness.estimatedScore}/90</p>
              )}
              <p className="text-[10px] text-gray-500 mt-2">
                Based on {readiness.submissionsCount} submissions and {readiness.mocksCount} mocks. Sections: {(readiness.sectionsWithData || []).join(', ') || 'none'}.
              </p>
            </div>
          )}

          {/* Recent Activity */}
          {activity.length > 0 && (
            <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-[#101424] border-gray-850' : 'bg-white border-gray-200'}`}>
              <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-widest font-mono flex items-center gap-2">
                <Clock className="w-4 h-4" /> Recent Activity
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {activity.slice(0, 8).map((a: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800/20 last:border-0 text-xs">
                    <div>
                      <span className="font-bold">{a.taskCode}</span>
                      <span className="text-gray-500 ml-2">{a.title?.substring(0, 30)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] ${a.status === 'graded' ? 'text-emerald-400' : 'text-amber-400'}`}>{a.status === 'graded' ? a.score + '/90' : 'pending'}</span>
                      <span className="text-gray-600 text-[10px]">{new Date(a.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Learning tips */}
          <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-[#101424] border-gray-850' : 'bg-white border-gray-200'}`}>
            <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-widest font-mono flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400" /> Practice Tips
            </h3>
            <div className="grid sm:grid-cols-2 gap-3 text-xs text-gray-400">
              <div className="flex gap-2"><BookOpen className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" /> Complete practice submissions in all four sections for balanced analytics.</div>
              <div className="flex gap-2"><Award className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" /> Scores shown are practice estimates, not official PTE scores.</div>
              <div className="flex gap-2"><Clock className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" /> Pending submissions will update once the scoring service processes them.</div>
              <div className="flex gap-2"><BarChart className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" /> More submissions across multiple sections improve the readiness estimate.</div>
            </div>
          </div>
        </>
      )}
    </div>
    )
  );
};
