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
        
        params.append('limit', '104');
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
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <main className="px-4 pt-4 pb-24 md:pb-8 md:px-6 max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-black mb-1">
                <span className="gradient-text">FIFA WC 2026</span>
                <span className="text-white"> Matches</span>
              </h1>
              <p className="text-gray-500 text-sm">All 104 matches of FIFA World Cup 2026</p>
            </div>

            {/* View Switcher Toggle */}
            <div className="flex bg-white/[0.02] border border-white/5 p-1 rounded-2xl w-fit">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all ${
                  viewMode === 'list'
                    ? 'bg-primary text-[#0B0B0C] shadow-md shadow-primary/20'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                📋 List View
              </button>
              <button
                onClick={() => setViewMode('bracket')}
                className={`px-4 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all ${
                  viewMode === 'bracket'
                    ? 'bg-primary text-[#0B0B0C] shadow-md shadow-primary/20'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                🌳 Bracket View
              </button>
            </div>
          </div>

          {viewMode === 'list' ? (
            <>
              {/* Status and Round filters */}
              <div className="flex flex-wrap gap-3 mb-4 items-center">
                {/* Status Filters */}
                <div className="flex gap-1.5 flex-wrap">
                  {FILTERS.map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setFilter(f.value)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                        filter === f.value
                          ? 'text-white border-primary-500/50'
                          : 'text-gray-400 glass hover:text-white'
                      }`}
                      style={filter === f.value ? { background: 'rgba(220,20,60,0.15)', border: '1px solid rgba(220,20,60,0.4)' } : {}}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="h-6 w-[1px] bg-white/10 hidden md:block" />

                {/* Round Filters */}
                <div className="flex gap-1.5 flex-wrap">
                  {ROUNDS.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => {
                        setRoundFilter(r.value);
                        if (r.value !== 'Group Stage') {
                          setGroup(''); // Clear group filter if selecting knockout rounds
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                        roundFilter === r.value
                          ? 'text-[#FFD700] border-[#FFD700]/50 bg-[#FFD700]/10'
                          : 'text-gray-400 glass hover:text-white'
                      }`}
                      style={roundFilter === r.value ? { border: '1px solid rgba(255,215,0,0.4)' } : {}}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Group Filter (Only visible if roundFilter is empty or Group Stage) */}
              {(roundFilter === '' || roundFilter === 'Group Stage') && (
                <div className="flex gap-1.5 flex-wrap mb-6 bg-white/[0.01] border border-white/5 p-3 rounded-2xl">
                  <button
                    onClick={() => setGroup('')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                      group === ''
                        ? 'bg-primary-500/20 text-primary border border-primary/30'
                        : 'text-gray-500 hover:text-gray-300 glass'
                    }`}
                  >
                    All Groups
                  </button>
                  {groups.map((g) => (
                    <button
                      key={g}
                      onClick={() => {
                        setGroup(g);
                        setRoundFilter('Group Stage'); // Autoselect Group Stage
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                        group === g
                          ? 'bg-primary-500/20 text-primary border border-primary/30'
                          : 'text-gray-500 hover:text-gray-300 glass'
                      }`}
                    >
                      Group {g}
                    </button>
                  ))}
                </div>
              )}

              {/* Match Grid */}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="glass rounded-2xl h-36 shimmer" />
                  ))}
                </div>
              ) : matches.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-5xl mb-4">⚽</div>
                  <p className="text-gray-400">No matches found for this filter.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {matches.map((m, i) => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
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
                  <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-xs text-gray-400">Assembling tournament tree...</p>
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
