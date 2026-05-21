'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Copy, Share2, UserMinus, Crown, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { Navbar } from '@/components/ui/Navbar';
import { getRankMedal } from '@/lib/utils';
import api from '@/lib/api';
import type { League, LeaderboardEntry } from '@/types';
import toast from 'react-hot-toast';

export default function LeagueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { socket, joinLeague, leaveLeague: leaveRoom } = useSocket();
  const router = useRouter();
  const [league, setLeague] = useState<League | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [tab, setTab] = useState<'leaderboard' | 'members'>('leaderboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated || !id) return;
    Promise.all([
      api.get(`/leagues/${id}`),
      api.get(`/leaderboard/league/${id}`),
    ]).then(([leagueRes, lbRes]) => {
      setLeague(leagueRes.data.data);
      setLeaderboard(lbRes.data.data || []);
    }).finally(() => setLoading(false));

    joinLeague(id);
    return () => leaveRoom(id);
  }, [id, isAuthenticated, joinLeague, leaveRoom]);

  useEffect(() => {
    if (!socket) return;
    socket.on('leaderboard:update', (data: { leagueId: string }) => {
      if (data.leagueId === id) {
        api.get(`/leaderboard/league/${id}`).then((res) => setLeaderboard(res.data.data || []));
      }
    });
    return () => { socket.off('leaderboard:update'); };
  }, [socket, id]);

  const copyInviteCode = () => {
    if (league?.inviteCode) {
      navigator.clipboard.writeText(league.inviteCode);
      toast.success('Invite code copied! 🔗');
    }
  };

  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this league?')) return;
    try {
      await api.delete(`/leagues/${id}/leave`);
      toast.success('Left league');
      router.push('/leagues');
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to leave');
    }
  };

  const removeMember = async (userId: string, name: string) => {
    if (!confirm(`Remove ${name} from the league?`)) return;
    try {
      await api.delete(`/leagues/${id}/members/${userId}`);
      setLeague((prev) => prev ? {
        ...prev,
        members: prev.members?.filter((m) => m.userId !== userId),
      } : prev);
      toast.success('Member removed');
    } catch { toast.error('Failed to remove member'); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-5xl animate-float">⚽</div>
        </div>
      </div>
    );
  }

  if (!league) {
    return (
      <div className="min-h-screen bg-dark-900">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-gray-400">League not found or you are not a member.</p>
        </div>
      </div>
    );
  }

  const isOwner = league.ownerId === user?.id;
  const myEntry = leaderboard.find((e) => e.userId === user?.id);

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <main className="px-4 pt-4 pb-24 md:pb-8 md:px-6 max-w-2xl mx-auto">
        {/* League Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="glass rounded-3xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-black text-white">{league.name}</h1>
                  {isOwner && <Crown className="w-4 h-4 text-gold-400" />}
                </div>
                <p className="text-xs text-gray-500">{league.members?.length || 0}/{league.maxMembers} members</p>
              </div>
              {myEntry && (
                <div className="text-right">
                  <p className="text-[10px] text-gray-500">Your Rank</p>
                  <p className="text-2xl">{getRankMedal(myEntry.rank)}</p>
                </div>
              )}
            </div>

            {/* Invite Code */}
            <div className="flex items-center gap-2 glass-gold rounded-xl p-3">
              <div className="flex-1">
                <p className="text-[10px] text-gray-500 mb-0.5">Invite Code</p>
                <p className="text-xl font-black tracking-widest text-gold-400">{league.inviteCode}</p>
              </div>
              <button onClick={copyInviteCode} className="p-2 rounded-lg hover:bg-gold-400/10 transition-colors">
                <Copy className="w-4 h-4 text-gold-400" />
              </button>
              <button onClick={() => {
                if (navigator.share) navigator.share({ title: league.name, text: `Join my World Cup Fantasy 2026 league! Code: ${league.inviteCode}`, url: window.location.origin + '/leagues' });
                else copyInviteCode();
              }} className="p-2 rounded-lg hover:bg-gold-400/10 transition-colors">
                <Share2 className="w-4 h-4 text-gold-400" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 glass rounded-xl p-1">
          <button onClick={() => setTab('leaderboard')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'leaderboard' ? 'bg-primary-500/20 text-primary-400' : 'text-gray-500'}`}>
            🏆 Leaderboard
          </button>
          <button onClick={() => setTab('members')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'members' ? 'bg-primary-500/20 text-primary-400' : 'text-gray-500'}`}>
            👥 Members
          </button>
        </div>

        {tab === 'leaderboard' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {leaderboard.length === 0 ? (
              <div className="text-center py-12 glass rounded-2xl">
                <div className="text-4xl mb-3">🏆</div>
                <p className="text-gray-400 text-sm">No rankings yet — pick your teams!</p>
              </div>
            ) : (
              <div className="glass rounded-2xl overflow-hidden">
                {leaderboard.map((entry, idx) => {
                  const isMe = entry.userId === user?.id;
                  return (
                    <motion.div
                      key={entry.userId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`flex items-center gap-3 px-4 py-3.5 ${idx !== leaderboard.length - 1 ? 'border-b border-white/5' : ''} ${isMe ? 'bg-primary-500/5' : ''}`}
                    >
                      <span className="text-xl w-8 text-center">{getRankMedal(entry.rank)}</span>
                      <span className="text-xl">{entry.avatar || '⚽'}</span>
                      <div className="flex-1">
                        <p className={`font-semibold text-sm ${isMe ? 'text-primary-300' : 'text-white'}`}>
                          {entry.name} {isMe && <span className="text-[10px] text-gray-500">(you)</span>}
                        </p>
                        <p className="text-xs text-gray-500">{entry.matchesPlayed || 0} matches played</p>
                      </div>
                      <span className="font-black text-lg gradient-text-gold">{entry.totalPoints}</span>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {tab === 'members' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="glass rounded-2xl overflow-hidden">
              {league.members?.map((member, idx) => (
                <div key={member.id} className={`flex items-center gap-3 px-4 py-3 ${idx !== (league.members?.length || 0) - 1 ? 'border-b border-white/5' : ''}`}>
                  <span className="text-xl">{member.user.avatar || '⚽'}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{member.user.name}</p>
                      {member.userId === league.ownerId && <Crown className="w-3 h-3 text-gold-400" />}
                      {member.userId === user?.id && <span className="text-[10px] text-gray-500">(you)</span>}
                    </div>
                    <p className="text-xs text-gray-500">{member.user.totalPoints} pts total</p>
                  </div>
                  {isOwner && member.userId !== user?.id && (
                    <button onClick={() => removeMember(member.userId, member.user.name)}
                      className="p-1.5 rounded-lg hover:bg-primary-500/10 text-gray-600 hover:text-primary-400 transition-colors">
                      <UserMinus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Leave League */}
        {!isOwner && (
          <button onClick={handleLeave}
            className="mt-6 w-full py-3 rounded-xl text-sm font-semibold text-primary-400 glass-red hover:bg-primary-500/10 transition-all">
            Leave League
          </button>
        )}
      </main>
    </div>
  );
}
