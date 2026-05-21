import { useState, useEffect, useCallback } from 'react';
import { getCountdownParts } from '@/lib/utils';

interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

export function useCountdown(targetDate: string | null): CountdownState {
  const getState = useCallback((): CountdownState => {
    if (!targetDate) return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
    const parts = getCountdownParts(targetDate);
    return { days: parts.days, hours: parts.hours, minutes: parts.minutes, seconds: parts.seconds, isExpired: parts.expired };
  }, [targetDate]);

  const [countdown, setCountdown] = useState<CountdownState>(getState);

  useEffect(() => {
    if (!targetDate) return;
    setCountdown(getState());
    const interval = setInterval(() => {
      const updated = getState();
      setCountdown(updated);
      if (updated.isExpired) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate, getState]);

  return countdown;
}
