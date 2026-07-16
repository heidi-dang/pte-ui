/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useGlobalContext } from './ThemeContext';
import { Award, Shield, BarChart, AlertTriangle, BookOpen, Clock, Calendar, CheckCircle, Lightbulb } from 'lucide-react';
import { motion } from 'motion/react';

export const Reports: React.FC = () => {
  const { theme, apiFetch, role } = useGlobalContext();
  const [selectedSubskill, setSelectedSubskill] = useState<string>('Speaking');
  const [stats, setStats] = useState({
    overall: 74,
    target: 79,
    subskills: [
      { name: 'Speaking', score: 78, description: 'Excellent volume and oral pacing, but pitch modulation needs adjustment.' },
      { name: 'Writing', score: 72, description: 'Flawless spelling, but grammatical range can be enhanced with complex prepositions.' },
      { name: 'Reading', score: 69, description: 'Strong comprehension, but drag-and-drop logical flow needs practice.' },
      { name: 'Listening', score: 75, description: 'Excellent dictation match, minor spelling slip on multi-syllabic words.' }
    ]
  });

  React.useEffect(() => {
    const fetchStats = async () => {
      if (role === 'guest') return;
      try {
        const res = await apiFetch('/api/student/dashboard-stats');
        setStats({
          overall: res.overallScore,
          target: res.targetScore,
          subskills: [
            { name: 'Speaking', score: res.skills.speaking, description: 'Excellent volume and oral pacing, but pitch modulation needs adjustment.' },
            { name: 'Writing', score: res.skills.writing, description: 'Flawless spelling, but grammatical range can be enhanced with complex prepositions.' },
            { name: 'Reading', score: res.skills.reading, description: 'Strong comprehension, but drag-and-drop logical flow needs practice.' },
            { name: 'Listening', score: res.skills.listening, description: 'Excellent dictation match, minor spelling slip on multi-syllabic words.' }
          ]
        });
      } catch (err) {
        console.error('Failed to load report stats:', err);
      }
    };
    fetchStats();
  }, [apiFetch, role]);

  const reportData = {
    overall: stats.overall,
    target: stats.target,
    cefr: stats.overall >= 79 ? 'C2 - Proficient User' : stats.overall >= 65 ? 'C1 - Advanced Practitioner' : 'B2 - Independent User',
    ieltsEquivalent: stats.overall >= 79 ? '8.0+' : stats.overall >= 65 ? '7.5' : '6.5',
    subskills: stats.subskills,
    weaknesses: [
      {
        skill: 'Speaking',
        error: 'Incongruous mid-sentence vocal pause',
        remedy: 'Sustain vocal tones continuous up to logical punctuation marks. Avoid speaking-gaps between nouns.',
        gravity: 'High'
      },
      {
        skill: 'Writing',
        error: 'Repeated simple verbs',
        remedy: 'Vary lexical items. Swap simple verbs like "make" or "do" with academic options like "accomplish" or "construct".',
        gravity: 'Medium'
      },
      {
        skill: 'Reading',
        error: 'Incorrect logical reordering',
        remedy: 'Practice reading transition-links (e.g. "On the other hand", "This effect"). Find independent topic sentence first.',
        gravity: 'High'
      }
    ]
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-8">
      {/* Header title */}
      <div className="border-b border-gray-800/40 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">AI Academic Score Diagnostics</h1>
        <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          Review diagnostic feedback extracted from your voice recordings and typed essays.
        </p>
      </div>

      {/* Main Grid: Overview Score & CEFR Mapping */}
      <div className="grid md:grid-cols-3 gap-8">
        {/* Core Score Badge */}
        <div className={`p-8 rounded-3xl border text-center flex flex-col justify-center items-center ${
          theme === 'dark' ? 'bg-gray-900/20 border-gray-850' : 'bg-white border-gray-200'
        }`}>
          <p className="text-xs font-mono font-bold uppercase tracking-widest text-gray-500">Overall PTE Level</p>
          <div className="relative my-6 w-32 h-32 flex items-center justify-center">
            {/* SVG Progress Circle */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" stroke="#1f2937" strokeWidth="6" fill="transparent" />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="#10b981"
                strokeWidth="7"
                fill="transparent"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * reportData.overall) / 90}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute text-center">
              <p className="text-4xl font-black font-mono leading-none text-emerald-400">{reportData.overall}</p>
              <p className="text-[10px] text-gray-500 font-mono mt-1">out of 90</p>
            </div>
          </div>
          <p className="text-sm font-bold mt-2">{reportData.cefr}</p>
          <p className="text-[10px] text-gray-500 font-mono mt-1">IELTS Band Equivalent: {reportData.ieltsEquivalent}</p>
        </div>

        {/* Horizontal bar charts for subskills */}
        <div className={`p-6 rounded-3xl border md:col-span-2 flex flex-col justify-between ${
          theme === 'dark' ? 'bg-gray-900/10 border-gray-850' : 'bg-white border-gray-200'
        }`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-gray-400">PTE Band Sub-Skills</h3>
            <span className="text-xs text-emerald-400 font-mono font-bold">Target: {reportData.target}+ score</span>
          </div>

          <div className="space-y-4">
            {reportData.subskills.map((sub) => (
              <div
                key={sub.name}
                onClick={() => setSelectedSubskill(sub.name)}
                className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                  selectedSubskill === sub.name
                    ? 'border-emerald-500/40 bg-emerald-500/5'
                    : 'border-transparent hover:border-gray-800'
                }`}
              >
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-bold">{sub.name}</span>
                  <span className="font-mono text-emerald-400 font-bold">{sub.score} / 90</span>
                </div>
                <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden mb-1">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(sub.score / 90) * 100}%` }}></div>
                </div>
                <p className="text-[10px] text-gray-400 leading-normal">{sub.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weakness Analysis Section */}
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest font-mono text-gray-400">Target Area Weaknesses</h3>
          <div className="space-y-4">
            {reportData.weaknesses.map((w, index) => (
              <div
                key={index}
                className={`p-5 rounded-2xl border flex gap-4 items-start ${
                  theme === 'dark' ? 'bg-gray-900/30 border-gray-850' : 'bg-white border-gray-200 shadow-sm'
                }`}
              >
                <div className="mt-0.5 flex-shrink-0">
                  <AlertTriangle className={`w-5 h-5 ${w.gravity === 'High' ? 'text-red-400' : 'text-orange-400'}`} />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-mono tracking-wider bg-gray-850 text-gray-400 px-2 py-0.5 rounded font-bold uppercase">{w.skill}</span>
                    <span className={`text-[9px] font-mono font-bold ${w.gravity === 'High' ? 'text-red-400' : 'text-orange-400'}`}>{w.gravity} Severity</span>
                  </div>
                  <h4 className="text-xs font-bold">{w.error}</h4>
                  <p className="text-[10px] text-gray-400 leading-relaxed pt-1">{w.remedy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Simulated advice dashboard */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest font-mono text-gray-400">Diagnostic Counsel</h3>
          <div className={`p-6 rounded-3xl border space-y-4 ${
            theme === 'dark' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50/15 border-emerald-400 shadow-sm'
          }`}>
            <div className="flex items-center gap-2 text-emerald-400">
              <Lightbulb className="w-5 h-5" />
              <h4 className="text-xs font-bold uppercase tracking-wider font-mono">Expert Recommendations</h4>
            </div>
            <div className="space-y-3.5 text-xs text-gray-300 leading-relaxed">
              <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                • <strong>Daily speaking chunking</strong>: Dedicate 15 minutes to repeating sentences. Emphasize copying native pause clusters.
              </p>
              <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                • <strong>Write SWT templates</strong>: Memorize the single-clause paragraph model. Avoid compound sentences to bypass grammatical slips.
              </p>
              <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                • <strong>Drag-and-drop mapping</strong>: Prioritize prepositions & noun coherence links. Complete 3 Reading Blanks exercises daily.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
