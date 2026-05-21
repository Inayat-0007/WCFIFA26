'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { getSocket, connectSocket, disconnectSocket } from '@/lib/socket';
import type { Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  joinMatch: (matchId: string) => void;
  leaveMatch: (matchId: string) => void;
  joinLeague: (leagueId: string) => void;
  leaveLeague: (leagueId: string) => void;
  joinUser: (userId: string) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const s = getSocket();
    socketRef.current = s;
    connectSocket();

    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));

    return () => {
      s.off('connect');
      s.off('disconnect');
    };
  }, []);

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

  const joinUser = useCallback((userId: string) => {
    socketRef.current?.emit('join:user', userId);
  }, []);

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      connected,
      joinMatch, leaveMatch, joinLeague, leaveLeague, joinUser,
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
