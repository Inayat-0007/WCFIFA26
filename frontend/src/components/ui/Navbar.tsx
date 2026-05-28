'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Calendar, Trophy, BarChart3, User,
  Sun, Moon, LogOut, Menu, X, Zap
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useSocket } from '@/context/SocketContext';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/matches', label: 'Matches', icon: Calendar },
  { href: '/leagues', label: 'Leagues', icon: Trophy },
  { href: '/leaderboard', label: 'Rankings', icon: BarChart3 },
  { href: '/profile', label: 'Profile', icon: User },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { connected, reconnecting } = useSocket();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Real-time Connection Status Banner */}
      <AnimatePresence>
        {reconnecting && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="w-full text-center py-2 text-xs font-bold text-white flex items-center justify-center gap-2 select-none"
            style={{
              background: 'linear-gradient(90deg, #F59E0B, #D97706)',
              boxShadow: '0 2px 8px rgba(217, 119, 6, 0.2)',
            }}
          >
            <div className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span>Connection lost. Attempting to reconnect...</span>
          </motion.div>
        )}
        {!connected && !reconnecting && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="w-full text-center py-2 text-xs font-bold text-white flex items-center justify-center gap-2 select-none"
            style={{
              background: 'linear-gradient(90deg, #DC143C, #B91C1C)',
              boxShadow: '0 2px 8px rgba(220, 20, 60, 0.2)',
            }}
          >
            <div className="w-2 h-2 rounded-full bg-white" />
            <span>Disconnected from live updates. Check your internet connection.</span>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="sticky top-0 z-50 border-b" style={{
        background: 'var(--nav-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderColor: 'var(--border)',
      }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl gradient-emerald flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-extrabold tracking-tight hidden sm:block" style={{ color: 'var(--text)' }}>
                WCF <span className="gradient-text">2026</span>
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="relative px-3.5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all duration-200"
                    style={{
                      color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                      background: isActive ? 'var(--primary-glow)' : 'transparent',
                    }}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full"
                        style={{ background: 'var(--primary)' }}
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                }}
                aria-label="Toggle theme"
              >
                <motion.div
                  key={theme}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {theme === 'dark' ? (
                    <Sun className="w-4 h-4" style={{ color: '#F59E0B' }} />
                  ) : (
                    <Moon className="w-4 h-4" style={{ color: '#6366F1' }} />
                  )}
                </motion.div>
              </button>

              {/* User Avatar */}
              {user && (
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                  }}>
                    <span className="text-lg select-none">{user.avatar || '⚽'}</span>
                    <span className="text-sm font-bold truncate max-w-[120px]" style={{ color: 'var(--text)' }}>
                      {user.name}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                    style={{
                      background: 'rgba(220,20,60,0.08)',
                      border: '1px solid rgba(220,20,60,0.15)',
                      color: '#DC143C',
                    }}
                    aria-label="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
              >
                {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Slide-out */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-72 z-50 p-6 flex flex-col gap-2 md:hidden"
              style={{ background: 'var(--bg)', borderLeft: '1px solid var(--border)' }}
            >
              <div className="flex items-center justify-between mb-6">
                <span className="text-lg font-bold" style={{ color: 'var(--text)' }}>Menu</span>
                <button onClick={() => setMobileOpen(false)}>
                  <X className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                </button>
              </div>

              {user && (
                <div className="flex items-center gap-3 p-3 rounded-xl mb-4" style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                }}>
                  <span className="text-2xl">{user.avatar || '⚽'}</span>
                  <div>
                    <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{user.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{user.totalPoints} pts</p>
                  </div>
                </div>
              )}

              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                      background: isActive ? 'var(--primary-glow)' : 'transparent',
                    }}
                  >
                    <Icon className="w-5 h-5" />
                    {link.label}
                  </Link>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
