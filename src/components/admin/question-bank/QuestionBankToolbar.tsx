import React from 'react';
import { Plus, Wand2 } from 'lucide-react';

interface QuestionBankToolbarProps {
  onNewManual: () => void;
  onNewAi: () => void;
}

export const QuestionBankToolbar: React.FC<QuestionBankToolbarProps> = ({ onNewManual, onNewAi }) => {
  return (
    <div className="flex flex-wrap gap-3 justify-between items-center mb-4">
      <h3 className="text-sm font-bold uppercase tracking-widest font-mono text-gray-400">Question Bank CMS</h3>
      <div className="flex gap-2">
        <button
          onClick={onNewAi}
          className="px-3.5 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
        >
          <Wand2 className="w-4 h-4" /> AI Generate Batch
        </button>
        <button
          onClick={onNewManual}
          className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
        >
          <Plus className="w-4 h-4" /> Manual Question
        </button>
      </div>
    </div>
  );
};
