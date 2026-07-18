import React from 'react';
import { FileEdit, History, Calendar } from 'lucide-react';

export interface PracticeSidePanelsProps {
  theme: 'dark' | 'light';
  note: string;
  isNoteSaving: boolean;
  onNoteChange: (text: string) => void;
  serverSubmissions: any[];
  questionHistory: { id: string; score: number; date: string; answer?: string }[];
  itemId: string;
}

export const PracticeSidePanels: React.FC<PracticeSidePanelsProps> = ({
  theme, note, isNoteSaving, onNoteChange, serverSubmissions, questionHistory, itemId,
}) => {
  return (
    <div className="grid md:grid-cols-2 gap-6 pt-4">
      {/* Notes Panel */}
      <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-gray-900/10 border-gray-850' : 'bg-white border-gray-200 shadow-sm'}`}>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-gray-400 flex items-center gap-1.5">
            <FileEdit className="w-4 h-4 text-emerald-400" /> Question Sticky Notes
          </h3>
          {isNoteSaving && (
            <span className="text-[10px] text-emerald-400 font-mono animate-pulse">Saving note...</span>
          )}
        </div>
        <textarea
          rows={6}
          placeholder="Jot down quick phonetic layouts, response templates, or notes for this question... notes are persistent."
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          className={`w-full p-3 rounded-2xl text-xs border focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 ${theme === 'dark' ? 'bg-gray-950 border-gray-850 text-gray-300' : 'bg-white border-gray-300 text-gray-950'}`}
        />
        <p className="text-[10px] text-gray-500 font-mono mt-2">Notes auto-save instantly per practice item ID.</p>
      </div>

      {/* History Panel */}
      <div className={`p-6 rounded-3xl border flex flex-col justify-between ${theme === 'dark' ? 'bg-gray-900/10 border-gray-850' : 'bg-white border-gray-200 shadow-sm'}`}>
        <div>
          <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-gray-400 mb-3 flex items-center gap-1.5">
            <History className="w-4 h-4 text-emerald-400" /> Submission History
          </h3>
          {serverSubmissions.length === 0 && questionHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-8 h-8 text-gray-700 mx-auto mb-2" />
              <p className="text-xs">No submissions yet.</p>
              <p className="text-[10px] opacity-60 mt-0.5">Submit a task to see your scored results.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-44 overflow-y-auto pr-1 custom-scrollbar">
              {serverSubmissions.slice(0, 3).map((s: any) => (
                <div key={s.id} className={`p-2.5 rounded-xl border text-[10px] flex justify-between items-center ${theme === 'dark' ? 'bg-gray-950/60 border-gray-850 text-gray-300' : 'bg-gray-50 border-gray-250 text-gray-600'}`}>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{s.title} <span className="text-gray-500 font-normal">({s.taskCode})</span></p>
                    <div className="flex gap-2 items-center mt-0.5">
                      <span className="text-emerald-400 font-mono font-bold">{s.score}/90</span>
                      {s.fluencyScore != null && <span className="text-[9px] text-gray-500">F:{s.fluencyScore}</span>}
                      {s.pronunciationScore != null && <span className="text-[9px] text-gray-500">P:{s.pronunciationScore}</span>}
                    </div>
                  </div>
                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 uppercase font-bold flex-shrink-0">Graded</span>
                </div>
              ))}
              {serverSubmissions.length === 0 && questionHistory.length > 0 && questionHistory.slice(0, 3).map((h) => (
                <div key={h.id} className={`p-2.5 rounded-xl border text-[10px] flex justify-between items-center ${theme === 'dark' ? 'bg-gray-950/60 border-gray-850 text-gray-300' : 'bg-gray-50 border-gray-250 text-gray-600'}`}>
                  <div>
                    <p className="font-bold">Attempt Score: <span className="text-emerald-400 font-mono">{h.score}/90</span></p>
                    <span className="text-[9px] text-gray-500">{h.date}</span>
                  </div>
                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 uppercase font-bold">Local</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="text-[10px] text-gray-500 font-mono mt-3 border-t border-gray-800/40 pt-2">
          {serverSubmissions.length > 0
            ? `${serverSubmissions.length} scored submission(s) across all tasks`
            : `Tracks last 5 local evaluations for ID: ${itemId}.`}
        </div>
      </div>
    </div>
  );
};
