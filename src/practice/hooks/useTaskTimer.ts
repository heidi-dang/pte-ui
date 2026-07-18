import { useState, useEffect, useRef, useCallback } from 'react';

export type TimerPhase = 'preparing' | 'recording' | 'answering' | 'completed';

export interface UseTaskTimerOptions {
  prepSeconds: number;
  responseSeconds: number;
  autoStartRecorder?: (phase: TimerPhase) => void;
}

export interface UseTaskTimerReturn {
  phase: TimerPhase;
  countdown: number;
  prepCountdown: number;
  reset: (prepSec: number, respSec: number) => void;
}

export function useTaskTimer(options?: UseTaskTimerOptions): UseTaskTimerReturn {
  const [phase, setPhase] = useState<TimerPhase>('preparing');
  const [responseCountdown, setResponseCountdown] = useState(40);
  const [prepCountdown, setPrepCountdown] = useState(10);
  const phaseRef = useRef(phase);
  const optsRef = useRef(options);

  phaseRef.current = phase;
  optsRef.current = options;

  // Prep timer
  useEffect(() => {
    if (phase !== 'preparing') return;
    if (prepCountdown <= 0) return;

    const interval = setInterval(() => {
      setPrepCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, prepCountdown]);

  // Transition from prep to recording/answering
  useEffect(() => {
    if (phase === 'preparing' && prepCountdown <= 0) {
      if (optsRef.current?.autoStartRecorder) {
        setPhase('recording');
        optsRef.current.autoStartRecorder('recording');
      } else {
        setPhase('answering');
      }
    }
  }, [phase, prepCountdown]);

  // Response timer
  useEffect(() => {
    if (phase !== 'recording' && phase !== 'answering') return;
    if (responseCountdown <= 0) {
      setPhase('completed');
      return;
    }

    const interval = setInterval(() => {
      setResponseCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setPhase('completed');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, responseCountdown]);

  const reset = useCallback((prepSec: number, respSec: number) => {
    setPrepCountdown(prepSec);
    setResponseCountdown(respSec);
    setPhase(prepSec > 0 ? 'preparing' : 'answering');
  }, []);

  return { phase, countdown: responseCountdown, prepCountdown, reset };
}
