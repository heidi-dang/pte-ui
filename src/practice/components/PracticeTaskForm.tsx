import React from 'react';
import { PTETaskCode, PracticeItem } from '../../types';
import { PTE_TASK_TYPES } from '../../data/mockData';
import { getTaskModule } from '../tasks/registry';
import { AlertTriangle, Mic, Square, Play, StopCircle } from 'lucide-react';

const PROMPT_HIDDEN_TASKS = new Set<string>(['WFD', 'SST', 'FIBL', 'HCS', 'HIW', 'MCSSL', 'MCMSL', 'SMW']);

interface PracticeTaskFormProps {
  activeCode: PTETaskCode;
  phase: string;
  theme: 'dark' | 'light';
  activeQuestion: PracticeItem | null;
  taskResponse: Record<string, unknown>;
  onResponseChange: (data: Record<string, unknown>) => void;
  disabled: boolean;
  isSpeaking: boolean;
  isRecording: boolean;
  recordedBlob: Blob | null;
  recordedAudioUrl: string | null;
  micError: string;
  prepCountdown: number;
  countdown: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onClearRecording: () => void;
  onPlayPrompt: () => void;
  attemptId: string | null;
  attemptLoading: boolean;
}

export const PracticeTaskForm: React.FC<PracticeTaskFormProps> = ({
  activeCode, phase, theme, activeQuestion, taskResponse, onResponseChange,
  disabled, isSpeaking, isRecording, recordedBlob, recordedAudioUrl, micError,
  prepCountdown, countdown, onStartRecording, onStopRecording, onClearRecording,
  onPlayPrompt, attemptId, attemptLoading,
}) => {
  if (!activeQuestion) {
    return (
      <div className="p-6 text-center text-gray-500 text-xs">Loading question...</div>
    );
  }

  const taskModule = getTaskModule(activeCode);
  const TaskRenderer = taskModule.Renderer;
  const isPreparing = phase === 'preparing';
  const isActive = phase === 'recording' || phase === 'answering';
  const isCompleted = phase === 'completed';

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-gray-850 pb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase bg-emerald-500/10 px-2.5 py-1 rounded-full font-bold">
              {PTE_TASK_TYPES.find((t) => t.code === activeCode)?.section} Section Task
            </span>
            <span className="text-[10px] font-mono text-gray-400 bg-gray-800 px-2.5 py-1 rounded-full">
              ID: {activeQuestion.id}
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight mt-2">{activeQuestion.title}</h2>
        </div>
        <div className="flex items-center gap-3">
          {isPreparing ? (
            <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 px-3.5 py-1.5 rounded-xl text-orange-400 text-xs font-mono font-bold animate-pulse">
              Preparation Countdown: {prepCountdown}s
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-xl text-emerald-400 text-xs font-mono font-bold">
              Answering Timer: {countdown}s
            </div>
          )}
        </div>
      </div>

      <div className={`p-4 rounded-xl mb-6 flex gap-3 items-start border text-xs leading-relaxed ${theme === 'dark' ? 'bg-gray-950/40 border-gray-850 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
        <AlertTriangle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold mb-1">Instructions:</p>
          <p>{activeQuestion.instruction}</p>
        </div>
      </div>

      <div className="space-y-6 mb-8">
        {activeQuestion.imageUrl && (
          <div className="flex justify-center border border-gray-800/40 rounded-2xl overflow-hidden max-w-md mx-auto">
            <img referrerPolicy="no-referrer" src={activeQuestion.imageUrl} alt={activeQuestion.title} className="max-h-64 object-contain" />
          </div>
        )}

        {activeQuestion.promptText && !PROMPT_HIDDEN_TASKS.has(activeCode) && (
          <div className={`p-6 rounded-2xl border text-sm leading-relaxed whitespace-pre-line ${theme === 'dark' ? 'bg-gray-950/30 border-gray-850 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-800'}`}>
            {activeQuestion.promptText}
          </div>
        )}
      </div>

      {micError && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{micError}</span>
        </div>
      )}

      <TaskRenderer
        item={activeQuestion}
        status={isPreparing ? 'preparing' : isCompleted ? 'completed' : 'answering'}
        theme={theme}
        onAnswerChange={onResponseChange}
      />

      {isSpeaking && (
        <div className={`mt-4 p-6 rounded-2xl border text-center ${phase === 'recording' ? 'border-red-500/40 bg-red-500/5' : theme === 'dark' ? 'bg-gray-950/40 border-gray-850' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex justify-center mb-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-emerald-500/10 text-emerald-400'}`}>
              <Mic className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs font-mono font-bold tracking-widest uppercase mb-2">
            {isPreparing && 'MIC STATUS: STANDBY'}
            {isRecording && 'MIC STATUS: RECORDING...'}
            {recordedBlob && !isRecording && 'MIC STATUS: CAPTURED'}
          </p>
          <div className="flex justify-center gap-3 mb-3">
            {!isRecording && !recordedBlob && (
              <button onClick={onStartRecording} disabled={disabled || attemptLoading}
                className="px-4 py-2 rounded-xl bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50">
                <Mic className="w-4 h-4" /> Start Recording
              </button>
            )}
            {isRecording && (
              <button onClick={onStopRecording}
                className="px-4 py-2 rounded-xl bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-all flex items-center gap-2 cursor-pointer">
                <Square className="w-4 h-4" /> Stop Recording
              </button>
            )}
            {recordedBlob && !isRecording && (
              <button onClick={onClearRecording}
                className="px-4 py-2 rounded-xl bg-gray-700 text-gray-300 text-xs font-semibold hover:bg-gray-600 transition-all flex items-center gap-2 cursor-pointer">
                <StopCircle className="w-4 h-4" /> Re-record
              </button>
            )}
          </div>
          <span className="text-[10px] text-gray-500 font-mono">
            {isPreparing && 'Recording begins when the timer reaches zero'}
            {isRecording && 'Speak clearly into your microphone now'}
            {recordedBlob && !isRecording && `Voice response captured (${Math.round(recordedBlob.size / 1024)} KB). Click submit.`}
          </span>
        </div>
      )}
    </>
  );
};
