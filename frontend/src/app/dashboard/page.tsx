'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ChevronRight, Plus, Star, TrendingUp, Target, Award, Calendar } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { Navbar } from '@/components/ui/Navbar';
import { MatchCard } from '@/components/matches/MatchCard';
import api from '@/lib/api';
import type { Match, League, LeaderboardEntry } from '@/types';
import { getRankMedal } from '@/lib/utils';

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { socket } = useSocket();
  const router = useRouter();
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [myLeagues, setMyLeagues] = useState<League[]>([]);
  const [globalTop, setGlobalTop] = useState<LeaderboardEntry[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchAll = async () => {
      try {
        const [upRes, liveRes, leagueRes, lbRes] = await Promise.all([
          api.get('/matches/upcoming'),
          api.get('/matches/live'),
          api.get('/leagues'),
          api.get('/leaderboard/global?limit=5'),
        ]);
        setUpcomingMatches(upRes.data.data || []);
        setLiveMatches(liveRes.data.data || []);
        setMyLeagues(leagueRes.data.data || []);
        setGlobalTop(lbRes.data.data || []);
      } catch {} finally { setDataLoading(false); }
    };
    fetchAll();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!socket) return;
    socket.on('score:update', (data: { matchId: string; homeScore: number; awayScore: number }) => {
      setLiveMatches((prev) => prev.map((m) =>
        m.id === data.matchId ? { ...m, homeScore: data.homeScore, awayScore: data.awayScore } : m
      ));
    });
    return () => { socket.off('score:update'); };
  }, [socket]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="text-5xl animate-float">⚽</div>
      </div>
    );
  }

  const nextMatch = upcomingMatches[0];
  const stats = [
    { icon: TrendingUp, label: 'Points', value: user?.totalPoints || 0, color: '#10B981' },
    { icon: Target, label: 'Matches', value: upcomingMatches.length, color: '#06B6D4' },
    { icon: Award, label: 'Leagues', value: myLeagues.length, color: '#F59E0B' },
    { icon: Calendar, label: 'Live Now', value: liveMatches.length, color: '#DC143C' },
  ];

  return (
    <div className="min-h-screen relative" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="stadium-rays" />
      <Navbar />

      <main className="px-4 sm:px-6 pt-8 pb-24 md:pb-12 max-w-6xl mx-auto relative z-10">

        {/* Welcome Header */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Manager Dashboard</p>
              <h1 className="text-3xl md:text-4xl font-display font-black leading-tight mt-1 flex items-center gap-3">
                <span style={{ color: 'var(--text)' }}>Welcome back,</span>
                <span className="gradient-text">{user?.name?.split(' ')[0]}</span>
                <span className="text-3xl select-none">{user?.avatar}</span>
              </h1>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8"
        >
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="stat-card"
              >
                <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ background: `${s.color}12`, color: s.color }}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="stat-value" style={{ color: s.color }}>{s.value}</p>
                <p className="stat-label">{s.label}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* LIVE Banner */}
        {liveMatches.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 rounded-2xl p-5 border relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(220,20,60,0.08), rgba(249,115,22,0.04))',
              borderColor: 'rgba(220,20,60,0.2)',
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="live-dot" />
              <span className="text-xs font-extrabold tracking-widest uppercase" style={{ color: '#DC143C' }}>LIVE NOW</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {liveMatches.slice(0, 2).map((m) => (
                <MatchCard key={m.id} match={m} compact />
              ))}
            </div>
          </motion.div>
        )}

        {/* Marquee Match */}
        {nextMatch && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-8"
          >
            <h2 className="text-xs font-extrabold uppercase tracking-[0.2em] mb-4 flex items-center gap-2" style={{ color: 'var(--primary)' }}>
              <Star className="w-3.5 h-3.5 fill-current animate-pulse" /> Next Match
            </h2>
            <MatchCard match={nextMatch} showPickButton />
          </motion.div>
        )}

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-6 items-start">

          {/* My Leagues */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-extrabold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>My Leagues</h2>
              <Link href="/leagues" className="text-xs font-bold flex items-center gap-1 transition-colors" style={{ color: 'var(--primary)' }}>
                All Leagues <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {myLeagues.length === 0 ? (
              <div className="card p-8 text-center group">
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🏆</div>
                <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>No leagues yet! Create one or join friends.</p>
                <Link href="/leagues" className="btn-primary inline-flex items-center gap-2 text-xs uppercase tracking-widest">
                  <Plus className="w-4 h-4 stroke-[3px]" /> Join League
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {myLeagues.slice(0, 3).map((league) => (
                  <Link key={league.id} href={`/leagues/${league.id}`} className="card card-hover flex items-center justify-between p-4">
                    <div>
                      <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{league.name}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{league._count?.members || 0} / {league.maxMembers} Members</p>
                    </div>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                      <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </motion.div>

          {/* Leaderboard */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-extrabold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Global Top Managers</h2>
              <Link href="/leaderboard" className="text-xs font-bold flex items-center gap-1 transition-colors" style={{ color: 'var(--primary)' }}>
                Full Rankings <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="card overflow-hidden">
              {globalTop.length === 0 ? (
                <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No rankings yet — play a match first!</div>
              ) : (
                globalTop.map((entry, idx) => (
                  <div
                    key={entry.userId || idx}
                    className="flex items-center gap-3 px-4 py-3.5 transition-colors"
                    style={{
                      borderBottom: idx !== globalTop.length - 1 ? '1px solid var(--border)' : undefined,
                    }}
                  >
                    <span className="font-display font-black text-lg w-8 text-center">{getRankMedal(entry.rank)}</span>
                    <span className="text-xl select-none">{entry.avatar || '⚽'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate" style={{ color: 'var(--text)' }}>{entry.name}</p>
                      <p className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: 'var(--text-muted)' }}>{entry.matchesPlayed || 0} matches</p>
                    </div>
                    <div className="text-right">
                      <span className="font-display font-black text-lg gradient-text">{entry.totalPoints}</span>
                      <p className="text-[8px] uppercase tracking-widest font-bold mt-0.5" style={{ color: 'var(--text-muted)' }}>pts</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* Upcoming Fixtures */}
        {upcomingMatches.length > 1 && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-extrabold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Upcoming Fixtures</h2>
              <Link href="/matches" className="text-xs font-bold flex items-center gap-1 transition-colors" style={{ color: 'var(--primary)' }}>
                All Matches <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingMatches.slice(1, 7).map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
