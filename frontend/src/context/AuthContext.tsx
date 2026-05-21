'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import api from '@/lib/api';
import type { User, AuthResponse } from '@/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, avatar?: string) => Promise<void>;
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

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<{ success: boolean; data: AuthResponse }>('/auth/login', { email, password });
    setAuth(res.data.data);
  }, [setAuth]);

  const signup = useCallback(async (name: string, email: string, password: string, avatar = '⚽') => {
    const res = await api.post<{ success: boolean; data: AuthResponse }>('/auth/register', { name, email, password, avatar });
    setAuth(res.data.data);
  }, [setAuth]);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('wcf_token');
    localStorage.removeItem('wcf_user');
    window.location.href = '/login';
  }, []);

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
      login, signup, logout, updateProfile,
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
