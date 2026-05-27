import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { verifyNeonToken } from '../auth/neonAuth';
import { generateToken } from '../auth/jwt';

const router = Router();

/**
 * POST /api/auth/neon/sync
 * 
 * Called by the frontend after a successful Neon Auth sign-up or sign-in.
 * Syncs the Neon Auth user to our Prisma User table and returns a
 * legacy JWT token + user data for backward compatibility with the rest of the app.
 * 
 * Body: { neonToken: string, name?: string, avatar?: string }
 */
router.post('/sync', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { neonToken, name, avatar } = req.body;

    if (!neonToken) {
      res.status(400).json({ success: false, message: 'neonToken is required' });
      return;
    }

    // Verify the Neon Auth token
    const payload = await verifyNeonToken(neonToken);
    if (!payload || !payload.sub || !payload.email) {
      res.status(401).json({ success: false, message: 'Invalid Neon Auth token' });
      return;
    }

    const neonId = `neon:${payload.sub}`;

    // Find or create user
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId: neonId },
          { email: payload.email },
        ],
      },
    });

    if (user) {
      // Link existing user to Neon Auth if not already linked
      if (user.googleId !== neonId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId: neonId },
        });
      }
    } else {
      // Create new user from Neon Auth data
      const isAdmin = payload.email === process.env.ADMIN_EMAIL;
      user = await prisma.user.create({
        data: {
          email: payload.email,
          name: name || payload.name || payload.email.split('@')[0],
          avatar: avatar || '⚽',
          googleId: neonId,
          isAdmin,
          // No password — Neon Auth manages credentials
        },
      });
    }

    // Generate a legacy JWT for backward compatibility with the rest of the app
    const token = generateToken(user.id, user.email, user.isAdmin);

    const { password: _pw, ...safeUser } = user;
    res.json({
      success: true,
      data: {
        user: {
          id: safeUser.id,
          name: safeUser.name,
          email: safeUser.email,
          avatar: safeUser.avatar,
          isAdmin: safeUser.isAdmin,
          totalPoints: safeUser.totalPoints,
          createdAt: safeUser.createdAt,
        },
        token,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/neon/session
 * 
 * Validates a Neon Auth token and returns the associated user.
 * Used by the frontend to check if a Neon Auth session is still valid.
 */
router.get('/session', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      res.status(401).json({ success: false, message: 'No token provided' });
      return;
    }

    const payload = await verifyNeonToken(token);
    if (!payload?.sub) {
      res.status(401).json({ success: false, message: 'Invalid token' });
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId: `neon:${payload.sub}` },
          { email: payload.email },
        ],
      },
      select: { id: true, name: true, email: true, avatar: true, isAdmin: true, totalPoints: true },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not synced yet' });
      return;
    }

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

export default router;
