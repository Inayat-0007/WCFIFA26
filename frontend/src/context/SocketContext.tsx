'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { getSocket, connectSocket, disconnectSocket, updateSocketAuth } from '@/lib/socket';
import { useAuth } from '@/context/AuthContext';
import type { Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  reconnecting: boolean;
  joinMatch: (matchId: string) => void;
  leaveMatch: (matchId: string) => void;
  joinLeague: (leagueId: string) => void;
  leaveLeague: (leagueId: string) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const joinedRooms = useRef<Set<string>>(new Set());
  const { token } = useAuth();

  useEffect(() => {
    // Only connect when we have a valid auth token
    if (!token) {
      // User logged out — disconnect cleanly
      disconnectSocket();
      setConnected(false);
      setReconnecting(false);
      return;
    }

    const s = getSocket(token);
    socketRef.current = s;
    connectSocket(token);

    s.on('connect', () => {
      setConnected(true);
      setReconnecting(false);
      // Re-join all rooms after reconnect
      joinedRooms.current.forEach((room) => {
        const [type, id] = room.split(':');
        if (type === 'match') s.emit('join:match', id);
        if (type === 'league') s.emit('join:league', id);
      });
    });
    s.on('disconnect', () => setConnected(false));
    s.on('connect_error', (err) => {
      console.error('[Socket.IO] Connection error:', err.message);
      setConnected(false);
    });
    s.on('reconnect_attempt', () => setReconnecting(true));

    return () => {
      s.off('connect');
      s.off('disconnect');
      s.off('connect_error');
      s.off('reconnect_attempt');
    };
  }, [token]);

  // When token changes (e.g. refresh), update the socket auth
  useEffect(() => {
    updateSocketAuth(token);
  }, [token]);

  const joinMatch = useCallback((matchId: string) => {
    joinedRooms.current.add(`match:${matchId}`);
    socketRef.current?.emit('join:match', matchId);
  }, []);

  const leaveMatch = useCallback((matchId: string) => {
    joinedRooms.current.delete(`match:${matchId}`);
    socketRef.current?.emit('leave:match', matchId);
  }, []);

  const joinLeague = useCallback((leagueId: string) => {
    joinedRooms.current.add(`league:${leagueId}`);
    socketRef.current?.emit('join:league', leagueId);
  }, []);

  const leaveLeague = useCallback((leagueId: string) => {
    joinedRooms.current.delete(`league:${leagueId}`);
    socketRef.current?.emit('leave:league', leagueId);
  }, []);

  // NOTE: joinUser is removed — the server now auto-joins the user's
  // private notification room from the verified JWT payload.

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      connected,
      reconnecting,
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
