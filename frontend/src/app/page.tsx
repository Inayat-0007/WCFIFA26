'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

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

  return (
    <main className="relative min-h-screen bg-dark-900 flex flex-col items-center justify-center overflow-hidden">
      {/* Background orbs */}
      <div className="orb orb-red w-[600px] h-[600px] top-[-200px] left-[-200px] opacity-40" />
      <div className="orb orb-gold w-[400px] h-[400px] bottom-[-100px] right-[-100px] opacity-30" style={{ animationDelay: '3s' }} />

      {/* Animated grid overlay */}
      <div className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'linear-gradient(rgba(220,20,60,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(220,20,60,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        {/* Trophy / Ball animation */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, type: 'spring', bounce: 0.4 }}
          className="text-8xl mb-6 animate-float"
        >
          ⚽
        </motion.div>

        {/* FIFA WC 2026 badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mb-3 px-4 py-1 rounded-full text-xs font-semibold tracking-widest uppercase"
          style={{ background: 'rgba(220,20,60,0.15)', border: '1px solid rgba(220,20,60,0.3)', color: '#DC143C' }}
        >
          FIFA WORLD CUP 2026
        </motion.div>

        {/* App title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-4xl md:text-6xl lg:text-7xl font-black mb-4 leading-tight"
        >
          <span className="gradient-text">World Cup</span>
          <br />
          <span className="text-white">Fantasy</span>
          <span className="gradient-text-gold"> 2026</span>
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="text-gray-400 text-lg md:text-xl mb-10 max-w-md"
        >
          Build your dream team. Conquer the world.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 w-full max-w-xs sm:max-w-sm"
        >
          <a
            href="/signup"
            className="flex-1 py-4 rounded-2xl font-bold text-lg text-white text-center transition-all duration-200 hover:scale-105 hover:shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #DC143C, #a01030)',
              boxShadow: '0 4px 20px rgba(220,20,60,0.4)',
            }}
          >
            Get Started
          </a>
          <a
            href="/login"
            className="flex-1 py-4 rounded-2xl font-bold text-lg text-white text-center transition-all duration-200 hover:scale-105 glass"
          >
            Log In
          </a>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.6 }}
          className="flex flex-wrap justify-center gap-2 mt-10"
        >
          {['🏆 Private Leagues', '⚡ Live Scoring', '🎯 Dream Team Builder', '📱 Works on All Devices'].map((f) => (
            <span key={f} className="px-3 py-1 rounded-full text-xs text-gray-400 glass">
              {f}
            </span>
          ))}
        </motion.div>
      </div>

      {/* Loading bar at bottom */}
      <motion.div
        className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-primary-500 to-gold-400"
        initial={{ width: '0%' }}
        animate={{ width: '100%' }}
        transition={{ duration: 2.8, ease: 'linear' }}
      />
    </main>
  );
}
