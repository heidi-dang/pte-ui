import React, { useEffect, useRef } from 'react';

interface ExamNoiseGeneratorProps {
  active: boolean;
  volume?: number; // 0.0 to 1.0
}

export const ExamNoiseGenerator: React.FC<ExamNoiseGeneratorProps> = ({ active, volume = 0.05 }) => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    if (!active) {
      if (sourceRef.current) {
        // Fade out smoothly to avoid popping
        if (gainNodeRef.current && audioCtxRef.current) {
          gainNodeRef.current.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.5);
          setTimeout(() => {
            if (sourceRef.current) {
              sourceRef.current.stop();
              sourceRef.current.disconnect();
              sourceRef.current = null;
            }
          }, 1000);
        } else {
          sourceRef.current.stop();
          sourceRef.current.disconnect();
          sourceRef.current = null;
        }
      }
      return;
    }

    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const audioCtx = audioCtxRef.current;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    // Stop previous if exists
    if (sourceRef.current) {
      sourceRef.current.stop();
      sourceRef.current.disconnect();
    }

    // Generate brown noise buffer
    const bufferSize = audioCtx.sampleRate * 2; // 2 seconds of noise
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = buffer.getChannelData(0);
    
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5; // Compensate for gain
    }

    const noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;
    
    // Add a lowpass filter to make it sound like distant AC/murmur
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400; // Cut off high frequencies

    const gainNode = audioCtx.createGain();
    // Fade in
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + 1);

    noiseSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    noiseSource.start();

    sourceRef.current = noiseSource;
    gainNodeRef.current = gainNode;

    return () => {
      // Don't stop immediately on unmount if active toggled fast, 
      // but clean up is handled by the `!active` branch or final unmount.
    };
  }, [active, volume]);

  // Clean up on total unmount
  useEffect(() => {
    return () => {
      if (sourceRef.current) {
        sourceRef.current.stop();
        sourceRef.current.disconnect();
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  return null; // Invisible component
};
