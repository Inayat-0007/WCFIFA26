'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { getFlagByCountry, formatMatchTime, cn } from '@/lib/utils';
import type { Match } from '@/types';

interface MatchCardProps {
  match: Match;
  showPickButton?: boolean;
  compact?: boolean;
}

export function MatchCard({ match, showPickButton = true, compact = false }: MatchCardProps) {
  const isLive = match.status === 'LIVE';
  const isCompleted = match.status === 'COMPLETED';
  const isUpcoming = match.status === 'UPCOMING';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'card p-5 relative overflow-hidden transition-all',
        isLive && 'card-accent'
      )}
      style={isLive ? { borderColor: 'rgba(220,20,60,0.25)' } : undefined}
    >
      {/* Top row */}
      <div className="flex items-center justify-between mb-4">
        {match.group ? (
          <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
            Group {match.group} · {match.round}
          </span>
        ) : <span />}

        <div className="flex items-center gap-2">
          {isLive && (
            <div className="live-badge">
              <div className="live-dot" style={{ width: 6, height: 6 }} />
              LIVE
              {match.minute && <span style={{ color: 'var(--text-muted)' }}>{match.minute}&apos;</span>}
            </div>
          )}
          {match.hasUserTeam && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider"
              style={{ background: 'var(--badge-bg)', border: '1px solid var(--badge-border)', color: 'var(--primary)' }}>
              <span className="w-1 h-1 rounded-full bg-current animate-pulse" /> Squad Set
            </span>
          )}
        </div>
      </div>

      {/* Teams & Score */}
      <div className="flex items-center justify-between gap-4 py-2">
        {/* Home */}
        <div className="flex-1 flex flex-col items-center gap-2">
          <div className="text-4xl select-none hover:scale-110 transition-transform">{getFlagByCountry(match.homeTeam)}</div>
          <span className="text-xs font-bold text-center uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
            {match.homeTeam.length > 10 ? match.homeTeam.split(' ')[0] : match.homeTeam}
          </span>
        </div>

        {/* Score / VS */}
        <div className="flex flex-col items-center gap-1.5 min-w-[90px]">
          {isLive || isCompleted ? (
            <div className="flex items-center gap-3 px-4 py-1.5 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <span className={cn('text-3xl font-display font-black', isLive && 'gradient-text-fire')} style={!isLive ? { color: 'var(--text)' } : undefined}>
                {match.homeScore}
              </span>
              <span className="font-bold" style={{ color: 'var(--text-muted)' }}>:</span>
              <span className={cn('text-3xl font-display font-black', isLive && 'gradient-text-fire')} style={!isLive ? { color: 'var(--text)' } : undefined}>
                {match.awayScore}
              </span>
            </div>
          ) : (
            <div className="px-3 py-1 rounded-full" style={{ background: 'var(--primary-glow)', border: '1px solid rgba(16,185,129,0.15)' }}>
              <span className="text-xs font-display font-black tracking-widest" style={{ color: 'var(--primary)' }}>VS</span>
            </div>
          )}

          {isUpcoming && <CountdownTimer kickoffTime={match.kickoffTime} compact />}
          {isCompleted && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider" style={{ color: 'var(--text-muted)', background: 'var(--surface)', border: '1px solid var(--border)' }}>FT</span>
          )}
        </div>

        {/* Away */}
        <div className="flex-1 flex flex-col items-center gap-2">
          <div className="text-4xl select-none hover:scale-110 transition-transform">{getFlagByCountry(match.awayTeam)}</div>
          <span className="text-xs font-bold text-center uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
            {match.awayTeam.length > 10 ? match.awayTeam.split(' ')[0] : match.awayTeam}
          </span>
        </div>
      </div>

      {/* Footer */}
      {!compact && (
        <div className="mt-4 pt-4 flex items-center justify-between" style={{ borderTop: '1px solid var(--border)' }}>
          <span className="text-[10px] font-medium tracking-wide" style={{ color: 'var(--text-muted)' }}>{formatMatchTime(match.kickoffTime)}</span>
          <div className="flex gap-2 items-center">
            {isUpcoming && showPickButton && (
              <>
                {match.hasUserTeam && (
                  <Link href={`/matches/${match.id}?tab=squad`} className="btn-ghost px-3 py-1.5 text-xs rounded-lg">
                    View Team 🛡️
                  </Link>
                )}
                <Link href={`/team-builder/${match.id}`}
                  className={cn(
                    'px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 uppercase tracking-wide',
                    match.hasUserTeam ? 'btn-primary' : 'btn-accent'
                  )}>
                  {match.hasUserTeam ? 'Edit Team ✏' : 'Pick Team →'}
                </Link>
              </>
            )}
            {(isLive || isCompleted) && (
              <Link href={`/matches/${match.id}${match.hasUserTeam ? '?tab=squad' : ''}`} className="btn-ghost px-4 py-2 text-xs font-bold rounded-xl">
                {match.hasUserTeam ? 'View Points 📈' : 'View Stats 📊'}
              </Link>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
