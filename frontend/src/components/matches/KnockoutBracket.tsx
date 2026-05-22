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
        className={cn(
          'w-64 glass border rounded-2xl p-3.5 relative overflow-hidden transition-all duration-300',
          isLive 
            ? 'border-primary/40 shadow-[0_0_15px_rgba(220,20,60,0.15)] bg-primary/5' 
            : 'border-white/5 bg-white/[0.01] hover:border-white/10 hover:bg-white/[0.03]'
        )}
      >
        {/* Match Header */}
        <div className="flex justify-between items-center text-[9px] text-gray-500 font-bold tracking-wider mb-2 font-sans">
          <span>{match.round}</span>
          {isLive && (
            <span className="text-accent animate-pulse font-black">● LIVE</span>
          )}
          {isCompleted && <span className="text-gray-400">FT</span>}
        </div>

        {/* Teams & Scores */}
        <div className="space-y-1.5">
          {/* Home */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xl select-none flex-shrink-0">{getFlagByCountry(match.homeTeam)}</span>
              <span className="text-xs font-bold text-gray-200 truncate">{match.homeTeam}</span>
            </div>
            {(isLive || isCompleted) && (
              <span className="text-xs font-black text-white">{match.homeScore}</span>
            )}
          </div>

          {/* Away */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xl select-none flex-shrink-0">{getFlagByCountry(match.awayTeam)}</span>
              <span className="text-xs font-bold text-gray-200 truncate">{match.awayTeam}</span>
            </div>
            {(isLive || isCompleted) && (
              <span className="text-xs font-black text-white">{match.awayScore}</span>
            )}
          </div>
        </div>

        {/* Footer info/Action */}
        <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between">
          <span className="text-[8px] text-gray-500 font-medium">
            {formatMatchTime(match.kickoffTime)}
          </span>
          <Link
            href={`/team-builder/${match.id}`}
            className="text-[9px] font-black tracking-widest text-[#FFD700] hover:text-white transition-all uppercase"
          >
            {match.hasUserTeam ? 'Edit Squad ✏️' : 'Pick Squad 🏆'}
          </Link>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="w-full overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-white/10">
      <div className="min-w-[1400px] flex items-center justify-between gap-8 py-4 px-2">
        {/* ROUND OF 32 */}
        <div className="flex flex-col gap-6">
          <h3 className="text-center font-display font-black text-xs uppercase tracking-widest text-gray-400 mb-2">
            Round of 32
          </h3>
          <div className="flex flex-col gap-5">
            {sortedR32.map((m) => renderBracketMatchCard(m))}
            {sortedR32.length === 0 && (
              <div className="text-[10px] text-gray-500 italic py-6 text-center w-64">
                Round of 32 not started
              </div>
            )}
          </div>
        </div>

        {/* ROUND OF 16 */}
        <div className="flex flex-col gap-6">
          <h3 className="text-center font-display font-black text-xs uppercase tracking-widest text-gray-400 mb-2">
            Round of 16
          </h3>
          <div className="flex flex-col gap-16 justify-around h-full py-6">
            {sortedR16.map((m) => renderBracketMatchCard(m))}
            {sortedR16.length === 0 && (
              <div className="text-[10px] text-gray-500 italic py-6 text-center w-64">
                Round of 16 not started
              </div>
            )}
          </div>
        </div>

        {/* QUARTER-FINALS */}
        <div className="flex flex-col gap-6">
          <h3 className="text-center font-display font-black text-xs uppercase tracking-widest text-gray-400 mb-2">
            Quarter-finals
          </h3>
          <div className="flex flex-col gap-36 justify-around h-full py-12">
            {sortedQF.map((m) => renderBracketMatchCard(m))}
            {sortedQF.length === 0 && (
              <div className="text-[10px] text-gray-500 italic py-6 text-center w-64">
                Quarter-finals not started
              </div>
            )}
          </div>
        </div>

        {/* SEMI-FINALS */}
        <div className="flex flex-col gap-6">
          <h3 className="text-center font-display font-black text-xs uppercase tracking-widest text-gray-400 mb-2">
            Semi-finals
          </h3>
          <div className="flex flex-col gap-64 justify-around h-full py-20">
            {sortedSF.map((m) => renderBracketMatchCard(m))}
            {sortedSF.length === 0 && (
              <div className="text-[10px] text-gray-500 italic py-6 text-center w-64">
                Semi-finals not started
              </div>
            )}
          </div>
        </div>

        {/* FINAL */}
        <div className="flex flex-col gap-6">
          <h3 className="text-center font-display font-black text-xs uppercase tracking-widest text-[#FFD700] mb-2 glow-text">
            👑 Final
          </h3>
          <div className="flex flex-col justify-center h-full py-32">
            {sortedFn.map((m) => (
              <div key={m.id} className="relative p-1 bg-gradient-to-r from-[#e6b619] via-[#D4AF37] to-[#b45309] rounded-3xl shadow-[0_0_30px_rgba(230,182,25,0.25)]">
                {renderBracketMatchCard(m)}
              </div>
            ))}
            {sortedFn.length === 0 && (
              <div className="text-[10px] text-gray-500 italic py-6 text-center w-64">
                Final not started
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
