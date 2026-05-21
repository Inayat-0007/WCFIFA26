import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_KEY = process.env.FOOTBALL_API_KEY;
const BASE_URL = 'https://api.football-data.org/v4';

// Simple in-memory cache
const cache = new Map<string, { data: unknown; expiresAt: number }>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() < entry.expiresAt) return entry.data as T;
  return null;
}

function setCache(key: string, data: unknown, ttlSeconds = 30): void {
  cache.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
}

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'X-Auth-Token': API_KEY || '' },
  timeout: 10000,
});

// FIFA World Cup 2026 competition ID (will be updated when available)
const WC_2026_ID = 2000;

export async function fetchLiveMatches(): Promise<void> {
  if (!API_KEY) return;
  try {
    const cacheKey = 'live-matches';
    const cached = getCached(cacheKey);
    if (cached) return;

    const response = await apiClient.get(`/competitions/${WC_2026_ID}/matches?status=LIVE`);
    setCache(cacheKey, response.data, 30);

    const matches = response.data.matches || [];
    for (const m of matches) {
      await prisma.match.updateMany({
        where: { externalId: String(m.id) },
        data: {
          status: 'LIVE',
          homeScore: m.score?.fullTime?.home ?? 0,
          awayScore: m.score?.fullTime?.away ?? 0,
          minute: m.minute || null,
        },
      });
    }
  } catch {
    // API unavailable — fail silently
  }
}

export async function fetchMatchEvents(externalMatchId: string): Promise<void> {
  if (!API_KEY) return;
  try {
    const response = await apiClient.get(`/matches/${externalMatchId}`);
    const match = response.data;
    // Process goals from lineups/bookings if available
    // This is a simplified implementation
  } catch {
    // Fail silently
  }
}

export async function syncEventsForLiveMatches(): Promise<void> {
  if (!API_KEY) return;
  try {
    const liveMatches = await prisma.match.findMany({
      where: { status: 'LIVE', externalId: { not: null } },
    });

    for (const match of liveMatches) {
      if (match.externalId) {
        await fetchMatchEvents(match.externalId);
      }
    }
  } catch {
    // Fail silently
  }
}

export async function syncMatchesToDB(): Promise<void> {
  if (!API_KEY) return;
  try {
    const response = await apiClient.get(`/competitions/${WC_2026_ID}/matches`);
    const matches = response.data.matches || [];

    for (const m of matches) {
      const statusMap: Record<string, string> = {
        'SCHEDULED': 'UPCOMING',
        'TIMED': 'UPCOMING',
        'IN_PLAY': 'LIVE',
        'PAUSED': 'LIVE',
        'FINISHED': 'COMPLETED',
        'POSTPONED': 'POSTPONED',
      };

      await prisma.match.upsert({
        where: { externalId: String(m.id) },
        update: {
          status: (statusMap[m.status] || 'UPCOMING') as any,
          homeScore: m.score?.fullTime?.home ?? 0,
          awayScore: m.score?.fullTime?.away ?? 0,
        },
        create: {
          externalId: String(m.id),
          homeTeam: m.homeTeam.name,
          awayTeam: m.awayTeam.name,
          kickoffTime: new Date(m.utcDate),
          status: (statusMap[m.status] || 'UPCOMING') as any,
          homeScore: m.score?.fullTime?.home ?? 0,
          awayScore: m.score?.fullTime?.away ?? 0,
          round: m.stage || 'Group Stage',
        },
      });
    }
  } catch {
    // Fail silently
  }
}
