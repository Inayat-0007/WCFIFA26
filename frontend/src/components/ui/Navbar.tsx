'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Trophy, Users, BarChart3, User, Shield, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/matches', label: 'Matches', icon: Trophy },
  { href: '/leagues', label: 'Leagues', icon: Users },
  { href: '/leaderboard', label: 'Rankings', icon: BarChart3 },
  { href: '/profile', label: 'Profile', icon: User },
];

const playClickSound = () => {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(550, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(750, ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.03, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  } catch (e) {
    // blocked or unsupported
  }
};

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const handleLinkClick = () => {
    playClickSound();
  };

  return (
    <>
      {/* Desktop Top Navbar */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-20 items-center justify-between px-10 glass-premium border-b border-primary-500/10">
        <Link href="/dashboard" onClick={handleLinkClick} className="flex items-center gap-3 group">
          <span className="text-3xl transition-transform duration-300 group-hover:rotate-12">🏆</span>
          <span className="font-display font-black text-2xl tracking-tight gradient-text-gold">
            Golden Glory
          </span>
        </Link>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                onClick={handleLinkClick}
                className={cn(
                  'relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300',
                  active
                    ? 'text-white bg-primary/10 border border-primary/25 shadow-[0_0_15px_rgba(230,182,25,0.08)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.03]'
                )}
              >
                <Icon className={cn('w-4 h-4 transition-transform duration-300', active && 'text-primary scale-110')} />
                <span>{label}</span>
                {active && (
                  <motion.div
                    layoutId="active-nav-indicator"
                    className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-primary"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
          
          {user?.isAdmin && (
            <Link
              href="/admin"
              onClick={handleLinkClick}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300',
                pathname === '/admin'
                  ? 'text-primary bg-primary/10 border border-primary/25'
                  : 'text-primary/75 hover:text-primary hover:bg-primary/5'
              )}
            >
              <Shield className="w-4 h-4" />
              <span>Admin</span>
            </Link>
          )}
        </div>

        {/* Profile Card & Logout */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="text-xl select-none">{user?.avatar || '⚽'}</span>
            <span className="text-sm font-bold text-gray-200">{user?.name}</span>
          </div>
          
          <button
            onClick={() => {
              playClickSound();
              logout();
            }}
            className="flex items-center justify-center p-2.5 rounded-xl bg-white/5 hover:bg-accent-500/20 border border-white/5 hover:border-accent-500/30 text-gray-400 hover:text-white transition-all duration-300 group"
            title="Log Out"
          >
            <LogOut className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </nav>

      {/* Mobile Bottom Navbar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe glass-premium border-t border-primary-500/10 shadow-[0_-8px_30px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-around py-3">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                onClick={handleLinkClick}
                className={cn(
                  'flex flex-col items-center gap-1.5 px-3 py-1 rounded-xl transition-all duration-300 relative',
                  active ? 'text-primary' : 'text-gray-500 hover:text-gray-300'
                )}
              >
                <Icon className={cn('w-5 h-5 transition-transform duration-300', active && 'scale-110')} />
                <span className="text-[10px] font-bold tracking-wide">{label}</span>
                {active && (
                  <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Spacer for desktop nav */}
      <div className="hidden md:block h-20" />
    </>
  );
}
