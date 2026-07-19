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

const DesktopNavigator: React.FC<QuestionNavBarProps> = ({
  total, page, totalPages, search, difficultyFilter,
  questionIndex, itemCount, pageSize, theme,
  onSearchChange, onDifficultyChange, onQuestionSelect, onPageChange,
}) => {
  return (
    <div className={`hidden md:flex md:flex-wrap items-center gap-2 ${theme === 'dark' ? '' : ''}`}>
      <div className="flex items-center gap-1 text-xs text-gray-400 mr-2 shrink-0">
        <span className="font-mono font-bold text-emerald-400">{total}</span> questions
      </div>
      <div className="flex items-center gap-1 bg-gray-800 rounded-lg px-2 py-1 min-w-0">
        <Search className="w-3 h-3 text-gray-500 shrink-0" />
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
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: Math.min(itemCount, 20) }).map((_, idx) => (
          <button key={idx} onClick={() => onQuestionSelect(idx)}
            className={`text-[10px] font-mono font-bold w-7 h-7 rounded-lg transition-all cursor-pointer ${idx === questionIndex ? 'bg-emerald-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
            {page * pageSize - pageSize + idx + 1}
          </button>
        ))}
      </div>
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

const MobileNavigator: React.FC<QuestionNavBarProps> = ({
  total, questionIndex, itemCount, page, pageSize,
  onQuestionSelect,
}) => {
  const totalQuestions = total;

  return (
    <div className="md:hidden w-full max-w-full min-w-0">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-emerald-400">
            Question {page * pageSize - pageSize + questionIndex + 1} of {totalQuestions}
          </div>
          <div className="truncate text-xs text-slate-400">
            Jump or move between questions
          </div>
        </div>

        <select
          value={questionIndex}
          onChange={(event) => onQuestionSelect(Number(event.target.value))}
          className="h-11 max-w-[140px] rounded-xl bg-slate-800 px-3 text-sm text-white"
          aria-label="Jump to question"
        >
          {Array.from({ length: itemCount }).map((_, idx) => (
            <option key={idx} value={idx}>
              Q{page * pageSize - pageSize + idx + 1}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={questionIndex === 0}
          onClick={() => onQuestionSelect(questionIndex - 1)}
          className="h-11 rounded-xl bg-slate-800 px-4 text-sm font-semibold text-white disabled:opacity-40"
        >
          Previous
        </button>

        <button
          type="button"
          disabled={questionIndex >= itemCount - 1}
          onClick={() => onQuestionSelect(questionIndex + 1)}
          className="h-11 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export const QuestionNavBar: React.FC<QuestionNavBarProps> = (props) => {
  const { theme } = props;

  return (
    <div className={`w-full max-w-full min-w-0 overflow-hidden rounded-2xl border p-3 ${theme === 'dark' ? 'bg-gray-900/10 border-gray-850' : 'bg-white border-gray-200'}`}>
      <DesktopNavigator {...props} />
      <MobileNavigator {...props} />
    </div>
  );
};
