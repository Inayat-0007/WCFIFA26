'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Copy, ChevronRight, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import api from '@/lib/api';
import type { League } from '@/types';
import toast from 'react-hot-toast';

export default function LeaguesPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [newLeagueName, setNewLeagueName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [createdCode, setCreatedCode] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    api.get('/leagues').then((res) => setLeagues(res.data.data || [])).finally(() => setLoading(false));
  }, [isAuthenticated]);

  const createLeague = async () => {
    if (!newLeagueName.trim()) { toast.error('Enter a league name'); return; }
    setSaving(true);
    try {
      const res = await api.post('/leagues', { name: newLeagueName });
      const league = res.data.data;
      setLeagues((prev) => [league, ...prev]);
      setCreatedCode(league.inviteCode);
      setNewLeagueName('');
      toast.success('League created! 🏆');
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create league');
    } finally { setSaving(false); }
  };

  const joinLeague = async () => {
    if (!joinCode.trim()) { toast.error('Enter an invite code'); return; }
    setSaving(true);
    try {
      const res = await api.post('/leagues/join', { inviteCode: joinCode.trim().toUpperCase() });
      setLeagues((prev) => [res.data.data, ...prev]);
      setShowJoin(false);
      setJoinCode('');
      toast.success('Joined league! ⚽');
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Invalid invite code');
    } finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Stadium Light Rays */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      <Navbar />
      <main className="px-4 pt-6 pb-24 md:pb-8 md:px-6 max-w-2xl mx-auto relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-black tracking-tight mb-1">
                <span className="gradient-text">My Leagues</span>
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Compete with your friends
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowJoin(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-200 hover:scale-105"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-secondary)',
                }}
              >
                Join
              </button>
              <button
                onClick={() => { setShowCreate(true); setCreatedCode(''); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:scale-105 duration-200"
                style={{
                  background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                  boxShadow: '0 4px 12px var(--primary-glow)',
                }}
              >
                <Plus className="w-3.5 h-3.5" /> Create
              </button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card h-20 shimmer" />
              ))}
            </div>
          ) : leagues.length === 0 ? (
            <div className="text-center py-20 card" style={{ background: 'var(--card-bg)' }}>
              <div className="text-5xl mb-4 animate-bounce">🏆</div>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                No leagues yet!
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Create a league or join with an invite code
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {leagues.map((league, i) => (
                <motion.a
                  key={league.id}
                  href={`/leagues/${league.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-4 card p-4 hover:translate-y-[-2px] transition-all duration-200 block"
                  style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border"
                    style={{
                      background: 'var(--primary-glow)',
                      borderColor: 'var(--border)',
                    }}
                  >
                    🏆
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate" style={{ color: 'var(--text)' }}>
                      {league.name}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {league._count?.members || 0} / {league.maxMembers} members
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                </motion.a>
              ))}
            </div>
          )}
        </motion.div>
      </main>

      {/* Create League Modal */}
      <AnimatePresence>
        {showCreate && (
          <Modal onClose={() => setShowCreate(false)} title="Create League">
            {createdCode ? (
              <div className="text-center">
                <div className="text-4xl mb-3">🎉</div>
                <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
                  League created! Share this code:
                </p>
                <div
                  className="flex items-center gap-2 rounded-xl p-4 mb-4 border"
                  style={{ background: 'var(--gold-glow)', borderColor: 'var(--gold)' }}
                >
                  <span className="flex-1 text-2xl font-black tracking-widest text-center" style={{ color: 'var(--gold)' }}>
                    {createdCode}
                  </span>
                  <button onClick={() => { navigator.clipboard.writeText(createdCode); toast.success('Copied!'); }}>
                    <Copy className="w-5 h-5" style={{ color: 'var(--gold)' }} />
                  </button>
                </div>
                <button
                  onClick={() => setShowCreate(false)}
                  className="w-full py-3 rounded-xl font-bold text-white transition-all duration-200 hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))' }}
                >
                  Done 🏆
                </button>
              </div>
            ) : (
              <>
                <input
                  value={newLeagueName}
                  onChange={(e) => setNewLeagueName(e.target.value)}
                  placeholder="League name (e.g. 'The Champions')"
                  className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 mb-4 transition-all"
                  style={{
                    background: 'var(--input-bg)',
                    borderColor: 'var(--input-border)',
                    color: 'var(--text)',
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && createLeague()}
                />
                <button
                  onClick={createLeague}
                  disabled={saving}
                  className="w-full py-3 rounded-xl font-bold text-white transition-all duration-200 hover:opacity-90 disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))' }}
                >
                  {saving ? 'Creating...' : 'Create League'}
                </button>
              </>
            )}
          </Modal>
        )}
      </AnimatePresence>

      {/* Join League Modal */}
      <AnimatePresence>
        {showJoin && (
          <Modal onClose={() => setShowJoin(false)} title="Join League">
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              Enter the 6-character invite code from your friend
            </p>
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="e.g. ABC123"
              maxLength={6}
              className="w-full px-4 py-3 rounded-xl border text-sm text-center tracking-widest font-mono text-lg uppercase focus:outline-none focus:ring-1 focus:ring-emerald-500 mb-4 transition-all"
              style={{
                background: 'var(--input-bg)',
                borderColor: 'var(--input-border)',
                color: 'var(--text)',
              }}
              onKeyDown={(e) => e.key === 'Enter' && joinLeague()}
            />
            <button
              onClick={joinLeague}
              disabled={saving}
              className="w-full py-3 rounded-xl font-bold text-white transition-all duration-200 hover:opacity-90 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))' }}
            >
              {saving ? 'Joining...' : 'Join League ⚽'}
            </button>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

function Modal({ children, title, onClose }: { children: React.ReactNode; title: string; onClose: () => void }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm mx-4 card p-6"
        style={{ background: 'var(--card-bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:opacity-85">
            <X className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>
        {children}
      </motion.div>
    </>
  );
}
