import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

interface WaveAudioPlayerProps {
  src: string;
  autoPlay?: boolean;
  onEnded?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onTimeUpdate?: (progress: number) => void; // 0 to 1
}

export const WaveAudioPlayer: React.FC<WaveAudioPlayerProps> = ({
  src,
  autoPlay,
  onEnded,
  onPlay,
  onPause,
  onTimeUpdate
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (autoPlay && audioRef.current) {
      audioRef.current.play().catch(e => console.warn('Autoplay blocked', e));
    }
  }, [autoPlay, src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const p = audioRef.current.currentTime / (audioRef.current.duration || 1);
      setProgress(p);
      if (onTimeUpdate) onTimeUpdate(p);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(1);
    if (onEnded) onEnded();
  };

  return (
    <div className="flex items-center gap-4 bg-gray-900/50 p-4 rounded-xl border border-gray-800">
      <audio
        ref={audioRef}
        src={src}
        onPlay={() => { setIsPlaying(true); if (onPlay) onPlay(); }}
        onPause={() => { setIsPlaying(false); if (onPause) onPause(); }}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        className="hidden"
      />
      <button
        onClick={togglePlay}
        className="w-12 h-12 flex items-center justify-center bg-emerald-500 hover:bg-emerald-400 text-black rounded-full transition-colors"
      >
        {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
      </button>
      
      <div className="flex-1 flex items-center gap-1 h-8">
        {Array.from({ length: 40 }).map((_, i) => {
          const isActive = (i / 40) <= progress;
          const height = isPlaying
            ? 30 + Math.random() * 70 // 30% to 100%
            : 30; // flat when paused

          return (
            <div
              key={i}
              className={`flex-1 rounded-full transition-all duration-100 ${
                isActive ? 'bg-emerald-400' : 'bg-gray-700'
              }`}
              style={{ height: `${height}%` }}
            />
          );
        })}
      </div>
    </div>
  );
};
