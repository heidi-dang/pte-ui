import React, { useState } from 'react';

interface ManualQuestionModalProps {
  theme: string;
  initialData?: any;
  onClose: () => void;
  onSave: (data: any, id?: string) => Promise<void>;
}

export const ManualQuestionModal: React.FC<ManualQuestionModalProps> = ({ theme, initialData, onClose, onSave }) => {
  const [form, setForm] = useState(initialData || {
    taskCode: 'RA', section: 'Speaking', title: '', instruction: '', promptText: '',
    difficulty: 'medium', status: 'draft', optionsJson: '', answerKeyJson: '',
    sampleAnswer: '', explanation: '', promptHtml: '', audioUrl: '', imageUrl: '',
    passageText: '', tagsJson: '', source: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onSave(form, initialData?.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save question');
      setLoading(false);
    }
  };

  return (
    <div className={`p-5 rounded-2xl border border-emerald-500/40 bg-emerald-500/5 mb-6 ${theme === 'dark' ? '' : 'bg-white border-emerald-200'}`}>
      <h4 className="text-xs font-bold uppercase tracking-widest font-mono mb-4 text-emerald-400">
        {initialData ? 'Edit Question' : 'New Manual Question'}
      </h4>
      {error && <div className="mb-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[9px] font-mono text-gray-400 mb-0.5">Task Code *</label>
            <select value={form.taskCode} onChange={(e) => {
              const code = e.target.value;
              const section = ['RA','RS','DI','RL','ASQ','SGD','RTS'].includes(code) ? 'Speaking' :
                ['SWT','WE'].includes(code) ? 'Writing' :
                ['MCS','MCM','ROP','FIBR','FIBRW'].includes(code) ? 'Reading' : 'Listening';
              setForm({ ...form, taskCode: code, section });
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
            <input readOnly value={form.section} className="w-full px-2 py-1.5 rounded text-xs bg-gray-950 border border-gray-850 text-gray-400" />
          </div>
          <div>
            <label className="block text-[9px] font-mono text-gray-400 mb-0.5">Difficulty *</label>
            <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} className="w-full px-2 py-1.5 rounded text-xs bg-gray-950 border border-gray-850 text-white">
              <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-[9px] font-mono text-gray-400 mb-0.5">Title *</label>
          <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Urban Sustainability Debate" className="w-full px-3 py-1.5 rounded text-xs bg-gray-950 border border-gray-850 text-white" />
        </div>
        <div>
          <label className="block text-[9px] font-mono text-gray-400 mb-0.5">Instruction *</label>
          <input required value={form.instruction} onChange={(e) => setForm({ ...form, instruction: e.target.value })} placeholder="e.g. Read the passage aloud with proper pronunciation" className="w-full px-3 py-1.5 rounded text-xs bg-gray-950 border border-gray-850 text-white" />
        </div>
        <div>
          <label className="block text-[9px] font-mono text-gray-400 mb-0.5">Prompt Text *</label>
          <textarea required value={form.promptText} onChange={(e) => setForm({ ...form, promptText: e.target.value })} placeholder="The full question prompt text..." rows={3} className="w-full px-3 py-1.5 rounded text-xs bg-gray-950 border border-gray-850 text-white resize-none" />
        </div>
        <details className="text-xs text-gray-500">
          <summary className="cursor-pointer py-1">Optional Fields</summary>
          <div className="grid sm:grid-cols-2 gap-3 mt-2">
            <div>
              <label className="block text-[9px] font-mono text-gray-400 mb-0.5">Sample Answer</label>
              <textarea value={form.sampleAnswer} onChange={(e) => setForm({ ...form, sampleAnswer: e.target.value })} placeholder="Model answer text..." rows={2} className="w-full px-3 py-1.5 rounded text-xs bg-gray-950 border border-gray-850 text-white resize-none" />
            </div>
            <div>
              <label className="block text-[9px] font-mono text-gray-400 mb-0.5">Explanation</label>
              <textarea value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} placeholder="Reasons for the answer..." rows={2} className="w-full px-3 py-1.5 rounded text-xs bg-gray-950 border border-gray-850 text-white resize-none" />
            </div>
            <div>
              <label className="block text-[9px] font-mono text-gray-400 mb-0.5">Options JSON</label>
              <textarea value={form.optionsJson} onChange={(e) => setForm({ ...form, optionsJson: e.target.value })} placeholder='["Option A", "Option B"]' rows={2} className="w-full px-3 py-1.5 rounded text-xs bg-gray-950 border border-gray-850 text-white resize-none" />
            </div>
            <div>
              <label className="block text-[9px] font-mono text-gray-400 mb-0.5">Answer Key JSON</label>
              <textarea value={form.answerKeyJson} onChange={(e) => setForm({ ...form, answerKeyJson: e.target.value })} placeholder='{"correct": "A"}' rows={2} className="w-full px-3 py-1.5 rounded text-xs bg-gray-950 border border-gray-850 text-white resize-none" />
            </div>
            <div>
              <label className="block text-[9px] font-mono text-gray-400 mb-0.5">Tags JSON</label>
              <input value={form.tagsJson} onChange={(e) => setForm({ ...form, tagsJson: e.target.value })} placeholder='["academic","science"]' className="w-full px-3 py-1.5 rounded text-xs bg-gray-950 border border-gray-850 text-white" />
            </div>
            <div>
              <label className="block text-[9px] font-mono text-gray-400 mb-0.5">Source</label>
              <input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="original_sample" className="w-full px-3 py-1.5 rounded text-xs bg-gray-950 border border-gray-850 text-white" />
            </div>
            <div>
              <label className="block text-[9px] font-mono text-gray-400 mb-0.5">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-2 py-1.5 rounded text-xs bg-gray-950 border border-gray-850 text-white">
                <option value="draft">Draft</option><option value="published">Published</option>
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-mono text-gray-400 mb-0.5">Audio URL</label>
              <input value={form.audioUrl} onChange={(e) => setForm({ ...form, audioUrl: e.target.value })} placeholder="/uploads/sample.wav" className="w-full px-3 py-1.5 rounded text-xs bg-gray-950 border border-gray-850 text-white" />
            </div>
            <div>
              <label className="block text-[9px] font-mono text-gray-400 mb-0.5">Image URL</label>
              <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="/uploads/sample.png" className="w-full px-3 py-1.5 rounded text-xs bg-gray-950 border border-gray-850 text-white" />
            </div>
            <div>
              <label className="block text-[9px] font-mono text-gray-400 mb-0.5">Passage Text</label>
              <textarea value={form.passageText} onChange={(e) => setForm({ ...form, passageText: e.target.value })} placeholder="Longer passage text..." rows={2} className="w-full px-3 py-1.5 rounded text-xs bg-gray-950 border border-gray-850 text-white resize-none" />
            </div>
            <div>
              <label className="block text-[9px] font-mono text-gray-400 mb-0.5">Prompt HTML</label>
              <textarea value={form.promptHtml} onChange={(e) => setForm({ ...form, promptHtml: e.target.value })} placeholder="<p>Formatted prompt</p>" rows={2} className="w-full px-3 py-1.5 rounded text-xs bg-gray-950 border border-gray-850 text-white resize-none" />
            </div>
          </div>
        </details>
        <div className="flex gap-2 pt-2">
          <button disabled={loading} type="submit" className="flex-1 py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 disabled:opacity-50">
            {loading ? 'Saving...' : 'Save Question'}
          </button>
          <button disabled={loading} type="button" onClick={onClose} className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-xs hover:bg-gray-700">Cancel</button>
        </div>
      </form>
    </div>
  );
};
