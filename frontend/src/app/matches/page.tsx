'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { Navbar } from '@/components/ui/Navbar';
import { MatchCard } from '@/components/matches/MatchCard';
import api from '@/lib/api';
import type { Match, MatchStatus } from '@/types';

const FILTERS: { label: string; value: string }[] = [
  { label: 'All', value: '' },
  { label: '🔴 Live', value: 'LIVE' },
  { label: '⏳ Upcoming', value: 'UPCOMING' },
  { label: '✅ Completed', value: 'COMPLETED' },
];

export default function MatchesPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { socket } = useSocket();
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filter) params.append('status', filter);
        if (group) params.append('group', group);
        params.append('limit', '104');
        const res = await api.get(`/matches?${params}`);
        setMatches(res.data.data || []);
      } catch { } finally { setLoading(false); }
    };
    fetch();
  }, [isAuthenticated, filter, group]);

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
          <h1 className="text-2xl font-black mb-1">
            <span className="gradient-text">FIFA WC 2026</span>
            <span className="text-white"> Matches</span>
          </h1>
          <p className="text-gray-500 text-sm mb-5">All 104 matches of FIFA World Cup 2026</p>

          {/* Status Filters */}
          <div className="flex gap-2 flex-wrap mb-4">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
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

          {/* Group Filter */}
          <div className="flex gap-1.5 flex-wrap mb-6">
            <button
              onClick={() => setGroup('')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${group === '' ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'text-gray-500 hover:text-gray-300 glass'}`}
            >
              All Groups
            </button>
            {groups.map((g) => (
              <button
                key={g}
                onClick={() => setGroup(g)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${group === g ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'text-gray-500 hover:text-gray-300 glass'}`}
              >
                Group {g}
              </button>
            ))}
          </div>

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
                  transition={{ delay: i * 0.03 }}
                >
                  <MatchCard match={m} />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
