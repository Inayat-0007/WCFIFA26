'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getFlagByCountry, formatMatchTime } from '@/lib/utils';
import type { Match } from '@/types';
import { cn } from '@/lib/utils';

interface KnockoutBracketProps {
  matches: Match[];
}

export function KnockoutBracket({ matches }: KnockoutBracketProps) {
  // Filter matches by round
  const r32 = matches.filter((m) => m.round === 'Round of 32');
  const r16 = matches.filter((m) => m.round === 'Round of 16');
  const qf = matches.filter((m) => m.round === 'Quarter-finals');
  const sf = matches.filter((m) => m.round === 'Semi-finals');
  const fn = matches.filter((m) => m.round === 'Final');

  // Helper to sort matches chronologically to align the tree correctly
  const sortByTime = (arr: Match[]) => {
    return [...arr].sort(
      (a, b) => new Date(a.kickoffTime).getTime() - new Date(b.kickoffTime).getTime()
    );
  };

  const sortedR32 = sortByTime(r32);
  const sortedR16 = sortByTime(r16);
  const sortedQF = sortByTime(qf);
  const sortedSF = sortByTime(sf);
  const sortedFn = sortByTime(fn);

  const renderBracketMatchCard = (match: Match) => {
    if (!match) return null;
    const isLive = match.status === 'LIVE';
    const isCompleted = match.status === 'COMPLETED';

    return (
      <motion.div
        key={match.id}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-64 card p-3.5 relative overflow-hidden transition-all duration-300"
        style={{
          borderLeft: isLive ? '4px solid var(--accent)' : '1px solid var(--border)',
          background: isLive ? 'var(--primary-glow)' : 'var(--card-bg)',
        }}
      >
        {/* Match Header */}
        <div className="flex justify-between items-center text-[9px] font-bold tracking-wider mb-2 font-sans" style={{ color: 'var(--text-muted)' }}>
          <span>{match.round}</span>
          {isLive && (
            <span className="animate-pulse font-black text-[9px]" style={{ color: 'var(--accent)' }}>● LIVE</span>
          )}
          {isCompleted && <span>FT</span>}
        </div>

        {/* Teams & Scores */}
        <div className="space-y-1.5">
          {/* Home */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xl select-none flex-shrink-0">{getFlagByCountry(match.homeTeam)}</span>
              <span className="text-xs font-bold truncate" style={{ color: 'var(--text)' }}>{match.homeTeam}</span>
            </div>
            {(isLive || isCompleted) && (
              <span className="text-xs font-black" style={{ color: 'var(--text)' }}>{match.homeScore}</span>
            )}
          </div>

          {/* Away */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xl select-none flex-shrink-0">{getFlagByCountry(match.awayTeam)}</span>
              <span className="text-xs font-bold truncate" style={{ color: 'var(--text)' }}>{match.awayTeam}</span>
            </div>
            {(isLive || isCompleted) && (
              <span className="text-xs font-black" style={{ color: 'var(--text)' }}>{match.awayScore}</span>
            )}
          </div>
        </div>

        {/* Footer info/Action */}
        <div className="mt-3 pt-2.5 border-t flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
          <span className="text-[8px] font-medium" style={{ color: 'var(--text-muted)' }}>
            {formatMatchTime(match.kickoffTime)}
          </span>
          <Link
            href={`/team-builder/${match.id}`}
            className="text-[9px] font-black tracking-widest transition-all uppercase hover:opacity-80"
            style={{ color: 'var(--gold)' }}
          >
            {match.hasUserTeam ? 'Edit Squad ✏️' : 'Pick Squad 🏆'}
          </Link>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="w-full overflow-x-auto pb-6 scrollbar-thin">
      <div className="min-w-[1400px] flex items-center justify-between gap-8 py-4 px-2">
        {/* ROUND OF 32 */}
        <div className="flex flex-col gap-6">
          <h3 className="text-center font-display font-black text-xs uppercase tracking-widest mb-2 animate-pulse" style={{ color: 'var(--text-secondary)' }}>
            Round of 32
          </h3>
          <div className="flex flex-col gap-5">
            {sortedR32.map((m) => renderBracketMatchCard(m))}
            {sortedR32.length === 0 && (
              <div className="text-[10px] italic py-6 text-center w-64" style={{ color: 'var(--text-muted)' }}>
                Round of 32 not started
              </div>
            )}
          </div>
        </div>

        {/* ROUND OF 16 */}
        <div className="flex flex-col gap-6">
          <h3 className="text-center font-display font-black text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>
            Round of 16
          </h3>
          <div className="flex flex-col gap-16 justify-around h-full py-6">
            {sortedR16.map((m) => renderBracketMatchCard(m))}
            {sortedR16.length === 0 && (
              <div className="text-[10px] italic py-6 text-center w-64" style={{ color: 'var(--text-muted)' }}>
                Round of 16 not started
              </div>
            )}
          </div>
        </div>

        {/* QUARTER-FINALS */}
        <div className="flex flex-col gap-6">
          <h3 className="text-center font-display font-black text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>
            Quarter-finals
          </h3>
          <div className="flex flex-col gap-36 justify-around h-full py-12">
            {sortedQF.map((m) => renderBracketMatchCard(m))}
            {sortedQF.length === 0 && (
              <div className="text-[10px] italic py-6 text-center w-64" style={{ color: 'var(--text-muted)' }}>
                Quarter-finals not started
              </div>
            )}
          </div>
        </div>

        {/* SEMI-FINALS */}
        <div className="flex flex-col gap-6">
          <h3 className="text-center font-display font-black text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>
            Semi-finals
          </h3>
          <div className="flex flex-col gap-64 justify-around h-full py-20">
            {sortedSF.map((m) => renderBracketMatchCard(m))}
            {sortedSF.length === 0 && (
              <div className="text-[10px] italic py-6 text-center w-64" style={{ color: 'var(--text-muted)' }}>
                Semi-finals not started
              </div>
            )}
          </div>
        </div>

        {/* FINAL */}
        <div className="flex flex-col gap-6">
          <h3 className="text-center font-display font-black text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--gold)' }}>
            🏆 Final
          </h3>
          <div className="flex flex-col justify-center h-full py-32">
            {sortedFn.map((m) => (
              <div key={m.id} className="relative p-0.5 rounded-3xl" style={{ background: 'linear-gradient(135deg, var(--gold), #EAB308)', boxShadow: '0 0 30px var(--gold-glow)' }}>
                {renderBracketMatchCard(m)}
              </div>
            ))}
            {sortedFn.length === 0 && (
              <div className="text-[10px] italic py-6 text-center w-64" style={{ color: 'var(--text-muted)' }}>
                Final not started
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
