import React, { useState, useEffect } from 'react';
import { useGlobalContext } from './ThemeContext';
import { Award, BarChart, BookOpen, Clock, AlertTriangle, Lightbulb, RefreshCw } from 'lucide-react';
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

  const loadReports = async () => {
    if (role === 'guest') { setLoading(false); return; }
    setLoading(true);
    setError('');
    try {
      const [over, sec, tsk, prog, act, ready] = await Promise.all([
        apiFetch('/api/student/reports/overview'),
        apiFetch('/api/student/reports/sections'),
        apiFetch('/api/student/reports/tasks'),
        apiFetch('/api/student/reports/progress'),
        apiFetch('/api/student/reports/recent-activity'),
        apiFetch('/api/student/reports/readiness'),
      ]);
      setOverview(over);
      setSections(sec || []);
      setTasks(tsk || []);
      setProgress(prog);
      setActivity(act || []);
      setReadiness(ready);
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
  );
};
