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
import neonAuthRoutes from './routes/neonAuth.routes';

import { syncEventsForLiveMatches } from './services/footballApi.service';
import { syncPlayerPrices } from './services/playerSync.service';
import http from 'http';

const app = express();
const httpServer = createServer(app);

// ─── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:3001',
  'https://wcfifa-26.vercel.app',
  'https://wcfifa26.vercel.app',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      // Allow any vercel.app subdomain (covers preview deployments)
      if (origin.endsWith('.vercel.app')) return callback(null, true);
      // Allow explicitly listed origins
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(null, false);
    },
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
app.get('/', (_req, res) => {
  res.send('⚽ World Cup Fantasy 2026 API is running. Go to /health for status.');
});

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
app.use('/api/auth/neon', neonAuthRoutes);

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

// CRON: Update player prices daily at 03:00 UTC
cron.schedule('0 3 * * *', async () => {
  try {
    await syncPlayerPrices();
  } catch (e) {
    console.error('[CRON] Player price sync failed:', e);
  }
});

// Graceful error handlers
process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err);
  process.exit(1);
});

// ─── START SERVER ─────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '4000', 10);
httpServer.listen(PORT, '0.0.0.0', () => {
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

// Keep-alive ping to prevent Render free tier sleep (every 14 minutes)
setInterval(() => {
  const url = `http://localhost:${PORT}/health`;
  http.get(url, () => {}).on('error', () => {});
}, 14 * 60 * 1000);

export default app;
