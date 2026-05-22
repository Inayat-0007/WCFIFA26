'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { Sparkles, Play } from 'lucide-react';

const playWelcomeChime = () => {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Minor/major hybrid chord (C5 and E5)
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc1.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.5); // G5

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
    osc2.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.5); // C6

    gainNode.gain.setValueAtTime(0.06, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.5);
    osc2.stop(ctx.currentTime + 0.5);
  } catch (e) {}
};

export default function SplashPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const redirected = useRef(false);

  useEffect(() => {
    if (isLoading || redirected.current) return;
    const timer = setTimeout(() => {
      redirected.current = true;
      if (isAuthenticated) {
        router.push('/dashboard');
      }
    }, 2800);
    return () => clearTimeout(timer);
  }, [isAuthenticated, isLoading, router]);

  const handleInteract = () => {
    playWelcomeChime();
  };

  return (
    <main className="relative min-h-screen bg-dark-900 flex flex-col items-center justify-center overflow-hidden font-sans">
      {/* Premium background lighting orbs */}
      <div className="orb orb-red w-[500px] h-[500px] -top-40 -left-40 opacity-30" />
      <div className="orb orb-gold w-[500px] h-[500px] -bottom-40 -right-40 opacity-25" style={{ animationDelay: '3s' }} />

      {/* Decorative Golden Grid Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(230,182,25,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(230,182,25,0.4) 1px, transparent 1px)',
          backgroundSize: '80px 80px'
        }}
      />

      {/* Main Container */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-2xl">
        
        {/* Animated Trophy badge */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 1, type: 'spring', bounce: 0.35 }}
          className="text-8xl mb-8 select-none filter drop-shadow-[0_10px_20px_rgba(230,182,25,0.25)] animate-float"
          style={{ animationDuration: '4s' }}
        >
          🏆
        </motion.div>

        {/* Tournament Tagline badge */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mb-4 px-5 py-1.5 rounded-full text-[10px] font-black tracking-[0.2em] uppercase bg-primary/10 border border-primary/25 text-primary shadow-[0_0_15px_rgba(230,182,25,0.1)] flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
          FIFA WORLD CUP 2026
        </motion.div>

        {/* Lavish Display Title */}
        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="text-5xl md:text-7xl font-display font-black mb-6 leading-[1.05] tracking-tight"
        >
          <span className="text-white">World Cup</span>
          <br />
          <span className="gradient-text-gold">Golden Glory</span>
        </motion.h1>

        {/* Narrative Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          className="text-gray-400 text-base md:text-lg mb-10 max-w-md leading-relaxed font-sans"
        >
          Step into the arena. Manage elite squads. Claim international prestige in the next-generation fantasy experience.
        </motion.p>

        {/* Action Button hubs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 w-full max-w-xs sm:max-w-md justify-center"
        >
          <a
            href="/signup"
            onClick={handleInteract}
            className="flex-1 py-4 px-6 rounded-2xl font-bold text-base text-dark-900 text-center transition-all duration-300 transform hover:scale-[1.03] active:scale-[0.98] bg-gradient-to-r from-primary to-amber-600 shadow-[0_8px_25px_rgba(230,182,25,0.3)] hover:shadow-[0_12px_30px_rgba(230,182,25,0.4)] flex items-center justify-center gap-2 uppercase tracking-widest font-sans"
          >
            <Play className="w-4 h-4 fill-current" />
            Get Started
          </a>
          <a
            href="/login"
            onClick={handleInteract}
            className="flex-1 py-4 px-6 rounded-2xl font-bold text-base text-white text-center transition-all duration-300 transform hover:scale-[1.03] active:scale-[0.98] glass border border-white/10 hover:border-primary/30 flex items-center justify-center uppercase tracking-widest font-sans"
          >
            Log In
          </a>
        </motion.div>

        {/* Key Features List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="flex flex-wrap justify-center gap-2.5 mt-12"
        >
          {['👑 Private Leagues', '⚡ Live Soundscapes', '🎯 Tactical Drafts', '🤖 AI Advisor'].map((f) => (
            <span key={f} className="px-4 py-1.5 rounded-full text-xs font-semibold text-gray-400 bg-white/[0.02] border border-white/5 shadow-sm">
              {f}
            </span>
          ))}
        </motion.div>
      </div>

      {/* Loading Progression track */}
      <motion.div
        className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-primary via-amber-500 to-accent shadow-[0_0_8px_rgba(230,182,25,0.4)]"
        initial={{ width: '0%' }}
        animate={{ width: '100%' }}
        transition={{ duration: 2.8, ease: 'linear' }}
      />
    </main>
  );
}
