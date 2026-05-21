import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { recalculateMatchPoints } from '../services/scoringEngine.service';
import { emitScoreUpdate, emitMatchEvent } from '../sockets';

const prisma = new PrismaClient();

export const saveTeam = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { matchId, playerIds, captainId, viceCaptainId } = req.body;

    if (!matchId || !playerIds || !captainId || !viceCaptainId) {
      res.status(400).json({ success: false, message: 'matchId, playerIds, captainId, viceCaptainId are required' });
      return;
    }

    if (!Array.isArray(playerIds) || playerIds.length !== 11) {
      res.status(400).json({ success: false, message: 'You must select exactly 11 players' });
      return;
    }

    if (!playerIds.includes(captainId)) {
      res.status(400).json({ success: false, message: 'Captain must be one of your selected players' });
      return;
    }

    if (!playerIds.includes(viceCaptainId)) {
      res.status(400).json({ success: false, message: 'Vice-Captain must be one of your selected players' });
      return;
    }

    if (captainId === viceCaptainId) {
      res.status(400).json({ success: false, message: 'Captain and Vice-Captain must be different players' });
      return;
    }

    // Check match exists and is not started
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) {
      res.status(404).json({ success: false, message: 'Match not found' });
      return;
    }
    if (match.status === 'COMPLETED') {
      res.status(400).json({ success: false, message: 'Cannot change team — match is completed' });
      return;
    }
    if (match.status === 'LIVE') {
      res.status(400).json({ success: false, message: 'Cannot change team — match is in progress' });
      return;
    }

    // Validate players exist
    const players = await prisma.player.findMany({
      where: { id: { in: playerIds } },
    });

    if (players.length !== 11) {
      res.status(400).json({ success: false, message: 'One or more invalid player IDs' });
      return;
    }

    // Validate position rules: must have at least 1 GK
    const positions = players.map((p) => p.position);
    const gkCount = positions.filter((p) => p === 'GK').length;
    if (gkCount !== 1) {
      res.status(400).json({ success: false, message: 'Team must have exactly 1 Goalkeeper' });
      return;
    }

    // Validate budget (100 credits)
    const totalCost = players.reduce((sum, p) => sum + p.price, 0);
    if (totalCost > 100) {
      res.status(400).json({ success: false, message: `Budget exceeded: ${totalCost.toFixed(1)} > 100 credits` });
      return;
    }

    // Upsert fantasy team
    const existingTeam = await prisma.fantasyTeam.findUnique({
      where: { userId_matchId: { userId: req.user!.id, matchId } },
    });

    let team;
    if (existingTeam) {
      // Update: delete old players first
      await prisma.teamPlayer.deleteMany({ where: { fantasyTeamId: existingTeam.id } });
      team = await prisma.fantasyTeam.update({
        where: { id: existingTeam.id },
        data: {
          captainId,
          viceCaptainId,
          budgetUsed: Math.round(totalCost * 10) / 10,
          teamPlayers: {
            create: playerIds.map((pid: string) => ({ playerId: pid })),
          },
        },
        include: {
          teamPlayers: { include: { player: true } },
        },
      });
    } else {
      team = await prisma.fantasyTeam.create({
        data: {
          userId: req.user!.id,
          matchId,
          captainId,
          viceCaptainId,
          budgetUsed: Math.round(totalCost * 10) / 10,
          teamPlayers: {
            create: playerIds.map((pid: string) => ({ playerId: pid })),
          },
        },
        include: {
          teamPlayers: { include: { player: true } },
        },
      });
    }

    res.json({ success: true, data: team, message: 'Team saved successfully!' });
  } catch (err) {
    next(err);
  }
};

export const getMyTeam = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { matchId } = req.params;
    const team = await prisma.fantasyTeam.findUnique({
      where: { userId_matchId: { userId: req.user!.id, matchId } },
      include: {
        teamPlayers: {
          include: {
            player: {
              include: {
                matchPlayers: { where: { matchId }, select: { fantasyPoints: true, goals: true, assists: true } },
              },
            },
          },
        },
        match: { select: { status: true, kickoffTime: true, homeTeam: true, awayTeam: true } },
      },
    });

    if (!team) {
      res.status(404).json({ success: false, message: 'No team found for this match' });
      return;
    }

    res.json({ success: true, data: team });
  } catch (err) {
    next(err);
  }
};
