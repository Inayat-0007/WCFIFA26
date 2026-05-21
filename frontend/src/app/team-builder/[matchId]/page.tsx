'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { getPositionColor, getFlagByCountry, cn } from '@/lib/utils';
import api from '@/lib/api';
import type { Match, Player, Position } from '@/types';
import toast from 'react-hot-toast';

const BUDGET = 100;
const POSITION_SLOTS: Record<Position, number[]> = {
  GK: [1],
  DEF: [2, 3, 4, 5],
  MID: [6, 7, 8],
  FWD: [9, 10, 11],
};

interface SelectedPlayer extends Player {
  isCaptain?: boolean;
  isVC?: boolean;
}

export default function TeamBuilderPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  const [match, setMatch] = useState<Match | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selected, setSelected] = useState<SelectedPlayer[]>([]);
  const [captainId, setCaptainId] = useState<string>('');
  const [vcId, setVcId] = useState<string>('');
  const [filter, setFilter] = useState<Position | ''>('');
  const [search, setSearch] = useState('');
  const [showDrawer, setShowDrawer] = useState(false);
  const [saving, setSaving] = useState(false);
  const [contextPlayer, setContextPlayer] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated || !matchId) return;
    const fetchData = async () => {
      try {
        const [matchRes, playersRes, teamRes] = await Promise.allSettled([
          api.get(`/matches/${matchId}`),
          api.get(`/players/match/${matchId}`),
          api.get(`/teams/${matchId}`),
        ]);
        if (matchRes.status === 'fulfilled') setMatch(matchRes.value.data.data);
        if (playersRes.status === 'fulfilled') setPlayers(playersRes.value.data.data || []);
        if (teamRes.status === 'fulfilled' && teamRes.value.data.data) {
          const team = teamRes.value.data.data;
          const selPlayers = team.teamPlayers.map((tp: { player: Player }) => tp.player);
          setSelected(selPlayers);
          setCaptainId(team.captainId);
          setVcId(team.viceCaptainId);
        }
      } catch { } finally { setLoading(false); }
    };
    fetchData();
  }, [matchId, isAuthenticated]);

  const budgetUsed = selected.reduce((sum, p) => sum + p.price, 0);
  const budgetLeft = BUDGET - budgetUsed;
  const isLocked = match?.status === 'LIVE' || match?.status === 'COMPLETED';

  const filteredPlayers = players.filter((p) => {
    const matchesPos = !filter || p.position === filter;
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.country.toLowerCase().includes(search.toLowerCase());
    return matchesPos && matchesSearch;
  });

  const addPlayer = (player: Player) => {
    if (selected.find((s) => s.id === player.id)) return;
    if (selected.length >= 11) { toast.error('Team is full! Remove a player first.'); return; }
    if (budgetLeft < player.price) { toast.error(`Not enough budget! Need ${player.price} credits.`); return; }
    setSelected((prev) => [...prev, player]);
    if (!captainId && selected.length === 0) setCaptainId(player.id);
    if (!vcId && selected.length === 1) setVcId(player.id);
  };

  const removePlayer = (playerId: string) => {
    setSelected((prev) => prev.filter((p) => p.id !== playerId));
    if (captainId === playerId) setCaptainId('');
    if (vcId === playerId) setVcId('');
    setContextPlayer(null);
  };

  const saveTeam = async () => {
    if (selected.length !== 11) { toast.error('Select exactly 11 players!'); return; }
    if (!captainId) { toast.error('Choose a captain!'); return; }
    if (!vcId) { toast.error('Choose a vice-captain!'); return; }

    const gkCount = selected.filter((p) => p.position === 'GK').length;
    if (gkCount !== 1) { toast.error('You must have exactly 1 Goalkeeper!'); return; }

    setSaving(true);
    try {
      await api.post('/teams', {
        matchId,
        playerIds: selected.map((p) => p.id),
        captainId,
        viceCaptainId: vcId,
      });
      toast.success('Team saved! Good luck! 🏆');
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save team';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // Group selected players by position for pitch view
  const gks = selected.filter((p) => p.position === 'GK');
  const defs = selected.filter((p) => p.position === 'DEF');
  const mids = selected.filter((p) => p.position === 'MID');
  const fwds = selected.filter((p) => p.position === 'FWD');
  const emptySlots = 11 - selected.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-5xl animate-float">⚽</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />

      {/* Top Bar */}
      <div className="glass border-b border-white/5 px-4 py-3 sticky top-16 z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-xs text-gray-500">
              {match?.homeTeam} vs {match?.awayTeam}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-[10px] text-gray-500">Budget</p>
              <p className={cn('text-sm font-black', budgetLeft < 0 ? 'text-primary-400' : 'text-gold-400')}>
                {budgetLeft.toFixed(1)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-gray-500">Players</p>
              <p className={cn('text-sm font-black', selected.length === 11 ? 'text-green-400' : 'text-white')}>
                {selected.length}/11
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 pb-32 md:pb-10">
        {isLocked && (
          <div className="mt-4 p-3 rounded-xl text-center text-sm font-semibold text-primary-400 glass-red">
            🔒 Team is locked — match has started
          </div>
        )}

        {/* Football Pitch View */}
        <div className="mt-4 relative rounded-3xl overflow-hidden" style={{ minHeight: '480px' }}>
          {/* Pitch background */}
          <div className="absolute inset-0 pitch-bg" />
          {/* Pitch markings SVG */}
          <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 400 550" xmlns="http://www.w3.org/2000/svg">
            <rect x="20" y="20" width="360" height="510" fill="none" stroke="white" strokeWidth="2" />
            <line x1="20" y1="275" x2="380" y2="275" stroke="white" strokeWidth="1" />
            <circle cx="200" cy="275" r="50" fill="none" stroke="white" strokeWidth="1" />
            <rect x="100" y="20" width="200" height="80" fill="none" stroke="white" strokeWidth="1" />
            <rect x="140" y="20" width="120" height="40" fill="none" stroke="white" strokeWidth="1" />
            <rect x="100" y="450" width="200" height="80" fill="none" stroke="white" strokeWidth="1" />
            <rect x="140" y="490" width="120" height="40" fill="none" stroke="white" strokeWidth="1" />
            <circle cx="200" cy="90" r="6" fill="white" />
            <circle cx="200" cy="460" r="6" fill="white" />
            <circle cx="200" cy="275" r="4" fill="white" />
          </svg>

          {/* Players on pitch */}
          <div className="relative z-10 flex flex-col justify-between py-8 px-4 h-full min-h-[480px]">
            {/* Forwards */}
            <PitchRow players={fwds} emptyCount={Math.max(0, 3 - fwds.length)} label="FWD"
              captainId={captainId} vcId={vcId}
              onTap={(id) => setContextPlayer(contextPlayer === id ? null : id)}
              contextPlayer={contextPlayer}
              onSetCaptain={(id) => { setCaptainId(id); if (vcId === id) setVcId(''); setContextPlayer(null); }}
              onSetVC={(id) => { setVcId(id); if (captainId === id) setCaptainId(''); setContextPlayer(null); }}
              onRemove={removePlayer} onAdd={() => { setFilter('FWD'); setShowDrawer(true); }} />

            {/* Midfielders */}
            <PitchRow players={mids} emptyCount={Math.max(0, 4 - mids.length)} label="MID"
              captainId={captainId} vcId={vcId}
              onTap={(id) => setContextPlayer(contextPlayer === id ? null : id)}
              contextPlayer={contextPlayer}
              onSetCaptain={(id) => { setCaptainId(id); if (vcId === id) setVcId(''); setContextPlayer(null); }}
              onSetVC={(id) => { setVcId(id); if (captainId === id) setCaptainId(''); setContextPlayer(null); }}
              onRemove={removePlayer} onAdd={() => { setFilter('MID'); setShowDrawer(true); }} />

            {/* Defenders */}
            <PitchRow players={defs} emptyCount={Math.max(0, 4 - defs.length)} label="DEF"
              captainId={captainId} vcId={vcId}
              onTap={(id) => setContextPlayer(contextPlayer === id ? null : id)}
              contextPlayer={contextPlayer}
              onSetCaptain={(id) => { setCaptainId(id); if (vcId === id) setVcId(''); setContextPlayer(null); }}
              onSetVC={(id) => { setVcId(id); if (captainId === id) setCaptainId(''); setContextPlayer(null); }}
              onRemove={removePlayer} onAdd={() => { setFilter('DEF'); setShowDrawer(true); }} />

            {/* Goalkeeper */}
            <PitchRow players={gks} emptyCount={Math.max(0, 1 - gks.length)} label="GK"
              captainId={captainId} vcId={vcId}
              onTap={(id) => setContextPlayer(contextPlayer === id ? null : id)}
              contextPlayer={contextPlayer}
              onSetCaptain={(id) => { setCaptainId(id); if (vcId === id) setVcId(''); setContextPlayer(null); }}
              onSetVC={(id) => { setVcId(id); if (captainId === id) setCaptainId(''); setContextPlayer(null); }}
              onRemove={removePlayer} onAdd={() => { setFilter('GK'); setShowDrawer(true); }} />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => { setFilter(''); setShowDrawer(true); }}
            className="flex-1 py-3 rounded-xl font-semibold text-white glass border border-white/10 hover:border-white/20 transition-all"
          >
            + Add Players
          </button>
          <button
            onClick={saveTeam}
            disabled={saving || isLocked || selected.length !== 11 || !captainId || !vcId}
            className="flex-1 py-3 rounded-xl font-bold text-white transition-all hover:scale-[1.02] disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #DC143C, #a01030)', boxShadow: '0 4px 20px rgba(220,20,60,0.3)' }}
          >
            {saving ? 'Saving...' : 'Save Team 🏆'}
          </button>
        </div>
      </main>

      {/* Player Selection Drawer */}
      <AnimatePresence>
        {showDrawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
              onClick={() => setShowDrawer(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 max-h-[75vh] flex flex-col rounded-t-3xl"
              style={{ background: '#1A1A24', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/5">
                <div>
                  <h3 className="font-bold">Select Players</h3>
                  <p className="text-xs text-gray-500">Budget left: {budgetLeft.toFixed(1)} credits</p>
                </div>
                <button onClick={() => setShowDrawer(false)} className="p-2 rounded-xl glass">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Position Filters */}
              <div className="flex gap-2 px-4 py-3 overflow-x-auto">
                {(['', 'GK', 'DEF', 'MID', 'FWD'] as const).map((pos) => (
                  <button
                    key={pos || 'all'}
                    onClick={() => setFilter(pos)}
                    className={cn(
                      'px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all',
                      filter === pos ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : 'text-gray-400 glass'
                    )}
                  >
                    {pos || 'All'}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="px-4 pb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search players..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-dark-700 border border-dark-500 text-white text-sm placeholder-gray-600 focus:border-primary-500 transition-colors"
                  />
                </div>
              </div>

              {/* Player List */}
              <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2">
                {filteredPlayers.map((player) => {
                  const isSelected = !!selected.find((s) => s.id === player.id);
                  const canAfford = budgetLeft >= player.price;
                  return (
                    <div
                      key={player.id}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl transition-all',
                        isSelected ? 'bg-primary-500/10 border border-primary-500/30' : 'glass'
                      )}
                    >
                      <div className="text-2xl">{getFlagByCountry(player.country)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{player.name}</p>
                        <p className="text-xs text-gray-500">{player.country}</p>
                      </div>
                      <span className={cn('text-xs px-2 py-0.5 rounded-lg font-semibold border', getPositionColor(player.position))}>
                        {player.position}
                      </span>
                      <span className="text-xs font-bold text-gold-400 w-10 text-right">{player.price}</span>
                      <button
                        onClick={() => isSelected ? removePlayer(player.id) : addPlayer(player)}
                        disabled={!isSelected && (!canAfford || selected.length >= 11)}
                        className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all',
                          isSelected
                            ? 'bg-primary-500/20 text-primary-400 hover:bg-primary-500/30'
                            : canAfford && selected.length < 11
                              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                              : 'bg-dark-600 text-gray-600 cursor-not-allowed'
                        )}
                      >
                        {isSelected ? '−' : '+'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Pitch Row Component
function PitchRow({ players, emptyCount, label, captainId, vcId, onTap, contextPlayer, onSetCaptain, onSetVC, onRemove, onAdd }: {
  players: SelectedPlayer[]; emptyCount: number; label: string;
  captainId: string; vcId: string; contextPlayer: string | null;
  onTap: (id: string) => void; onSetCaptain: (id: string) => void;
  onSetVC: (id: string) => void; onRemove: (id: string) => void; onAdd: () => void;
}) {
  return (
    <div className="flex justify-center gap-3 flex-wrap">
      {players.map((player) => (
        <div key={player.id} className="flex flex-col items-center relative">
          <button
            onClick={() => onTap(player.id)}
            className="w-14 h-14 rounded-xl flex flex-col items-center justify-center text-xs font-bold relative"
            style={{ background: 'rgba(0,0,0,0.6)', border: '2px solid rgba(255,255,255,0.2)' }}
          >
            <span className="text-lg">{getFlagByCountry(player.country)}</span>
            {captainId === player.id && (
              <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gold-400 flex items-center justify-center text-[10px] font-black text-dark-900">C</div>
            )}
            {vcId === player.id && (
              <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-[10px] font-black text-dark-900">V</div>
            )}
          </button>
          <p className="text-[9px] text-white font-semibold mt-1 max-w-[56px] text-center truncate">
            {player.name.split(' ').pop()}
          </p>
          <p className="text-[9px] text-gold-400">{player.price}</p>

          {/* Context menu */}
          {contextPlayer === player.id && (
            <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 z-20 rounded-xl p-2 flex flex-col gap-1 min-w-[120px]"
              style={{ background: '#222230', border: '1px solid rgba(255,255,255,0.15)' }}>
              <button onClick={() => onSetCaptain(player.id)} className="text-[11px] text-gold-400 hover:text-gold-300 px-2 py-1 rounded text-left">👑 Set Captain</button>
              <button onClick={() => onSetVC(player.id)} className="text-[11px] text-gray-300 hover:text-white px-2 py-1 rounded text-left">⭐ Set Vice-Cap</button>
              <button onClick={() => onRemove(player.id)} className="text-[11px] text-primary-400 hover:text-primary-300 px-2 py-1 rounded text-left">✕ Remove</button>
            </div>
          )}
        </div>
      ))}
      {[...Array(Math.max(0, emptyCount))].map((_, i) => (
        <button key={i} onClick={onAdd}
          className="w-14 h-14 rounded-xl flex items-center justify-center text-xl text-gray-600 hover:text-gray-400 transition-colors"
          style={{ background: 'rgba(0,0,0,0.4)', border: '2px dashed rgba(255,255,255,0.15)' }}>
          +
        </button>
      ))}
    </div>
  );
}
