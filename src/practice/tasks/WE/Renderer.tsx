import React, { useState, useEffect } from 'react';
import type { RendererProps } from '../types';

export const WERenderer: React.FC<RendererProps> = ({ status, theme, onAnswerChange }) => {
  const [text, setText] = useState('');
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  useEffect(() => {
    onAnswerChange({ typedText: text || null });
  }, [text]);

  return (
    <div className="space-y-2">
      <textarea
        rows={14}
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={status === 'completed'}
        placeholder="Type your academic essay here..."
        className={`w-full p-4 rounded-2xl text-xs border focus:outline-none focus:ring-1 focus:border-emerald-500 focus:ring-emerald-500 ${
          theme === 'dark' ? 'bg-gray-950 border-gray-850 text-white' : 'bg-white border-gray-300 text-gray-900'
        }`}
      />
      <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono">
        <span>Words: {wordCount} | Characters: {text.length}</span>
        <span className={wordCount > 0 && (wordCount < 200 || wordCount > 300) ? 'text-red-400 font-bold' : ''}>
          Constraint: 200 - 300 words
        </span>
      </div>
    </div>
  );
};
