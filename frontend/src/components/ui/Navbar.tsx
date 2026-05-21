'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Trophy, Users, BarChart3, User, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/matches', label: 'Matches', icon: Trophy },
  { href: '/leagues', label: 'Leagues', icon: Users },
  { href: '/leaderboard', label: 'Rankings', icon: BarChart3 },
  { href: '/profile', label: 'Profile', icon: User },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Top Navbar */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-16 items-center justify-between px-6 glass border-b border-white/5">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl">⚽</span>
          <span className="font-black text-lg gradient-text">WCF 2026</span>
        </Link>

        <div className="flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                pathname === href
                  ? 'text-white bg-primary-500/20 border border-primary-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
          {user?.isAdmin && (
            <Link
              href="/admin"
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                pathname === '/admin'
                  ? 'text-gold-400 bg-gold-400/10 border border-gold-400/20'
                  : 'text-gold-400/70 hover:text-gold-400 hover:bg-gold-400/5'
              )}
            >
              <Shield className="w-4 h-4" />
              Admin
            </Link>
          )}
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <span className="text-lg">{user?.avatar || '⚽'}</span>
          <span>{user?.name?.split(' ')[0]}</span>
        </button>
      </nav>

      {/* Mobile Bottom Navbar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe glass border-t border-white/5">
        <div className="flex items-center justify-around py-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200',
                  active ? 'text-primary-400' : 'text-gray-600'
                )}
              >
                <Icon className={cn('w-5 h-5', active && 'scale-110')} />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Spacer for desktop nav */}
      <div className="hidden md:block h-16" />
    </>
  );
}
