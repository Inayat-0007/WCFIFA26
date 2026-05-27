'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { Navbar } from '@/components/ui/Navbar';
import { getEventIcon, getFlagByCountry, formatDate, cn } from '@/lib/utils';
import api from '@/lib/api';
import type { Match, MatchEvent, MatchPlayer, FantasyTeam, TeamPlayer } from '@/types';

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
    // Audio context failed
  }
};

export default function LiveMatchPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { socket, joinMatch, leaveMatch } = useSocket();
  const router = useRouter();
  const [match, setMatch] = useState<Match | null>(null);
  const [myTeam, setMyTeam] = useState<FantasyTeam | null>(null);
  const [myTeamPoints, setMyTeamPoints] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'match' | 'squad'>('match');
  const [selectedPlayerDetails, setSelectedPlayerDetails] = useState<TeamPlayer | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'squad') {
        setActiveTab('squad');
      }
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !id) return;
    const fetch = async () => {
      try {
        const [matchRes, teamRes] = await Promise.allSettled([
          api.get(`/matches/${id}`),
          api.get(`/teams/${id}`),
        ]);
        if (matchRes.status === 'fulfilled') setMatch(matchRes.value.data.data);
        if (teamRes.status === 'fulfilled' && teamRes.value.data.data) {
          setMyTeam(teamRes.value.data.data);
          setMyTeamPoints(teamRes.value.data.data.totalPoints ?? 0);
          playSound('success');
        }
      } catch { } finally { setLoading(false); }
    };
    fetch();
    joinMatch(id);
    return () => leaveMatch(id);
  }, [id, isAuthenticated, joinMatch, leaveMatch]);

  useEffect(() => {
    if (!socket) return;
    socket.on('score:update', (data: { matchId: string; homeScore: number; awayScore: number; minute: number }) => {
      if (data.matchId === id) {
        setMatch((prev) => prev ? { ...prev, homeScore: data.homeScore, awayScore: data.awayScore, minute: data.minute } : prev);
      }
    });
    socket.on('event:new', (data: { matchId: string; event: MatchEvent }) => {
      if (data.matchId === id) {
        setMatch((prev) => prev ? { ...prev, events: [...(prev.events || []), data.event] } : prev);
      }
    });
    socket.on('points:update', (data: { userId: string; matchId: string; newTotal: number }) => {
      if (data.matchId === id && data.userId === user?.id) {
        setMyTeamPoints(data.newTotal);
        setMyTeam((prev) => prev ? { ...prev, totalPoints: data.newTotal } : prev);
      }
    });
    return () => { socket.off('score:update'); socket.off('event:new'); socket.off('points:update'); };
  }, [socket, id, user?.id]);

  const getPositionPlayers = (pos: 'GK' | 'DEF' | 'MID' | 'FWD') => {
    if (!myTeam) return [];
    return myTeam.teamPlayers.filter((tp) => tp.player.position === pos);
  };

  const getFormation = () => {
    if (!myTeam) return '4-4-2';
    const defsCount = myTeam.teamPlayers.filter((tp) => tp.player.position === 'DEF').length;
    const midsCount = myTeam.teamPlayers.filter((tp) => tp.player.position === 'MID').length;
    const fwdsCount = myTeam.teamPlayers.filter((tp) => tp.player.position === 'FWD').length;
    return `${defsCount}-${midsCount}-${fwdsCount}`;
  };

  const getPlayerMatchPoints = (tp: TeamPlayer) => {
    const basePoints = tp.player.matchPlayers?.[0]?.fantasyPoints ?? 0;
    const isCap = myTeam?.captainId === tp.player.id;
    const isVc = myTeam?.viceCaptainId === tp.player.id;
    
    if (isCap) return { total: basePoints * 2, display: `${basePoints * 2} pts (2x)` };
    if (isVc) return { total: basePoints * 1.5, display: `${basePoints * 1.5} pts (1.5x)` };
    return { total: basePoints, display: `${basePoints} pts` };
  };

  const renderPlayerBadge = (tp: TeamPlayer) => {
    const isCap = myTeam?.captainId === tp.player.id;
    const isVc = myTeam?.viceCaptainId === tp.player.id;
    const ptsInfo = getPlayerMatchPoints(tp);
    const shortName = tp.player.name.split(' ').pop();

    // Determinate jersey styling
    const isHome = tp.player.country === match?.homeTeam;
    const primaryColor = isHome ? '#DC143C' : '#00C9FF';
    const secondaryColor = isHome ? '#FFD700' : '#92FE9D';
    const finalPrimary = tp.player.position === 'GK' ? '#FF9F0A' : primaryColor;
    const finalSecondary = tp.player.position === 'GK' ? '#FFD700' : secondaryColor;
    
    // Deterministic shirt number
    let hash = 0;
    for (let i = 0; i < tp.player.name.length; i++) {
      hash = tp.player.name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const jerseyNum = (Math.abs(hash) % 22) + 1;

    // Check if the player has live stats (goals, assists, cards)
    const matchStat = tp.player.matchPlayers?.[0] || null;
    const goals = matchStat?.goals || 0;
    const assists = matchStat?.assists || 0;
    const yellowCards = matchStat?.yellowCards || 0;
    const redCards = matchStat?.redCards || 0;

    return (
      <div 
        className="flex flex-col items-center cursor-pointer group transform hover:scale-105 transition-all relative"
        onClick={() => {
          playSound('pop');
          setSelectedPlayerDetails(tp);
        }}
      >
        {/* Player Badge / Jersey SVG container */}
        <div className="relative flex items-center justify-center">
          
          {/* Captain / Vice Captain Indicators */}
          {isCap && (
            <div className="absolute -top-1 -right-1.5 w-5 h-5 rounded-full bg-[#FFD700] text-black text-[9px] font-black border border-black flex items-center justify-center shadow z-20">
              C
            </div>
          )}
          {isVc && (
            <div className="absolute -top-1 -right-1.5 w-5 h-5 rounded-full bg-gray-300 text-black text-[9px] font-black border border-black flex items-center justify-center shadow z-20">
              VC
            </div>
          )}

          {/* SVG Jersey */}
          <div className="relative">
            <svg className={cn(
              "w-12 h-12 md:w-14 md:h-14 drop-shadow-md transition-transform group-hover:scale-110",
              isCap && "filter drop-shadow-[0_0_6px_rgba(255,215,0,0.6)]",
              isVc && "filter drop-shadow-[0_0_6px_rgba(200,200,200,0.5)]"
            )} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path 
                d="M 20 28 L 32 15 L 43 19 L 50 15 L 57 19 L 68 15 L 80 28 L 73 38 L 66 33 L 66 85 L 34 85 L 34 33 L 27 38 Z" 
                fill={finalPrimary} 
                stroke={isCap ? '#FFD700' : isVc ? '#d1d5db' : '#ffffff'} 
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

          {/* Micro badges overlays for goals, assists, cards */}
          <div className="absolute -bottom-1 -right-1 flex flex-col gap-0.5 z-20">
            {goals > 0 && (
              <span className="w-4 h-4 rounded-full bg-white text-[10px] flex items-center justify-center shadow border border-gray-200" title={`Goals: ${goals}`}>
                ⚽
              </span>
            )}
            {assists > 0 && (
              <span className="w-4 h-4 rounded-full bg-blue-600 text-[10px] flex items-center justify-center shadow border border-blue-400" title={`Assists: ${assists}`}>
                🎯
              </span>
            )}
            {yellowCards > 0 && !redCards && (
              <span className="w-4 h-4 rounded bg-yellow-500 text-[9px] flex items-center justify-center font-bold text-black border border-yellow-300" title={`Yellow Cards: ${yellowCards}`}>
                🟨
              </span>
            )}
            {redCards > 0 && (
              <span className="w-4 h-4 rounded bg-red-600 text-[9px] flex items-center justify-center font-bold text-white border border-red-400" title={`Red Cards: ${redCards}`}>
                🟥
              </span>
            )}
          </div>

          {/* Country flag indicator */}
          <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-black/90 px-1 py-0.2 border border-white/10 rounded text-[7px] text-gray-400 scale-90 uppercase z-10 whitespace-nowrap">
            {getFlagByCountry(tp.player.country)} {tp.player.country.substring(0, 3)}
          </div>
        </div>

        {/* Name and Points Bubble */}
        <div className="mt-3.5 text-center leading-none max-w-[70px]">
          <p className="text-[9px] md:text-[10px] text-white font-extrabold truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            {shortName}
          </p>
          <div className={cn(
            "inline-block mt-1 px-1.5 py-0.5 rounded-full text-[8px] font-black border shadow-sm",
            ptsInfo.total > 0 
              ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" 
              : ptsInfo.total < 0 
                ? "text-red-400 bg-red-500/10 border-red-500/20" 
                : "text-gray-400 bg-white/5 border-white/5"
          )}>
            {ptsInfo.total > 0 ? '+' : ''}{ptsInfo.total} pts
          </div>
        </div>
      </div>
    );
  };

  if (loading || !match) {
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

  const isLive = match.status === 'LIVE';

  return (
    <div className="min-h-screen relative overflow-hidden pb-12" style={{ background: 'var(--bg)' }}>
      {/* Stadium Light Rays */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <Navbar />
      <main className="px-4 pt-6 pb-24 md:pb-8 md:px-6 max-w-4xl mx-auto relative z-10">
        {/* Match Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 mb-6 relative overflow-hidden"
          style={{
            background: 'var(--card-bg)',
            borderColor: isLive ? 'var(--accent)' : 'var(--border)',
            boxShadow: isLive ? '0 0 24px var(--accent-glow)' : 'var(--shadow-md)',
          }}
        >
          {isLive && (
            <div className="flex items-center gap-2 mb-4 justify-center">
              <div className="relative">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--accent)' }} />
                <div className="absolute inset-0 rounded-full animate-ping" style={{ background: 'var(--accent)' }} />
              </div>
              <span className="text-sm font-bold tracking-wider" style={{ color: 'var(--accent)' }}>
                LIVE {match.minute && `· ${match.minute}'`}
              </span>
            </div>
          )}
          {match.status === 'COMPLETED' && (
            <div className="text-center mb-4">
              <span className="px-3.5 py-1.5 rounded-full text-xs font-bold border" style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                FULL TIME
              </span>
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 flex flex-col items-center gap-2">
              <span className="text-5xl md:text-6xl select-none">{getFlagByCountry(match.homeTeam)}</span>
              <span className="font-bold text-sm md:text-base text-center" style={{ color: 'var(--text)' }}>
                {match.homeTeam}
              </span>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-3">
                <span className="text-5xl md:text-6xl font-black gradient-text">{match.homeScore}</span>
                <span className="text-3xl font-bold" style={{ color: 'var(--text-muted)' }}>:</span>
                <span className="text-5xl md:text-6xl font-black gradient-text">{match.awayScore}</span>
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center gap-2">
              <span className="text-5xl md:text-6xl select-none">{getFlagByCountry(match.awayTeam)}</span>
              <span className="font-bold text-sm md:text-base text-center" style={{ color: 'var(--text)' }}>
                {match.awayTeam}
              </span>
            </div>
          </div>

          {match.venue && (
            <p className="text-center text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
              📍 {match.venue}, {match.city}
            </p>
          )}
        </motion.div>

        {/* My Fantasy Points Summary */}
        {myTeamPoints !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card p-4 mb-6 flex items-center justify-between border"
            style={{ background: 'var(--gold-glow)', borderColor: 'var(--gold)' }}
          >
            <div>
              <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>My Fantasy Points</p>
              <p className="text-3xl font-black gradient-text-gold">{myTeamPoints}</p>
            </div>
            <div className="text-3xl select-none">🏆</div>
          </motion.div>
        )}

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-6 p-1 rounded-2xl border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <button
            onClick={() => {
              playSound('tick');
              setActiveTab('match');
            }}
            className="flex-1 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all border duration-200"
            style={{
              background: activeTab === 'match' ? 'var(--primary-glow)' : 'transparent',
              borderColor: activeTab === 'match' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'match' ? 'var(--primary)' : 'var(--text-muted)',
            }}
          >
            Match Feed & Stats 📊
          </button>
          <button
            onClick={() => {
              playSound('tick');
              setActiveTab('squad');
            }}
            className="flex-1 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all border duration-200"
            style={{
              background: activeTab === 'squad' ? 'var(--primary-glow)' : 'transparent',
              borderColor: activeTab === 'squad' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'squad' ? 'var(--primary)' : 'var(--text-muted)',
            }}
          >
            My Fantasy Squad 🛡️
          </button>
        </div>

        {activeTab === 'match' ? (
          <div className="space-y-6">
            {/* Match Timeline */}
            {match.events && match.events.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Match Timeline</h2>
                <div className="card p-4 space-y-3 max-h-80 overflow-y-auto" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
                  {[...match.events].sort((a, b) => b.minute - a.minute).map((event) => (
                    <div key={event.id} className="flex items-center gap-3">
                      <span className="text-xl select-none">{getEventIcon(event.type)}</span>
                      <span className="text-xs font-bold w-8" style={{ color: 'var(--text-muted)' }}>{event.minute}&apos;</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
                          {event.type.replace(/_/g, ' ')}
                        </p>
                        {event.detail && (
                          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{event.detail}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Player Stats */}
            {match.matchPlayers && match.matchPlayers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Player Fantasy Points</h2>
                <div className="card overflow-hidden" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
                  {match.matchPlayers.slice(0, 20).map((mp, idx) => (
                    <div key={mp.id} className="flex items-center gap-3 px-4 py-3.5 border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
                      <span className="text-xs w-4" style={{ color: 'var(--text-muted)' }}>{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: 'var(--text)' }}>{mp.player?.name}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {mp.player?.country} · {mp.player?.position}
                        </p>
                      </div>
                      <div className="flex gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                        {mp.goals > 0 && <span className="select-none">⚽ {mp.goals}</span>}
                        {mp.assists > 0 && <span className="select-none">🎯 {mp.assists}</span>}
                        {mp.yellowCards > 0 && <span className="select-none">🟨 {mp.yellowCards}</span>}
                        {mp.redCards > 0 && <span className="select-none">🟥 {mp.redCards}</span>}
                      </div>
                      <span
                        className="font-black text-sm"
                        style={{ color: mp.fantasyPoints > 0 ? 'var(--gold)' : mp.fantasyPoints < 0 ? 'var(--accent)' : 'var(--text-muted)' }}
                      >
                        {mp.fantasyPoints > 0 ? '+' : ''}{mp.fantasyPoints}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        ) : (
          <div>
            {myTeam ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                {/* Miniature Pitch container */}
                <div className="relative rounded-3xl overflow-hidden border shadow-2xl p-6 flex flex-col justify-between pitch-bg" style={{ minHeight: '560px', borderColor: 'var(--border)' }}>
                  {/* Pitch markings */}
                  <div className="absolute inset-0 opacity-35 pointer-events-none">
                    <svg className="w-full h-full" viewBox="0 0 400 520" xmlns="http://www.w3.org/2000/svg">
                      <rect x="10" y="10" width="380" height="500" fill="none" stroke="white" strokeWidth="2.5" />
                      <line x1="10" y1="260" x2="390" y2="260" stroke="white" strokeWidth="1.5" />
                      <circle cx="200" cy="260" r="45" fill="none" stroke="white" strokeWidth="1.5" />
                      <rect x="80" y="10" width="240" height="80" fill="none" stroke="white" strokeWidth="1.5" />
                      <rect x="80" y="430" width="240" height="80" fill="none" stroke="white" strokeWidth="1.5" />
                      <circle cx="200" cy="70" r="4" fill="white" />
                      <circle cx="200" cy="450" r="4" fill="white" />
                    </svg>
                  </div>

                  {/* Header Badge */}
                  <div
                    className="relative z-10 self-center px-4 py-1.5 rounded-full border backdrop-blur-md text-[10px] font-black tracking-widest uppercase mb-4"
                    style={{ background: 'var(--nav-bg)', borderColor: 'var(--border)', color: 'var(--gold)' }}
                  >
                    FORMATION: {getFormation()}
                  </div>

                  {/* Pitch Rows */}
                  <div className="relative z-10 flex flex-col justify-between flex-1 gap-6">
                    {/* Forwards */}
                    <div className="flex justify-center gap-6 md:gap-12">
                      {getPositionPlayers('FWD').map((tp) => (
                        <div key={tp.id} onClick={() => setSelectedPlayerDetails(tp)}>
                          {renderPlayerBadge(tp)}
                        </div>
                      ))}
                    </div>

                    {/* Midfielders */}
                    <div className="flex justify-center gap-6 md:gap-10">
                      {getPositionPlayers('MID').map((tp) => (
                        <div key={tp.id} onClick={() => setSelectedPlayerDetails(tp)}>
                          {renderPlayerBadge(tp)}
                        </div>
                      ))}
                    </div>

                    {/* Defenders */}
                    <div className="flex justify-center gap-6 md:gap-8">
                      {getPositionPlayers('DEF').map((tp) => (
                        <div key={tp.id} onClick={() => setSelectedPlayerDetails(tp)}>
                          {renderPlayerBadge(tp)}
                        </div>
                      ))}
                    </div>

                    {/* Goalkeeper */}
                    <div className="flex justify-center">
                      {getPositionPlayers('GK').map((tp) => (
                        <div key={tp.id} onClick={() => setSelectedPlayerDetails(tp)}>
                          {renderPlayerBadge(tp)}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Floating Pitch Legend */}
                  <div
                    className="relative z-10 mt-6 backdrop-blur-md rounded-2xl p-2.5 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-[9px] font-bold self-center border shadow-lg max-w-md"
                    style={{ background: 'var(--card-bg)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                  >
                    <div className="flex items-center gap-1">
                      <span className="w-4 h-4 rounded-full bg-[#FFD700] text-black text-[9px] font-black border border-black flex items-center justify-center">C</span>
                      <span>Captain (2x Pts)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-4 h-4 rounded-full bg-gray-300 text-black text-[9px] font-black border border-black flex items-center justify-center">VC</span>
                      <span>Vice-Captain (1.5x Pts)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-4 h-4 flex items-center justify-center select-none">⚽</span>
                      <span>Goal</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-4 h-4 flex items-center justify-center select-none">🎯</span>
                      <span>Assist</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-4 h-4 flex items-center justify-center select-none">🟨</span>
                      <span>Yellow</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-4 h-4 flex items-center justify-center select-none">🟥</span>
                      <span>Red</span>
                    </div>
                  </div>
                </div>

                {/* Edit Team CTA if Match is Upcoming */}
                {match.status === 'UPCOMING' && (
                  <div className="flex justify-center">
                    <Link
                      href={`/team-builder/${id}`}
                      className="px-6 py-3 rounded-2xl font-black text-sm text-white transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
                      style={{
                        background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                        boxShadow: '0 4px 12px var(--primary-glow)',
                      }}
                    >
                      <span>Edit Squad ✏️</span>
                    </Link>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="card p-8 text-center border flex flex-col items-center justify-center py-16" style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}>
                <div className="text-5xl mb-4 animate-float select-none">🛡️</div>
                <h3 className="text-lg font-black mb-2" style={{ color: 'var(--text)' }}>No Fantasy Squad Created</h3>
                <p className="text-sm max-w-sm mb-6 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  You didn&apos;t create a fantasy roster for this match. Next time, be sure to pick your 11 players before kickoff!
                </p>
                {match.status === 'UPCOMING' && (
                  <Link
                    href={`/team-builder/${id}`}
                    className="px-6 py-3 rounded-2xl font-black text-sm text-white transition-transform hover:scale-[1.02]"
                    style={{
                      background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                      boxShadow: '0 4px 12px var(--primary-glow)',
                    }}
                  >
                    Build Your Squad Now 🚀
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Player Stats Detail Modal */}
      <AnimatePresence>
        {selectedPlayerDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => {
                playSound('remove');
                setSelectedPlayerDetails(null);
              }}
            />
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="relative w-full max-w-sm card p-6 overflow-hidden z-50 shadow-xl"
              style={{ background: 'var(--card-bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              {/* Close icon top-right */}
              <button 
                onClick={() => {
                  playSound('remove');
                  setSelectedPlayerDetails(null);
                }}
                className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center transition-colors text-xs font-bold border hover:opacity-80"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
              >
                ✕
              </button>

              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-16 rounded-full blur-[30px] pointer-events-none" style={{ background: 'var(--primary-glow)' }} />
              
              <div className="text-center mb-5 mt-2">
                <span className="text-5xl animate-float inline-block mb-1 select-none">{getFlagByCountry(selectedPlayerDetails.player.country)}</span>
                <h3 className="text-xl font-black mt-2 tracking-wide" style={{ color: 'var(--text)' }}>{selectedPlayerDetails.player.name}</h3>
                <p className="text-xs font-bold uppercase tracking-wider mt-0.5" style={{ color: 'var(--primary)' }}>
                  {selectedPlayerDetails.player.country} · {selectedPlayerDetails.player.position}
                </p>
              </div>

              {/* Price & Match Points Meters */}
              <div className="space-y-3 p-4 rounded-2xl border mb-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                {/* Price Meter */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1.5">
                    <span style={{ color: 'var(--text-muted)' }}>Player Value</span>
                    <span className="font-black" style={{ color: 'var(--text)' }}>${selectedPlayerDetails.player.price.toFixed(1)}M</span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden border" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
                    <div 
                      className="h-full rounded-full" 
                      style={{
                        background: 'linear-gradient(90deg, var(--primary), var(--primary-hover))',
                        width: `${Math.min(100, (selectedPlayerDetails.player.price / 15.0) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Match Points Meter */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1.5">
                    <span style={{ color: 'var(--text-muted)' }}>Total Match Points</span>
                    <span className="font-black" style={{ color: 'var(--gold)' }}>{getPlayerMatchPoints(selectedPlayerDetails).display}</span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden border" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
                    <div 
                      className="h-full rounded-full" 
                      style={{ 
                        background: 'linear-gradient(90deg, var(--gold), #EAB308)',
                        width: `${Math.max(5, Math.min(100, ((getPlayerMatchPoints(selectedPlayerDetails).total) / 25.0) * 100))}%` 
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Grid-based Statistics Table */}
              <div className="mb-6">
                <p className="text-[10px] font-bold tracking-wider uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Live Match Stats Breakdown</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="border rounded-xl p-2.5 flex items-center justify-between" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[9px] font-semibold" style={{ color: 'var(--text-muted)' }}>Goals Scored</span>
                      <span className="text-xs font-black" style={{ color: 'var(--text)' }}>{selectedPlayerDetails.player.matchPlayers?.[0]?.goals || 0}</span>
                    </div>
                    <span className="text-lg select-none">⚽</span>
                  </div>
                  <div className="border rounded-xl p-2.5 flex items-center justify-between" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[9px] font-semibold" style={{ color: 'var(--text-muted)' }}>Assists Made</span>
                      <span className="text-xs font-black" style={{ color: 'var(--text)' }}>{selectedPlayerDetails.player.matchPlayers?.[0]?.assists || 0}</span>
                    </div>
                    <span className="text-lg select-none">🎯</span>
                  </div>
                  <div className="border rounded-xl p-2.5 flex items-center justify-between" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[9px] font-semibold" style={{ color: 'var(--text-muted)' }}>Yellow Cards</span>
                      <span className="text-xs font-black" style={{ color: 'var(--gold)' }}>{selectedPlayerDetails.player.matchPlayers?.[0]?.yellowCards || 0}</span>
                    </div>
                    <span className="text-lg select-none">🟨</span>
                  </div>
                  <div className="border rounded-xl p-2.5 flex items-center justify-between" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[9px] font-semibold" style={{ color: 'var(--text-muted)' }}>Red Cards</span>
                      <span className="text-xs font-black" style={{ color: 'var(--accent)' }}>{selectedPlayerDetails.player.matchPlayers?.[0]?.redCards || 0}</span>
                    </div>
                    <span className="text-lg select-none">🟥</span>
                  </div>
                  <div className="border rounded-xl p-2.5 flex items-center justify-between" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[9px] font-semibold" style={{ color: 'var(--text-muted)' }}>Clean Sheet</span>
                      <span className="text-xs font-black" style={{ color: 'var(--text)' }}>{selectedPlayerDetails.player.matchPlayers?.[0]?.cleanSheet ? 'Yes' : 'No'}</span>
                    </div>
                    <span className="text-lg select-none">🛡️</span>
                  </div>
                  <div className="border rounded-xl p-2.5 flex items-center justify-between" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[9px] font-semibold" style={{ color: 'var(--text-muted)' }}>Pen Misses</span>
                      <span className="text-xs font-black" style={{ color: 'var(--text)' }}>{selectedPlayerDetails.player.matchPlayers?.[0]?.penaltyMisses || 0}</span>
                    </div>
                    <span className="text-lg select-none">⚠️</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  playSound('remove');
                  setSelectedPlayerDetails(null);
                }}
                className="w-full py-3 rounded-xl text-xs font-black text-white tracking-wider transition-all shadow-md uppercase hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))' }}
              >
                Close Profile
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
