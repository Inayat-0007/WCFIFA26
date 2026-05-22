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

export function MatchCard({ match, showPickButton = true, compact = false }: MatchCardProps) {
  const isLive = match.status === 'LIVE';
  const isCompleted = match.status === 'COMPLETED';
  const isUpcoming = match.status === 'UPCOMING';

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'glass rounded-2xl p-4 card-hover relative overflow-hidden',
        isLive && 'border-primary-500/40'
      )}
    >
      {/* Live indicator */}
      {isLive && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-primary-500" />
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-primary-500 animate-ping" />
          </div>
          <span className="text-[10px] font-bold text-primary-400 tracking-wider">LIVE</span>
          {match.minute && <span className="text-[10px] text-gray-500">{match.minute}&apos;</span>}
        </div>
      )}

      {/* Group/Round badge & Joined Status */}
      <div className="flex items-center justify-between mb-3">
        {match.group ? (
          <span className="text-[10px] font-semibold text-gray-500 tracking-widest uppercase">
            Group {match.group} · {match.round}
          </span>
        ) : <span />}
        {match.hasUserTeam && (
          <span className="text-[9px] font-black bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-[0_0_8px_rgba(16,185,129,0.1)]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> SQUAD CREATED
          </span>
        )}
      </div>

      {/* Teams and Score */}
      <div className="flex items-center justify-between gap-3">
        {/* Home Team */}
        <div className="flex-1 flex flex-col items-center gap-1">
          <span className="text-3xl">{getFlagByCountry(match.homeTeam)}</span>
          <span className="text-xs font-semibold text-center text-gray-200 leading-tight">
            {match.homeTeam.length > 10 ? match.homeTeam.split(' ')[0] : match.homeTeam}
          </span>
        </div>

        {/* Score/Time center */}
        <div className="flex flex-col items-center gap-1 min-w-[80px]">
          {isLive || isCompleted ? (
            <div className="flex items-center gap-2">
              <span className={cn('text-3xl font-black', isLive ? 'text-primary-400' : 'text-white')}>
                {match.homeScore}
              </span>
              <span className="text-gray-600 font-bold">:</span>
              <span className={cn('text-3xl font-black', isLive ? 'text-primary-400' : 'text-white')}>
                {match.awayScore}
              </span>
            </div>
          ) : (
            <div className="text-center">
              <span className="text-lg font-bold text-gray-400">VS</span>
            </div>
          )}

          {isUpcoming && (
            <CountdownTimer kickoffTime={match.kickoffTime} compact />
          )}
          {isCompleted && (
            <span className="text-[10px] text-gray-500 bg-dark-700 px-2 py-0.5 rounded-full">FT</span>
          )}
        </div>

        {/* Away Team */}
        <div className="flex-1 flex flex-col items-center gap-1">
          <span className="text-3xl">{getFlagByCountry(match.awayTeam)}</span>
          <span className="text-xs font-semibold text-center text-gray-200 leading-tight">
            {match.awayTeam.length > 10 ? match.awayTeam.split(' ')[0] : match.awayTeam}
          </span>
        </div>
      </div>

      {/* Kickoff time */}
      {!compact && (
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] text-gray-600">{formatMatchTime(match.kickoffTime)}</span>
          <div className="flex gap-2 items-center">
            {isUpcoming && showPickButton && (
              <>
                {match.hasUserTeam && (
                  <Link
                    href={`/matches/${match.id}?tab=squad`}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-300 hover:text-white glass transition-all"
                  >
                    View Team 🛡️
                  </Link>
                )}
                <Link
                  href={`/team-builder/${match.id}`}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 hover:scale-105",
                    match.hasUserTeam 
                      ? "bg-gradient-to-r from-amber-500 to-amber-700 text-white shadow-[0_2px_10px_rgba(245,158,11,0.2)]"
                      : "bg-gradient-to-r from-[#DC143C] to-[#a01030] text-white"
                  )}
                >
                  {match.hasUserTeam ? 'Edit Team ✏️' : 'Pick Team →'}
                </Link>
              </>
            )}
            {(isLive || isCompleted) && (
              <Link
                href={`/matches/${match.id}${match.hasUserTeam ? '?tab=squad' : ''}`}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-300 hover:text-white glass transition-all"
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
