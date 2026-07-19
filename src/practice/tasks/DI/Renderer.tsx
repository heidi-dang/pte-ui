import React from 'react';
import { Mic, MicOff, CheckCircle2, ImageIcon } from 'lucide-react';
import type { RendererProps } from '../types';

export const DIRenderer: React.FC<RendererProps> = ({ item, status }) => {
  const isRecording = status === 'recording';
  const isSubmitted = status === 'submitted' || status === 'completed';

  return (
    <div className="space-y-5">
      <div className="flex justify-center">
        <div className="rounded-2xl border border-dark-border bg-dark-surface-50 overflow-hidden max-w-lg w-full">
          {item.imageUrl ? (
            <img
              referrerPolicy="no-referrer"
              src={item.imageUrl}
              alt={item.title}
              className="w-full max-h-72 object-contain p-4"
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <ImageIcon className="h-12 w-12 mb-2" />
              <span className="text-xs">No image available</span>
            </div>
          )}
        </div>
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
          {isRecording && 'Recording... Describe the image in detail'}
          {isSubmitted && 'Voice response captured'}
          {!isRecording && !isSubmitted && 'Study the image carefully'}
        </p>

        <p className="text-xs text-gray-500">
          {isRecording && 'Describe key trends, data points, and your conclusions'}
          {isSubmitted && 'Response stored. Click Submit to continue'}
          {!isRecording && !isSubmitted && 'Use preparation time to analyze the chart or diagram'}
        </p>
      </div>
    </div>
  );
};
