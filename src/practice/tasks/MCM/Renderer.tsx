import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import type { RendererProps } from '../types';

export const MCMRenderer: React.FC<RendererProps> = ({ item, status, onAnswerChange }) => {
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    onAnswerChange({ selectedMultiple: selected.length > 0 ? selected : null });
  }, [selected]);

  const toggle = (opt: string) => {
    if (status === 'completed' || status === 'submitted') return;
    setSelected(prev => prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt]);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-warning-400 mb-3 flex items-center gap-1.5">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-warning-400" />
        Select all correct answers. Negative marking applies for incorrect selections.
      </p>
      {item.options?.map((opt, idx) => {
        const isSelected = selected.includes(opt);
        return (
          <button
            key={idx}
            onClick={() => toggle(opt)}
            disabled={status === 'completed' || status === 'submitted'}
            className={`w-full text-left p-4 rounded-xl text-sm border flex justify-between items-center transition-all duration-150 ${
              isSelected
                ? 'bg-primary-500/10 border-primary-500/50 text-primary-400'
                : 'bg-dark-surface border-dark-border hover:border-gray-600 text-gray-300'
            }`}
          >
            <span className="flex-1 pr-3">{opt}</span>
            <div className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-all duration-150 ${
              isSelected ? 'bg-primary-500 border-primary-500' : 'border-gray-600'
            }`}>
              {isSelected && <Check className="h-3 w-3 text-white" />}
            </div>
          </button>
        );
      })}
    </div>
  );
};
