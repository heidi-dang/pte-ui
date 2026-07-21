import React, { useEffect, useRef } from 'react';

interface WaveformVisualizerProps {
  stream: MediaStream | null;
  isRecording: boolean;
  theme?: 'dark' | 'light';
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({ stream, isRecording, theme = 'dark' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isRecording || !stream || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    // Resume context if it was suspended
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    const audioCtx = audioCtxRef.current;
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;

    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isRecording) return;
      rafRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        
        // Gradient styling
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
        if (theme === 'dark') {
          gradient.addColorStop(0, '#10b981'); // emerald-500
          gradient.addColorStop(1, '#34d399'); // emerald-400
        } else {
          gradient.addColorStop(0, '#059669'); // emerald-600
          gradient.addColorStop(1, '#10b981'); // emerald-500
        }

        ctx.fillStyle = gradient;
        
        // Center vertically or draw from bottom? Let's draw from center for a cool symmetric wave
        const y = (canvas.height - barHeight) / 2;
        
        // Rounded caps for bars
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth - 1, barHeight, 2);
        ctx.fill();

        x += barWidth;
      }
    };

    draw();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (source) source.disconnect();
    };
  }, [isRecording, stream, theme]);

  if (!isRecording) return null;

  return (
    <div className="w-full flex justify-center py-4">
      <canvas
        ref={canvasRef}
        width={300}
        height={80}
        className="max-w-full"
      />
    </div>
  );
};
