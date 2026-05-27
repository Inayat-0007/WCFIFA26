'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { Navbar } from '@/components/ui/Navbar';
import { MatchCard } from '@/components/matches/MatchCard';
import { KnockoutBracket } from '@/components/matches/KnockoutBracket';
import api from '@/lib/api';
import type { Match } from '@/types';

const FILTERS = [
  { label: 'All Status', value: '' },
  { label: '🔴 Live', value: 'LIVE' },
  { label: '⏳ Upcoming', value: 'UPCOMING' },
  { label: '✅ Completed', value: 'COMPLETED' },
];

const ROUNDS = [
  { label: 'All Rounds', value: '' },
  { label: 'Group Stage', value: 'Group Stage' },
  { label: 'Round of 32', value: 'Round of 32' },
  { label: 'Round of 16', value: 'Round of 16' },
  { label: 'Quarter-finals', value: 'Quarter-finals' },
  { label: 'Semi-finals', value: 'Semi-finals' },
  { label: 'Final', value: 'Final' },
];

export default function MatchesPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { socket } = useSocket();
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState('');
  const [roundFilter, setRoundFilter] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'bracket'>('list');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        
        // For bracket view, we fetch all matches to render the complete bracket
        if (viewMode === 'list') {
          if (filter) params.append('status', filter);
          if (group) params.append('group', group);
          if (roundFilter) params.append('round', roundFilter);
        }
        
        params.append('limit', '200');
        const res = await api.get(`/matches?${params}`);
        setMatches(res.data.data || []);
      } catch { } finally { setLoading(false); }
    };
    fetch();
  }, [isAuthenticated, filter, group, roundFilter, viewMode]);

  useEffect(() => {
    if (!socket) return;
    socket.on('score:update', (data: { matchId: string; homeScore: number; awayScore: number }) => {
      setMatches((prev) => prev.map((m) =>
        m.id === data.matchId ? { ...m, homeScore: data.homeScore, awayScore: data.awayScore, status: 'LIVE' } : m
      ));
    });
    return () => { socket.off('score:update'); };
  }, [socket]);

  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Stadium Light Rays */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <Navbar />
      <main className="px-4 pt-6 pb-24 md:pb-8 md:px-6 max-w-6xl mx-auto relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-black tracking-tight mb-1">
                <span className="gradient-text">FIFA WC 2026</span>
                <span style={{ color: 'var(--text)' }}> Matches</span>
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                All {matches.length} matches of FIFA World Cup 2026
              </p>
            </div>

            {/* View Switcher Toggle */}
            <div className="flex p-1 rounded-2xl w-fit border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <button
                onClick={() => setViewMode('list')}
                className="px-4 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all duration-200"
                style={{
                  background: viewMode === 'list' ? 'linear-gradient(135deg, var(--primary), var(--primary-hover))' : 'transparent',
                  color: viewMode === 'list' ? '#fff' : 'var(--text-muted)',
                }}
              >
                📋 List View
              </button>
              <button
                onClick={() => setViewMode('bracket')}
                className="px-4 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all duration-200"
                style={{
                  background: viewMode === 'bracket' ? 'linear-gradient(135deg, var(--primary), var(--primary-hover))' : 'transparent',
                  color: viewMode === 'bracket' ? '#fff' : 'var(--text-muted)',
                }}
              >
                🌳 Bracket View
              </button>
            </div>
          </div>

          {viewMode === 'list' ? (
            <>
              {/* Status and Round filters */}
              <div className="flex flex-wrap gap-4 mb-6 items-center">
                {/* Status Filters */}
                <div className="flex gap-1.5 flex-wrap">
                  {FILTERS.map((f) => {
                    const isActive = filter === f.value;
                    return (
                      <button
                        key={f.value}
                        onClick={() => setFilter(f.value)}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 border"
                        style={{
                          background: isActive ? 'var(--accent-glow)' : 'var(--card-bg)',
                          borderColor: isActive ? 'var(--accent)' : 'var(--border)',
                          color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                        }}
                      >
                        {f.label}
                      </button>
                    );
                  })}
                </div>

                <div className="h-6 w-[1px] hidden md:block" style={{ background: 'var(--border)' }} />

                {/* Round Filters */}
                <div className="flex gap-1.5 flex-wrap">
                  {ROUNDS.map((r) => {
                    const isActive = roundFilter === r.value;
                    return (
                      <button
                        key={r.value}
                        onClick={() => {
                          setRoundFilter(r.value);
                          if (r.value !== 'Group Stage') {
                            setGroup(''); // Clear group filter if selecting knockout rounds
                          }
                        }}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 border"
                        style={{
                          background: isActive ? 'var(--gold-glow)' : 'var(--card-bg)',
                          borderColor: isActive ? 'var(--gold)' : 'var(--border)',
                          color: isActive ? 'var(--gold)' : 'var(--text-muted)',
                        }}
                      >
                        {r.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Group Filter (Only visible if roundFilter is empty or Group Stage) */}
              {(roundFilter === '' || roundFilter === 'Group Stage') && (
                <div className="flex gap-1.5 flex-wrap mb-8 border p-3.5 rounded-2xl" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
                  <button
                    onClick={() => setGroup('')}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border"
                    style={{
                      background: group === '' ? 'var(--primary-glow)' : 'transparent',
                      borderColor: group === '' ? 'var(--primary)' : 'var(--border)',
                      color: group === '' ? 'var(--primary)' : 'var(--text-muted)',
                    }}
                  >
                    All Groups
                  </button>
                  {groups.map((g) => {
                    const isActive = group === g;
                    return (
                      <button
                        key={g}
                        onClick={() => {
                          setGroup(g);
                          setRoundFilter('Group Stage'); // Autoselect Group Stage
                        }}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border"
                        style={{
                          background: isActive ? 'var(--primary-glow)' : 'transparent',
                          borderColor: isActive ? 'var(--primary)' : 'var(--border)',
                          color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                        }}
                      >
                        Group {g}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Match Grid */}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="card h-40 shimmer" />
                  ))}
                </div>
              ) : matches.length === 0 ? (
                <div className="text-center py-20 card" style={{ background: 'var(--card-bg)' }}>
                  <div className="text-5xl mb-4 animate-bounce">⚽</div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    No matches found matching these filters.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {matches.map((m, i) => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.015 }}
                    >
                      <MatchCard match={m} />
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Knockout Bracket View */
            <div>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: 'var(--primary)' }} />
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Assembling tournament tree...</p>
                </div>
              ) : (
                <KnockoutBracket matches={matches} />
              )}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
