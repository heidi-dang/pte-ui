import React, { useState, useEffect } from 'react';
import type { RendererProps } from '../types';

export const WFDRenderer: React.FC<RendererProps> = ({ status, onAnswerChange }) => {
  const [text, setText] = useState('');

  useEffect(() => {
    onAnswerChange({ typedText: text || null });
  }, [text]);

  const disabled = status === 'completed' || status === 'submitted';

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
        placeholder="Type the exact sentence you heard here..."
        className="w-full p-4 rounded-xl border border-dark-border bg-dark-surface-50 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-dark-surface disabled:opacity-60 disabled:cursor-not-allowed"
      />
      <p className="text-xs text-gray-500">Use standard capitalizations and punctuation (e.g. period).</p>
    </div>
  );
};
