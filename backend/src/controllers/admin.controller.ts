import prisma from '../lib/prisma';
import { Request, Response, NextFunction } from 'express';
import { recalculateMatchPoints } from '../services/scoringEngine.service';
import { emitScoreUpdate, emitMatchEvent } from '../sockets';
import { EventType } from '@prisma/client';


export const getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, name: true, email: true, avatar: true, isAdmin: true,
        totalPoints: true, createdAt: true,
        _count: { select: { memberships: true, fantasyTeams: true } },
      },
      orderBy: { totalPoints: 'desc' },
    });
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

export const getAllLeagues = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const leagues = await prisma.league.findMany({
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: leagues });
  } catch (err) {
    next(err);
  }
};

export const updateMatchScore = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { homeScore, awayScore, status, minute } = req.body;

    const match = await prisma.match.update({
      where: { id },
      data: {
        ...(homeScore !== undefined && { homeScore: parseInt(homeScore) }),
        ...(awayScore !== undefined && { awayScore: parseInt(awayScore) }),
        ...(status && { status }),
        ...(minute !== undefined && { minute: parseInt(minute) }),
      },
    });

    emitScoreUpdate(id, match.homeScore, match.awayScore, match.minute || 0);

    // If completed, recalculate all points
    if (status === 'COMPLETED') {
      await recalculateMatchPoints(id);
    }

    res.json({ success: true, data: match, message: 'Match score updated' });
  } catch (err) {
    next(err);
  }
};

export const addMatchEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { matchId, playerId, type, minute, detail } = req.body;

    if (!matchId || !type || minute === undefined) {
      res.status(400).json({ success: false, message: 'matchId, type, and minute are required' });
      return;
    }

    const event = await prisma.matchEvent.create({
      data: { matchId, playerId: playerId || null, type: type as EventType, minute: parseInt(minute), detail },
      include: { match: true },
    });

    // Update MatchPlayer stats based on event type
    if (playerId) {
      const matchPlayer = await prisma.matchPlayer.upsert({
        where: { matchId_playerId: { matchId, playerId } },
        update: {
          ...(type === 'GOAL' && { goals: { increment: 1 } }),
          ...(type === 'ASSIST' && { assists: { increment: 1 } }),
          ...(type === 'YELLOW_CARD' && { yellowCards: { increment: 1 } }),
          ...(type === 'RED_CARD' && { redCards: { increment: 1 } }),
          ...(type === 'PENALTY_MISS' && { penaltyMisses: { increment: 1 } }),
        },
        create: {
          matchId,
          playerId,
          goals: type === 'GOAL' ? 1 : 0,
          assists: type === 'ASSIST' ? 1 : 0,
          yellowCards: type === 'YELLOW_CARD' ? 1 : 0,
          redCards: type === 'RED_CARD' ? 1 : 0,
          penaltyMisses: type === 'PENALTY_MISS' ? 1 : 0,
        },
      });

      // Recalculate all fantasy teams for this match
      await recalculateMatchPoints(matchId);
    }

    // Emit to all clients watching this match
    emitMatchEvent(matchId, {
      type,
      minute: parseInt(minute),
      playerId,
      detail,
      id: event.id,
    });

    res.json({ success: true, data: event, message: 'Event added successfully' });
  } catch (err) {
    next(err);
  }
};

export const updatePlayer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { price, name, image } = req.body;

    const player = await prisma.player.update({
      where: { id },
      data: {
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(name && { name }),
        ...(image && { image }),
      },
    });

    res.json({ success: true, data: player });
  } catch (err) {
    next(err);
  }
};

export const triggerScoreRecalc = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { matchId } = req.params;
    await recalculateMatchPoints(matchId);
    res.json({ success: true, message: `Points recalculated for match ${matchId}` });
  } catch (err) {
    next(err);
  }
};

export const getAdminStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [userCount, leagueCount, matchCount, liveCount] = await Promise.all([
      prisma.user.count(),
      prisma.league.count(),
      prisma.match.count(),
      prisma.match.count({ where: { status: 'LIVE' } }),
    ]);

    res.json({
      success: true,
      data: { userCount, leagueCount, matchCount, liveCount },
    });
  } catch (err) {
    next(err);
  }
};
