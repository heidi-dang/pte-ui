import type { ReactNode } from 'react';

interface AudioTaskFrameProps {
  title: string;
  instruction: string;
  promptText?: string;
  passageText?: string;
  imageUrl?: string | null;
  audioUrl?: string | null;
  isAudioPlaying: boolean;
  audioPlaybackUrl?: string;
  status: string;
  theme: string;
  timerDisplay?: ReactNode;
  recordingSection?: ReactNode;
  onPlay: () => void;
  onPause: () => void;
  onEnded: () => void;
}

export function AudioTaskFrame({
  title, instruction, promptText, passageText, imageUrl, audioUrl,
  isAudioPlaying, audioPlaybackUrl, status, theme, timerDisplay,
  recordingSection, onPlay, onPause, onEnded,
}: AudioTaskFrameProps) {
  const isDark = theme === 'dark';
  return (
    <div className="space-y-4">
      {passageText && (
        <div className={`rounded-xl border p-4 text-sm leading-relaxed ${isDark ? 'border-dark-border bg-dark-elevated text-gray-300' : 'border-gray-200 bg-gray-50 text-gray-700'}`}>
          {passageText}
        </div>
      )}

      <h3 className={`text-sm sm:text-base font-bold font-sans ${isDark ? 'text-white' : 'text-slate-950'}`}>
        {title}
      </h3>

      <div className={`border-l-4 p-3.5 text-xs leading-normal font-sans rounded-r-xl ${
        isDark ? 'bg-indigo-500/5 border-indigo-500/40 text-indigo-300' : 'bg-indigo-50 border-indigo-600 text-indigo-900'
      }`}>
        <p className="font-bold">Instructions:</p>
        <p className="mt-0.5">{instruction}</p>
      </div>

      {imageUrl && (
        <div className="flex justify-center border border-gray-800/40 rounded-2xl overflow-hidden max-w-md mx-auto">
          <img referrerPolicy="no-referrer" src={imageUrl} alt={title} className="max-h-60 object-contain" />
        </div>
      )}

      {audioUrl && (
        <div className={`p-4 rounded-2xl border flex flex-col gap-3 ${isDark ? 'bg-gray-950/60 border-gray-850' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex justify-between items-center text-[10px] font-mono">
            <span className="text-gray-400">LECTURE RECORDING</span>
            <span className="text-emerald-400 font-bold">{isAudioPlaying ? 'PLAYING' : 'IDLE'}</span>
          </div>
          {audioPlaybackUrl && (
            <audio controls className="w-full h-8" autoPlay={status === 'preparing'} src={audioPlaybackUrl}
              onPlay={onPlay} onPause={onPause} onEnded={onEnded} />
          )}
        </div>
      )}

      {(!audioUrl) && promptText && (
        <div className={`p-5 rounded-2xl border text-xs leading-relaxed font-sans select-none ${
          isDark ? 'bg-slate-900/40 border-slate-850 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'
        }`}>
          {promptText}
        </div>
      )}

      {timerDisplay && <div className="flex justify-center">{timerDisplay}</div>}

      {recordingSection}
    </div>
  );
}
