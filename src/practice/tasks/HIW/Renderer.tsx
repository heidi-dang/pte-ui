import React, { useState, useEffect } from 'react';
import type { RendererProps } from '../types';

export const HIWRenderer: React.FC<RendererProps> = ({ item, status, theme, onAnswerChange }) => {
  const [highlighted, setHighlighted] = useState<string[]>([]);

  useEffect(() => {
    onAnswerChange({ highlightedIncorrect: highlighted.length > 0 ? highlighted : null });
  }, [highlighted]);

  useEffect(() => {
    setHighlighted([]);
  }, [item.id]);

  const toggleWord = (word: string) => {
    if (status === 'completed') return;
    setHighlighted(prev =>
      prev.includes(word) ? prev.filter(w => w !== word) : [...prev, word]
    );
  };

  return (
    <div className={`p-6 rounded-2xl border text-xs leading-loose ${
      theme === 'dark' ? 'bg-gray-950/40 border-gray-850 text-gray-300' : 'bg-white border-gray-200'
    }`}>
      <p className="text-[10px] text-gray-400 font-mono mb-3">Click on words that differ from what the speaker actually said.</p>
      {item.promptText?.split(' ').map((word, idx) => {
        const cleanWord = word.replace(/[().,;[\]]/g, '');
        const isHighlighted = highlighted.includes(cleanWord);
        return (
          <span
            key={idx}
            onClick={() => toggleWord(cleanWord)}
            className={`mx-1 px-1 rounded cursor-pointer transition-colors ${
              isHighlighted ? 'bg-emerald-500/25 text-emerald-400 font-bold' : 'hover:bg-white/10'
            }`}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};
