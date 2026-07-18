import { useState, useRef, useCallback, useEffect } from 'react';

export interface UseAudioRecorderReturn {
  isRecording: boolean;
  recordedBlob: Blob | null;
  recordedAudioUrl: string | null;
  isPlaybackPlaying: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  togglePlayback: () => void;
  clearRecording: () => void;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isPlaybackPlaying, setIsPlaybackPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const playbackRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setRecordedAudioUrl(url);
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      setIsRecording(false);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const togglePlayback = useCallback(() => {
    if (!playbackRef.current) {
      if (!recordedAudioUrl) return;
      const audio = new Audio(recordedAudioUrl);
      audio.addEventListener('ended', () => setIsPlaybackPlaying(false));
      playbackRef.current = audio;
    }

    if (isPlaybackPlaying) {
      playbackRef.current.pause();
      setIsPlaybackPlaying(false);
    } else {
      if (playbackRef.current.src !== recordedAudioUrl) {
        playbackRef.current.src = recordedAudioUrl || '';
      }
      playbackRef.current.play().catch(() => {});
      setIsPlaybackPlaying(true);
    }
  }, [recordedAudioUrl, isPlaybackPlaying]);

  const clearRecording = useCallback(() => {
    if (playbackRef.current) {
      playbackRef.current.pause();
      playbackRef.current = null;
    }
    if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
    setRecordedBlob(null);
    setRecordedAudioUrl(null);
    setIsPlaybackPlaying(false);
  }, [recordedAudioUrl]);

  useEffect(() => {
    return () => {
      if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
    };
  }, []);

  return {
    isRecording,
    recordedBlob,
    recordedAudioUrl,
    isPlaybackPlaying,
    startRecording,
    stopRecording,
    togglePlayback,
    clearRecording,
  };
}
