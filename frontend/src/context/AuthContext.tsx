'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import api from '@/lib/api';
import { neonAuth } from '@/lib/neonAuth';
import type { User, AuthResponse } from '@/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, avatar?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  updateProfile: (data: { name?: string; avatar?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('wcf_token');
    const savedUser = localStorage.getItem('wcf_user');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('wcf_token');
        localStorage.removeItem('wcf_user');
      }
    }
    setIsLoading(false);
  }, []);

  // Refresh user data from server
  useEffect(() => {
    if (token) {
      api.get('/auth/me').then((res) => {
        const freshUser = res.data.data;
        setUser(freshUser);
        localStorage.setItem('wcf_user', JSON.stringify(freshUser));
      }).catch(() => {
        // Token invalid, clear auth
        setToken(null);
        setUser(null);
        localStorage.removeItem('wcf_token');
        localStorage.removeItem('wcf_user');
      });
    }
  }, [token]);

  const setAuth = useCallback((data: AuthResponse) => {
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('wcf_token', data.token);
    localStorage.setItem('wcf_user', JSON.stringify(data.user));
  }, []);

  /**
   * Sync a Neon Auth session to our backend.
   * After a Neon Auth sign-up/sign-in, we call our backend to:
   * 1. Create or link the user in our Prisma DB
   * 2. Get a legacy JWT for backward compat with all API routes
   */
  const syncNeonAuthUser = useCallback(async (neonToken: string, name?: string, avatar?: string): Promise<AuthResponse> => {
    const res = await api.post<{ success: boolean; data: AuthResponse }>('/auth/neon/sync', {
      neonToken,
      name,
      avatar,
    });
    return res.data.data;
  }, []);

  // ─── Login ────────────────────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    // Try Neon Auth first
    try {
      const neonResult = await neonAuth.signIn.email({ email, password }) as { data?: { token?: string } };
      const neonToken = neonResult?.data?.token;
      if (neonToken) {
        const syncData = await syncNeonAuthUser(neonToken);
        setAuth(syncData);
        return;
      }
    } catch {
      // Neon Auth failed — fall back to legacy auth
    }

    // Legacy auth fallback (for existing users who signed up before Neon Auth)
    const res = await api.post<{ success: boolean; data: AuthResponse }>('/auth/login', { email, password });
    setAuth(res.data.data);
  }, [setAuth, syncNeonAuthUser]);

  // ─── Signup ───────────────────────────────────────────────────────────────────
  const signup = useCallback(async (name: string, email: string, password: string, avatar = '⚽') => {
    // Try Neon Auth first (includes email verification)
    try {
      const neonResult = await neonAuth.signUp.email({ email, password, name }) as { data?: { token?: string } };
      const neonToken = neonResult?.data?.token;
      if (neonToken) {
        // Neon Auth signup succeeded — sync to our backend
        const syncData = await syncNeonAuthUser(neonToken, name, avatar);
        setAuth(syncData);
        return;
      }
    } catch {
      // Neon Auth signup failed — fall back to legacy
    }

    // Legacy signup fallback
    const res = await api.post<{ success: boolean; data: AuthResponse }>('/auth/register', { name, email, password, avatar });
    setAuth(res.data.data);
  }, [setAuth, syncNeonAuthUser]);

  // ─── Google OAuth via Neon Auth ────────────────────────────────────────────────
  const loginWithGoogle = useCallback(async () => {
    try {
      await neonAuth.signIn.social({ provider: 'google' });
      // After Google OAuth redirect, the session will be checked on page load
    } catch {
      // Fall back to legacy Google OAuth
      let apiUrl = '';
      if (typeof window !== 'undefined') {
        const host = window.location.hostname;
        if (host.includes('vercel.app') || host.includes('wcfifa')) {
          apiUrl = 'https://wcfifa26.onrender.com';
        }
      }
      if (!apiUrl) {
        apiUrl = process.env.NEXT_PUBLIC_API_URL
          ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '')
          : 'http://localhost:4000';
      }
      window.location.href = `${apiUrl}/api/auth/google`;
    }
  }, []);

  // ─── Logout ───────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    // Sign out from Neon Auth too
    try {
      neonAuth.signOut();
    } catch {
      // Ignore Neon Auth signout errors
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('wcf_token');
    localStorage.removeItem('wcf_user');
    window.location.href = '/login';
  }, []);

  // ─── Update Profile ───────────────────────────────────────────────────────────
  const updateProfile = useCallback(async (data: { name?: string; avatar?: string }) => {
    const res = await api.put('/auth/profile', data);
    const updated = res.data.data;
    setUser(updated);
    localStorage.setItem('wcf_user', JSON.stringify(updated));
  }, []);

  return (
    <AuthContext.Provider value={{
      user, token, isLoading,
      isAuthenticated: !!user && !!token,
      login, signup, loginWithGoogle, logout, updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
