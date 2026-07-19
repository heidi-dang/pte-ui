import { useState } from 'react';
import { type MockTaskRendererProps } from './index';

export function HighlightIncorrectWordsRenderer({ question, response, mode, status, onChange }: MockTaskRendererProps) {
  const words = question.promptText?.split(' ') || [];
  const highlighted = (typeof response === 'object' && Array.isArray(response?.words)) ? response.words :
    (Array.isArray(response?.highlightedIncorrect) ? response.highlightedIncorrect : []);

  const toggle = (word: string) => {
    if (status === 'completed') return;
    const clean = word.replace(/[().,;[\]]/g, '');
    const next = highlighted.includes(clean) ? highlighted.filter((w: string) => w !== clean) : [...highlighted, clean];
    onChange({ kind: 'highlight_words', words: next });
  };

  return (
    <div className={`p-6 rounded-2xl border text-xs leading-loose ${status === 'completed' ? 'opacity-70' : ''}`}>
      {words.map((word, idx) => {
        const clean = word.replace(/[().,;[\]]/g, '');
        const isOn = highlighted.includes(clean);
        return (
          <span key={idx} onClick={() => toggle(word)}
            className={`mx-1 px-1 rounded cursor-pointer transition-colors ${isOn ? 'bg-emerald-500/25 text-emerald-400 font-bold' : 'hover:bg-white/10'}`}>
            {word}
          </span>
        );
      })}
    </div>
  );
}
