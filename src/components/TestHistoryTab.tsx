import React from 'react';
import { LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Calendar } from 'lucide-react';

export default function TestHistoryTab({ testHistory, theme, onNavigateReport }: { testHistory: any[], theme: string, onNavigateReport: () => void }) {
  return (
    <div className="space-y-4">
      {testHistory.length > 1 && testHistory.some(h => h.overallScore > 0) && (
        <div className={`p-6 rounded-3xl border shadow-lg mb-6 ${theme === 'dark' ? 'bg-slate-900/40 border-gray-850' : 'bg-white border-gray-200'}`}>
          <h3 className="text-sm font-bold mb-4 font-mono tracking-tight">Performance Trend</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[...testHistory].reverse().filter(h => h.overallScore > 0)}>
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis domain={[10, 90]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#0f172a' : '#fff', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="overallScore" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {testHistory.length === 0 ? (
        <div className="text-center py-12 text-gray-500 text-xs border border-dashed border-gray-850 rounded-2xl">
          No completed mock exams recorded. Attempt an available mock test above to initialize your historical reports.
        </div>
      ) : (
        testHistory.map((h) => (
          <div
            key={h.id}
            className={`p-5 rounded-2xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
              theme === 'dark' ? 'bg-gray-900/20 border-gray-850' : 'bg-white border-gray-200'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full font-bold uppercase">
                  {h.type}
                </span>
                <span className="text-xs text-gray-500 font-mono flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> {h.date}
                </span>
              </div>
              <h4 className="text-sm font-bold">{h.title}</h4>
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                {h.overallScore === 0 ? (
                  <span className="text-amber-400 font-bold animate-pulse text-[10px] font-mono">AI Grading in progress...</span>
                ) : (
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col gap-1 text-[10px] text-gray-400 font-mono">
                      <span>Speaking: <strong className="text-emerald-400">{h.speakingScore}</strong></span>
                      <span>Writing: <strong className="text-emerald-400">{h.writingScore}</strong></span>
                      <span>Reading: <strong className="text-emerald-400">{h.readingScore}</strong></span>
                      <span>Listening: <strong className="text-emerald-400">{h.listeningScore}</strong></span>
                    </div>
                    <div className="w-24 h-24 sm:w-32 sm:h-32">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={[
                          { subject: 'Speaking', A: h.speakingScore, fullMark: 90 },
                          { subject: 'Writing', A: h.writingScore, fullMark: 90 },
                          { subject: 'Reading', A: h.readingScore, fullMark: 90 },
                          { subject: 'Listening', A: h.listeningScore, fullMark: 90 }
                        ]}>
                          <PolarGrid stroke="#334155" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 8 }} />
                          <Radar name="Score" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="text-center sm:text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto border-t sm:border-0 border-gray-800/40 pt-3 sm:pt-0">
              <div>
                <p className="text-[10px] font-mono text-gray-500">Overall PTE Mark</p>
                {h.overallScore === 0 ? (
                  <p className="text-xs font-bold text-amber-400 font-mono uppercase animate-pulse">Evaluating</p>
                ) : (
                  <div className="flex items-baseline justify-center sm:justify-end gap-1">
                    <p className="text-2xl font-black text-emerald-400 font-mono">{h.overallScore}</p>
                    <span className="text-[10px] text-gray-500 font-mono" title="Confidence Interval">
                      ±{h.type === 'full' ? 2 : h.type === 'section' ? 5 : 8}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={onNavigateReport}
                className="text-xs text-emerald-400 font-bold hover:underline mt-1 block cursor-pointer"
              >
                View Full Analysis →
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
