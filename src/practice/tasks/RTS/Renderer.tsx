import React from 'react';
import { Mic, MicOff, CheckCircle2, MessageSquare } from 'lucide-react';
import type { RendererProps } from '../types';

export const RTSRenderer: React.FC<RendererProps> = ({ item, status }) => {
  const isRecording = status === 'recording';
  const isSubmitted = status === 'submitted' || status === 'completed';

  return (
    <div className="space-y-5">
      <div className="p-5 rounded-xl border border-dark-border bg-dark-surface-50">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="h-4 w-4 text-primary-400" />
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Situation</span>
        </div>
        <p className="text-sm text-gray-200 leading-relaxed">
          {item.promptText || 'Describe a situation where you need to respond appropriately.'}
        </p>
      </div>

      <div className={`rounded-2xl border p-8 text-center transition-all duration-300 ${
        isRecording
          ? 'border-primary-500/40 bg-primary-500/5 shadow-lg shadow-primary-500/5'
          : isSubmitted
            ? 'border-success-500/30 bg-success-500/5'
            : 'border-dark-border bg-dark-surface'
      }`}>
        <div className="flex justify-center mb-5">
          <div className={`h-20 w-20 rounded-full flex items-center justify-center transition-all duration-300 ${
            isRecording
              ? 'bg-primary-500 text-white scale-110 shadow-lg shadow-primary-500/30'
              : isSubmitted
                ? 'bg-success-500/10 text-success-400'
                : 'bg-dark-elevated text-gray-500'
          }`}>
            {isRecording ? (
              <Mic className="h-8 w-8 animate-pulse" />
            ) : isSubmitted ? (
              <CheckCircle2 className="h-8 w-8" />
            ) : (
              <MicOff className="h-8 w-8" />
            )}
          </div>
        </div>

        <p className="text-sm font-semibold text-gray-100 mb-2">
          {isRecording && 'Recording... Describe your response to the situation'}
          {isSubmitted && 'Voice response captured'}
          {!isRecording && !isSubmitted && 'Read the situation carefully'}
        </p>

        <p className="text-xs text-gray-500">
          {isRecording && 'Explain what action you would take and why'}
          {isSubmitted && 'Response stored. Click Submit to continue'}
          {!isRecording && !isSubmitted && 'Use preparation time to plan your response'}
        </p>
      </div>
    </div>
  );
};
