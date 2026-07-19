import React from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface QuestionNavBarProps {
  total: number;
  page: number;
  totalPages: number;
  search: string;
  difficultyFilter: string;
  questionIndex: number;
  itemCount: number;
  pageSize: number;
  theme: 'dark' | 'light';
  onSearchChange: (val: string) => void;
  onDifficultyChange: (val: string) => void;
  onQuestionSelect: (idx: number) => void;
  onPageChange: (page: number) => void;
}

export const QuestionNavBar: React.FC<QuestionNavBarProps> = ({
  total, page, totalPages, search, difficultyFilter,
  questionIndex, itemCount, pageSize, theme,
  onSearchChange, onDifficultyChange, onQuestionSelect, onPageChange,
}) => {
  return (
    <div className={`p-3 rounded-2xl border flex flex-wrap items-center gap-2 ${theme === 'dark' ? 'bg-gray-900/10 border-gray-850' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center gap-1 text-xs text-gray-400 mr-2">
        <span className="font-mono font-bold text-emerald-400">{total}</span> questions
      </div>
      <div className="flex items-center gap-1 bg-gray-800 rounded-lg px-2 py-1">
        <Search className="w-3 h-3 text-gray-500" />
        <input type="text" placeholder="Search..." value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="bg-transparent text-xs text-white outline-none w-24 placeholder-gray-500" />
      </div>
      <select value={difficultyFilter} onChange={(e) => onDifficultyChange(e.target.value)}
        className="bg-gray-800 text-xs text-gray-300 rounded-lg px-2 py-1 border-0 outline-none">
        <option value="">All</option>
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
        <option value="hard">Hard</option>
      </select>
      {Array.from({ length: Math.min(itemCount, 20) }).map((_, idx) => (
        <button key={idx} onClick={() => onQuestionSelect(idx)}
          className={`text-[10px] font-mono font-bold w-7 h-7 rounded-lg transition-all cursor-pointer ${idx === questionIndex ? 'bg-emerald-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
          {page * pageSize - pageSize + idx + 1}
        </button>
      ))}
      {totalPages > 1 && (
        <div className="flex items-center gap-1 ml-auto">
          <button onClick={() => onPageChange(page - 1)} disabled={page <= 1}
            className="text-gray-400 hover:text-white disabled:opacity-30 p-1 cursor-pointer">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[10px] font-mono text-gray-500">{page}/{totalPages}</span>
          <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}
            className="text-gray-400 hover:text-white disabled:opacity-30 p-1 cursor-pointer">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
