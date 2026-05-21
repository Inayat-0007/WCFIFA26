'use client';

import { useEffect, useState } from 'react';
import { getCountdownParts } from '@/lib/utils';

interface CountdownTimerProps {
  kickoffTime: string;
  className?: string;
  compact?: boolean;
}

export function CountdownTimer({ kickoffTime, className = '', compact = false }: CountdownTimerProps) {
  const [parts, setParts] = useState(getCountdownParts(kickoffTime));

  useEffect(() => {
    const interval = setInterval(() => {
      setParts(getCountdownParts(kickoffTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [kickoffTime]);

  if (parts.expired) {
    return <span className={`text-gray-500 text-xs ${className}`}>Kicked off</span>;
  }

  if (compact) {
    const { days, hours, minutes, seconds } = parts;
    if (days > 0) return <span className={`text-gold-400 font-semibold text-xs ${className}`}>{days}d {hours}h</span>;
    if (hours > 0) return <span className={`text-gold-400 font-semibold text-xs ${className}`}>{hours}h {minutes}m</span>;
    return <span className={`text-primary-400 font-semibold text-xs ${className}`}>{minutes}m {seconds}s</span>;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {parts.days > 0 && (
        <Segment value={parts.days} label="d" />
      )}
      <Segment value={parts.hours} label="h" />
      <Segment value={parts.minutes} label="m" />
      <Segment value={parts.seconds} label="s" />
    </div>
  );
}

function Segment({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-end gap-0.5">
      <span className="font-black text-white tabular-nums text-sm">{String(value).padStart(2, '0')}</span>
      <span className="text-[10px] text-gray-500 mb-0.5">{label}</span>
    </div>
  );
}
