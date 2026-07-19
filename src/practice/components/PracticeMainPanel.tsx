import React from 'react';
import { CheckCircle, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PTE_TASK_TYPES, PRACTICE_ITEMS } from '../../data/mockData';
import type { PTETaskCode, PracticeItem } from '../../types';
import type { QuestionListItem } from '../../shared/api/practice';
import { QuestionNavBar } from './QuestionNavBar';
import { PracticeTaskForm } from './PracticeTaskForm';
import { PracticeResultPanel } from './PracticeResultPanel';
import { PracticeSidePanels } from './PracticeSidePanels';

interface PracticeMainPanelProps {
  theme: 'dark' | 'light';
  activeCode: PTETaskCode;
  items: QuestionListItem[];
  questionIndex: number;
  page: number;
  total: number;
  totalPages: number;
  search: string;
  difficultyFilter: string;
  showResult: boolean;
  activeQuestion: QuestionListItem | null;
  isPublishedCms: boolean;
  hasNoPublished: boolean;
  demoItem: PracticeItem | null;
  phase: string;
  taskResponse: Record<string, unknown>;
  submitting: boolean;
  localStatus: string;
  isSpeaking: boolean;
  isRecording: boolean;
  recordedBlob: Blob | null;
  recordedAudioUrl: string | null;
  micError: string;
  prepCountdown: number;
  countdown: number;
  remainingPlays: number | null;
  attemptId: string | null;
  attemptLoading: boolean;
  resultData: any;
  noteText: string;
  isNoteSaving: boolean;
  serverSubmissions: any[];
  questionHistory: any[];
  scoredSubmission: any;
  onTaskChange: (code: PTETaskCode) => void;
  onSearchChange: (v: string) => void;
  onDifficultyChange: (v: string) => void;
  onQuestionSelect: (idx: number) => void;
  onPageChange: (p: number) => void;
  onResponseChange: (data: Record<string, unknown>) => void;
  onSubmit: () => void;
  onRetry: () => void;
  onAdvance: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onClearRecording: () => void;
  onPlayPrompt: () => void;
  onNoteChange: (text: string) => void;
}

export const PracticeMainPanel: React.FC<PracticeMainPanelProps> = (p) => {
  const PAGE_SIZE = 20;

  return (
    <div className="flex-1 space-y-4">
      {!p.showResult && p.items.length > 0 && (
        <QuestionNavBar
          total={p.total} page={p.page} totalPages={p.totalPages}
          search={p.search} difficultyFilter={p.difficultyFilter}
          questionIndex={p.questionIndex} itemCount={p.items.length} pageSize={PAGE_SIZE}
          theme={p.theme}
          onSearchChange={p.onSearchChange}
          onDifficultyChange={p.onDifficultyChange}
          onQuestionSelect={p.onQuestionSelect}
          onPageChange={p.onPageChange}
        />
      )}

      <AnimatePresence mode="wait">
        {!p.showResult ? (
          <motion.div key="sim" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className={`p-6 sm:p-8 rounded-3xl border relative ${p.theme === 'dark' ? 'bg-gray-900/10 border-gray-850' : 'bg-white border-gray-200 shadow-sm'}`}>
            {p.hasNoPublished && p.demoItem && (
              <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>No published questions available for this task yet. Showing demo content — scoring disabled.</span>
              </div>
            )}

            {(p.items.length > 0 && p.activeQuestion) || (p.hasNoPublished && p.demoItem) ? (
              <PracticeTaskForm
                activeCode={p.activeCode} phase={p.phase} theme={p.theme}
                activeQuestion={((p.items.length > 0 ? p.activeQuestion : p.demoItem) as any)}
                taskResponse={p.taskResponse} onResponseChange={p.onResponseChange}
                disabled={p.submitting || p.localStatus === 'submitted'}
                isSpeaking={p.isSpeaking} isRecording={p.isRecording}
                recordedBlob={p.recordedBlob} recordedAudioUrl={p.recordedAudioUrl}
                micError={p.micError} prepCountdown={p.prepCountdown} countdown={p.countdown}
                onStartRecording={p.onStartRecording} onStopRecording={p.onStopRecording}
                onClearRecording={p.onClearRecording} onPlayPrompt={p.onPlayPrompt}
                remainingPlays={p.remainingPlays} attemptId={p.attemptId} attemptLoading={p.attemptLoading}
              />
            ) : (
              <div className="p-12 text-center">
                <p className="text-gray-500 text-sm">No published questions available for this task yet.</p>
                <p className="text-gray-600 text-xs mt-2">Try selecting a different task type.</p>
              </div>
            )}

            {/* Desktop action row */}
            <div className="hidden sm:flex justify-between items-center border-t border-gray-850 pt-6 mt-6">
              <div className="flex gap-2">
                <button onClick={() => { const i = PTE_TASK_TYPES.findIndex(t => t.code === p.activeCode); if (i > 0) p.onTaskChange(PTE_TASK_TYPES[i - 1].code); }}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-gray-800 text-gray-300 hover:bg-gray-700 transition-all flex items-center gap-1 cursor-pointer">
                  <ChevronLeft className="w-4 h-4" /> Prev Task
                </button>
                <button onClick={() => { const i = PTE_TASK_TYPES.findIndex(t => t.code === p.activeCode); if (i < PTE_TASK_TYPES.length - 1) p.onTaskChange(PTE_TASK_TYPES[i + 1].code); }}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-gray-800 text-gray-300 hover:bg-gray-700 transition-all flex items-center gap-1 cursor-pointer">
                  Next Task <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-2">
                {p.items.length > 0 && (
                  <>
                    <button onClick={() => { if (p.questionIndex > 0) p.onQuestionSelect(p.questionIndex - 1); }}
                      disabled={p.questionIndex <= 0}
                      className="px-3 py-2 rounded-xl text-xs font-semibold bg-gray-800 text-gray-300 hover:bg-gray-700 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-30">
                      <ChevronLeft className="w-4 h-4" /> Prev Q
                    </button>
                    <button onClick={() => { if (p.questionIndex < p.items.length - 1) p.onQuestionSelect(p.questionIndex + 1); }}
                      disabled={p.questionIndex >= p.items.length - 1}
                      className="px-3 py-2 rounded-xl text-xs font-semibold bg-gray-800 text-gray-300 hover:bg-gray-700 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-30">
                      Next Q <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
                <button onClick={p.onSubmit} disabled={p.submitting || p.attemptLoading || p.localStatus === 'submitted' || (!p.isPublishedCms && p.hasNoPublished)}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold transition-all shadow shadow-emerald-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50">
                  {p.submitting ? 'Submitting...' : <><CheckCircle className="w-4 h-4" /> Submit</>}
                </button>
              </div>
            </div>

            {/* Mobile action row */}
            <div className="sm:hidden border-t border-gray-850 pt-5 mt-5 space-y-3">
              <button onClick={p.onSubmit} disabled={p.submitting || p.attemptLoading || p.localStatus === 'submitted' || (!p.isPublishedCms && p.hasNoPublished)}
                className="w-full h-11 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition-all shadow shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
                {p.submitting ? 'Submitting...' : <><CheckCircle className="w-4 h-4" /> Submit Answer</>}
              </button>
              {p.items.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => {
                    if (p.questionIndex > 0) {
                      p.onQuestionSelect(p.questionIndex - 1);
                    } else if (p.page > 1) {
                      p.onPageChange(p.page - 1);
                    }
                  }}
                    disabled={p.page <= 1 && p.questionIndex <= 0}
                    className="h-11 rounded-xl text-sm font-semibold bg-gray-800 text-gray-300 hover:bg-gray-700 transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-30">
                    <ChevronLeft className="w-4 h-4" /> Prev Q
                  </button>
                  <button onClick={() => {
                    if (p.questionIndex < p.items.length - 1) {
                      p.onQuestionSelect(p.questionIndex + 1);
                    } else if (p.page < p.totalPages) {
                      p.onPageChange(p.page + 1);
                    }
                  }}
                    disabled={p.page >= p.totalPages && p.questionIndex >= p.items.length - 1}
                    className="h-11 rounded-xl text-sm font-semibold bg-gray-800 text-gray-300 hover:bg-gray-700 transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-30">
                    Next Q <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => { const i = PTE_TASK_TYPES.findIndex(t => t.code === p.activeCode); if (i > 0) p.onTaskChange(PTE_TASK_TYPES[i - 1].code); }}
                  className="h-11 rounded-xl text-sm font-semibold bg-gray-800 text-gray-300 hover:bg-gray-700 transition-all flex items-center justify-center gap-1 cursor-pointer">
                  <ChevronLeft className="w-4 h-4" /> Prev Task
                </button>
                <button onClick={() => { const i = PTE_TASK_TYPES.findIndex(t => t.code === p.activeCode); if (i < PTE_TASK_TYPES.length - 1) p.onTaskChange(PTE_TASK_TYPES[i + 1].code); }}
                  className="h-11 rounded-xl text-sm font-semibold bg-gray-800 text-gray-300 hover:bg-gray-700 transition-all flex items-center justify-center gap-1 cursor-pointer">
                  Next Task <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            {p.resultData?.error && (
              <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /><span>{p.resultData.error}</span>
              </div>
            )}
          </motion.div>
        ) : (
          <PracticeResultPanel
            scoredSubmission={p.scoredSubmission}
            theme={p.theme}
            activeItem={p.activeQuestion || PRACTICE_ITEMS[p.activeCode]}
            onRetry={p.onRetry}
            onAdvance={p.onAdvance}
          />
        )}
      </AnimatePresence>
      <PracticeSidePanels theme={p.theme} note={p.noteText} isNoteSaving={p.isNoteSaving} onNoteChange={p.onNoteChange}
        serverSubmissions={p.serverSubmissions} questionHistory={p.questionHistory}
        itemId={p.activeQuestion?.id || ''} />
    </div>
  );
};
