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
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <main className="px-4 pt-4 pb-24 md:pb-8 md:px-6 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-black gradient-text">My Leagues</h1>
              <p className="text-gray-500 text-sm">Compete with your friends</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowJoin(true)}
                className="px-3 py-2 rounded-xl text-sm font-semibold text-gray-300 glass hover:text-white transition-all">
                Join
              </button>
              <button onClick={() => { setShowCreate(true); setCreatedCode(''); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #DC143C, #a01030)' }}>
                <Plus className="w-4 h-4" /> Create
              </button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="glass rounded-2xl h-20 shimmer" />)}
            </div>
          ) : leagues.length === 0 ? (
            <div className="text-center py-16 glass rounded-3xl">
              <div className="text-5xl mb-4">🏆</div>
              <p className="text-gray-400 mb-2">No leagues yet!</p>
              <p className="text-gray-600 text-sm">Create a league or join with an invite code</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leagues.map((league, i) => (
                <motion.a
                  key={league.id}
                  href={`/leagues/${league.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 glass rounded-2xl p-4 card-hover block"
                >
                  <div className="w-12 h-12 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-2xl">
                    🏆
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-white">{league.name}</p>
                    <p className="text-xs text-gray-500">{league._count?.members || 0}/{league.maxMembers} members</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-600" />
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
                <p className="text-gray-400 text-sm mb-4">League created! Share this code:</p>
                <div className="flex items-center gap-2 glass-gold rounded-xl p-4 mb-4">
                  <span className="flex-1 text-2xl font-black tracking-widest text-gold-400 text-center">{createdCode}</span>
                  <button onClick={() => { navigator.clipboard.writeText(createdCode); toast.success('Copied!'); }}>
                    <Copy className="w-5 h-5 text-gold-400" />
                  </button>
                </div>
                <button onClick={() => setShowCreate(false)} className="w-full py-3 rounded-xl font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #DC143C, #a01030)' }}>
                  Done 🏆
                </button>
              </div>
            ) : (
              <>
                <input
                  value={newLeagueName}
                  onChange={(e) => setNewLeagueName(e.target.value)}
                  placeholder="League name (e.g. 'The Champions')"
                  className="w-full px-4 py-3 rounded-xl bg-dark-700 border border-dark-500 text-white placeholder-gray-600 focus:border-primary-500 mb-4 text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && createLeague()}
                />
                <button onClick={createLeague} disabled={saving}
                  className="w-full py-3 rounded-xl font-bold text-white disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #DC143C, #a01030)' }}>
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
            <p className="text-gray-500 text-sm mb-4">Enter the 6-character invite code from your friend</p>
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="e.g. ABC123"
              maxLength={6}
              className="w-full px-4 py-3 rounded-xl bg-dark-700 border border-dark-500 text-white placeholder-gray-600 focus:border-primary-500 mb-4 text-sm text-center tracking-widest font-mono text-lg uppercase"
              onKeyDown={(e) => e.key === 'Enter' && joinLeague()}
            />
            <button onClick={joinLeague} disabled={saving}
              className="w-full py-3 rounded-xl font-bold text-white disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #DC143C, #a01030)' }}>
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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm mx-4 glass rounded-3xl p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/5"><X className="w-4 h-4 text-gray-400" /></button>
        </div>
        {children}
      </motion.div>
    </>
  );
}
