import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import passport from 'passport';
import cron from 'node-cron';

import { setupPassport } from './auth/jwt';
import { initializeSocket } from './sockets';
import { errorHandler } from './middleware/errorHandler.middleware';
import { globalLimiter } from './middleware/rateLimit.middleware';

import authRoutes from './routes/auth.routes';
import leagueRoutes from './routes/league.routes';
import matchRoutes from './routes/match.routes';
import playerRoutes from './routes/player.routes';
import teamRoutes from './routes/team.routes';
import leaderboardRoutes from './routes/leaderboard.routes';
import adminRoutes from './routes/admin.routes';
import notificationRoutes from './routes/notification.routes';
import userRoutes from './routes/user.routes';

import { syncEventsForLiveMatches } from './services/footballApi.service';

const app = express();
const httpServer = createServer(app);

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: [
      process.env.CLIENT_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:3001',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── BODY PARSER ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── RATE LIMITER ─────────────────────────────────────────────────────────────
app.use('/api/', globalLimiter);

// ─── PASSPORT ─────────────────────────────────────────────────────────────────
setupPassport();
app.use(passport.initialize());

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'World Cup Fantasy 2026 API', timestamp: new Date().toISOString() });
});

// ─── ROUTES ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/leagues', leagueRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);

// ─── SOCKET.IO ─────────────────────────────────────────────────────────────────
initializeSocket(httpServer);

// ─── ERROR HANDLER (must be last) ────────────────────────────────────────────
app.use(errorHandler);

// ─── CRON: Sync live match data every 60 seconds ─────────────────────────────
cron.schedule('* * * * *', async () => {
  if (process.env.FOOTBALL_API_KEY) {
    try {
      await syncEventsForLiveMatches();
    } catch {
      // Silently fail cron, don't crash server
    }
  }
});

// ─── START SERVER ─────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '4000', 10);
httpServer.listen(PORT, () => {
  console.log(`
  ⚽ World Cup Fantasy 2026 API
  ================================
  🚀 Server running on port ${PORT}
  🌍 Environment: ${process.env.NODE_ENV || 'development'}
  📦 Database: Connected via Prisma
  🔌 Socket.IO: Ready
  ================================
  `);
});

export default app;
