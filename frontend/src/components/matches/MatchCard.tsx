'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { getFlagByCountry, formatMatchTime } from '@/lib/utils';
import type { Match } from '@/types';
import { cn } from '@/lib/utils';

interface MatchCardProps {
  match: Match;
  showPickButton?: boolean;
  compact?: boolean;
}

const playClickSound = () => {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.03, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch (e) {}
};

export function MatchCard({ match, showPickButton = true, compact = false }: MatchCardProps) {
  const isLive = match.status === 'LIVE';
  const isCompleted = match.status === 'COMPLETED';
  const isUpcoming = match.status === 'UPCOMING';

  const handleInteract = () => {
    playClickSound();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onMouseMove={handleMouseMove}
      className={cn(
        'spotlight-card-interactive glass rounded-3xl p-5 border border-white/5 relative overflow-hidden',
        isLive && 'border-primary/30 glow-gold-premium'
      )}
    >
      {/* Dynamic background light for card */}
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

      {/* Top Banner: Live Indicator, Round Info & Squad Status */}
      <div className="flex items-center justify-between mb-4">
        {match.group ? (
          <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase font-sans">
            Group {match.group} · {match.round}
          </span>
        ) : (
          <span />
        )}
        
        {/* Status indicator */}
        <div className="flex items-center gap-2">
          {isLive && (
            <div className="flex items-center gap-1.5 bg-accent/15 border border-accent/30 px-2 py-0.5 rounded-full">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent"></span>
              </span>
              <span className="text-[9px] font-black text-accent tracking-widest uppercase">LIVE</span>
              {match.minute && <span className="text-[9px] text-gray-400 font-bold">{match.minute}&apos;</span>}
            </div>
          )}

          {match.hasUserTeam && (
            <span className="text-[9px] font-black bg-primary/10 border border-primary/20 text-primary px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-[0_0_10px_rgba(230,182,25,0.15)] uppercase tracking-wider">
              <span className="w-1 h-1 rounded-full bg-primary animate-pulse" /> Team Saved
            </span>
          )}
        </div>
      </div>

      {/* Teams grid & Score */}
      <div className="flex items-center justify-between gap-4 py-2">
        {/* Home Team */}
        <div className="flex-1 flex flex-col items-center gap-2">
          <div className="text-4xl filter drop-shadow-md select-none transform transition-transform duration-300 hover:scale-110">
            {getFlagByCountry(match.homeTeam)}
          </div>
          <span className="text-xs font-bold text-center text-gray-200 leading-tight uppercase tracking-wider font-sans">
            {match.homeTeam.length > 10 ? match.homeTeam.split(' ')[0] : match.homeTeam}
          </span>
        </div>

        {/* VS / Score Hub */}
        <div className="flex flex-col items-center gap-1.5 min-w-[90px]">
          {isLive || isCompleted ? (
            <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 px-4 py-1.5 rounded-2xl shadow-inner">
              <span className={cn('text-3xl font-display font-black leading-none', isLive ? 'text-primary' : 'text-white')}>
                {match.homeScore}
              </span>
              <span className="text-gray-600 font-bold leading-none">:</span>
              <span className={cn('text-3xl font-display font-black leading-none', isLive ? 'text-primary' : 'text-white')}>
                {match.awayScore}
              </span>
            </div>
          ) : (
            <div className="bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
              <span className="text-xs font-display font-black text-primary tracking-widest">VS</span>
            </div>
          )}

          {isUpcoming && (
            <CountdownTimer kickoffTime={match.kickoffTime} compact />
          )}
          {isCompleted && (
            <span className="text-[9px] font-bold text-gray-400 bg-white/5 border border-white/5 px-2 py-0.5 rounded-full uppercase tracking-wider font-sans">FT</span>
          )}
        </div>

        {/* Away Team */}
        <div className="flex-1 flex flex-col items-center gap-2">
          <div className="text-4xl filter drop-shadow-md select-none transform transition-transform duration-300 hover:scale-110">
            {getFlagByCountry(match.awayTeam)}
          </div>
          <span className="text-xs font-bold text-center text-gray-200 leading-tight uppercase tracking-wider font-sans">
            {match.awayTeam.length > 10 ? match.awayTeam.split(' ')[0] : match.awayTeam}
          </span>
        </div>
      </div>

      {/* Card Action footer bar */}
      {!compact && (
        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
          <span className="text-[10px] text-gray-500 font-medium tracking-wide">{formatMatchTime(match.kickoffTime)}</span>
          <div className="flex gap-2 items-center">
            {isUpcoming && showPickButton && (
              <>
                {match.hasUserTeam && (
                  <Link
                    href={`/matches/${match.id}?tab=squad`}
                    onClick={handleInteract}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white glass border border-white/5 transition-all duration-300 hover:border-white/10"
                  >
                    View Team 🛡️
                  </Link>
                )}
                <Link
                  href={`/team-builder/${match.id}`}
                  onClick={handleInteract}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 transform hover:scale-[1.03] active:scale-[0.98] tracking-wide uppercase",
                    match.hasUserTeam 
                      ? "bg-gradient-to-r from-primary to-amber-600 text-dark-900 shadow-[0_4px_15px_rgba(230,182,25,0.25)] font-extrabold"
                      : "bg-gradient-to-r from-accent to-accent-600 text-white shadow-[0_4px_15px_rgba(230,57,70,0.25)]"
                  )}
                >
                  {match.hasUserTeam ? 'Edit Team ✏' : 'Pick Team →'}
                </Link>
              </>
            )}
            {(isLive || isCompleted) && (
              <Link
                href={`/matches/${match.id}${match.hasUserTeam ? '?tab=squad' : ''}`}
                onClick={handleInteract}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-300 hover:text-white glass border border-white/5 hover:border-primary/20 transition-all duration-300"
              >
                {match.hasUserTeam ? 'View Points 📈' : 'View Stats 📊'}
              </Link>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
