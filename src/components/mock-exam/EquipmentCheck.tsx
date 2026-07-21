import React, { useState, useRef } from 'react';
import { WaveformVisualizer } from '../../practice/components/WaveformVisualizer';
import { Mic, Play, Square, CheckCircle, AlertTriangle } from 'lucide-react';

interface EquipmentCheckProps {
  onComplete: () => void;
  theme: string;
}

export function EquipmentCheck({ onComplete, theme }: EquipmentCheckProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [error, setError] = useState('');

  const startRecording = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(s);
      const recorder = new MediaRecorder(s);
      mediaRecorderRef.current = recorder;
      const chunks: Blob[] = [];
      recorder.ondataavailable = e => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setRecordedAudio(URL.createObjectURL(blob));
        s.getTracks().forEach(t => t.stop());
        setStream(null);
      };
      recorder.start();
      setIsRecording(true);
      setError('');
    } catch (err) {
      setError('Microphone access denied or unavailable. Please check your browser permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const playRecording = () => {
    if (audioRef.current && recordedAudio) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className={`flex flex-col items-center justify-center p-8 rounded-xl border max-w-2xl mx-auto shadow-2xl backdrop-blur-md ${isDark ? 'bg-slate-900/80 border-slate-700 text-white' : 'bg-white/80 border-slate-200 text-slate-900'}`}>
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Mic className="w-6 h-6 text-emerald-500" /> Equipment Check</h2>
      <p className="text-center mb-8 opacity-80">
        Before you begin your Mock Exam, let's verify your microphone and headphones are working properly. 
        Record a short sample and play it back to ensure clear audio quality.
      </p>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/50 text-red-500 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="flex flex-col items-center w-full mb-8">
        {!recordedAudio && !isRecording && (
          <button onClick={startRecording} className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold transition-all shadow-lg shadow-blue-500/30">
            <Mic className="w-5 h-5" /> Start Recording
          </button>
        )}
        
        {isRecording && (
          <div className="flex flex-col items-center w-full gap-4">
            <div className="w-full bg-slate-950/50 rounded-xl overflow-hidden border border-slate-800 p-4">
              <WaveformVisualizer stream={stream} isRecording={isRecording} theme={theme as any} />
            </div>
            <button onClick={stopRecording} className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-full font-bold transition-all shadow-lg shadow-red-500/30">
              <Square className="w-5 h-5" /> Stop Recording
            </button>
          </div>
        )}

        {recordedAudio && !isRecording && (
          <div className="flex flex-col items-center w-full gap-6">
            <div className="flex items-center gap-4">
              <button 
                onClick={playRecording} 
                disabled={isPlaying}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-full font-bold transition-all shadow-lg shadow-emerald-500/30">
                <Play className="w-5 h-5" /> {isPlaying ? 'Playing...' : 'Play Back'}
              </button>
              <button 
                onClick={() => { setRecordedAudio(null); setIsPlaying(false); }} 
                className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-full font-bold transition-all">
                <Mic className="w-5 h-5" /> Retest
              </button>
            </div>
            <audio 
              ref={audioRef} 
              src={recordedAudio} 
              onEnded={() => setIsPlaying(false)} 
              className="hidden" 
            />
          </div>
        )}
      </div>

      <div className="w-full border-t border-slate-700/50 pt-6 flex justify-end">
        <button 
          onClick={onComplete}
          disabled={!recordedAudio}
          className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-all shadow-lg">
          <CheckCircle className="w-5 h-5" /> Sounds Good, Start Exam
        </button>
      </div>
    </div>
  );
}
