import React, { useState, useEffect } from 'react';
import type { RendererProps } from '../types';

export const HIWRenderer: React.FC<RendererProps> = ({ item, status, onAnswerChange, currentResponse }) => {
  const [highlighted, setHighlighted] = useState<string[]>(() => currentResponse?.highlightedIncorrect ?? []);

  useEffect(() => {
    onAnswerChange({ highlightedIncorrect: highlighted.length > 0 ? highlighted : null });
  }, [highlighted]);

  useEffect(() => {
    setHighlighted(currentResponse?.highlightedIncorrect ?? []);
  }, [item.id]);

  const toggleWord = (word: string) => {
    if (status === 'completed' || status === 'submitted') return;
    setHighlighted(prev =>
      prev.includes(word) ? prev.filter(w => w !== word) : [...prev, word]
    );
  };

  const disabled = status === 'completed' || status === 'submitted';

  return (
    <div className="p-6 rounded-2xl border border-dark-border bg-dark-surface-50 text-sm leading-relaxed text-gray-300">
      <p className="text-xs text-gray-500 mb-4 flex items-center gap-1.5">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-600" />
        Click on words that differ from what the speaker actually said
      </p>
      <p className="leading-loose">
        {item.promptText?.split(' ').map((word, idx) => {
          const cleanWord = word.replace(/[().,;[\]]/g, '');
          const isHighlighted = highlighted.includes(cleanWord);
          return (
            <span
              key={idx}
              onClick={() => !disabled && toggleWord(cleanWord)}
              className={`mx-0.5 px-1 rounded cursor-pointer transition-colors ${
                isHighlighted
                  ? 'bg-primary-500/25 text-primary-400 font-semibold'
                  : 'hover:bg-dark-elevated'
              } ${disabled ? 'cursor-default' : ''}`}
            >
              {word}
            </span>
          );
        })}
      </p>
      {highlighted.length > 0 && (
        <p className="mt-4 text-xs text-gray-500">
          {highlighted.length} word{highlighted.length !== 1 ? 's' : ''} highlighted
        </p>
      )}
    </div>
  );
};
