'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Edit2, LogOut, Trophy, Bell, Award, Calendar } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import type { Achievement, SeasonHistory } from '@/types';

const AVATARS = ['⚽', '🏆', '🥅', '⭐', '🦁', '🐉', '🦅', '🔥', '💫', '🎯'];

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading, logout, updateProfile } = useAuth();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAvatar, setNewAvatar] = useState('');
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ leagues: 0, teams: 0 });

  // Phase 4 States
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [history, setHistory] = useState<SeasonHistory[]>([]);
  const [subscribed, setSubscribed] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [loadingPush, setLoadingPush] = useState(false);
  const [loadingAchievements, setLoadingAchievements] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Fetch stats
    api.get('/auth/me').then((res) => {
      const data = res.data.data;
      setStats({ leagues: data._count?.memberships || 0, teams: data._count?.fantasyTeams || 0 });
    });

    // Fetch achievements
    api.get('/users/achievements')
      .then((res) => {
        setAchievements(res.data.data || []);
      })
      .catch(() => {})
      .finally(() => setLoadingAchievements(false));

    // Fetch season history
    api.get('/users/history')
      .then((res) => {
        setHistory(res.data.data || []);
      })
      .catch(() => {})
      .finally(() => setLoadingHistory(false));

    // Check push support and registration
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setPushSupported(true);
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setSubscribed(!!sub);
        });
      });
    }
  }, [isAuthenticated]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ name: newName || user?.name, avatar: newAvatar || user?.avatar || '⚽' });
      toast.success('Profile updated!');
      setEditing(false);
    } catch { toast.error('Failed to update profile'); }
    finally { setSaving(false); }
  };

  // Push notifications handlers
  const handleTogglePush = async () => {
    if (!pushSupported) return;
    setLoadingPush(true);

    try {
      if (subscribed) {
        // Unsubscribe logic
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
          setSubscribed(false);
          toast.success('Unsubscribed from notifications.');
        }
      } else {
        // Subscribe logic
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          toast.error('Notification permission denied.');
          setLoadingPush(false);
          return;
        }

        const reg = await navigator.serviceWorker.ready;
        let vapidKey = '';
        try {
          const res = await api.get('/notifications/vapid-key');
          vapidKey = res.data.publicKey;
        } catch {
          // Fallback to env
          vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
        }

        if (!vapidKey) {
          toast.error('Server notifications are not configured.');
          setLoadingPush(false);
          return;
        }

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey)
        });

        await api.post('/notifications/subscribe', sub);
        setSubscribed(true);
        toast.success('Successfully subscribed to notifications!');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to toggle notification status.');
    } finally {
      setLoadingPush(false);
    }
  };

  const handleTestPush = async () => {
    try {
      const res = await api.post('/notifications/test');
      if (res.data.success) {
        toast.success(res.data.message || 'Test notification dispatched!');
      } else {
        toast.error(res.data.message || 'No active subscriptions registered.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to dispatch test notification.');
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen relative overflow-hidden pb-12" style={{ background: 'var(--bg)' }}>
      {/* Stadium Light Rays */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      <Navbar />
      <main className="px-4 pt-6 pb-24 md:pb-8 md:px-6 max-w-2xl mx-auto space-y-6 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Profile Card */}
          <div className="card p-6 text-center relative overflow-hidden" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
            <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full blur-3xl pointer-events-none" style={{ background: 'var(--primary-glow)' }} />
            <motion.div
              className="text-7xl mb-4 cursor-pointer w-24 h-24 rounded-full flex items-center justify-center mx-auto transition-all border"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
              whileHover={{ scale: 1.05 }}
              onClick={() => setEditing(true)}
            >
              {user.avatar || '⚽'}
            </motion.div>
            <h1 className="text-2xl font-black mb-1" style={{ color: 'var(--text)' }}>{user.name}</h1>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
            {user.isAdmin && (
              <span className="px-3 py-1 rounded-full text-xs font-bold border" style={{ color: 'var(--gold)', background: 'var(--gold-glow)', borderColor: 'var(--gold)' }}>
                👑 Super Admin
              </span>
            )}

            <button
              onClick={() => { setNewName(user.name); setNewAvatar(user.avatar || '⚽'); setEditing(!editing); }}
              className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 hover:scale-105"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--text-secondary)',
              }}
            >
              <Edit2 className="w-3.5 h-3.5" /> Edit Profile
            </button>
          </div>

          {/* Edit Form */}
          {editing && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="card p-5" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
              <h3 className="font-bold mb-4" style={{ color: 'var(--text)' }}>Edit Profile</h3>
              <div className="mb-4">
                <label className="text-xs mb-2 block font-bold" style={{ color: 'var(--text-muted)' }}>Name</label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                  style={{
                    background: 'var(--input-bg)',
                    borderColor: 'var(--input-border)',
                    color: 'var(--text)',
                  }}
                />
              </div>
              <div className="mb-4">
                <label className="text-xs mb-2 block font-bold" style={{ color: 'var(--text-muted)' }}>Avatar</label>
                <div className="flex flex-wrap gap-2">
                  {AVATARS.map((a) => (
                    <button
                      key={a}
                      onClick={() => setNewAvatar(a)}
                      className="w-10 h-10 text-xl rounded-xl flex items-center justify-center transition-all border"
                      style={{
                        background: newAvatar === a ? 'var(--primary-glow)' : 'var(--surface)',
                        borderColor: newAvatar === a ? 'var(--primary)' : 'var(--border)',
                      }}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-2.5 rounded-xl font-bold text-white text-sm transition-all duration-200 hover:opacity-90 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))' }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </motion.div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total Points', value: user.totalPoints, icon: '⭐' },
              { label: 'Leagues Joined', value: stats.leagues, icon: '🏆' },
              { label: 'Teams Built', value: stats.teams, icon: '⚽' },
            ].map(({ label, value, icon }) => (
              <div key={label} className="card p-3 text-center border" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
                <div className="text-2xl mb-1 select-none">{icon}</div>
                <p className="text-xl font-black" style={{ color: 'var(--text)' }}>{value}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Web Push Notifications Card */}
          <div className="card p-5 border relative overflow-hidden" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl border flex items-center justify-center"
                  style={{
                    background: 'var(--primary-glow)',
                    borderColor: 'var(--border)',
                    color: 'var(--primary)',
                  }}
                >
                  <Bell className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h3 className="font-black text-sm" style={{ color: 'var(--text)' }}>Web Push Notifications</h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Stay updated with live scores & match starts</p>
                </div>
              </div>
              
              {pushSupported ? (
                <button
                  onClick={handleTogglePush}
                  disabled={loadingPush}
                  className="px-4 py-2 rounded-xl text-xs font-black uppercase transition-all tracking-wider border hover:scale-105"
                  style={{
                    background: subscribed ? 'var(--primary-glow)' : 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                    borderColor: subscribed ? 'var(--primary)' : 'transparent',
                    color: subscribed ? 'var(--primary)' : '#fff',
                  }}
                >
                  {loadingPush ? '...' : subscribed ? 'Subscribed' : 'Enable'}
                </button>
              ) : (
                <span className="text-[10px] px-2.5 py-1 rounded-full font-bold uppercase border" style={{ color: 'var(--accent)', background: 'var(--accent-glow)', borderColor: 'var(--accent)' }}>Unsupported</span>
              )}
            </div>

            {subscribed && (
              <div className="mt-4 pt-3 border-t flex justify-end" style={{ borderColor: 'var(--border)' }}>
                <button
                  onClick={handleTestPush}
                  className="px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 border hover:opacity-85"
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                >
                  ⚡ Send Test Push
                </button>
              </div>
            )}
          </div>

          {/* Achievements Badges Card */}
          <div className="card p-5 border" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
            <h3 className="font-black text-sm mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <Award className="w-5 h-5" style={{ color: 'var(--gold)' }} />
              Achievements & Badges
            </h3>
            
            {loadingAchievements ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="h-16 card shimmer" />
                <div className="h-16 card shimmer" />
              </div>
            ) : achievements.length === 0 ? (
              <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>No achievements defined.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {achievements.map((ach) => (
                  <div
                    key={ach.id}
                    className="flex items-center gap-3.5 p-3 rounded-2xl border transition-all"
                    style={{
                      background: ach.isUnlocked ? 'var(--gold-glow)' : 'var(--surface)',
                      borderColor: ach.isUnlocked ? 'var(--gold)' : 'var(--border)',
                      opacity: ach.isUnlocked ? 1 : 0.6,
                    }}
                  >
                    <span className={cn('text-3xl filter select-none transition-all', ach.isUnlocked ? 'drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]' : 'grayscale')}>{ach.icon}</span>
                    <div className="text-left leading-tight min-w-0">
                      <p className="text-xs font-black" style={{ color: ach.isUnlocked ? 'var(--gold)' : 'var(--text-secondary)' }}>{ach.title}</p>
                      <p className="text-[10px] truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>{ach.description}</p>
                      <span className="text-[8px] font-black uppercase tracking-wider block mt-1" style={{ color: 'var(--text-muted)' }}>+{ach.pointsAwarded} XP</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Season History timeline */}
          <div className="card p-5 border" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
            <h3 className="font-black text-sm mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <Calendar className="w-5 h-5" style={{ color: 'var(--gold)' }} />
              Tournament History
            </h3>

            {loadingHistory ? (
              <div className="h-20 card shimmer" />
            ) : history.length === 0 ? (
              <div className="text-center py-6">
                <span className="text-2xl mb-1 block select-none">🏆</span>
                <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>This is your first season! Build a team to write history.</p>
              </div>
            ) : (
              <div className="space-y-4 relative">
                {/* Timeline vertical line */}
                <div className="absolute left-6 top-2 bottom-2 w-[1px]" style={{ background: 'var(--border)' }} />
                {history.map((hist) => (
                  <div key={hist.id} className="flex gap-4 relative">
                    {/* Bullet */}
                    <div
                      className="w-12 h-12 rounded-full border flex items-center justify-center z-10 flex-shrink-0"
                      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                    >
                      <Trophy className="w-5 h-5" style={{ color: 'var(--gold)' }} />
                    </div>

                    <div className="text-left border rounded-2xl p-4 flex-1" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className="font-black text-xs" style={{ color: 'var(--text)' }}>{hist.season}</h4>
                          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Final Rank: #{hist.rank}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black" style={{ color: 'var(--gold)' }}>{hist.totalPoints} pts</p>
                          <p className="text-[9px] font-bold" style={{ color: 'var(--primary)' }}>{hist.percentile}% percentile</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          {user.isAdmin && (
            <a
              href="/admin"
              className="flex items-center justify-between rounded-2xl p-4 transition-all border hover:opacity-90"
              style={{ background: 'var(--gold-glow)', borderColor: 'var(--gold)' }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl select-none">👑</span>
                <div className="text-left">
                  <p className="font-bold text-sm" style={{ color: 'var(--gold)' }}>Admin Dashboard</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Manage matches, users, events</p>
                </div>
              </div>
              <span style={{ color: 'var(--gold)' }}>→</span>
            </a>
          )}

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border transition-all font-bold text-sm hover:opacity-95"
            style={{
              background: 'var(--accent-glow)',
              borderColor: 'var(--accent)',
              color: 'var(--accent)',
            }}
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </motion.div>
      </main>
    </div>
  );
}
