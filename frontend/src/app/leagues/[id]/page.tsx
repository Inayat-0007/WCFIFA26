'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Copy, Share2, UserMinus, Crown } from 'lucide-react';
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
      <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--bg)' }}>
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <div className="text-5xl animate-float select-none">⚽</div>
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mt-4" style={{ borderColor: 'var(--primary)' }} />
        </div>
      </div>
    );
  }

  if (!league) {
    return (
      <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--bg)' }}>
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[60vh] max-w-sm mx-auto px-4">
          <div className="card p-6 text-center" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
            <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>
              League not found or you are not a member.
            </p>
            <button
              onClick={() => router.push('/leagues')}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))' }}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = league.ownerId === user?.id;
  const myEntry = leaderboard.find((e) => e.userId === user?.id);

  return (
    <div className="min-h-screen relative overflow-hidden pb-12" style={{ background: 'var(--bg)' }}>
      {/* Stadium Light Rays */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      <Navbar />
      <main className="px-4 pt-6 pb-24 md:pb-8 md:px-6 max-w-2xl mx-auto relative z-10">
        {/* League Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="card p-5" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-black" style={{ color: 'var(--text)' }}>{league.name}</h1>
                  {isOwner && <Crown className="w-4 h-4" style={{ color: 'var(--gold)' }} />}
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {league.members?.length || 0} / {league.maxMembers} members
                </p>
              </div>
              {myEntry && (
                <div className="text-right">
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Your Rank</p>
                  <p className="text-2xl">{getRankMedal(myEntry.rank)}</p>
                </div>
              )}
            </div>

            {/* Invite Code */}
            <div className="flex items-center gap-2 rounded-xl p-3 border" style={{ background: 'var(--gold-glow)', borderColor: 'var(--gold)' }}>
              <div className="flex-1">
                <p className="text-[10px] mb-0.5" style={{ color: 'var(--text-muted)' }}>Invite Code</p>
                <p className="text-xl font-black tracking-widest" style={{ color: 'var(--gold)' }}>{league.inviteCode}</p>
              </div>
              <button onClick={copyInviteCode} className="p-2 rounded-lg hover:opacity-80 transition-opacity">
                <Copy className="w-4 h-4" style={{ color: 'var(--gold)' }} />
              </button>
              <button
                onClick={() => {
                  if (navigator.share) navigator.share({ title: league.name, text: `Join my World Cup Fantasy 2026 league! Code: ${league.inviteCode}`, url: window.location.origin + '/leagues' });
                  else copyInviteCode();
                }}
                className="p-2 rounded-lg hover:opacity-80 transition-opacity"
              >
                <Share2 className="w-4 h-4" style={{ color: 'var(--gold)' }} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 rounded-xl p-1 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <button
            onClick={() => setTab('leaderboard')}
            className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
            style={{
              background: tab === 'leaderboard' ? 'var(--primary-glow)' : 'transparent',
              color: tab === 'leaderboard' ? 'var(--primary)' : 'var(--text-muted)',
            }}
          >
            🏆 Leaderboard
          </button>
          <button
            onClick={() => setTab('members')}
            className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
            style={{
              background: tab === 'members' ? 'var(--primary-glow)' : 'transparent',
              color: tab === 'members' ? 'var(--primary)' : 'var(--text-muted)',
            }}
          >
            👥 Members
          </button>
        </div>

        {tab === 'leaderboard' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {leaderboard.length === 0 ? (
              <div className="text-center py-12 card" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
                <div className="text-4xl mb-3 animate-bounce">🏆</div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  No rankings yet — pick your teams!
                </p>
              </div>
            ) : (
              <div className="card overflow-hidden" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
                {leaderboard.map((entry, idx) => {
                  const isMe = entry.userId === user?.id;
                  return (
                    <motion.div
                      key={entry.userId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="flex items-center gap-3 px-4 py-3.5 border-b last:border-b-0"
                      style={{
                        borderColor: 'var(--border)',
                        background: isMe ? 'var(--primary-glow)' : 'transparent',
                        borderLeft: isMe ? '4px solid var(--primary)' : '1px solid transparent',
                      }}
                    >
                      <span className="text-xl w-8 text-center">{getRankMedal(entry.rank)}</span>
                      <span className="text-xl select-none">{entry.avatar || '⚽'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate" style={{ color: isMe ? 'var(--primary)' : 'var(--text)' }}>
                          {entry.name} {isMe && <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>(you)</span>}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{entry.matchesPlayed || 0} matches played</p>
                      </div>
                      <span className="font-black text-lg" style={{ color: 'var(--gold)' }}>{entry.totalPoints}</span>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {tab === 'members' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="card overflow-hidden" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
              {league.members?.map((member, idx) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 px-4 py-3.5 border-b last:border-b-0"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <span className="text-xl select-none">{member.user.avatar || '⚽'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm truncate" style={{ color: 'var(--text)' }}>{member.user.name}</p>
                      {member.userId === league.ownerId && <Crown className="w-3 h-3" style={{ color: 'var(--gold)' }} />}
                      {member.userId === user?.id && <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>(you)</span>}
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{member.user.totalPoints} pts total</p>
                  </div>
                  {isOwner && member.userId !== user?.id && (
                    <button
                      onClick={() => removeMember(member.userId, member.user.name)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-500 transition-colors"
                    >
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
          <button
            onClick={handleLeave}
            className="mt-6 w-full py-3 rounded-xl text-sm font-bold border transition-all duration-200 hover:opacity-95"
            style={{
              background: 'var(--accent-glow)',
              borderColor: 'var(--accent)',
              color: 'var(--accent)',
            }}
          >
            Leave League
          </button>
        )}
      </main>
    </div>
  );
}
