import React from 'react';
import { BookOpen } from 'lucide-react';
import { PTE_TASK_TYPES } from '../../data/mockData';
import type { PTETaskCode } from '../../types';

interface TaskSidebarProps {
  activeCode: PTETaskCode;
  taskCounts: Record<string, number>;
  theme: 'dark' | 'light';
  onTaskSelect: (code: PTETaskCode) => void;
}

export const TaskSidebar: React.FC<TaskSidebarProps> = ({ activeCode, taskCounts, theme, onTaskSelect }) => {
  return (
    <div className="w-full lg:w-1/4 space-y-4">
      <div className={`p-5 rounded-3xl border ${theme === 'dark' ? 'bg-gray-900/30 border-gray-850' : 'bg-white border-gray-200'}`}>
        <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-gray-400 mb-4 flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-emerald-400" /> All 22 Task Types
        </h3>
        <div className="space-y-1 max-h-96 lg:max-h-[550px] overflow-y-auto pr-2">
          {PTE_TASK_TYPES.map(t => (
            <button key={t.code} onClick={() => onTaskSelect(t.code)}
              className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${activeCode === t.code ? 'bg-emerald-500 text-white font-bold shadow' : theme === 'dark' ? 'hover:bg-gray-950 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'}`}>
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${activeCode === t.code ? 'bg-white/20 text-white' : 'bg-emerald-500/10 text-emerald-400'}`}>{t.code}</span>
                <span className="truncate max-w-[100px]">{t.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[9px] opacity-60 uppercase font-mono">{t.section[0]}</span>
                {taskCounts[t.code] !== undefined && (
                  <span className={`text-[9px] font-mono ${taskCounts[t.code] > 0 ? 'text-emerald-400' : 'text-gray-500'}`}>{taskCounts[t.code]}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
