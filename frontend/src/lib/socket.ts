import { io, Socket } from 'socket.io-client';

const PRODUCTION_SOCKET = 'https://wcfifa26.onrender.com';

const getSocketUrl = (): string => {
  // In the browser, always use the production socket when on a Vercel domain
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host.includes('vercel.app') || host.includes('wcfifa')) {
      return PRODUCTION_SOCKET;
    }
  }
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }
  return 'http://localhost:4000';
};

let socket: Socket | null = null;

export function getSocket(token?: string | null): Socket {
  if (!socket) {
    socket = io(getSocketUrl(), {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      randomizationFactor: 0.5,
      autoConnect: false,
      // Auth token is set dynamically before connect — see updateSocketAuth()
    });
  }

  // Update auth if a token was provided
  if (token) {
    socket.auth = { token };
  }

  return socket;
}

/**
 * Update the auth token on the existing socket instance.
 * If the socket is already connected, it will disconnect and reconnect
 * with the new token so the server re-verifies.
 */
export function updateSocketAuth(token: string | null): void {
  if (!socket) return;

  if (token) {
    socket.auth = { token };
    if (socket.connected) {
      // Reconnect so the server validates the new token
      socket.disconnect().connect();
    }
  } else {
    // No token = logged out, disconnect cleanly
    socket.auth = {};
    if (socket.connected) socket.disconnect();
  }
}

export function connectSocket(token?: string | null): void {
  const s = getSocket(token);
  if (token) {
    s.auth = { token };
  }
  if (!s.connected) s.connect();
}

export function disconnectSocket(): void {
  if (socket?.connected) socket.disconnect();
}

export default getSocket;
