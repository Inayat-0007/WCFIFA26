'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { getSocket, connectSocket, disconnectSocket, updateSocketAuth } from '@/lib/socket';
import { useAuth } from '@/context/AuthContext';
import type { Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  joinMatch: (matchId: string) => void;
  leaveMatch: (matchId: string) => void;
  joinLeague: (leagueId: string) => void;
  leaveLeague: (leagueId: string) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    // Only connect when we have a valid auth token
    if (!token) {
      // User logged out — disconnect cleanly
      disconnectSocket();
      setConnected(false);
      return;
    }

    const s = getSocket(token);
    socketRef.current = s;
    connectSocket(token);

    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    s.on('connect_error', (err) => {
      console.error('[Socket.IO] Connection error:', err.message);
      setConnected(false);
    });

    return () => {
      s.off('connect');
      s.off('disconnect');
      s.off('connect_error');
    };
  }, [token]);

  // When token changes (e.g. refresh), update the socket auth
  useEffect(() => {
    updateSocketAuth(token);
  }, [token]);

  const joinMatch = useCallback((matchId: string) => {
    socketRef.current?.emit('join:match', matchId);
  }, []);

  const leaveMatch = useCallback((matchId: string) => {
    socketRef.current?.emit('leave:match', matchId);
  }, []);

  const joinLeague = useCallback((leagueId: string) => {
    socketRef.current?.emit('join:league', leagueId);
  }, []);

  const leaveLeague = useCallback((leagueId: string) => {
    socketRef.current?.emit('leave:league', leagueId);
  }, []);

  // NOTE: joinUser is removed — the server now auto-joins the user's
  // private notification room from the verified JWT payload.

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      connected,
      joinMatch, leaveMatch, joinLeague, leaveLeague,
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket(): SocketContextType {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used inside SocketProvider');
  return ctx;
}
