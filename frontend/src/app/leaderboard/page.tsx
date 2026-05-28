'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { getRankMedal } from '@/lib/utils';
import api from '@/lib/api';
import type { LeaderboardEntry } from '@/types';
import { useSocket } from '@/context/SocketContext';

export default function LeaderboardPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [rankings, setRankings] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  const fetchRankings = useCallback(() => {
    if (!isAuthenticated) return;
    api.get('/leaderboard/global?limit=50').then((res) => setRankings(res.data.data || [])).finally(() => setLoading(false));
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => {
      fetchRankings();
    };
    socket.on('leaderboard:update', handleUpdate);
    socket.on('points:update', handleUpdate);
    return () => {
      socket.off('leaderboard:update', handleUpdate);
      socket.off('points:update', handleUpdate);
    };
  }, [socket, fetchRankings]);

  const top3 = rankings.slice(0, 3);
  const rest = rankings.slice(3);

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Stadium Light Rays */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      <Navbar />
      <main className="px-4 pt-6 pb-24 md:pb-8 md:px-6 max-w-2xl mx-auto relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-black tracking-tight mb-1">
            <span className="gradient-text">Global</span>
            <span style={{ color: 'var(--text)' }}> Leaderboard</span>
          </h1>
          <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
            All players ranked by total fantasy points
          </p>

          {loading ? (
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="card h-16 shimmer" />
              ))}
            </div>
          ) : rankings.length === 0 ? (
            <div className="text-center py-20 card" style={{ background: 'var(--card-bg)' }}>
              <div className="text-5xl mb-4 animate-bounce">🏆</div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                No rankings yet — play a match!
              </p>
            </div>
          ) : (
            <>
              {/* Top 3 Podium */}
              {top3.length > 0 && (
                <div className="flex items-end justify-center gap-4 mb-10 pt-4">
                  {/* 2nd place */}
                  {top3[1] && (
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="flex flex-col items-center"
                    >
                      <span className="text-3xl mb-2 hover:scale-110 transition-transform select-none">{top3[1].avatar || '⚽'}</span>
                      <p className="text-xs font-bold mb-1 max-w-[80px] text-center truncate" style={{ color: 'var(--text-secondary)' }}>
                        {top3[1].name}
                      </p>
                      <p className="text-sm font-black mb-2" style={{ color: 'var(--text)' }}>
                        {top3[1].totalPoints}
                      </p>
                      <div
                        className="w-20 h-16 rounded-t-2xl flex items-center justify-center text-2xl font-black border border-b-0"
                        style={{
                          background: 'linear-gradient(180deg, rgba(148,163,184,0.15), rgba(148,163,184,0.02))',
                          borderColor: 'var(--border)',
                          boxShadow: '0 -4px 12px rgba(148,163,184,0.05)',
                        }}
                      >
                        🥈
                      </div>
                    </motion.div>
                  )}
                  {/* 1st place */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center"
                  >
                    <div className="text-xl mb-1 animate-bounce">👑</div>
                    <span className="text-4xl mb-2 hover:scale-110 transition-transform select-none">{top3[0].avatar || '⚽'}</span>
                    <p className="text-xs font-black mb-1 max-w-[90px] text-center truncate" style={{ color: 'var(--text)' }}>
                      {top3[0].name}
                    </p>
                    <p className="text-lg font-black gradient-text-gold mb-2">
                      {top3[0].totalPoints}
                    </p>
                    <div
                      className="w-24 h-24 rounded-t-2xl flex items-center justify-center text-3xl border border-b-0"
                      style={{
                        background: 'linear-gradient(180deg, var(--gold-glow), transparent)',
                        borderColor: 'var(--gold)',
                        boxShadow: '0 -4px 16px var(--gold-glow)',
                      }}
                    >
                      🥇
                    </div>
                  </motion.div>
                  {/* 3rd place */}
                  {top3[2] && (
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="flex flex-col items-center"
                    >
                      <span className="text-3xl mb-2 hover:scale-110 transition-transform select-none">{top3[2].avatar || '⚽'}</span>
                      <p className="text-xs font-bold mb-1 max-w-[80px] text-center truncate" style={{ color: 'var(--text-secondary)' }}>
                        {top3[2].name}
                      </p>
                      <p className="text-sm font-black mb-2" style={{ color: 'var(--text-muted)' }}>
                        {top3[2].totalPoints}
                      </p>
                      <div
                        className="w-20 h-12 rounded-t-2xl flex items-center justify-center text-2xl border border-b-0"
                        style={{
                          background: 'linear-gradient(180deg, rgba(205,127,50,0.15), rgba(205,127,50,0.02))',
                          borderColor: 'rgba(205,127,50,0.2)',
                          boxShadow: '0 -4px 12px rgba(205,127,50,0.05)',
                        }}
                      >
                        🥉
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Full Rankings Table */}
              <div className="card overflow-hidden" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
                {rankings.map((entry, idx) => {
                  const isMe = entry.userId === user?.id;
                  return (
                    <motion.div
                      key={entry.userId || idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.01 }}
                      className="flex items-center gap-3 px-4 py-3.5 border-b last:border-b-0"
                      style={{
                        borderColor: 'var(--border)',
                        background: isMe ? 'var(--primary-glow)' : 'transparent',
                        borderLeft: isMe ? '4px solid var(--primary)' : '1px solid transparent',
                      }}
                    >
                      <span className="w-8 text-center text-base font-bold">{getRankMedal(entry.rank)}</span>
                      <span className="text-xl select-none">{entry.avatar || '⚽'}</span>
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-bold text-sm truncate"
                          style={{ color: isMe ? 'var(--primary)' : 'var(--text)' }}
                        >
                          {entry.name} {isMe && <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>(you)</span>}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {entry.matchesPlayed || 0} matches played
                        </p>
                      </div>
                      <span
                        className="font-black text-base"
                        style={{ color: entry.rank <= 3 ? 'var(--gold)' : 'var(--text)' }}
                      >
                        {entry.totalPoints}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}
        </motion.div>
      </main>
    </div>
  );
}
