import { useState, useEffect, useRef, useCallback } from 'react';

export type TimerPhase = 'preparing' | 'recording' | 'answering' | 'completed';

export interface UseTaskTimerReturn {
  phase: TimerPhase;
  countdown: number;
  prepCountdown: number;
  reset: (prepSec: number, deadlineAt: string) => void;
}

function msUntil(iso: string): number {
  return new Date(iso).getTime() - Date.now();
}

function clampSeconds(ms: number): number {
  return Math.max(0, Math.floor(ms / 1000));
}

export function useTaskTimer(): UseTaskTimerReturn {
  const [phase, setPhase] = useState<TimerPhase>('preparing');
  const [responseCountdown, setResponseCountdown] = useState(0);
  const [prepCountdown, setPrepCountdown] = useState(0);
  const phaseRef = useRef<TimerPhase>('preparing');
  const prepDeadlineRef = useRef<string | null>(null);
  const respDeadlineRef = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiredFiredRef = useRef(false);

  phaseRef.current = phase;

  const recompute = useCallback(() => {
    const curPhase = phaseRef.current;
    const prepDead = prepDeadlineRef.current;
    const respDead = respDeadlineRef.current;

    if (curPhase === 'preparing' && prepDead) {
      const remaining = clampSeconds(msUntil(prepDead));
      setPrepCountdown(remaining);
      if (remaining <= 0) {
        setPhase('answering');
        if (respDead) {
          setResponseCountdown(clampSeconds(msUntil(respDead)));
        }
      }
      return;
    }

    if ((curPhase === 'answering' || curPhase === 'recording') && respDead) {
      const remaining = clampSeconds(msUntil(respDead));
      setResponseCountdown(remaining);
      if (remaining <= 0 && !expiredFiredRef.current) {
        expiredFiredRef.current = true;
        setPhase('completed');
      }
      return;
    }

    if (curPhase === 'completed') {
      setResponseCountdown(0);
      setPrepCountdown(0);
    }
  }, []);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startInterval = useCallback(() => {
    clearTimer();
    intervalRef.current = setInterval(recompute, 1000);
  }, [clearTimer, recompute]);

  // Handle visibilitychange and focus — recompute immediately
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') recompute();
    };
    const onFocus = () => recompute();

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
    };
  }, [recompute]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  const reset = useCallback((prepSec: number, deadlineAt: string) => {
    clearTimer();
    expiredFiredRef.current = false;
    const now = Date.now();
    const respDead = new Date(deadlineAt).getTime();
    respDeadlineRef.current = deadlineAt;

    if (prepSec > 0) {
      prepDeadlineRef.current = new Date(now + prepSec * 1000).toISOString();
      setPrepCountdown(prepSec);
      setPhase('preparing');
    } else {
      prepDeadlineRef.current = null;
      setPrepCountdown(0);
      const respRemaining = clampSeconds(respDead - now);
      setResponseCountdown(respRemaining);
      setPhase(respRemaining > 0 ? 'answering' : 'completed');
    }

    startInterval();
  }, [clearTimer, startInterval]);

  return { phase, countdown: responseCountdown, prepCountdown, reset };
}
