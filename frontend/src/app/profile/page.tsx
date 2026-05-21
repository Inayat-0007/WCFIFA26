'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Edit2, LogOut, Trophy, Users, Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const AVATARS = ['⚽', '🏆', '🥅', '⭐', '🦁', '🐉', '🦅', '🔥', '💫', '🎯'];

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading, logout, updateProfile } = useAuth();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAvatar, setNewAvatar] = useState('');
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ leagues: 0, teams: 0 });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    api.get('/auth/me').then((res) => {
      const data = res.data.data;
      setStats({ leagues: data._count?.memberships || 0, teams: data._count?.fantasyTeams || 0 });
    });
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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <main className="px-4 pt-4 pb-24 md:pb-8 md:px-6 max-w-md mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Profile Card */}
          <div className="glass rounded-3xl p-6 text-center mb-6">
            <motion.div
              className="text-7xl mb-4 cursor-pointer"
              whileHover={{ scale: 1.1 }}
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
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5 mb-6">
              <h3 className="font-bold mb-4">Edit Profile</h3>
              <div className="mb-4">
                <label className="text-xs text-gray-400 mb-2 block">Name</label>
                <input value={newName} onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-dark-700 border border-dark-500 text-white text-sm focus:border-primary-500 transition-colors" />
              </div>
              <div className="mb-4">
                <label className="text-xs text-gray-400 mb-2 block">Avatar</label>
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

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Total Points', value: user.totalPoints, icon: '⭐' },
              { label: 'Leagues', value: stats.leagues, icon: '🏆' },
              { label: 'Teams Built', value: stats.teams, icon: '⚽' },
            ].map(({ label, value, icon }) => (
              <div key={label} className="glass rounded-2xl p-3 text-center">
                <div className="text-2xl mb-1">{icon}</div>
                <p className="text-xl font-black gradient-text-gold">{value}</p>
                <p className="text-[10px] text-gray-500">{label}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          {user.isAdmin && (
            <a href="/admin" className="flex items-center justify-between glass-gold rounded-2xl p-4 mb-3 hover:bg-gold-400/10 transition-all">
              <div className="flex items-center gap-3">
                <span className="text-2xl">👑</span>
                <div>
                  <p className="font-bold text-gold-400">Admin Dashboard</p>
                  <p className="text-xs text-gray-500">Manage matches, users, events</p>
                </div>
              </div>
              <span className="text-gray-600">→</span>
            </a>
          )}

          <button onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-primary-400 glass-red hover:bg-primary-500/10 transition-all font-semibold">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </motion.div>
      </main>
    </div>
  );
}
