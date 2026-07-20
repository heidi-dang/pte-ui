import React, { useState, useEffect } from 'react';
import type { RendererProps } from '../types';
import { splitPromptIntoBlankParts } from '../../utils/blanks';

export const FIBLRenderer: React.FC<RendererProps> = ({ item, status, onAnswerChange, currentResponse }) => {
  const [blanks, setBlanks] = useState<Record<number, string>>(() => currentResponse?.blanks ?? {});

  useEffect(() => {
    onAnswerChange({ blanks: Object.keys(blanks).length > 0 ? blanks : null });
  }, [blanks]);

  useEffect(() => {
    setBlanks(currentResponse?.blanks ?? {});
  }, [item.id]);

  const disabled = status === 'completed' || status === 'submitted';

  const parts = splitPromptIntoBlankParts(item.promptText || '');
  const blankCount = Math.max(0, parts.length - 1);

  if (blankCount === 0) {
    return (
      <div className="p-6 rounded-2xl border border-dark-border bg-dark-surface-50 text-sm leading-relaxed text-gray-400">
        {item.promptText}
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl border border-dark-border bg-dark-surface-50 text-sm leading-relaxed text-gray-300">
      {parts.map((part, idx, arr) => {
        if (idx === arr.length - 1) return <span key={idx}>{part}</span>;
        return (
          <React.Fragment key={idx}>
            <span>{part}</span>
            <input
              type="text"
              value={blanks[idx] || ''}
              onChange={(e) => setBlanks({ ...blanks, [idx]: e.target.value })}
              disabled={disabled}
              placeholder="___"
              className="mx-1 px-2 py-1 w-28 rounded-lg border bg-dark-surface text-primary-400 font-semibold text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-dark-surface disabled:opacity-60 disabled:cursor-not-allowed placeholder:text-gray-600"
            />
          </React.Fragment>
        );
      })}
    </div>
  );
};
