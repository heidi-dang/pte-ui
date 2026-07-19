import { useState, useEffect } from 'react';
import { type MockTaskRendererProps } from './index';

export function SingleChoiceRenderer({ question, response, mode, status, onChange }: MockTaskRendererProps) {
  const options = question.optionsJson ? (JSON.parse(question.optionsJson) as string[]) : [];

  return (
    <div className="space-y-3">
      {options.map((opt, i) => {
        const selected = typeof response === 'object'
          ? response?.selected === opt || response?.selectedOption === opt
          : response === opt;
        return (
          <button
            key={i}
            onClick={() => !status.includes('completed') && onChange({ kind: 'single_choice', selected: opt })}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all border ${
              selected
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                : 'border-dark-border bg-dark-surface text-gray-300 hover:border-gray-600'
            } ${status === 'completed' ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
            disabled={status === 'completed'}
          >
            <span className="font-mono text-[10px] mr-2 opacity-50">{String.fromCharCode(65 + i)}.</span>
            {opt}
          </button>
        );
      })}
    </div>
  );
}
