import { useState, useEffect, useRef, useCallback } from 'react';

export type TimerPhase = 'preparing' | 'recording' | 'answering' | 'completed';

export interface UseTaskTimerReturn {
  phase: TimerPhase;
  countdown: number;
  prepCountdown: number;
  reset: (prepSec: number, deadlineAt: string) => void;
}

function calcRemaining(deadlineAt: string): number {
  return Math.max(0, Math.floor((new Date(deadlineAt).getTime() - Date.now()) / 1000));
}

export function useTaskTimer(): UseTaskTimerReturn {
  const [phase, setPhase] = useState<TimerPhase>('preparing');
  const [responseCountdown, setResponseCountdown] = useState(0);
  const [prepCountdown, setPrepCountdown] = useState(0);
  const phaseRef = useRef<TimerPhase>('preparing');
  const prepDeadlineRef = useRef<string | null>(null);
  const respDeadlineRef = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  phaseRef.current = phase;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    const now = Date.now();
    const prepDead = prepDeadlineRef.current ? new Date(prepDeadlineRef.current).getTime() : 0;
    const respDead = respDeadlineRef.current ? new Date(respDeadlineRef.current).getTime() : 0;

    if (phaseRef.current === 'preparing') {
      const remaining = Math.max(0, Math.floor((prepDead - now) / 1000));
      setPrepCountdown(remaining);
      if (remaining <= 0 && prepDead > 0) {
        setPhase('answering');
        setResponseCountdown(Math.max(0, Math.floor((respDead - now) / 1000)));
      }
    } else if (phaseRef.current === 'answering' || phaseRef.current === 'recording') {
      const remaining = Math.max(0, Math.floor((respDead - now) / 1000));
      setResponseCountdown(remaining);
      if (remaining <= 0 && respDead > 0) {
        setPhase('completed');
        clearTimer();
      }
    }
  }, [clearTimer]);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  const reset = useCallback((prepSec: number, deadlineAt: string) => {
    clearTimer();
    const now = Date.now();
    const respDead = new Date(deadlineAt).getTime();
    respDeadlineRef.current = deadlineAt;

    if (prepSec > 0) {
      const prepDead = now + prepSec * 1000;
      prepDeadlineRef.current = new Date(prepDead).toISOString();
      setPrepCountdown(prepSec);
      setPhase('preparing');
    } else {
      prepDeadlineRef.current = null;
      setPrepCountdown(0);
      const respRemaining = Math.max(0, Math.floor((respDead - now) / 1000));
      setResponseCountdown(respRemaining);
      setPhase('answering');
    }

    intervalRef.current = setInterval(tick, 1000);
  }, [clearTimer, tick]);

  return { phase, countdown: responseCountdown, prepCountdown, reset };
}
