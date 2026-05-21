import axios from 'axios';
import prisma from '../lib/prisma';
import { recalculateMatchPoints } from './scoringEngine.service';
import { emitScoreUpdate, emitMatchEvent } from '../sockets';

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

// Track processed events to avoid duplicates
const processedEvents = new Set<string>();

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
          homeScore: m.score?.fullTime?.home ?? m.score?.halfTime?.home ?? 0,
          awayScore: m.score?.fullTime?.away ?? m.score?.halfTime?.away ?? 0,
          minute: m.minute || null,
        },
      });

      // Emit real-time score update
      const dbMatch = await prisma.match.findFirst({ where: { externalId: String(m.id) } });
      if (dbMatch) {
        emitScoreUpdate(dbMatch.id, dbMatch.homeScore, dbMatch.awayScore, m.minute || 0);
      }
    }
  } catch (error) {
    console.error('[FootballAPI] Error fetching live matches:', (error as Error).message);
  }
}

export async function fetchMatchEvents(externalMatchId: string): Promise<void> {
  if (!API_KEY) return;
  try {
    const cacheKey = `events-${externalMatchId}`;
    const cached = getCached(cacheKey);
    if (cached) return;

    const response = await apiClient.get(`/matches/${externalMatchId}`);
    const matchData = response.data;
    setCache(cacheKey, matchData, 30);

    // Find our DB match
    const dbMatch = await prisma.match.findFirst({ where: { externalId: externalMatchId } });
    if (!dbMatch) return;

    // Update score
    const homeScore = matchData.score?.fullTime?.home ?? matchData.score?.halfTime?.home ?? 0;
    const awayScore = matchData.score?.fullTime?.away ?? matchData.score?.halfTime?.away ?? 0;
    await prisma.match.update({
      where: { id: dbMatch.id },
      data: { homeScore, awayScore, minute: matchData.minute || null },
    });

    // Process goals from the match data
    const goals = matchData.goals || [];
    for (const goal of goals) {
      const eventKey = `${dbMatch.id}-GOAL-${goal.minute}-${goal.scorer?.name || 'unknown'}`;
      if (processedEvents.has(eventKey)) continue;
      processedEvents.add(eventKey);

      // Find the scoring player in our DB
      const scorer = goal.scorer?.name
        ? await prisma.player.findFirst({
            where: {
              OR: [
                { name: { contains: goal.scorer.name.split(' ').pop() || '', mode: 'insensitive' } },
                { displayName: { contains: goal.scorer.name.split(' ').pop() || '', mode: 'insensitive' } },
              ],
            },
          })
        : null;

      // Create match event
      const event = await prisma.matchEvent.create({
        data: {
          matchId: dbMatch.id,
          playerId: scorer?.id || null,
          type: 'GOAL',
          minute: goal.minute || 0,
          detail: `Goal by ${goal.scorer?.name || 'Unknown'}${goal.assist?.name ? ` (assist: ${goal.assist.name})` : ''}`,
        },
      });

      // Update MatchPlayer stats for scorer
      if (scorer) {
        await prisma.matchPlayer.upsert({
          where: { matchId_playerId: { matchId: dbMatch.id, playerId: scorer.id } },
          update: { goals: { increment: 1 } },
          create: { matchId: dbMatch.id, playerId: scorer.id, goals: 1 },
        });
      }

      // Handle assist
      if (goal.assist?.name) {
        const assister = await prisma.player.findFirst({
          where: {
            OR: [
              { name: { contains: goal.assist.name.split(' ').pop() || '', mode: 'insensitive' } },
              { displayName: { contains: goal.assist.name.split(' ').pop() || '', mode: 'insensitive' } },
            ],
          },
        });

        if (assister) {
          await prisma.matchPlayer.upsert({
            where: { matchId_playerId: { matchId: dbMatch.id, playerId: assister.id } },
            update: { assists: { increment: 1 } },
            create: { matchId: dbMatch.id, playerId: assister.id, assists: 1 },
          });
        }
      }

      // Emit event to clients
      emitMatchEvent(dbMatch.id, {
        type: 'GOAL',
        minute: goal.minute || 0,
        playerId: scorer?.id || null,
        detail: event.detail,
        id: event.id,
      });
    }

    // Process bookings (yellow/red cards)
    const bookings = matchData.bookings || [];
    for (const booking of bookings) {
      const cardType = booking.card === 'RED_CARD' ? 'RED_CARD' : 'YELLOW_CARD';
      const eventKey = `${dbMatch.id}-${cardType}-${booking.minute}-${booking.player?.name || 'unknown'}`;
      if (processedEvents.has(eventKey)) continue;
      processedEvents.add(eventKey);

      const player = booking.player?.name
        ? await prisma.player.findFirst({
            where: {
              OR: [
                { name: { contains: booking.player.name.split(' ').pop() || '', mode: 'insensitive' } },
                { displayName: { contains: booking.player.name.split(' ').pop() || '', mode: 'insensitive' } },
              ],
            },
          })
        : null;

      await prisma.matchEvent.create({
        data: {
          matchId: dbMatch.id,
          playerId: player?.id || null,
          type: cardType as any,
          minute: booking.minute || 0,
          detail: `${cardType === 'RED_CARD' ? 'Red' : 'Yellow'} card: ${booking.player?.name || 'Unknown'}`,
        },
      });

      if (player) {
        const updateField = cardType === 'RED_CARD' ? 'redCards' : 'yellowCards';
        await prisma.matchPlayer.upsert({
          where: { matchId_playerId: { matchId: dbMatch.id, playerId: player.id } },
          update: { [updateField]: { increment: 1 } },
          create: { matchId: dbMatch.id, playerId: player.id, [updateField]: 1 } as any,
        });
      }
    }

    // Recalculate all fantasy team points for this match
    if (goals.length > 0 || bookings.length > 0) {
      await recalculateMatchPoints(dbMatch.id);
    }
  } catch (error) {
    console.error(`[FootballAPI] Error fetching events for match ${externalMatchId}:`, (error as Error).message);
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
  } catch (error) {
    console.error('[FootballAPI] Error syncing live matches:', (error as Error).message);
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
  } catch (error) {
    console.error('[FootballAPI] Error syncing matches to DB:', (error as Error).message);
  }
}
