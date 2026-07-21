import React, { useState } from 'react';

interface GenerationDialogProps {
  theme: string;
  onClose: () => void;
  onSubmit: (params: { tasks: { taskCode: string; section: string; count: number }[]; topic: string; difficulty: string; requestKey: string }) => Promise<void>;
}

const ALL_TASKS = [
  { code: 'RA', name: 'Read Aloud', section: 'Speaking' },
  { code: 'RS', name: 'Repeat Sentence', section: 'Speaking' },
  { code: 'DI', name: 'Describe Image', section: 'Speaking' },
  { code: 'RL', name: 'Retell Lecture', section: 'Speaking' },
  { code: 'ASQ', name: 'Answer Short Question', section: 'Speaking' },
  { code: 'SGD', name: 'Summarize Group Discussion', section: 'Speaking' },
  { code: 'RTS', name: 'Respond to a Situation', section: 'Speaking' },
  { code: 'SWT', name: 'Summarize Written Text', section: 'Writing' },
  { code: 'WE', name: 'Write Essay', section: 'Writing' },
  { code: 'MCS', name: 'Multiple Choice (Single)', section: 'Reading' },
  { code: 'MCM', name: 'Multiple Choice (Multiple)', section: 'Reading' },
  { code: 'ROP', name: 'Re-order Paragraphs', section: 'Reading' },
  { code: 'FIBR', name: 'Fill in the Blanks (R)', section: 'Reading' },
  { code: 'FIBRW', name: 'Fill in the Blanks (RW)', section: 'Reading' },
  { code: 'SST', name: 'Summarize Spoken Text', section: 'Listening' },
  { code: 'MCMSL', name: 'Multiple Choice (L)', section: 'Listening' },
  { code: 'FIBL', name: 'Fill in the Blanks (L)', section: 'Listening' },
  { code: 'HCS', name: 'Highlight Correct Summary', section: 'Listening' },
  { code: 'MCSSL', name: 'Multiple Choice Single (L)', section: 'Listening' },
  { code: 'SMW', name: 'Select Missing Word', section: 'Listening' },
  { code: 'HIW', name: 'Highlight Incorrect Words', section: 'Listening' },
  { code: 'WFD', name: 'Write from Dictation', section: 'Listening' },
];

export const GenerationDialog: React.FC<GenerationDialogProps> = ({ theme, onClose, onSubmit }) => {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // State to hold selected tasks and their target counts
  const [taskSelections, setTaskSelections] = useState<Record<string, { selected: boolean; count: number }>>(
    ALL_TASKS.reduce((acc, t) => ({ ...acc, [t.code]: { selected: false, count: 5 } }), {})
  );

  const toggleAll = (select: boolean) => {
    setTaskSelections(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => {
        next[k].selected = select;
      });
      return next;
    });
  };

  const handleToggleTask = (code: string) => {
    setTaskSelections(prev => ({ ...prev, [code]: { ...prev[code], selected: !prev[code].selected } }));
  };

  const handleCountChange = (code: string, val: string) => {
    const num = parseInt(val, 10);
    setTaskSelections(prev => ({ ...prev, [code]: { ...prev[code], count: isNaN(num) ? 0 : num } }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const tasksToGenerate = ALL_TASKS
      .filter(t => taskSelections[t.code].selected && taskSelections[t.code].count > 0)
      .map(t => ({ taskCode: t.code, section: t.section, count: taskSelections[t.code].count }));

    if (tasksToGenerate.length === 0) {
      setError('Please select at least one task to generate.');
      return;
    }

    setLoading(true);
    try {
      const requestKey = crypto.randomUUID();
      await onSubmit({ tasks: tasksToGenerate, topic, difficulty, requestKey });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Generation failed');
      setLoading(false);
    }
  };

  const selectedCount = Object.values(taskSelections).filter(t => t.selected).length;

  return (
    <div className={`p-5 rounded-2xl border border-blue-500/40 bg-blue-500/5 mb-6 ${theme === 'dark' ? '' : 'bg-white border-blue-200'}`}>
      <div className="flex justify-between items-center mb-4 border-b border-blue-500/20 pb-3">
        <h4 className="text-sm font-bold uppercase tracking-widest font-mono text-blue-400">Bulk AI Generation</h4>
        <button disabled={loading} onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
      </div>

      {error && <div className="mb-4 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Global Options */}
        <div className="grid sm:grid-cols-2 gap-4 border-b border-blue-500/20 pb-4">
          <div>
            <label className="block text-[9px] font-mono text-gray-400 mb-1">Global Difficulty *</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full px-3 py-2 rounded-xl text-xs bg-gray-950 border border-gray-850 text-white focus:outline-none focus:border-blue-500">
              <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-mono text-gray-400 mb-1">Specific Topic (Optional, applies to all)</label>
            <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Climate Change, Science" className="w-full px-3 py-2 rounded-xl text-xs bg-gray-950 border border-gray-850 text-white focus:outline-none focus:border-blue-500" />
          </div>
        </div>

        {/* Task Selection */}
        <div>
          <div className="flex justify-between items-end mb-2">
            <label className="block text-[9px] font-mono text-gray-400">Select Tasks & Quantities</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => toggleAll(true)} className="text-[10px] text-blue-400 hover:text-blue-300 font-bold">Select All</button>
              <span className="text-[10px] text-gray-500">|</span>
              <button type="button" onClick={() => toggleAll(false)} className="text-[10px] text-gray-400 hover:text-gray-300 font-bold">Clear All</button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-64 overflow-y-auto custom-scrollbar pr-2">
            {ALL_TASKS.map(task => (
              <div key={task.code} className={`flex items-center gap-3 p-2 rounded-xl border transition-colors ${taskSelections[task.code].selected ? 'bg-blue-500/10 border-blue-500/30' : 'bg-gray-950/40 border-gray-850'} cursor-pointer`} onClick={() => handleToggleTask(task.code)}>
                <input 
                  type="checkbox" 
                  checked={taskSelections[task.code].selected} 
                  onChange={() => {}} 
                  className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-blue-500 focus:ring-blue-500/50"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold text-gray-200 truncate">{task.code} - {task.name}</div>
                  <div className="text-[8px] text-gray-500 uppercase">{task.section}</div>
                </div>
                <div onClick={(e) => e.stopPropagation()} className="w-16">
                  <input 
                    type="number" 
                    min={1} 
                    max={50}
                    value={taskSelections[task.code].count} 
                    onChange={(e) => handleCountChange(task.code, e.target.value)}
                    className="w-full px-2 py-1 text-xs bg-gray-900 border border-gray-800 rounded text-center text-white"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button disabled={loading || selectedCount === 0} type="submit" className="flex-1 py-3 bg-blue-500 text-white rounded-xl text-xs font-bold hover:bg-blue-600 disabled:opacity-50 transition-colors">
            {loading ? 'Queuing Batch Generation...' : `Generate for ${selectedCount} Task(s)`}
          </button>
          <button disabled={loading} type="button" onClick={onClose} className="px-6 py-3 bg-gray-800 text-gray-300 rounded-xl text-xs font-bold hover:bg-gray-700 transition-colors">Cancel</button>
        </div>
      </form>
    </div>
  );
};
