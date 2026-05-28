import prisma from '../lib/prisma';
import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';

export const saveTeam = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

    // ── CRITICAL: Time-based lock ─────────────────────────────────────────────
    // This is the primary guard. It locks the team the moment the real-world
    // kickoff time passes, regardless of whether the admin has toggled the
    // match status to LIVE yet. Without this, there's a race condition window
    // between actual kickoff and the status change.
    if (new Date() >= new Date(match.kickoffTime)) {
      res.status(400).json({
        success: false,
        message: 'Team locked — match has already kicked off',
        lockedAt: match.kickoffTime,
      });
      return;
    }

    // Status-based locks (belt-and-suspenders — covers manual status overrides)
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

    // Validate position rules: must have exactly 1 GK
    const positions = players.map((p) => p.position);
    const gkCount = positions.filter((p) => p === 'GK').length;
    if (gkCount !== 1) {
      res.status(400).json({ success: false, message: 'Team must have exactly 1 Goalkeeper' });
      return;
    }

    // Validate position distribution (covers all valid formations: 4-4-2, 4-3-3, 3-5-2, 3-4-3, 5-3-2)
    const defCount = positions.filter((p) => p === 'DEF').length;
    const midCount = positions.filter((p) => p === 'MID').length;
    const fwdCount = positions.filter((p) => p === 'FWD').length;
    if (defCount < 3 || defCount > 5) {
      res.status(400).json({ success: false, message: 'Must have 3-5 defenders' });
      return;
    }
    if (midCount < 3 || midCount > 5) {
      res.status(400).json({ success: false, message: 'Must have 3-5 midfielders' });
      return;
    }
    if (fwdCount < 1 || fwdCount > 3) {
      res.status(400).json({ success: false, message: 'Must have 1-3 forwards' });
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
});

export const getMyTeam = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { matchId } = req.params;
    const team = await prisma.fantasyTeam.findUnique({
      where: { userId_matchId: { userId: req.user!.id, matchId } },
      include: {
        teamPlayers: {
          include: {
            player: {
              include: {
                matchPlayers: { where: { matchId } },
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
});
