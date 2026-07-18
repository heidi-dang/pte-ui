import React, { useState } from 'react';

interface GenerationDialogProps {
  theme: string;
  onClose: () => void;
  onSubmit: (params: { taskCode: string; section: string; topic: string; difficulty: string; count: number }) => Promise<void>;
}

export const GenerationDialog: React.FC<GenerationDialogProps> = ({ theme, onClose, onSubmit }) => {
  const [taskCode, setTaskCode] = useState('RA');
  const [section, setSection] = useState('Speaking');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onSubmit({ taskCode, section, topic, difficulty, count });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Generation failed');
      setLoading(false);
    }
  };

  const handleTaskCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const sec = ['RA','RS','DI','RL','ASQ','SGD','RTS'].includes(code) ? 'Speaking' :
                ['SWT','WE'].includes(code) ? 'Writing' :
                ['MCS','MCM','ROP','FIBR','FIBRW'].includes(code) ? 'Reading' : 'Listening';
    setTaskCode(code);
    setSection(sec);
  };

  return (
    <div className={`p-5 rounded-2xl border border-blue-500/40 bg-blue-500/5 mb-6 ${theme === 'dark' ? '' : 'bg-white border-blue-200'}`}>
      <h4 className="text-xs font-bold uppercase tracking-widest font-mono mb-4 text-blue-400">AI Batch Generation</h4>
      {error && <div className="mb-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[9px] font-mono text-gray-400 mb-0.5">Task Code *</label>
            <select value={taskCode} onChange={handleTaskCodeChange} className="w-full px-2 py-1.5 rounded text-xs bg-gray-950 border border-gray-850 text-white">
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
            <input readOnly value={section} className="w-full px-2 py-1.5 rounded text-xs bg-gray-950 border border-gray-850 text-gray-400" />
          </div>
          <div>
            <label className="block text-[9px] font-mono text-gray-400 mb-0.5">Difficulty *</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full px-2 py-1.5 rounded text-xs bg-gray-950 border border-gray-850 text-white">
              <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-mono text-gray-400 mb-0.5">Count (1-50) *</label>
            <input type="number" min="1" max="50" required value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-full px-2 py-1.5 rounded text-xs bg-gray-950 border border-gray-850 text-white" />
          </div>
        </div>
        <div>
          <label className="block text-[9px] font-mono text-gray-400 mb-0.5">Specific Topic (Optional)</label>
          <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Climate Change, Australian History" className="w-full px-3 py-1.5 rounded text-xs bg-gray-950 border border-gray-850 text-white" />
        </div>
        <div className="flex gap-2 pt-2">
          <button disabled={loading} type="submit" className="flex-1 py-2 bg-blue-500 text-white rounded-lg text-xs font-bold hover:bg-blue-600 disabled:opacity-50">
            {loading ? 'Initiating Batch...' : 'Start Generation'}
          </button>
          <button disabled={loading} type="button" onClick={onClose} className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-xs hover:bg-gray-700">Cancel</button>
        </div>
      </form>
    </div>
  );
};
