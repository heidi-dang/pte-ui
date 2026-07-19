import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import type { RendererProps } from '../types';

export const MCSSLRenderer: React.FC<RendererProps> = ({ item, status, onAnswerChange }) => {
  const [selected, setSelected] = useState('');

  useEffect(() => {
    onAnswerChange({ selectedOption: selected || null });
  }, [selected]);

  const disabled = status === 'completed' || status === 'submitted';

  return (
    <div className="space-y-2">
      {item.options?.map((opt, idx) => {
        const isSelected = selected === opt;
        return (
          <button
            key={idx}
            onClick={() => !disabled && setSelected(opt)}
            disabled={disabled}
            className={`w-full text-left p-4 rounded-xl text-sm border flex justify-between items-center transition-all duration-150 ${
              isSelected
                ? 'bg-primary-500/10 border-primary-500/50 text-primary-400'
                : 'bg-dark-surface border-dark-border hover:border-gray-600 text-gray-300'
            }`}
          >
            <span className="flex-1 pr-3">{opt}</span>
            <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-150 ${
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
