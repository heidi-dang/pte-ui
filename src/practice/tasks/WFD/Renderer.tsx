import React, { useState, useEffect } from 'react';
import type { RendererProps } from '../types';

export const WFDRenderer: React.FC<RendererProps> = ({ status, theme, onAnswerChange }) => {
  const [text, setText] = useState('');

  useEffect(() => {
    onAnswerChange({ typedText: text || null });
  }, [text]);

  return (
    <div className="space-y-2">
      <input
        required
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={status === 'completed'}
        placeholder="Type the exact sentence you heard here..."
        className={`w-full p-4 rounded-2xl text-xs border focus:outline-none focus:ring-1 focus:border-emerald-500 focus:ring-emerald-500 ${
          theme === 'dark' ? 'bg-gray-950 border-gray-850 text-white' : 'bg-white border-gray-300 text-gray-900'
        }`}
      />
      <span className="text-[10px] text-gray-500 font-mono">Use standard capitalizations and punctuation (e.g. period).</span>
    </div>
  );
};
