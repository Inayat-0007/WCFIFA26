import prisma from '../lib/prisma';
import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Position } from '@prisma/client';


export const getAllPlayers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { position, country, search, page = '1', limit = '50', matchId } = req.query;

    const where: Record<string, unknown> = {};
    if (position) where.position = position as Position;
    if (country) where.country = { contains: country as string, mode: 'insensitive' };
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { country: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [players, total] = await Promise.all([
      prisma.player.findMany({
        where,
        include: matchId
          ? { matchPlayers: { where: { matchId: matchId as string }, select: { fantasyPoints: true, goals: true, assists: true } } }
          : undefined,
        orderBy: { price: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.player.count({ where }),
    ]);

    res.json({
      success: true,
      data: players,
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

export const getPlayer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const player = await prisma.player.findUnique({
      where: { id },
      include: {
        matchPlayers: {
          include: { match: { select: { homeTeam: true, awayTeam: true, kickoffTime: true, status: true } } },
          orderBy: { match: { kickoffTime: 'desc' } },
        },
      },
    });
    if (!player) {
      res.status(404).json({ success: false, message: 'Player not found' });
      return;
    }
    res.json({ success: true, data: player });
  } catch (err) {
    next(err);
  }
};

export const getPlayersByMatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { matchId } = req.params;
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) {
      res.status(404).json({ success: false, message: 'Match not found' });
      return;
    }

    const players = await prisma.player.findMany({
      where: {
        OR: [
          { country: match.homeTeam },
          { country: match.awayTeam },
        ],
      },
      include: {
        matchPlayers: { where: { matchId }, select: { fantasyPoints: true, goals: true, assists: true, cleanSheet: true } },
      },
      orderBy: [{ position: 'asc' }, { price: 'desc' }],
    });

    res.json({ success: true, data: players });
  } catch (err) {
    next(err);
  }
};
