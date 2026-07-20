import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import type { RendererProps } from '../types';

export const FIBRRenderer: React.FC<RendererProps> = ({ item, status, onAnswerChange, currentResponse }) => {
  const [blanks, setBlanks] = useState<Record<number, string>>(() => currentResponse?.blanks ?? {});

  useEffect(() => {
    onAnswerChange({ blanks: Object.keys(blanks).length > 0 ? blanks : null });
  }, [blanks]);

  useEffect(() => {
    setBlanks(currentResponse?.blanks ?? {});
  }, [item.id]);

  const disabled = status === 'completed' || status === 'submitted';

  const parts = item.promptText?.split(/\[\d+\]/) || [];

  const getOptions = (idx: number): string[] => {
    const raw = item.options?.[idx];
    if (typeof raw === 'string') return raw.split(', ');
    if (Array.isArray(item.options)) return item.options as string[];
    return [];
  };

  return (
    <div className="p-6 rounded-2xl border border-dark-border bg-dark-surface-50 text-sm leading-relaxed text-gray-300">
      {parts.map((part, idx, arr) => {
        if (idx === arr.length - 1) return <span key={idx}>{part}</span>;
        const opts = getOptions(idx);
        return (
          <React.Fragment key={idx}>
            <span>{part}</span>
            <span className="relative inline-flex mx-1">
              <select
                value={blanks[idx] || ''}
                onChange={(e) => setBlanks({ ...blanks, [idx]: e.target.value })}
                disabled={disabled}
                className="appearance-none px-3 py-1.5 pr-8 rounded-lg border bg-dark-surface text-primary-400 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-dark-surface disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="">Select...</option>
                {opts.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500 pointer-events-none" />
            </span>
          </React.Fragment>
        );
      })}
    </div>
  );
};
