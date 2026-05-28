import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler } from '../middleware/asyncHandler';

export const getUserAchievements = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Fetch all achievements
    const achievements = await prisma.achievement.findMany({
      orderBy: { pointsAwarded: 'asc' },
    });

    // Fetch user's unlocked achievements
    const unlocked = await prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true, unlockedAt: true },
    });

    // Map unlocked status to achievements
    const unlockedMap = new Map(unlocked.map((u) => [u.achievementId, u.unlockedAt]));

    const data = achievements.map((ach) => {
      const isUnlocked = unlockedMap.has(ach.id);
      return {
        ...ach,
        isUnlocked,
        unlockedAt: isUnlocked ? unlockedMap.get(ach.id) : null,
      };
    });

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

export const getUserHistory = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;

    const history = await prisma.seasonHistory.findMany({
      where: { userId },
      orderBy: { season: 'desc' }, // Latest season first
    });

    res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
});
