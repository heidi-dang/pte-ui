import React from 'react';
import { Mic } from 'lucide-react';
import type { RendererProps } from '../types';

export const RSRenderer: React.FC<RendererProps> = ({ status, theme }) => {
  return (
    <div className={`p-6 rounded-2xl border text-center ${
      status === 'recording' ? 'border-red-500/40 bg-red-500/5' : theme === 'dark' ? 'bg-gray-950/40 border-gray-850' : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex justify-center mb-4">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
          status === 'recording' ? 'bg-red-500 text-white animate-pulse' : 'bg-emerald-500/10 text-emerald-400'
        }`}>
          <Mic className="w-6 h-6" />
        </div>
      </div>
      <p className="text-xs font-mono font-bold tracking-widest uppercase mb-4">
        {status === 'preparing' && 'MIC STATUS: STANDBY — LISTEN CAREFULLY'}
        {status === 'recording' && 'MIC STATUS: RECORDING — REPEAT THE SENTENCE'}
        {status === 'completed' && 'MIC STATUS: CAPTURED'}
      </p>
      <span className="text-[10px] text-gray-500 font-mono">
        {status === 'preparing' && 'Recording begins after the audio plays'}
        {status === 'recording' && 'Repeat the sentence exactly as you heard it'}
        {status === 'completed' && 'Voice response stored. Click submit.'}
      </span>
    </div>
  );
};
