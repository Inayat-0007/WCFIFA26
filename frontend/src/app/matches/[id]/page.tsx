'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { Navbar } from '@/components/ui/Navbar';
import { getEventIcon, getFlagByCountry, formatDate } from '@/lib/utils';
import api from '@/lib/api';
import type { Match, MatchEvent, MatchPlayer } from '@/types';

export default function LiveMatchPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { socket, joinMatch, leaveMatch } = useSocket();
  const router = useRouter();
  const [match, setMatch] = useState<Match | null>(null);
  const [myTeamPoints, setMyTeamPoints] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated || !id) return;
    const fetch = async () => {
      try {
        const [matchRes, teamRes] = await Promise.allSettled([
          api.get(`/matches/${id}`),
          api.get(`/teams/${id}`),
        ]);
        if (matchRes.status === 'fulfilled') setMatch(matchRes.value.data.data);
        if (teamRes.status === 'fulfilled') setMyTeamPoints(teamRes.value.data.data?.totalPoints ?? null);
      } catch { } finally { setLoading(false); }
    };
    fetch();
    joinMatch(id);
    return () => leaveMatch(id);
  }, [id, isAuthenticated, joinMatch, leaveMatch]);

  useEffect(() => {
    if (!socket) return;
    socket.on('score:update', (data: { matchId: string; homeScore: number; awayScore: number; minute: number }) => {
      if (data.matchId === id) {
        setMatch((prev) => prev ? { ...prev, homeScore: data.homeScore, awayScore: data.awayScore, minute: data.minute } : prev);
      }
    });
    socket.on('event:new', (data: { matchId: string; event: MatchEvent }) => {
      if (data.matchId === id) {
        setMatch((prev) => prev ? { ...prev, events: [...(prev.events || []), data.event] } : prev);
      }
    });
    socket.on('points:update', (data: { userId: string; matchId: string; newTotal: number }) => {
      if (data.matchId === id && data.userId === user?.id) {
        setMyTeamPoints(data.newTotal);
      }
    });
    return () => { socket.off('score:update'); socket.off('event:new'); socket.off('points:update'); };
  }, [socket, id, user?.id]);

  if (loading || !match) {
    return (
      <div className="min-h-screen bg-dark-900">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-5xl animate-float">⚽</div>
        </div>
      </div>
    );
  }

  const isLive = match.status === 'LIVE';

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <main className="px-4 pt-4 pb-24 md:pb-8 md:px-6 max-w-4xl mx-auto">
        {/* Match Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-6 mb-6 relative overflow-hidden"
          style={isLive ? { border: '1px solid rgba(220,20,60,0.4)' } : {}}
        >
          {isLive && (
            <div className="flex items-center gap-2 mb-4 justify-center">
              <div className="relative">
                <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                <div className="absolute inset-0 rounded-full bg-primary-500 animate-ping" />
              </div>
              <span className="text-sm font-bold text-primary-400 tracking-wider">LIVE {match.minute && `· ${match.minute}'`}</span>
            </div>
          )}
          {match.status === 'COMPLETED' && (
            <div className="text-center mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-bold text-gray-400 bg-dark-600">FULL TIME</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 flex flex-col items-center gap-2">
              <span className="text-5xl md:text-6xl">{getFlagByCountry(match.homeTeam)}</span>
              <span className="font-bold text-sm md:text-base text-center">{match.homeTeam}</span>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-3">
                <span className={`text-5xl md:text-6xl font-black ${isLive ? 'text-primary-400' : 'text-white'}`}>{match.homeScore}</span>
                <span className="text-3xl text-gray-600 font-bold">:</span>
                <span className={`text-5xl md:text-6xl font-black ${isLive ? 'text-primary-400' : 'text-white'}`}>{match.awayScore}</span>
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center gap-2">
              <span className="text-5xl md:text-6xl">{getFlagByCountry(match.awayTeam)}</span>
              <span className="font-bold text-sm md:text-base text-center">{match.awayTeam}</span>
            </div>
          </div>

          {match.venue && (
            <p className="text-center text-xs text-gray-600 mt-4">📍 {match.venue}, {match.city}</p>
          )}
        </motion.div>

        {/* My Fantasy Points */}
        {myTeamPoints !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-gold rounded-2xl p-4 mb-6 flex items-center justify-between"
          >
            <div>
              <p className="text-xs text-gray-400 mb-0.5">My Fantasy Points</p>
              <p className="text-3xl font-black gradient-text-gold">{myTeamPoints}</p>
            </div>
            <div className="text-3xl">🏆</div>
          </motion.div>
        )}

        {/* Match Timeline */}
        {match.events && match.events.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">Match Timeline</h2>
            <div className="glass rounded-2xl p-4 space-y-3 max-h-80 overflow-y-auto">
              {[...match.events].sort((a, b) => b.minute - a.minute).map((event) => (
                <div key={event.id} className="flex items-center gap-3">
                  <span className="text-xl">{getEventIcon(event.type)}</span>
                  <span className="text-xs font-bold text-gray-500 w-8">{event.minute}&apos;</span>
                  <div className="flex-1">
                    <p className="text-sm text-white">{event.type.replace(/_/g, ' ')}</p>
                    {event.detail && <p className="text-xs text-gray-500">{event.detail}</p>}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Player Stats */}
        {match.matchPlayers && match.matchPlayers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6"
          >
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">Player Fantasy Points</h2>
            <div className="glass rounded-2xl overflow-hidden">
              {match.matchPlayers.slice(0, 20).map((mp, idx) => (
                <div key={mp.id} className={`flex items-center gap-3 px-4 py-3 ${idx !== match.matchPlayers!.length - 1 ? 'border-b border-white/5' : ''}`}>
                  <span className="text-xs text-gray-600 w-4">{idx + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{mp.player?.name}</p>
                    <p className="text-xs text-gray-500">{mp.player?.country} · {mp.player?.position}</p>
                  </div>
                  <div className="flex gap-3 text-xs text-gray-500">
                    {mp.goals > 0 && <span>⚽ {mp.goals}</span>}
                    {mp.assists > 0 && <span>🎯 {mp.assists}</span>}
                    {mp.yellowCards > 0 && <span>🟨 {mp.yellowCards}</span>}
                    {mp.redCards > 0 && <span>🟥 {mp.redCards}</span>}
                  </div>
                  <span className={`font-black text-sm ${mp.fantasyPoints > 0 ? 'text-gold-400' : mp.fantasyPoints < 0 ? 'text-primary-400' : 'text-gray-500'}`}>
                    {mp.fantasyPoints > 0 ? '+' : ''}{mp.fantasyPoints}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
