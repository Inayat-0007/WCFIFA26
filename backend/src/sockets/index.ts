import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyToken } from '../auth/jwt';

let io: SocketIOServer;

// ── Types ────────────────────────────────────────────────────────────────────
interface SocketData {
  userId: string;
  email: string;
  isAdmin: boolean;
}

export function initializeSocket(httpServer: HttpServer): void {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (origin.endsWith('.vercel.app')) return callback(null, true);
        const allowed = [
          process.env.CLIENT_URL || 'http://localhost:3000',
          'http://localhost:3000',
          'https://wcfifa-26.vercel.app',
          'https://wcfifa26.vercel.app',
        ];
        if (allowed.includes(origin)) return callback(null, true);
        callback(null, false);
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // ── JWT Authentication Middleware ──────────────────────────────────────────
  // Every connection attempt is verified before the 'connection' event fires.
  // Unauthenticated clients are rejected with a clear error.
  io.use((socket: Socket, next) => {
    try {
      // Accept token from socket.io auth object (preferred) or Authorization header
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication required — no token provided'));
      }

      const payload = verifyToken(token);
      // Attach verified user data to socket for downstream use
      (socket as Socket & { data: SocketData }).data = {
        userId: payload.userId,
        email: payload.email,
        isAdmin: payload.isAdmin,
      };

      next();
    } catch {
      next(new Error('Authentication failed — invalid or expired token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const data = (socket as Socket & { data: SocketData }).data;
    console.log(`[Socket.IO] Authenticated client connected: ${socket.id} (user: ${data.userId})`);

    // Auto-join user's private notification room
    socket.join(`user:${data.userId}`);

    // Join a specific match room
    socket.on('join:match', (matchId: string) => {
      if (typeof matchId === 'string' && matchId.length > 0) {
        socket.join(`match:${matchId}`);
        console.log(`[Socket.IO] ${socket.id} joined match:${matchId}`);
      }
    });

    // Leave a match room
    socket.on('leave:match', (matchId: string) => {
      socket.leave(`match:${matchId}`);
    });

    // Join a league room
    socket.on('join:league', (leagueId: string) => {
      if (typeof leagueId === 'string' && leagueId.length > 0) {
        socket.join(`league:${leagueId}`);
        console.log(`[Socket.IO] ${socket.id} joined league:${leagueId}`);
      }
    });

    // Leave a league room
    socket.on('leave:league', (leagueId: string) => {
      socket.leave(`league:${leagueId}`);
    });

    // ── REMOVED: join:user ──────────────────────────────────────────────────
    // Previously, ANY client could join ANY user's notification room by
    // passing an arbitrary userId. This was a security hole — a user could
    // eavesdrop on another user's private points updates and notifications.
    // Now the user's private room is auto-joined on connection using the
    // verified JWT payload (see line above: socket.join(`user:${data.userId}`)).

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  console.log('[Socket.IO] Initialized with JWT authentication');
}

// Emit score update to all clients watching a match
export function emitScoreUpdate(matchId: string, homeScore: number, awayScore: number, minute: number): void {
  if (!io) return;
  io.to(`match:${matchId}`).emit('score:update', { matchId, homeScore, awayScore, minute });
  io.emit('score:update', { matchId, homeScore, awayScore, minute }); // also to dashboard watchers
}

// Emit new match event (goal, card, etc.)
export function emitMatchEvent(matchId: string, event: {
  type: string; minute: number; playerId?: string | null; detail?: string | null; id: string;
}): void {
  if (!io) return;
  io.to(`match:${matchId}`).emit('event:new', { matchId, event });
}

// Emit leaderboard update for a league
export function emitLeaderboardUpdate(leagueId: string): void {
  if (!io) return;
  io.to(`league:${leagueId}`).emit('leaderboard:update', { leagueId });
}

// Emit points update for a specific user in a match
export function emitPointsUpdate(userId: string, matchId: string, newTotal: number): void {
  if (!io) return;
  io.to(`user:${userId}`).emit('points:update', { userId, matchId, newTotal });
}

// Emit push notification to a user
export function emitNotification(userId: string, title: string, body: string, type: string = 'info'): void {
  if (!io) return;
  io.to(`user:${userId}`).emit('notification:push', { title, body, type });
}

// Broadcast to all connected clients
export function broadcastToAll(event: string, data: unknown): void {
  if (!io) return;
  io.emit(event, data);
}
