'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { Zap, Users, Calendar, Trophy, ArrowRight, Shield } from 'lucide-react';

const FEATURES = [
  { icon: Calendar, title: '80 Matches', desc: 'Every group stage and knockout game', color: '#10B981' },
  { icon: Users, title: '48 Nations', desc: 'Build squads from the biggest tournament ever', color: '#06B6D4' },
  { icon: Trophy, title: 'Private Leagues', desc: 'Compete head-to-head with friends', color: '#F59E0B' },
  { icon: Shield, title: 'Live Scoring', desc: 'Real-time points as goals fly in', color: '#DC143C' },
];

const STATS = [
  { value: '48', label: 'Teams' },
  { value: '80', label: 'Matches' },
  { value: '104', label: 'Venues' },
  { value: '1', label: 'Champion' },
];

export default function SplashPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const redirected = useRef(false);

  useEffect(() => {
    if (isLoading || redirected.current) return;
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        redirected.current = true;
        router.push('/dashboard');
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [isAuthenticated, isLoading, router]);

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Background effects */}
      <div className="stadium-rays" />
      <div className="grid-pattern absolute inset-0" />
      <div className="orb orb-emerald w-[600px] h-[600px] -top-40 -left-40 opacity-40" />
      <div className="orb orb-cyan w-[400px] h-[400px] -bottom-20 -right-20 opacity-30" style={{ animationDelay: '3s' }} />
      <div className="orb orb-red w-[300px] h-[300px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-15" style={{ animationDelay: '6s' }} />

      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-3xl">

        {/* Logo Badge */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, type: 'spring', bounce: 0.4 }}
          className="w-24 h-24 rounded-3xl gradient-emerald flex items-center justify-center mb-8 shadow-lg glow-emerald"
        >
          <Zap className="w-12 h-12 text-white" />
        </motion.div>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="live-badge mb-6"
          style={{ color: 'var(--primary)', background: 'var(--primary-glow)', borderColor: 'rgba(16,185,129,0.25)' }}
        >
          <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
          FIFA WORLD CUP 2026 · USA · MEXICO · CANADA
        </motion.div>

        {/* Main Title */}
        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="text-5xl md:text-7xl font-display font-black mb-6 leading-[1.05] tracking-tight"
        >
          <span style={{ color: 'var(--text)' }}>World Cup</span>
          <br />
          <span className="gradient-text">Fantasy 2026</span>
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.7 }}
          className="text-lg md:text-xl mb-10 max-w-lg leading-relaxed"
          style={{ color: 'var(--text-muted)' }}
        >
          Build your dream squad. Outsmart your friends. Climb the global leaderboard in the ultimate fantasy football experience.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 w-full max-w-sm sm:max-w-md justify-center"
        >
          <a href="/signup" className="btn-primary flex-1 py-4 px-8 text-center text-base flex items-center justify-center gap-2 rounded-2xl">
            Get Started <ArrowRight className="w-4 h-4" />
          </a>
          <a href="/login" className="btn-ghost flex-1 py-4 px-8 text-center text-base flex items-center justify-center rounded-2xl">
            Sign In
          </a>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.6 }}
          className="flex gap-8 sm:gap-12 mt-16"
        >
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl md:text-3xl font-black gradient-text">{s.value}</p>
              <p className="text-xs font-semibold uppercase tracking-widest mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.8 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-16 w-full max-w-2xl"
        >
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.7 + i * 0.1 }}
                className="card p-4 flex flex-col items-center text-center gap-2"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-1" style={{ background: `${f.color}15`, color: f.color }}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold" style={{ color: 'var(--text)' }}>{f.title}</p>
                <p className="text-[10px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Progress bar */}
      {isAuthenticated && (
        <motion.div
          className="absolute bottom-0 left-0 h-1 gradient-emerald"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 2.8, ease: 'linear' }}
        />
      )}
    </main>
  );
}
