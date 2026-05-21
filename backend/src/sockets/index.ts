import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

let io: SocketIOServer;

export function initializeSocket(httpServer: HttpServer): void {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: [process.env.CLIENT_URL || 'http://localhost:3000', 'http://localhost:3000'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join a specific match room
    socket.on('join:match', (matchId: string) => {
      socket.join(`match:${matchId}`);
      console.log(`[Socket.IO] ${socket.id} joined match:${matchId}`);
    });

    // Leave a match room
    socket.on('leave:match', (matchId: string) => {
      socket.leave(`match:${matchId}`);
    });

    // Join a league room
    socket.on('join:league', (leagueId: string) => {
      socket.join(`league:${leagueId}`);
      console.log(`[Socket.IO] ${socket.id} joined league:${leagueId}`);
    });

    // Leave a league room
    socket.on('leave:league', (leagueId: string) => {
      socket.leave(`league:${leagueId}`);
    });

    // Join user-specific room for personal notifications
    socket.on('join:user', (userId: string) => {
      socket.join(`user:${userId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  console.log('[Socket.IO] Initialized');
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
