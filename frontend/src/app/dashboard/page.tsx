'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ChevronRight, Plus, Star } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { Navbar } from '@/components/ui/Navbar';
import { MatchCard } from '@/components/matches/MatchCard';
import api from '@/lib/api';
import type { Match, League, LeaderboardEntry } from '@/types';
import { getRankMedal } from '@/lib/utils';


const playDashboardSound = () => {
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
    osc.frequency.setValueAtTime(450, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(650, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.025, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch (e) {}
};

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
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchAll = async () => {
      try {
        const [upRes, liveRes, leagueRes, lbRes] = await Promise.all([
          api.get('/matches/upcoming'),
          api.get('/matches/live'),
          api.get('/leagues'),
          api.get('/leaderboard/global?limit=3'),
        ]);
        setUpcomingMatches(upRes.data.data || []);
        setLiveMatches(liveRes.data.data || []);
        setMyLeagues(leagueRes.data.data || []);
        setGlobalTop(lbRes.data.data || []);
      } catch {
        // Silently fail
      } finally {
        setDataLoading(false);
      }
    };
    fetchAll();
  }, [isAuthenticated]);

  // Live score updates via Socket.IO
  useEffect(() => {
    if (!socket) return;
    socket.on('score:update', (data: { matchId: string; homeScore: number; awayScore: number }) => {
      setLiveMatches((prev) => prev.map((m) =>
        m.id === data.matchId ? { ...m, homeScore: data.homeScore, awayScore: data.awayScore } : m
      ));
    });
    return () => { socket.off('score:update'); };
  }, [socket]);

  const handleLinkClick = () => {
    playDashboardSound();
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-5xl animate-float">⚽</div>
      </div>
    );
  }

  const nextMatch = upcomingMatches[0];

  return (
    <div className="min-h-screen bg-dark-900 text-white relative overflow-hidden font-sans">
      {/* Decorative Orbs */}
      <div className="orb orb-gold w-[400px] h-[400px] -top-20 right-10 opacity-20" />
      <div className="orb orb-red w-[500px] h-[500px] bottom-10 -left-20 opacity-15" />

      <Navbar />

      <main className="px-6 pt-8 pb-24 md:pb-12 max-w-6xl mx-auto relative z-10">
        
        {/* Dashboard Welcome header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest font-sans">Manager Dashboard</p>
              <h1 className="text-3xl md:text-5xl font-display font-black leading-tight mt-1 flex items-center gap-2.5">
                <span>Welcome back,</span>
                <span className="gradient-text-gold">{user?.name?.split(' ')[0]}</span>
                <span className="text-3xl select-none">{user?.avatar}</span>
              </h1>
            </div>
            
            <div className="glass-gold-premium rounded-2xl px-6 py-3 border border-primary/20 flex flex-col items-center sm:items-end justify-center">
              <p className="text-[10px] font-bold text-primary tracking-widest uppercase">Global Rank Score</p>
              <p className="text-3xl font-display font-black text-white mt-0.5">{user?.totalPoints || 0}</p>
            </div>
          </div>
        </motion.div>

        {/* LIVE NOW match events banner */}
        {liveMatches.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 rounded-3xl p-6 border border-accent/25 relative overflow-hidden shadow-[0_10px_30px_rgba(230,57,70,0.1)]"
            style={{ background: 'linear-gradient(135deg, rgba(230,57,70,0.15), rgba(230,182,25,0.02))' }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center gap-2 mb-4">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent"></span>
              </span>
              <span className="text-xs font-black text-accent tracking-widest uppercase font-sans">LIVE EVENTS TICKER</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {liveMatches.slice(0, 2).map((m) => (
                <MatchCard key={m.id} match={m} compact />
              ))}
            </div>
          </motion.div>
        )}

        {/* Highlight upcoming marquee fixture */}
        {nextMatch && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <h2 className="text-xs font-black text-primary uppercase tracking-[0.25em] mb-4 flex items-center gap-2">
              <Star className="w-3.5 h-3.5 fill-current text-primary animate-pulse" /> Marquee Match
            </h2>
            <MatchCard match={nextMatch} showPickButton />
          </motion.div>
        )}

        {/* Visual splits columns */}
        <div className="grid md:grid-cols-12 gap-8 items-start">
          
          {/* Leagues visual panel */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="md:col-span-6 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">My Leagues</h2>
              <Link href="/leagues" onClick={handleLinkClick} className="text-xs font-bold text-primary hover:text-white flex items-center gap-1 transition-colors">
                All Leagues <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {myLeagues.length === 0 ? (
              <div className="glass rounded-3xl p-8 text-center border border-white/5 shadow-lg relative overflow-hidden group hover:border-primary/20 transition-all duration-300">
                <div className="text-5xl mb-4 transform transition-transform group-hover:scale-110">🏆</div>
                <p className="text-gray-400 text-sm mb-6 leading-relaxed">No custom leagues found! Form a private league or join friends to compete.</p>
                <Link
                  href="/leagues"
                  onClick={handleLinkClick}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black text-dark-900 uppercase tracking-widest transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #e6b619, #D4AF37)' }}
                >
                  <Plus className="w-4 h-4 stroke-[3px]" /> Join League
                </Link>
              </div>
            ) : (
              <div className="space-y-3.5">
                {myLeagues.slice(0, 3).map((league) => (
                  <Link 
                    key={league.id} 
                    href={`/leagues/${league.id}`}
                    onClick={handleLinkClick}
                    className="flex items-center justify-between glass spotlight-card rounded-2xl p-5 border border-white/5 hover:border-primary/20 transition-all"
                  >
                    <div>
                      <p className="font-extrabold text-sm text-white tracking-wide">{league.name}</p>
                      <p className="text-xs text-gray-500 font-medium mt-1">{league._count?.members || 0} / {league.maxMembers} Members Enrolled</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/5 hover:border-primary/20 flex items-center justify-center transition-colors">
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </motion.div>

          {/* Leaders board panel */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="md:col-span-6 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Global Top Managers</h2>
              <Link href="/leaderboard" onClick={handleLinkClick} className="text-xs font-bold text-primary hover:text-white flex items-center gap-1 transition-colors">
                Full Rankings <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="glass rounded-3xl border border-white/5 overflow-hidden shadow-lg">
              {globalTop.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">No rankings computed yet — kick off a match!</div>
              ) : (
                globalTop.map((entry, idx) => (
                  <div
                    key={entry.userId || idx}
                    className={`flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/[0.02] ${
                      idx !== globalTop.length - 1 ? 'border-b border-white/5' : ''
                    }`}
                  >
                    <span className="font-display font-black text-lg w-8 text-center">{getRankMedal(entry.rank)}</span>
                    <span className="text-2xl select-none">{entry.avatar || '⚽'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-extrabold text-sm truncate text-white leading-normal">{entry.name}</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">{entry.matchesPlayed || 0} Matches visualised</p>
                    </div>
                    <div className="text-right">
                      <span className="font-display font-black text-lg gradient-text-gold">{entry.totalPoints}</span>
                      <p className="text-[8px] text-gray-500 uppercase tracking-widest font-black mt-0.5">pts</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* Remaining Match schedules */}
        {upcomingMatches.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-10"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Schedules & Fixtures</h2>
              <Link href="/matches" onClick={handleLinkClick} className="text-xs font-bold text-primary hover:text-white flex items-center gap-1 transition-colors">
                All Matches <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
