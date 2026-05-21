import prisma from '../lib/prisma';
import { Request, Response, NextFunction } from 'express';
import { emitLeaderboardUpdate } from '../sockets';


function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export const createLeague = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name } = req.body;
    if (!name || name.trim().length < 3) {
      res.status(400).json({ success: false, message: 'League name must be at least 3 characters' });
      return;
    }

    // Generate unique invite code
    let inviteCode = generateInviteCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.league.findUnique({ where: { inviteCode } });
      if (!existing) break;
      inviteCode = generateInviteCode();
      attempts++;
    }

    const league = await prisma.league.create({
      data: {
        name: name.trim(),
        inviteCode,
        ownerId: req.user!.id,
        maxMembers: 10,
        members: {
          create: { userId: req.user!.id },
        },
      },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        members: {
          include: { user: { select: { id: true, name: true, avatar: true, totalPoints: true } } },
        },
      },
    });

    res.status(201).json({ success: true, data: league });
  } catch (err) {
    next(err);
  }
};

export const joinLeague = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { inviteCode } = req.body;
    if (!inviteCode) {
      res.status(400).json({ success: false, message: 'Invite code is required' });
      return;
    }

    const league = await prisma.league.findUnique({
      where: { inviteCode: inviteCode.trim().toUpperCase() },
      include: { members: true },
    });

    if (!league) {
      res.status(404).json({ success: false, message: 'Invalid invite code — league not found' });
      return;
    }

    const alreadyMember = league.members.some((m) => m.userId === req.user!.id);
    if (alreadyMember) {
      res.status(409).json({ success: false, message: 'You are already a member of this league' });
      return;
    }

    if (league.members.length >= league.maxMembers) {
      res.status(400).json({ success: false, message: `League is full (max ${league.maxMembers} members)` });
      return;
    }

    await prisma.leagueMember.create({ data: { leagueId: league.id, userId: req.user!.id } });

    const updatedLeague = await prisma.league.findUnique({
      where: { id: league.id },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        members: {
          include: { user: { select: { id: true, name: true, avatar: true, totalPoints: true } } },
        },
      },
    });

    res.json({ success: true, data: updatedLeague });
  } catch (err) {
    next(err);
  }
};

export const getMyLeagues = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const memberships = await prisma.leagueMember.findMany({
      where: { userId: req.user!.id },
      include: {
        league: {
          include: {
            owner: { select: { id: true, name: true, avatar: true } },
            _count: { select: { members: true } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    const leagues = memberships.map((m) => m.league);
    res.json({ success: true, data: leagues });
  } catch (err) {
    next(err);
  }
};

export const getLeague = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const membership = await prisma.leagueMember.findFirst({
      where: { leagueId: id, userId: req.user!.id },
    });
    if (!membership) {
      res.status(403).json({ success: false, message: 'You are not a member of this league' });
      return;
    }

    const league = await prisma.league.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        members: {
          include: { user: { select: { id: true, name: true, avatar: true, totalPoints: true } } },
          orderBy: { joinedAt: 'asc' },
        },
      },
    });

    if (!league) {
      res.status(404).json({ success: false, message: 'League not found' });
      return;
    }

    res.json({ success: true, data: league });
  } catch (err) {
    next(err);
  }
};

export const getLeagueLeaderboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const members = await prisma.leagueMember.findMany({
      where: { leagueId: id },
      include: {
        user: {
          select: {
            id: true, name: true, avatar: true, totalPoints: true,
            fantasyTeams: { select: { totalPoints: true } },
          },
        },
      },
    });

    const ranked = members
      .map((m) => ({
        userId: m.user.id,
        name: m.user.name,
        avatar: m.user.avatar,
        totalPoints: m.user.fantasyTeams.reduce((sum, t) => sum + t.totalPoints, 0),
        matchesPlayed: m.user.fantasyTeams.length,
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((u, idx) => ({ ...u, rank: idx + 1 }));

    res.json({ success: true, data: ranked });
  } catch (err) {
    next(err);
  }
};

export const leaveLeague = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const league = await prisma.league.findUnique({ where: { id } });
    if (!league) {
      res.status(404).json({ success: false, message: 'League not found' });
      return;
    }
    if (league.ownerId === req.user!.id) {
      res.status(400).json({ success: false, message: 'League owner cannot leave. Delete the league instead.' });
      return;
    }
    await prisma.leagueMember.deleteMany({ where: { leagueId: id, userId: req.user!.id } });
    res.json({ success: true, message: 'Left league successfully' });
  } catch (err) {
    next(err);
  }
};

export const removeMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, userId } = req.params;
    const league = await prisma.league.findUnique({ where: { id } });
    if (!league) {
      res.status(404).json({ success: false, message: 'League not found' });
      return;
    }
    if (league.ownerId !== req.user!.id && !req.user!.isAdmin) {
      res.status(403).json({ success: false, message: 'Only the league owner can remove members' });
      return;
    }
    if (userId === league.ownerId) {
      res.status(400).json({ success: false, message: 'Cannot remove the league owner' });
      return;
    }
    await prisma.leagueMember.deleteMany({ where: { leagueId: id, userId } });
    emitLeaderboardUpdate(id);
    res.json({ success: true, message: 'Member removed successfully' });
  } catch (err) {
    next(err);
  }
};

export const deleteLeague = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const league = await prisma.league.findUnique({ where: { id } });
    if (!league) {
      res.status(404).json({ success: false, message: 'League not found' });
      return;
    }
    if (league.ownerId !== req.user!.id && !req.user!.isAdmin) {
      res.status(403).json({ success: false, message: 'Only the league owner can delete this league' });
      return;
    }
    await prisma.league.delete({ where: { id } });
    res.json({ success: true, message: 'League deleted successfully' });
  } catch (err) {
    next(err);
  }
};
