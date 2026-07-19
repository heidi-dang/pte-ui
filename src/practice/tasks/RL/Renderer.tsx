import React from 'react';
import { Mic, MicOff, CheckCircle2, Headphones } from 'lucide-react';
import type { RendererProps } from '../types';

export const RLRenderer: React.FC<RendererProps> = ({ status }) => {
  const isRecording = status === 'recording';
  const isSubmitted = status === 'submitted' || status === 'completed';
  const isPromptPlaying = status === 'prompt_playing';

  return (
    <div className="space-y-5">
      <div className={`rounded-2xl border p-8 text-center transition-all duration-300 ${
        isRecording
          ? 'border-primary-500/40 bg-primary-500/5 shadow-lg shadow-primary-500/5'
          : isSubmitted
            ? 'border-success-500/30 bg-success-500/5'
            : isPromptPlaying
              ? 'border-primary-500/20 bg-primary-500/5'
              : 'border-dark-border bg-dark-surface'
      }`}>
        <div className="flex justify-center mb-5">
          <div className={`h-20 w-20 rounded-full flex items-center justify-center transition-all duration-300 ${
            isRecording
              ? 'bg-primary-500 text-white scale-110 shadow-lg shadow-primary-500/30'
              : isSubmitted
                ? 'bg-success-500/10 text-success-400'
                : isPromptPlaying
                  ? 'bg-primary-500/20 text-primary-400'
                  : 'bg-dark-elevated text-gray-500'
          }`}>
            {isRecording ? (
              <Mic className="h-8 w-8 animate-pulse" />
            ) : isSubmitted ? (
              <CheckCircle2 className="h-8 w-8" />
            ) : isPromptPlaying ? (
              <Headphones className="h-8 w-8 animate-pulse" />
            ) : (
              <MicOff className="h-8 w-8" />
            )}
          </div>
        </div>

        <p className="text-sm font-semibold text-gray-100 mb-2">
          {isRecording && 'Recording... Retell the lecture in your own words'}
          {isSubmitted && 'Voice response captured'}
          {isPromptPlaying && 'Listen to the lecture carefully'}
          {!isRecording && !isSubmitted && !isPromptPlaying && 'Ready to retell'}
        </p>

        <p className="text-xs text-gray-500">
          {isRecording && 'Cover key points, arguments, and the overall message'}
          {isSubmitted && 'Response stored. Click Submit to continue'}
          {isPromptPlaying && 'Take notes while listening to the lecture'}
          {!isRecording && !isSubmitted && !isPromptPlaying && 'Recording will begin after preparation'}
        </p>
      </div>
    </div>
  );
};
