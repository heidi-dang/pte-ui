import React, { useState, useEffect } from 'react';
import type { RendererProps } from '../types';

export const SSTRenderer: React.FC<RendererProps> = ({ status, onAnswerChange, currentResponse }) => {
  const [text, setText] = useState(() => currentResponse?.typedText ?? '');
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  useEffect(() => {
    onAnswerChange({ typedText: text || null });
  }, [text]);

  const disabled = status === 'completed' || status === 'submitted';

  return (
    <div className="space-y-2">
      <textarea
        rows={10}
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
        placeholder="Type your summary of the spoken text here..."
        className="w-full p-4 rounded-xl border border-dark-border bg-dark-surface-50 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-dark-surface disabled:opacity-60 disabled:cursor-not-allowed resize-none"
      />
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>Words: {wordCount} | Characters: {text.length}</span>
        <span className={wordCount > 0 && (wordCount < 50 || wordCount > 70) ? 'text-error-400 font-semibold' : ''}>
          Constraint: 50 - 70 words
        </span>
      </div>
    </div>
  );
};
