import prisma from '../lib/prisma';
import { Request, Response, NextFunction } from 'express';


export const getAllMatches = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, group, round, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (group) where.group = group;
    if (round) where.round = round;

    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        where,
        include: {
          _count: { select: { events: true, fantasyTeams: true } },
        },
        orderBy: { kickoffTime: 'asc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.match.count({ where }),
    ]);

    res.json({
      success: true,
      data: matches,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getMatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        events: { orderBy: { minute: 'asc' } },
        matchPlayers: {
          include: { player: true },
          orderBy: { fantasyPoints: 'desc' },
        },
      },
    });

    if (!match) {
      res.status(404).json({ success: false, message: 'Match not found' });
      return;
    }

    res.json({ success: true, data: match });
  } catch (err) {
    next(err);
  }
};

export const getLiveMatches = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const matches = await prisma.match.findMany({
      where: { status: 'LIVE' },
      include: {
        events: { orderBy: { minute: 'desc' }, take: 5 },
      },
      orderBy: { kickoffTime: 'asc' },
    });
    res.json({ success: true, data: matches });
  } catch (err) {
    next(err);
  }
};

export const getUpcomingMatches = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const matches = await prisma.match.findMany({
      where: { status: 'UPCOMING', kickoffTime: { gte: new Date() } },
      orderBy: { kickoffTime: 'asc' },
      take: 10,
    });
    res.json({ success: true, data: matches });
  } catch (err) {
    next(err);
  }
};
