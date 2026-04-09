'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export function useTimer(initialTime, onTimeUp) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const durationRef = useRef(initialTime);

  const start = useCallback((duration) => {
    const time = duration ?? initialTime;
    durationRef.current = time;
    setTimeLeft(time);
    setIsRunning(true);
    startTimeRef.current = Date.now();
  }, [initialTime]);

  const stop = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    stop();
    setTimeLeft(durationRef.current);
  }, [stop]);

  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const remaining = Math.max(0, durationRef.current - elapsed);

      if (remaining <= 0) {
        setTimeLeft(0);
        setIsRunning(false);
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        onTimeUp?.();
      } else {
        setTimeLeft(Math.ceil(remaining));
      }
    }, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, onTimeUp]);

  const getElapsedTime = useCallback(() => {
    if (!startTimeRef.current) return 0;
    return (Date.now() - startTimeRef.current) / 1000;
  }, []);

  return { timeLeft, isRunning, start, stop, reset, getElapsedTime };
}
