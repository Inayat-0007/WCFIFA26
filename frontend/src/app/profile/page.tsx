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
          // We don't strictly delete it from the backend here since the test routine auto-cleans 410s, 
          // but we toggle the client state.
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
    <div className="min-h-screen bg-dark-900 pb-12">
      <Navbar />
      <main className="px-4 pt-4 pb-24 md:pb-8 md:px-6 max-w-2xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Profile Card */}
          <div className="glass rounded-3xl p-6 text-center relative overflow-hidden">
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <motion.div
              className="text-7xl mb-4 cursor-pointer w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto transition-all"
              whileHover={{ scale: 1.05 }}
              onClick={() => setEditing(true)}
            >
              {user.avatar || '⚽'}
            </motion.div>
            <h1 className="text-2xl font-black text-white mb-1">{user.name}</h1>
            <p className="text-gray-500 text-sm mb-4">{user.email}</p>
            {user.isAdmin && (
              <span className="px-3 py-1 rounded-full text-xs font-bold text-gold-400 bg-gold-400/10 border border-gold-400/20">
                👑 Super Admin
              </span>
            )}

            <button
              onClick={() => { setNewName(user.name); setNewAvatar(user.avatar || '⚽'); setEditing(!editing); }}
              className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 rounded-xl text-sm font-semibold text-gray-300 glass hover:text-white transition-all"
            >
              <Edit2 className="w-4 h-4" /> Edit Profile
            </button>
          </div>

          {/* Edit Form */}
          {editing && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5">
              <h3 className="font-bold mb-4">Edit Profile</h3>
              <div className="mb-4">
                <label className="text-xs text-gray-400 mb-2 block font-bold">Name</label>
                <input value={newName} onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-dark-700 border border-dark-500 text-white text-sm focus:border-primary-500 transition-colors" />
              </div>
              <div className="mb-4">
                <label className="text-xs text-gray-400 mb-2 block font-bold">Avatar</label>
                <div className="flex flex-wrap gap-2">
                  {AVATARS.map((a) => (
                    <button key={a} onClick={() => setNewAvatar(a)}
                      className={`w-10 h-10 text-xl rounded-xl flex items-center justify-center transition-all ${newAvatar === a ? 'bg-primary-500/20 border-2 border-primary-500' : 'glass'}`}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={handleSave} disabled={saving}
                className="w-full py-2.5 rounded-xl font-bold text-white text-sm disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #DC143C, #a01030)' }}>
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
              <div key={label} className="glass rounded-2xl p-3 text-center border border-white/5">
                <div className="text-2xl mb-1">{icon}</div>
                <p className="text-xl font-black text-white">{value}</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </div>

          {/* Web Push Notifications Card */}
          <div className="glass rounded-3xl p-5 border border-white/5 relative overflow-hidden">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Bell className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h3 className="font-black text-sm text-white">Web Push Notifications</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Stay updated with live scores & match starts</p>
                </div>
              </div>
              
              {pushSupported ? (
                <button
                  onClick={handleTogglePush}
                  disabled={loadingPush}
                  className={cn(
                    'px-4 py-2 rounded-xl text-xs font-black uppercase transition-all tracking-wider',
                    subscribed 
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
                      : 'bg-primary text-[#0B0B0C]'
                  )}
                >
                  {loadingPush ? '...' : subscribed ? 'Subscribed' : 'Enable'}
                </button>
              ) : (
                <span className="text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 px-2.5 py-1 rounded-full font-bold uppercase">Unsupported</span>
              )}
            </div>

            {subscribed && (
              <div className="mt-4 pt-3 border-t border-white/5 flex justify-end">
                <button
                  onClick={handleTestPush}
                  className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs transition-all flex items-center gap-1.5"
                >
                  ⚡ Send Test Push
                </button>
              </div>
            )}
          </div>

          {/* Achievements Badges Card */}
          <div className="glass rounded-3xl p-5 border border-white/5">
            <h3 className="font-black text-sm text-white mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-gold-400" />
              Achievements & Badges
            </h3>
            
            {loadingAchievements ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="h-16 glass rounded-2xl shimmer" />
                <div className="h-16 glass rounded-2xl shimmer" />
              </div>
            ) : achievements.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No achievements defined.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {achievements.map((ach) => (
                  <div
                    key={ach.id}
                    className={cn(
                      'flex items-center gap-3.5 p-3 rounded-2xl border transition-all',
                      ach.isUnlocked
                        ? 'bg-gold-400/5 border-gold-400/20'
                        : 'bg-white/[0.01] border-white/5 opacity-55'
                    )}
                  >
                    <span className={cn('text-3xl filter select-none', ach.isUnlocked ? 'drop-shadow-[0_0_8px_rgba(255,215,0,0.3)]' : 'grayscale')}>{ach.icon}</span>
                    <div className="text-left leading-tight min-w-0">
                      <p className={cn('text-xs font-black', ach.isUnlocked ? 'text-gold-400' : 'text-gray-300')}>{ach.title}</p>
                      <p className="text-[10px] text-gray-500 truncate mt-0.5">{ach.description}</p>
                      <span className="text-[8px] font-black uppercase text-gray-400 tracking-wider block mt-1">+{ach.pointsAwarded} XP</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Season History timeline */}
          <div className="glass rounded-3xl p-5 border border-white/5">
            <h3 className="font-black text-sm text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#FFD700]" />
              Tournament History
            </h3>

            {loadingHistory ? (
              <div className="h-20 glass rounded-2xl shimmer" />
            ) : history.length === 0 ? (
              <div className="text-center py-6">
                <span className="text-2xl mb-1 block">🏆</span>
                <p className="text-xs text-gray-400 italic">This is your first season! Build a team to write history.</p>
              </div>
            ) : (
              <div className="space-y-4 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-[1px] before:bg-white/10">
                {history.map((hist) => (
                  <div key={hist.id} className="flex gap-4 relative">
                    {/* Bullet */}
                    <div className="w-12 h-12 rounded-full bg-dark-700 border border-white/10 flex items-center justify-center z-10 flex-shrink-0">
                      <Trophy className="w-5 h-5 text-gold-400" />
                    </div>

                    <div className="text-left bg-white/[0.01] border border-white/5 rounded-2xl p-4 flex-1">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className="font-black text-xs text-white">{hist.season}</h4>
                          <p className="text-[10px] text-gray-400 mt-0.5">Final Rank: #{hist.rank}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-[#FFD700]">{hist.totalPoints} pts</p>
                          <p className="text-[9px] text-emerald-400 font-bold">{hist.percentile}% percentile</p>
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
            <a href="/admin" className="flex items-center justify-between glass-gold rounded-2xl p-4 hover:bg-gold-400/10 transition-all border border-gold-400/20">
              <div className="flex items-center gap-3">
                <span className="text-2xl">👑</span>
                <div className="text-left">
                  <p className="font-bold text-gold-400 text-sm">Admin Dashboard</p>
                  <p className="text-[10px] text-gray-500">Manage matches, users, events</p>
                </div>
              </div>
              <span className="text-gray-600">→</span>
            </a>
          )}

          <button onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-primary-400 glass-red hover:bg-primary-500/10 transition-all font-bold text-sm">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </motion.div>
      </main>
    </div>
  );
}
