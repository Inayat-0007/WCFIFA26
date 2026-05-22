'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, X, Sparkles, Trophy, Trash2, HelpCircle, CheckCircle2, RotateCcw, Info } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/ui/Navbar';
import { getPositionColor, getFlagByCountry, cn } from '@/lib/utils';
import api from '@/lib/api';
import type { Match, Player, Position } from '@/types';
import toast from 'react-hot-toast';

const BUDGET = 100;

type Formation = '4-4-2' | '4-3-3' | '3-5-2' | '3-4-3' | '5-3-2';

const FORMATIONS: Record<Formation, { GK: number; DEF: number; MID: number; FWD: number }> = {
  '4-4-2': { GK: 1, DEF: 4, MID: 4, FWD: 2 },
  '4-3-3': { GK: 1, DEF: 4, MID: 3, FWD: 3 },
  '3-5-2': { GK: 1, DEF: 3, MID: 5, FWD: 2 },
  '3-4-3': { GK: 1, DEF: 3, MID: 4, FWD: 3 },
  '5-3-2': { GK: 1, DEF: 5, MID: 3, FWD: 2 },
};

interface SelectedPlayer extends Player {
  isCaptain?: boolean;
  isVC?: boolean;
}

// Synthesize UI sounds using Web Audio API
const playSound = (type: 'tick' | 'success' | 'remove' | 'pop') => {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'tick') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'pop') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(280, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'success') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'remove') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    }
  } catch (e) {
    // Audio context failed or blocked by autoplay
  }
};

// Deterministic player stats generator
const getPlayerStats = (player: Player) => {
  let hash = 0;
  for (let i = 0; i < player.name.length; i++) {
    hash = player.name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const form = 6.0 + (Math.abs(hash % 38) / 10);
  const selectedBy = 5 + (Math.abs(hash % 88));
  return { form: form.toFixed(1), selectedBy: `${selectedBy}%` };
};

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
  const [loading, setLoading] = useState(true);
  const [formation, setFormation] = useState<Formation>('4-4-2');
  const [showCeremonyModal, setShowCeremonyModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);


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

          // Attempt to match saved team structure to a valid formation
          const defsCount = selPlayers.filter((p: Player) => p.position === 'DEF').length;
          const midsCount = selPlayers.filter((p: Player) => p.position === 'MID').length;
          const fwdsCount = selPlayers.filter((p: Player) => p.position === 'FWD').length;
          const formStr = `${defsCount}-${midsCount}-${fwdsCount}` as Formation;
          if (FORMATIONS[formStr]) {
            setFormation(formStr);
          }
        }
      } catch { } finally { setLoading(false); }
    };
    fetchData();
  }, [matchId, isAuthenticated]);

  const budgetUsed = selected.reduce((sum, p) => sum + p.price, 0);
  const budgetLeft = BUDGET - budgetUsed;
  const isLocked = match?.status === 'LIVE' || match?.status === 'COMPLETED';

  // Compute team splits
  const homeCount = selected.filter((p) => p.country === match?.homeTeam).length;
  const awayCount = selected.filter((p) => p.country === match?.awayTeam).length;

  const filteredPlayers = players.filter((p) => {
    const matchesPos = !filter || p.position === filter;
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.country.toLowerCase().includes(search.toLowerCase());
    return matchesPos && matchesSearch;
  });

  const addPlayer = (player: Player) => {
    if (selected.find((s) => s.id === player.id)) return;
    
    const limits = FORMATIONS[formation];
    const currentPosCount = selected.filter((s) => s.position === player.position).length;

    if (selected.length >= 11) {
      toast.error('Team is full! Remove a player first.');
      return;
    }

    if (currentPosCount >= limits[player.position]) {
      toast.error(`Formation limit reached for ${player.position}! Swap formation or remove a ${player.position}.`);
      return;
    }

    if (budgetLeft < player.price) {
      toast.error(`Budget exceeded! Need ${player.price} credits.`);
      return;
    }

    playSound('pop');
    setSelected((prev) => [...prev, player]);
  };

  const removePlayer = (playerId: string) => {
    playSound('remove');
    setSelected((prev) => prev.filter((p) => p.id !== playerId));
    if (captainId === playerId) setCaptainId('');
    if (vcId === playerId) setVcId('');
  };

  const changeFormation = (newForm: Formation) => {
    playSound('tick');
    const limits = FORMATIONS[newForm];
    
    // Check if we exceed limits
    const gks = selected.filter(p => p.position === 'GK');
    const defs = selected.filter(p => p.position === 'DEF');
    const mids = selected.filter(p => p.position === 'MID');
    const fwds = selected.filter(p => p.position === 'FWD');

    const newGks = gks.slice(0, limits.GK);
    const newDefs = defs.slice(0, limits.DEF);
    const newMids = mids.slice(0, limits.MID);
    const newFwds = fwds.slice(0, limits.FWD);

    const adjusted = [...newGks, ...newDefs, ...newMids, ...newFwds];
    const removedCount = selected.length - adjusted.length;
    
    if (removedCount > 0) {
      toast(`Adjusted team to fit ${newForm} formation. Removed ${removedCount} player(s).`, { icon: '🔄' });
    }
    
    setSelected(adjusted);
    setFormation(newForm);
  };

  const openSaveCeremony = () => {
    if (selected.length !== 11) {
      toast.error('Select exactly 11 players first!');
      return;
    }
    const gkCount = selected.filter((p) => p.position === 'GK').length;
    if (gkCount !== 1) {
      toast.error('Your team must contain exactly 1 Goalkeeper!');
      return;
    }
    playSound('success');
    setShowCeremonyModal(true);
  };

  const submitTeam = async () => {
    if (!captainId || !vcId) {
      toast.error('You must choose a Captain & Vice-Captain!');
      return;
    }
    setSaving(true);
    try {
      await api.post('/teams', {
        matchId,
        playerIds: selected.map((p) => p.id),
        captainId,
        viceCaptainId: vcId,
      });
      toast.success('Fantasy Squad Saved Successfully! 🏆');
      router.push(`/matches/${matchId}?tab=squad`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save team';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const getPositionPlayers = (pos: Position) => {
    return selected.filter((p) => p.position === pos);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="text-5xl animate-bounce">⚽</div>
      </div>
    );
  }

  // Budget color scheme
  const budgetPercent = (budgetUsed / BUDGET) * 100;
  const budgetColor = budgetLeft < 0 
    ? 'bg-gradient-to-r from-red-600 to-rose-500 shadow-[0_0_10px_rgba(220,38,38,0.5)]'
    : budgetLeft < 10 
      ? 'bg-gradient-to-r from-amber-500 to-red-500' 
      : 'bg-gradient-to-r from-[#DC143C] to-[#FFD700]';

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <Navbar />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 pt-4 pb-24">
        
        {/* Top Header stats bar */}
        <div className="glass rounded-2xl p-4 border border-white/5 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getFlagByCountry(match?.homeTeam || '')}</span>
            <div className="text-left">
              <h2 className="font-bold text-sm leading-tight md:text-base">{match?.homeTeam} vs {match?.awayTeam}</h2>
              <p className="text-xs text-gray-400">WC 2026 Group Stage</p>
            </div>
            <span className="text-2xl">{getFlagByCountry(match?.awayTeam || '')}</span>
          </div>

          {/* Stats Badges */}
          <div className="flex flex-wrap items-center gap-3 md:gap-6">
            <div className="text-center px-3 py-1 bg-white/5 rounded-xl border border-white/5">
              <p className="text-[10px] text-gray-400">Players Selected</p>
              <p className="text-sm font-black text-white">{selected.length}/11</p>
            </div>
            <div className="text-center px-3 py-1 bg-white/5 rounded-xl border border-white/5">
              <p className="text-[10px] text-gray-400">Balance (H:A)</p>
              <p className="text-sm font-black text-[#FFD700]">
                {homeCount} : {awayCount}
              </p>
            </div>
            <div className="text-center px-3 py-1 bg-white/5 rounded-xl border border-white/5">
              <p className="text-[10px] text-gray-400">Credits Remaining</p>
              <p className={cn('text-sm font-black transition-colors', budgetLeft < 0 ? 'text-red-500 animate-pulse' : 'text-[#FFD700]')}>
                {budgetLeft.toFixed(1)} / 100
              </p>
            </div>
          </div>
        </div>

        {/* Live Budget progress bar */}
        <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden mb-6 border border-white/5">
          <motion.div 
            className={cn('h-full rounded-full transition-all duration-300', budgetColor)} 
            style={{ width: `${Math.min(100, budgetPercent)}%` }}
            layout
          />
        </div>

        {/* Split view Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: PITCH & CONTROLS */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            
            {/* Formation switcher */}
            <div className="flex items-center justify-between p-3 glass rounded-2xl border border-white/5">
              <span className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#FFD700]" /> Select Formation:
              </span>
              <div className="flex gap-1">
                {(['4-4-2', '4-3-3', '3-5-2', '3-4-3', '5-3-2'] as Formation[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => changeFormation(f)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-bold transition-all border',
                      formation === f 
                        ? 'bg-[#DC143C]/20 border-[#DC143C] text-white' 
                        : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Pitch graphic container */}
            <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl" style={{ minHeight: '520px' }}>
              <div className="absolute inset-0 pitch-bg opacity-90" />
              
              {/* Glowing Red Vignette on Drag */}
              <div className={cn(
                "absolute inset-0 border-2 transition-all duration-300 pointer-events-none z-20 rounded-3xl",
                isDragging ? "border-red-500/50 shadow-[inset_0_0_40px_rgba(239,68,68,0.25)]" : "border-transparent"
              )} />

              {/* Pitch Markings */}
              <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" viewBox="0 0 400 550" xmlns="http://www.w3.org/2000/svg">
                <rect x="15" y="15" width="370" height="520" fill="none" stroke="white" strokeWidth="2.5" />
                <line x1="15" y1="275" x2="385" y2="275" stroke="white" strokeWidth="2" />
                <circle cx="200" cy="275" r="50" fill="none" stroke="white" strokeWidth="1.5" />
                <rect x="90" y="15" width="220" height="90" fill="none" stroke="white" strokeWidth="1.5" />
                <rect x="135" y="15" width="130" height="40" fill="none" stroke="white" strokeWidth="1.5" />
                <rect x="90" y="445" width="220" height="90" fill="none" stroke="white" strokeWidth="1.5" />
                <rect x="135" y="495" width="130" height="40" fill="none" stroke="white" strokeWidth="1.5" />
                <circle cx="200" cy="80" r="5" fill="white" />
                <circle cx="200" cy="470" r="5" fill="white" />
                <circle cx="200" cy="275" r="4.5" fill="white" />
              </svg>

              {/* Autodetect / Active Formation Badge */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-black/60 px-3 py-1 rounded-full border border-white/10 backdrop-blur-md">
                <p className="text-[10px] font-black tracking-widest text-[#FFD700] uppercase">
                  {selected.length === 11 ? `Squad Formation: ${formation}` : `Building: ${selected.length} / 11 Players`}
                </p>
              </div>

              {/* DRAG TO REMOVE DECAL */}
              <div className="absolute bottom-3 left-3 text-[9px] text-gray-500 font-semibold uppercase flex items-center gap-1">
                <Info className="w-3 h-3 text-[#DC143C]" /> Drag jersey off pitch to discard
              </div>

              {/* Drag Trash Zone HUD */}
              <AnimatePresence>
                {isDragging && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, x: '-50%' }}
                    animate={{ opacity: 1, y: 0, x: '-50%' }}
                    exit={{ opacity: 0, y: 15, x: '-50%' }}
                    className="absolute bottom-6 left-1/2 z-30 bg-red-600/90 backdrop-blur-md px-6 py-2 rounded-2xl border border-red-500 shadow-[0_4px_25px_rgba(220,38,38,0.5)] flex items-center gap-2 text-xs font-black text-white pointer-events-none uppercase tracking-widest"
                  >
                    <Trash2 className="w-4 h-4 animate-bounce" />
                    Drop here or drag off pitch to discard
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Rows inside Pitch */}
              <div className="relative z-10 flex flex-col justify-between py-12 px-4 h-full min-h-[520px]">
                
                {/* Forwards (FWD) */}
                <PitchRow 
                  players={getPositionPlayers('FWD')} 
                  limit={FORMATIONS[formation].FWD}
                  position="FWD"
                  onRemove={removePlayer}
                  onAdd={() => { setFilter('FWD'); setShowDrawer(true); }}
                  captainId={captainId}
                  vcId={vcId}
                  homeTeam={match?.homeTeam || ''}
                  awayTeam={match?.awayTeam || ''}
                  onDragStart={() => setIsDragging(true)}
                  onDragEnd={() => setIsDragging(false)}
                />

                {/* Midfielders (MID) */}
                <PitchRow 
                  players={getPositionPlayers('MID')} 
                  limit={FORMATIONS[formation].MID}
                  position="MID"
                  onRemove={removePlayer}
                  onAdd={() => { setFilter('MID'); setShowDrawer(true); }}
                  captainId={captainId}
                  vcId={vcId}
                  homeTeam={match?.homeTeam || ''}
                  awayTeam={match?.awayTeam || ''}
                  onDragStart={() => setIsDragging(true)}
                  onDragEnd={() => setIsDragging(false)}
                />

                {/* Defenders (DEF) */}
                <PitchRow 
                  players={getPositionPlayers('DEF')} 
                  limit={FORMATIONS[formation].DEF}
                  position="DEF"
                  onRemove={removePlayer}
                  onAdd={() => { setFilter('DEF'); setShowDrawer(true); }}
                  captainId={captainId}
                  vcId={vcId}
                  homeTeam={match?.homeTeam || ''}
                  awayTeam={match?.awayTeam || ''}
                  onDragStart={() => setIsDragging(true)}
                  onDragEnd={() => setIsDragging(false)}
                />

                {/* Goalkeeper (GK) */}
                <PitchRow 
                  players={getPositionPlayers('GK')} 
                  limit={FORMATIONS[formation].GK}
                  position="GK"
                  onRemove={removePlayer}
                  onAdd={() => { setFilter('GK'); setShowDrawer(true); }}
                  captainId={captainId}
                  vcId={vcId}
                  homeTeam={match?.homeTeam || ''}
                  awayTeam={match?.awayTeam || ''}
                  onDragStart={() => setIsDragging(true)}
                  onDragEnd={() => setIsDragging(false)}
                />

              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => { setSelected([]); setCaptainId(''); setVcId(''); playSound('remove'); }}
                disabled={selected.length === 0}
                className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-4 h-4" /> Reset
              </button>

              <button
                onClick={() => { setFilter(''); setShowDrawer(true); }}
                className="flex-1 lg:hidden py-3 rounded-2xl font-semibold bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all text-center"
              >
                + Browse Selection
              </button>

              <button
                onClick={openSaveCeremony}
                disabled={selected.length !== 11 || budgetLeft < 0 || isLocked}
                className={cn(
                  'flex-1 py-3 rounded-2xl font-black tracking-wide text-white transition-all transform hover:scale-[1.01] hover:brightness-115 active:scale-[0.99] disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed text-center'
                )}
                style={{
                  background: 'linear-gradient(135deg, #DC143C, #8B0000)',
                  boxShadow: selected.length === 11 && budgetLeft >= 0 ? '0 4px 20px rgba(220, 20, 60, 0.4)' : 'none',
                }}
              >
                {isLocked ? 'Match Locked' : selected.length === 11 ? 'Save & Assign Captains 👑' : `Select ${11 - selected.length} more player(s)`}
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: DESKTOP PLAYER LIST PANEL */}
          <div className="hidden lg:flex lg:col-span-5 flex-col max-h-[660px] glass rounded-3xl border border-white/5 p-4 overflow-hidden">
            <h3 className="font-extrabold text-base flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-[#FFD700]" /> Select Player Pool
            </h3>
            
            {/* Tab Filters */}
            <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
              {(['', 'GK', 'DEF', 'MID', 'FWD'] as const).map((pos) => (
                <button
                  key={pos || 'all'}
                  onClick={() => { setFilter(pos); playSound('tick'); }}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-bold transition-all border whitespace-nowrap',
                    filter === pos 
                      ? 'bg-[#DC143C]/20 border-[#DC143C] text-white' 
                      : 'bg-white/5 border-transparent text-gray-400 hover:text-white'
                  )}
                >
                  {pos || 'All Positions'}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search player or team name..."
                className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/5 rounded-xl text-xs placeholder-gray-500 focus:border-[#DC143C]/50 transition-colors"
              />
            </div>

            {/* List Header */}
            <div className="flex items-center justify-between text-[10px] text-gray-500 font-extrabold uppercase px-2 mb-1.5">
              <span>Player Info</span>
              <div className="flex gap-4">
                <span className="w-12 text-center">Form</span>
                <span className="w-12 text-center">Credits</span>
                <span className="w-8"></span>
              </div>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {filteredPlayers.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-xs">No players match the search filters.</div>
              ) : (
                filteredPlayers.map((player) => {
                  const isSelected = !!selected.find((s) => s.id === player.id);
                  const canAfford = budgetLeft >= player.price;
                  const stats = getPlayerStats(player);
                  return (
                    <motion.div
                      key={player.id}
                      className={cn(
                        'flex items-center justify-between p-2.5 rounded-xl border transition-all hover:bg-white/5',
                        isSelected 
                          ? 'bg-[#DC143C]/10 border-[#DC143C]/30' 
                          : 'bg-white/[0.02] border-white/5'
                      )}
                      layoutId={`player-card-${player.id}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-2xl select-none">{getFlagByCountry(player.country)}</span>
                        <div className="min-w-0 leading-tight">
                          <p className="font-bold text-xs truncate">{player.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={cn('text-[9px] px-1 rounded font-bold border uppercase', getPositionColor(player.position))}>
                              {player.position}
                            </span>
                            <span className="text-[10px] text-gray-400">{player.country}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-xs font-semibold text-green-400 w-12 text-center">⭐ {stats.form}</span>
                        <span className="text-xs font-black text-[#FFD700] w-12 text-center">{player.price}</span>
                        <button
                          onClick={() => isSelected ? removePlayer(player.id) : addPlayer(player)}
                          disabled={!isSelected && (!canAfford || selected.length >= 11)}
                          className={cn(
                            'w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold border transition-all',
                            isSelected
                              ? 'bg-[#DC143C]/20 border-[#DC143C]/50 text-[#DC143C] hover:bg-[#DC143C]/30'
                              : canAfford && selected.length < 11
                                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30'
                                : 'bg-white/5 border-transparent text-gray-600 cursor-not-allowed'
                          )}
                        >
                          {isSelected ? '−' : '+'}
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* List footer */}
            <div className="mt-3 pt-2.5 border-t border-white/5 text-center text-[10px] text-gray-500 flex justify-between items-center px-1">
              <span>FIFA Pool: {players.length} players available</span>
              <span>Need 1 GK, max 11 players</span>
            </div>
          </div>

        </div>

      </main>

      {/* MOBILE DRAWER PORTAL */}
      <AnimatePresence>
        {showDrawer && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm lg:hidden"
              onClick={() => setShowDrawer(false)}
            />
            {/* Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="fixed bottom-0 left-0 right-0 z-50 max-h-[75vh] flex flex-col rounded-t-3xl border-t border-white/10 lg:hidden"
              style={{ background: '#0F0F15' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/5">
                <div>
                  <h3 className="font-black text-sm">Select Squad Member</h3>
                  <p className="text-[10px] text-gray-400">Budget Remaining: {budgetLeft.toFixed(1)} credits</p>
                </div>
                <button onClick={() => setShowDrawer(false)} className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Filters */}
              <div className="flex gap-1.5 px-4 py-2 overflow-x-auto pb-3">
                {(['', 'GK', 'DEF', 'MID', 'FWD'] as const).map((pos) => (
                  <button
                    key={pos || 'all'}
                    onClick={() => { setFilter(pos); playSound('tick'); }}
                    className={cn(
                      'px-3 py-1 rounded-xl text-xs font-bold border transition-all whitespace-nowrap',
                      filter === pos 
                        ? 'bg-[#DC143C]/20 border-[#DC143C] text-white' 
                        : 'bg-white/5 border-transparent text-gray-400 hover:text-white'
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
                    placeholder="Search name or country..."
                    className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/5 rounded-xl text-xs placeholder-gray-500"
                  />
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-2">
                {filteredPlayers.map((player) => {
                  const isSelected = !!selected.find((s) => s.id === player.id);
                  const canAfford = budgetLeft >= player.price;
                  const stats = getPlayerStats(player);
                  return (
                    <div
                      key={player.id}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-xl border transition-all',
                        isSelected 
                          ? 'bg-[#DC143C]/10 border-[#DC143C]/30' 
                          : 'bg-white/[0.02] border-white/5'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getFlagByCountry(player.country)}</span>
                        <div>
                          <p className="font-bold text-xs">{player.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={cn('text-[9px] px-1 rounded font-bold border uppercase', getPositionColor(player.position))}>
                              {player.position}
                            </span>
                            <span className="text-[10px] text-gray-400">{player.country}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-green-400 font-bold">⭐ {stats.form}</span>
                        <span className="text-xs font-black text-[#FFD700]">{player.price}</span>
                        <button
                          onClick={() => isSelected ? removePlayer(player.id) : addPlayer(player)}
                          disabled={!isSelected && (!canAfford || selected.length >= 11)}
                          className={cn(
                            'w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold border',
                            isSelected
                              ? 'bg-[#DC143C]/20 border-[#DC143C]/50 text-[#DC143C]'
                              : canAfford && selected.length < 11
                                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                : 'bg-white/5 border-transparent text-gray-600 cursor-not-allowed'
                          )}
                        >
                          {isSelected ? '−' : '+'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* CEREMONIAL CAPTAINCY MODAL */}
      <AnimatePresence>
        {showCeremonyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setShowCeremonyModal(false)}
            />

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="relative w-full max-w-xl glass border border-white/10 rounded-3xl p-6 overflow-hidden flex flex-col max-h-[85vh] z-50"
              style={{ background: '#0F0F15' }}
            >
              {/* Gold light burst decoration */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-32 bg-yellow-500/10 rounded-full blur-[60px] pointer-events-none" />

              {/* Modal Header */}
              <div className="text-center mb-4 relative">
                <Sparkles className="w-8 h-8 text-[#FFD700] mx-auto mb-2 animate-pulse" />
                <h3 className="text-lg font-black tracking-wide">Assign Captain & Vice-Captain</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Captain earns <span className="text-[#FFD700] font-black">2x points</span>. Vice-Captain earns <span className="text-gray-300 font-black">1.5x points</span>.
                </p>
              </div>

              {/* List of selected 11 */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 py-1">
                {selected.map((player) => {
                  const stats = getPlayerStats(player);
                  const isCap = captainId === player.id;
                  const isVc = vcId === player.id;

                  return (
                    <div
                      key={player.id}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-2xl border transition-all',
                        isCap 
                          ? 'bg-[#FFD700]/5 border-[#FFD700]/30' 
                          : isVc 
                            ? 'bg-gray-300/5 border-gray-300/30' 
                            : 'bg-white/[0.01] border-white/5 hover:bg-white/5'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getFlagByCountry(player.country)}</span>
                        <div className="text-left leading-tight">
                          <p className="font-bold text-xs">{player.name}</p>
                          <span className={cn('text-[9px] px-1 rounded font-bold border uppercase', getPositionColor(player.position))}>
                            {player.position}
                          </span>
                        </div>
                      </div>

                      {/* Captain Choice badges */}
                      <div className="flex items-center gap-2">
                        {/* Captain Button */}
                        <button
                          onClick={() => {
                            playSound('tick');
                            setCaptainId(player.id);
                            if (vcId === player.id) setVcId('');
                          }}
                          className={cn(
                            'w-10 h-10 rounded-full font-black text-xs border flex items-center justify-center transition-all',
                            isCap
                              ? 'bg-[#FFD700] text-dark-900 border-[#FFD700] shadow-[0_0_10px_rgba(255,215,0,0.4)]'
                              : 'bg-white/5 border-white/10 text-gray-400 hover:border-[#FFD700]'
                          )}
                        >
                          C
                        </button>
                        {/* Vice Captain Button */}
                        <button
                          onClick={() => {
                            playSound('tick');
                            setVcId(player.id);
                            if (captainId === player.id) setCaptainId('');
                          }}
                          className={cn(
                            'w-10 h-10 rounded-full font-black text-xs border flex items-center justify-center transition-all',
                            isVc
                              ? 'bg-gray-300 text-dark-900 border-gray-300 shadow-[0_0_10px_rgba(200,200,200,0.4)]'
                              : 'bg-white/5 border-white/10 text-gray-400 hover:border-gray-300'
                          )}
                        >
                          VC
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Confirm Save CTA */}
              <div className="mt-4 pt-3 border-t border-white/5 flex gap-3">
                <button
                  onClick={() => setShowCeremonyModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 bg-white/5 text-gray-400 font-bold hover:bg-white/10 hover:text-white transition-all text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={submitTeam}
                  disabled={saving || !captainId || !vcId}
                  className="flex-1 py-2.5 rounded-xl font-extrabold text-white transition-all text-xs flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(135deg, #DC143C, #8B0000)',
                    boxShadow: '0 4px 15px rgba(220, 20, 60, 0.3)',
                  }}
                >
                  {saving ? 'Saving...' : 'Lock Squad & Save Team 🏆'}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Pitch Row Component
function PitchRow({ 
  players, 
  limit, 
  position, 
  onRemove, 
  onAdd, 
  captainId, 
  vcId,
  homeTeam,
  awayTeam,
  onDragStart,
  onDragEnd
}: {
  players: SelectedPlayer[]; 
  limit: number; 
  position: Position;
  onRemove: (id: string) => void; 
  onAdd: () => void;
  captainId: string;
  vcId: string;
  homeTeam: string;
  awayTeam: string;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const emptyCount = Math.max(0, limit - players.length);
  
  // Custom neon borders for different positions in empty slots
  const getSlotStyles = (pos: Position) => {
    const styles: Record<Position, string> = {
      GK: 'border-amber-500/20 text-amber-500/40 hover:border-amber-500/60 hover:text-amber-400 hover:shadow-[0_0_15px_rgba(245,158,11,0.25)] bg-amber-500/[0.02]',
      DEF: 'border-blue-500/20 text-blue-500/40 hover:border-blue-500/60 hover:text-blue-400 hover:shadow-[0_0_15px_rgba(59,130,246,0.25)] bg-blue-500/[0.02]',
      MID: 'border-emerald-500/20 text-emerald-500/40 hover:border-emerald-500/60 hover:text-emerald-400 hover:shadow-[0_0_15px_rgba(16,185,129,0.25)] bg-emerald-500/[0.02]',
      FWD: 'border-rose-500/20 text-rose-500/40 hover:border-rose-500/60 hover:text-rose-400 hover:shadow-[0_0_15px_rgba(244,63,94,0.25)] bg-rose-500/[0.02]',
    };
    return styles[pos] || 'border-white/10 text-white/30';
  };

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Position Header Label */}
      <span className={cn('text-[9px] px-1.5 py-0.5 rounded font-black border tracking-wider select-none uppercase mb-1', getPositionColor(position))}>
        {position} ({players.length}/{limit})
      </span>

      {/* Players Row */}
      <div className="flex justify-center gap-4 flex-wrap w-full max-w-lg min-h-[75px] items-center py-1">
        
        {/* Render Selected Players */}
        <AnimatePresence mode="popLayout">
          {players.map((player) => {
            const isCaptain = captainId === player.id;
            const isVC = vcId === player.id;

            // Determinate jersey styling
            const isHome = player.country === homeTeam;
            const primaryColor = isHome ? '#DC143C' : '#00C9FF';
            const secondaryColor = isHome ? '#FFD700' : '#92FE9D';
            const finalPrimary = player.position === 'GK' ? '#FF9F0A' : primaryColor;
            const finalSecondary = player.position === 'GK' ? '#FFD700' : secondaryColor;
            
            // Deterministic shirt number
            let hash = 0;
            for (let i = 0; i < player.name.length; i++) {
              hash = player.name.charCodeAt(i) + ((hash << 5) - hash);
            }
            const jerseyNum = (Math.abs(hash) % 22) + 1;

            return (
              <motion.div
                key={player.id}
                className="flex flex-col items-center relative cursor-grab active:cursor-grabbing group"
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                layoutId={`jersey-${player.id}`}
                // Drag options
                drag
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                dragElastic={0.4}
                onDragStart={() => {
                  playSound('tick');
                  onDragStart();
                }}
                onDragEnd={(event, info) => {
                  onDragEnd();
                  const threshold = 70;
                  if (Math.abs(info.offset.x) > threshold || Math.abs(info.offset.y) > threshold) {
                    onRemove(player.id);
                  } else {
                    playSound('pop'); // snap back sound
                  }
                }}
                whileDrag={{ 
                  scale: 1.15, 
                  zIndex: 50, 
                  filter: 'drop-shadow(0 15px 15px rgba(220, 20, 60, 0.45))' 
                }}
              >
                
                {/* SVG Soccer Jersey */}
                <div className="relative flex items-center justify-center">
                  
                  {/* Captain Badge Indicator */}
                  {isCaptain && (
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#FFD700] flex items-center justify-center text-[9px] font-black text-black border border-black shadow z-20">
                      C
                    </div>
                  )}

                  {/* Vice-Captain Badge Indicator */}
                  {isVC && (
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-[9px] font-black text-black border border-black shadow z-20">
                      VC
                    </div>
                  )}

                  {/* SVG Render */}
                  <div className="relative">
                    <svg className={cn(
                      "w-12 h-12 md:w-14 md:h-14 drop-shadow-md transition-transform group-hover:scale-110",
                      isCaptain && "filter drop-shadow-[0_0_6px_rgba(255,215,0,0.6)]",
                      isVC && "filter drop-shadow-[0_0_6px_rgba(200,200,200,0.5)]"
                    )} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path 
                        d="M 20 28 L 32 15 L 43 19 L 50 15 L 57 19 L 68 15 L 80 28 L 73 38 L 66 33 L 66 85 L 34 85 L 34 33 L 27 38 Z" 
                        fill={finalPrimary} 
                        stroke={isCaptain ? '#FFD700' : isVC ? '#d1d5db' : '#ffffff'} 
                        strokeWidth="4"
                        strokeLinejoin="round" 
                      />
                      <path d="M 43 19 Q 50 26 57 19" fill="none" stroke={finalSecondary} strokeWidth="3" />
                      <path d="M 40 33 L 40 85 M 50 26 L 50 85 M 60 33 L 60 85" stroke={finalSecondary} strokeWidth="2.5" opacity="0.3" />
                      <text 
                        x="50" 
                        y="60" 
                        fill="#ffffff" 
                        fontSize="24" 
                        fontWeight="900" 
                        textAnchor="middle" 
                        fontFamily="system-ui, -apple-system, sans-serif"
                      >
                        {jerseyNum}
                      </text>
                    </svg>
                  </div>

                  {/* Country Flag Badge overlay */}
                  <div className="absolute -bottom-1 -left-1 bg-black/60 px-1 py-0.5 rounded text-[8px] flex items-center gap-0.5 border border-white/10 z-20">
                    <span>{getFlagByCountry(player.country)}</span>
                    <span className="text-[7px] text-gray-300 font-extrabold uppercase">{player.country.substring(0, 3)}</span>
                  </div>

                </div>

                {/* Player details */}
                <div className="mt-2 text-center leading-none pointer-events-none select-none max-w-[65px]">
                  <p className="text-[9px] md:text-[10px] text-white font-extrabold truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                    {player.name.split(' ').pop()}
                  </p>
                  <p className="text-[8px] text-[#FFD700] font-bold mt-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                    {player.price} Cr
                  </p>
                </div>

                {/* Hover Delete Action Button */}
                <button
                  onClick={() => onRemove(player.id)}
                  className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-red-600/90 hover:bg-red-500 border border-white/10 flex items-center justify-center text-[9px] font-bold text-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-30"
                >
                  <Trash2 className="w-3 h-3" />
                </button>

              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Render dashed "+" empty slots */}
        {[...Array(emptyCount)].map((_, idx) => (
          <motion.button
            key={`empty-${idx}`}
            onClick={onAdd}
            className={cn(
              "w-12 h-12 md:w-14 md:h-14 rounded-full flex flex-col items-center justify-center border-2 border-dashed transition-all shadow-inner group/btn relative backdrop-blur-sm",
              getSlotStyles(position)
            )}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.7 }}
            whileHover={{ scale: 1.08, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <span className="text-sm font-extrabold transition-transform group-hover/btn:scale-115 pointer-events-none">+</span>
            <span className="text-[7px] font-black uppercase pointer-events-none tracking-tighter opacity-60 group-hover/btn:opacity-100">{position}</span>
          </motion.button>
        ))}

      </div>
    </div>
  );
}
