import React from 'react';
import { motion } from 'motion/react';
import { RotateCcw, ArrowRight, FileText, Award } from 'lucide-react';
import { PracticeItem } from '../../types';

export interface PracticeResultPanelProps {
  scoredSubmission: any;
  theme: 'dark' | 'light';
  activeItem: PracticeItem;
  onRetry: () => void;
  onAdvance: () => void;
}

export const PracticeResultPanel: React.FC<PracticeResultPanelProps> = ({
  scoredSubmission, theme, activeItem, onRetry, onAdvance,
}) => {
  return (
    <motion.div
      key="result"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className={`p-6 sm:p-8 rounded-3xl border premium-card relative ${theme === 'dark' ? 'glass-dark border-emerald-500/30' : 'bg-white border-emerald-500 shadow-xl'}`}
    >
      <div className="flex justify-between items-start mb-6 border-b border-gray-850 pb-4">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full font-bold uppercase">
            {scoredSubmission ? 'AI EVALUATED' : 'SUBMITTED'}
          </span>
          <h2 className="text-xl font-bold tracking-tight mt-2">
            {scoredSubmission ? 'Submission Scored' : 'Submission Saved Successfully'}
          </h2>
        </div>
        <button onClick={onRetry} className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer">
          <RotateCcw className="w-3.5 h-3.5" /> Retry Practice
        </button>
      </div>

      {scoredSubmission ? (
        <>
          {scoredSubmission._polling && !scoredSubmission.score && (
            <div className={`p-5 rounded-2xl border mb-6 ${theme === 'dark' ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
              <p className="text-sm text-amber-400 leading-relaxed">
                ⏳ <strong>Grading in progress.</strong> Your response has been saved and is being evaluated by the AI scoring engine. Results typically appear within 60 seconds. Refresh the Submission History to check.
              </p>
            </div>
          )}
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div className={`p-6 rounded-2xl border text-center flex flex-col justify-center items-center ${theme === 'dark' ? 'bg-gray-950/60 border-gray-850' : 'bg-gray-50 border-gray-200'}`}>
              <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500">Score</p>
              <p className="text-5xl font-black text-emerald-400 font-mono my-3">{scoredSubmission.score || '—'}</p>
              <span className="text-xs font-semibold text-emerald-400/90 font-mono">out of 90</span>
            </div>
            <div className="md:col-span-2 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-widest font-mono text-gray-400">Subskill Breakdown</h4>
              {scoredSubmission.fluencyScore != null && (
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold">Oral Fluency</span>
                    <span className="font-mono text-emerald-400 font-bold">{scoredSubmission.fluencyScore}/90</span>
                  </div>
                  <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full" style={{ width: `${(scoredSubmission.fluencyScore / 90) * 100}%` }} />
                  </div>
                </div>
              )}
              {scoredSubmission.pronunciationScore != null && (
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold">Pronunciation</span>
                    <span className="font-mono text-emerald-400 font-bold">{scoredSubmission.pronunciationScore}/90</span>
                  </div>
                  <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full" style={{ width: `${(scoredSubmission.pronunciationScore / 90) * 100}%` }} />
                  </div>
                </div>
              )}
              {scoredSubmission.grammarIssues != null && scoredSubmission.grammarIssues > 0 && (
                <p className="text-xs text-gray-400">Grammar issues detected: <span className="text-amber-400 font-bold">{scoredSubmission.grammarIssues}</span></p>
              )}
            </div>
          </div>
          {scoredSubmission.feedback && (
            <div className="space-y-3 mb-6">
              <h4 className="text-xs font-bold uppercase tracking-widest font-mono text-gray-400">Detailed Feedback</h4>
              {scoredSubmission.feedback.split(/\*\*(.+?)\*\*/).reduce((acc: string[], _part, i, parts) => {
                if (i === 0) return acc;
                if (i % 2 === 1) {
                  const heading = parts[i].trim();
                  const body = (parts[i + 1] || '').trim();
                  if (heading && body) acc.push(JSON.stringify({ heading, body }));
                }
                return acc;
              }, []).map((json: string, idx: number) => {
                const { heading, body } = JSON.parse(json);
                return (
                  <details key={idx} className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-gray-950/60 border-gray-850' : 'bg-gray-50 border-gray-200'}`}>
                    <summary className="text-xs font-bold text-emerald-400 cursor-pointer">{heading}</summary>
                    <div className={`mt-2 text-xs leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} style={{ whiteSpace: 'pre-wrap' }}>
                      {body}
                    </div>
                  </details>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div className={`p-5 rounded-2xl border mb-6 ${theme === 'dark' ? 'bg-gray-950/60 border-gray-850' : 'bg-gray-50 border-gray-200'}`}>
          <p className="text-sm text-gray-300 leading-relaxed">
            Evaluating your response... If scoring is delayed, your response has been saved and will be graded soon.
          </p>
        </div>
      )}

      {/* Review section */}
      <div className="space-y-4 border-t border-gray-850 pt-6">
        <h4 className="text-xs font-bold uppercase tracking-widest font-mono text-gray-400 mb-2">Learning Feedback</h4>
        <div className="grid md:grid-cols-2 gap-6">
          {activeItem.modelAnswer && (
            <div>
              <h5 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-400" /> Sample Answer
              </h5>
              <div className={`p-4 rounded-xl text-xs leading-relaxed ${theme === 'dark' ? 'bg-gray-950 text-gray-400' : 'bg-gray-50 text-gray-600'}`}>
                {activeItem.modelAnswer}
              </div>
            </div>
          )}
          {activeItem.vocabulary?.length > 0 && (
            <div>
              <h5 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-400" /> Tags & Topics
              </h5>
              <div className="space-y-2">
                {activeItem.vocabulary?.map((vocab, index) => (
                  <div key={index} className={`p-2.5 rounded-lg border text-xs ${theme === 'dark' ? 'bg-gray-950 border-gray-850' : 'bg-gray-50 border-gray-200'}`}>
                    <span className="font-bold text-emerald-400 font-mono">{vocab.phrase}</span>: <span className="text-gray-400">{vocab.meaning}</span>
                  </div>
                )) || <p className="text-xs text-gray-500">None required for this task type.</p>}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-gray-850 mt-8">
        <button onClick={onAdvance} className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
          Advance to Next Question <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};
