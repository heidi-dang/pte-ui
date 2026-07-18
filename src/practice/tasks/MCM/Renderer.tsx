import React, { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import type { RendererProps } from '../types';

export const MCMRenderer: React.FC<RendererProps> = ({ item, status, theme, onAnswerChange }) => {
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    onAnswerChange({ selectedMultiple: selected.length > 0 ? selected : null });
  }, [selected]);

  const toggle = (opt: string) => {
    if (status === 'completed') return;
    setSelected(prev => prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt]);
  };

  return (
    <div className="space-y-3">
      <p className="text-[10px] text-amber-400 font-mono mb-2">Select all correct answers. Negative marking applies for incorrect selections.</p>
      {item.options?.map((opt, idx) => {
        const isSelected = selected.includes(opt);
        return (
          <button
            key={idx}
            onClick={() => toggle(opt)}
            disabled={status === 'completed'}
            className={`w-full text-left p-4 rounded-xl text-xs font-semibold border flex justify-between items-center transition-all cursor-pointer ${
              isSelected
                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                : theme === 'dark'
                ? 'bg-gray-950/40 border-gray-850 hover:bg-gray-900 text-gray-300'
                : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
            }`}
          >
            <span>{opt}</span>
            <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
              isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-700'
            }`}>
              {isSelected && <CheckCircle className="w-3.5 h-3.5" />}
            </div>
          </button>
        );
      })}
    </div>
  );
};
