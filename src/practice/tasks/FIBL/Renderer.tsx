import React, { useState, useEffect } from 'react';
import type { RendererProps } from '../types';

export const FIBLRenderer: React.FC<RendererProps> = ({ item, status, theme, onAnswerChange }) => {
  const [blanks, setBlanks] = useState<Record<number, string>>({});

  useEffect(() => {
    onAnswerChange({ blanks: Object.keys(blanks).length > 0 ? blanks : null });
  }, [blanks]);

  useEffect(() => {
    setBlanks({});
  }, [item.id]);

  const parts = item.promptText?.split(/\[\d+\]/) || [];

  return (
    <div className={`p-6 rounded-2xl border leading-relaxed text-xs leading-loose ${
      theme === 'dark' ? 'bg-gray-950/40 border-gray-850 text-gray-300' : 'bg-white border-gray-200 text-gray-700'
    }`}>
      {parts.map((part, idx, arr) => {
        if (idx === arr.length - 1) return <span key={idx}>{part}</span>;
        return (
          <React.Fragment key={idx}>
            <span>{part}</span>
            <input
              type="text"
              value={blanks[idx] || ''}
              onChange={(e) => setBlanks({ ...blanks, [idx]: e.target.value })}
              disabled={status === 'completed'}
              placeholder="type word"
              className="mx-1 px-2 py-1 w-24 rounded border bg-gray-950 text-emerald-400 font-bold font-mono text-center focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </React.Fragment>
        );
      })}
    </div>
  );
};
