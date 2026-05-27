'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { getEventIcon, getFlagByCountry } from '@/lib/utils';
import api from '@/lib/api';
import type { Match, User, League } from '@/types';
import toast from 'react-hot-toast';

type EventType = 'GOAL' | 'ASSIST' | 'YELLOW_CARD' | 'RED_CARD' | 'PENALTY_MISS' | 'CLEAN_SHEET' | 'SUBSTITUTION';

export default function AdminPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ userCount: 0, leagueCount: 0, matchCount: 0, liveCount: 0 });
  const [matches, setMatches] = useState<Match[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allLeagues, setAllLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'matches' | 'users' | 'leagues'>('matches');

  // Score edit state
  const [editMatch, setEditMatch] = useState<Match | null>(null);
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [matchStatus, setMatchStatus] = useState('');

  // Add event state
  const [eventMatch, setEventMatch] = useState<Match | null>(null);
  const [eventType, setEventType] = useState<EventType>('GOAL');
  const [eventMinute, setEventMinute] = useState('');
  const [eventPlayerName, setEventPlayerName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user?.isAdmin)) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, user, router]);

  useEffect(() => {
    if (!isAuthenticated || !user?.isAdmin) return;
    Promise.all([
      api.get('/admin/stats'),
      api.get('/matches?limit=104'),
      api.get('/admin/users'),
      api.get('/admin/leagues'),
    ]).then(([statsRes, matchRes, usersRes, leaguesRes]) => {
      setStats(statsRes.data.data);
      setMatches(matchRes.data.data || []);
      setAllUsers(usersRes.data.data || []);
      setAllLeagues(leaguesRes.data.data || []);
    }).finally(() => setLoading(false));
  }, [isAuthenticated, user]);

  const updateScore = async () => {
    if (!editMatch) return;
    setSaving(true);
    try {
      await api.patch(`/admin/matches/${editMatch.id}/score`, {
        homeScore: parseInt(homeScore),
        awayScore: parseInt(awayScore),
        status: matchStatus,
      });
      setMatches((prev) => prev.map((m) => m.id === editMatch.id ? { ...m, homeScore: parseInt(homeScore), awayScore: parseInt(awayScore), status: matchStatus as any } : m));
      setEditMatch(null);
      toast.success('Score updated! Points recalculating...');
    } catch { toast.error('Failed to update score'); }
    finally { setSaving(false); }
  };

  const addEvent = async () => {
    if (!eventMatch || !eventMinute) { toast.error('Fill all fields'); return; }
    setSaving(true);
    try {
      await api.post(`/admin/matches/${eventMatch.id}/events`, {
        matchId: eventMatch.id,
        type: eventType,
        minute: parseInt(eventMinute),
        detail: eventPlayerName,
      });
      setEventMatch(null);
      setEventMinute('');
      setEventPlayerName('');
      toast.success(`${eventType.replace(/_/g, ' ')} event added! Points updated live.`);
    } catch { toast.error('Failed to add event'); }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)]">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-5xl animate-float">⚽</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-350">
      <Navbar />
      <main className="px-4 pt-4 pb-24 md:pb-8 md:px-6 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">👑</span>
            <div>
              <h1 className="text-2xl font-black gradient-text">Admin Dashboard</h1>
              <p className="text-[var(--text-muted)] text-sm font-sans">World Cup Fantasy 2026 Control Center</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total Users', value: stats.userCount, icon: '👥', color: 'text-blue-500' },
              { label: 'Leagues', value: stats.leagueCount, icon: '🏆', color: 'text-amber-500' },
              { label: 'Matches', value: stats.matchCount, icon: '⚽', color: 'text-emerald-500' },
              { label: 'Live Now', value: stats.liveCount, icon: '🔴', color: 'text-rose-500' },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className="glass rounded-2xl p-4 text-center">
                <div className="text-2xl mb-1">{icon}</div>
                <p className={`text-2xl font-black ${color}`}>{value}</p>
                <p className="text-xs text-[var(--text-muted)]">{label}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-4 glass rounded-xl p-1">
            {(['matches', 'users', 'leagues'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                  tab === t 
                    ? 'bg-primary/20 text-primary border border-primary/30' 
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Matches Tab */}
          {tab === 'matches' && (
            <div className="space-y-3">
              {matches.map((match) => (
                <div key={match.id} className="glass rounded-2xl p-4 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span>{getFlagByCountry(match.homeTeam)}</span>
                      <span className="font-semibold text-sm">{match.homeTeam} {match.homeScore} - {match.awayScore} {match.awayTeam}</span>
                      <span>{getFlagByCountry(match.awayTeam)}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      match.status === 'LIVE' ? 'text-rose-500 bg-rose-500/10' :
                      match.status === 'COMPLETED' ? 'text-emerald-500 bg-emerald-500/10' :
                      'text-[var(--text-secondary)] bg-[var(--bg-subtle)] border border-[var(--border)]'
                    }`}>{match.status}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditMatch(match); setHomeScore(String(match.homeScore)); setAwayScore(String(match.awayScore)); setMatchStatus(match.status); }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface-hover)] bg-[var(--card-bg)]">
                      ✏️ Score
                    </button>
                    <button onClick={() => setEventMatch(match)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-primary border border-primary/30 bg-primary/10 hover:bg-primary/20">
                      ⚽ Event
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Users Tab */}
          {tab === 'users' && (
            <div className="glass rounded-2xl overflow-hidden">
              {allUsers.map((u, idx) => (
                <div key={u.id} className={`flex items-center gap-3 px-4 py-3 ${idx !== allUsers.length - 1 ? 'border-b border-[var(--border)]' : ''}`}>
                  <span className="text-xl">{u.avatar || '⚽'}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{u.name}</p>
                      {u.isAdmin && <span className="text-[10px] text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded-full">Admin</span>}
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">{u.email}</p>
                  </div>
                  <span className="font-black text-primary">{u.totalPoints} pts</span>
                </div>
              ))}
            </div>
          )}

          {/* Leagues Tab */}
          {tab === 'leagues' && (
            <div className="glass rounded-2xl overflow-hidden">
              {allLeagues.map((league, idx) => (
                <div key={league.id} className={`flex items-center gap-3 px-4 py-3 ${idx !== allLeagues.length - 1 ? 'border-b border-[var(--border)]' : ''}`}>
                  <span className="text-2xl">🏆</span>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{league.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">Code: {league.inviteCode} · {league._count?.members || 0} members</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </main>

      {/* Edit Score Modal */}
      {editMatch && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setEditMatch(null)}>
          <div className="glass rounded-3xl p-6 w-full max-w-sm text-[var(--text)]" style={{ background: 'var(--bg-subtle)' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4 text-[var(--text)]">Update Score</h3>
            <p className="text-sm text-[var(--text-muted)] mb-4">{editMatch.homeTeam} vs {editMatch.awayTeam}</p>
            <div className="flex gap-3 mb-4">
              <input type="number" value={homeScore} onChange={(e) => setHomeScore(e.target.value)}
                placeholder="Home" min="0"
                className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text)] text-center text-xl font-black focus:border-primary/50 transition-colors" />
              <span className="flex items-center text-[var(--text-muted)] font-bold">:</span>
              <input type="number" value={awayScore} onChange={(e) => setAwayScore(e.target.value)}
                placeholder="Away" min="0"
                className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text)] text-center text-xl font-black focus:border-primary/50 transition-colors" />
            </div>
            <select value={matchStatus} onChange={(e) => setMatchStatus(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text)] mb-4 text-sm focus:border-primary/50 transition-colors">
              <option value="UPCOMING">UPCOMING</option>
              <option value="LIVE">LIVE</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
            <div className="flex gap-2">
              <button onClick={() => setEditMatch(null)} className="flex-1 py-2.5 rounded-xl font-semibold text-[var(--text-secondary)] border border-[var(--border)] bg-[var(--card-bg)] hover:bg-[var(--surface-hover)]">Cancel</button>
              <button onClick={updateScore} disabled={saving}
                className="flex-1 py-2.5 rounded-xl font-bold text-white disabled:opacity-60"
                style={{
                  background: 'linear-gradient(135deg, var(--accent), #B91C1C)',
                  boxShadow: '0 4px 15px var(--accent-glow)'
                }}>
                {saving ? 'Saving...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {eventMatch && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setEventMatch(null)}>
          <div className="glass rounded-3xl p-6 w-full max-w-sm text-[var(--text)]" style={{ background: 'var(--bg-subtle)' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-1 text-[var(--text)]">Add Match Event</h3>
            <p className="text-sm text-[var(--text-muted)] mb-4">{eventMatch.homeTeam} vs {eventMatch.awayTeam}</p>

            <label className="text-xs text-[var(--text-muted)] mb-2 block">Event Type</label>
            <select value={eventType} onChange={(e) => setEventType(e.target.value as EventType)}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text)] mb-3 text-sm focus:border-primary/50 transition-colors">
              {['GOAL', 'ASSIST', 'YELLOW_CARD', 'RED_CARD', 'PENALTY_MISS', 'CLEAN_SHEET'].map((t) => (
                <option key={t} value={t}>{getEventIcon(t)} {t.replace(/_/g, ' ')}</option>
              ))}
            </select>

            <label className="text-xs text-[var(--text-muted)] mb-2 block">Minute</label>
            <input type="number" value={eventMinute} onChange={(e) => setEventMinute(e.target.value)}
              placeholder="e.g. 45" min="1" max="120"
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text)] mb-3 text-sm focus:border-primary/50 transition-colors" />

            <label className="text-xs text-[var(--text-muted)] mb-2 block">Player Name (optional)</label>
            <input value={eventPlayerName} onChange={(e) => setEventPlayerName(e.target.value)}
              placeholder="e.g. Mbappe"
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text)] mb-4 text-sm focus:border-primary/50 transition-colors" />

            <div className="flex gap-2">
              <button onClick={() => setEventMatch(null)} className="flex-1 py-2.5 rounded-xl font-semibold text-[var(--text-secondary)] border border-[var(--border)] bg-[var(--card-bg)] hover:bg-[var(--surface-hover)]">Cancel</button>
              <button onClick={addEvent} disabled={saving}
                className="flex-1 py-2.5 rounded-xl font-bold text-white disabled:opacity-60"
                style={{
                  background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                  boxShadow: '0 4px 15px var(--primary-glow)'
                }}>
                {saving ? 'Adding...' : '⚽ Add Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
