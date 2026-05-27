import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { verifyNeonToken } from '../auth/neonAuth';
import prisma from '../lib/prisma';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  isAdmin: boolean;
  totalPoints: number;
}

declare global {
  namespace Express {
    interface User extends AuthUser {}
  }
}

/**
 * Extract Bearer token from Authorization header.
 */
function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return null;
}

/**
 * Try to authenticate via Neon Auth (JWKS).
 * Looks up the user in our DB by the Neon Auth `sub` (stored in user.googleId field)
 * or by email, and returns the AuthUser if found.
 */
async function tryNeonAuth(token: string): Promise<AuthUser | null> {
  const payload = await verifyNeonToken(token);
  if (!payload?.sub || !payload?.email) return null;

  // Find user by neonAuthId (stored in googleId field for compatibility) or by email
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { googleId: `neon:${payload.sub}` },
        { email: payload.email },
      ],
    },
    select: { id: true, email: true, name: true, avatar: true, isAdmin: true, totalPoints: true },
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    isAdmin: user.isAdmin,
    totalPoints: user.totalPoints,
  };
}

/**
 * Dual-mode authentication middleware.
 * 1. Tries Neon Auth (JWKS-verified JWT) first
 * 2. Falls back to legacy Passport JWT (symmetric key)
 * Both paths resolve to the same AuthUser shape on req.user.
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ success: false, message: 'Unauthorized — please log in' });
    return;
  }

  // Try Neon Auth first (async)
  tryNeonAuth(token)
    .then((neonUser) => {
      if (neonUser) {
        req.user = neonUser;
        return next();
      }
      // Fall back to legacy Passport JWT
      passport.authenticate('jwt', { session: false }, (err: Error | null, user: AuthUser | false) => {
        if (err) return next(err);
        if (!user) {
          res.status(401).json({ success: false, message: 'Unauthorized — please log in' });
          return;
        }
        req.user = user;
        next();
      })(req, res, next);
    })
    .catch(() => {
      // Neon Auth check failed, fall back to legacy
      passport.authenticate('jwt', { session: false }, (err: Error | null, user: AuthUser | false) => {
        if (err) return next(err);
        if (!user) {
          res.status(401).json({ success: false, message: 'Unauthorized — please log in' });
          return;
        }
        req.user = user;
        next();
      })(req, res, next);
    });
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user?.isAdmin) {
    res.status(403).json({ success: false, message: 'Forbidden — admin access required' });
    return;
  }
  next();
};

export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  const token = extractToken(req);
  if (!token) {
    return next();
  }

  tryNeonAuth(token)
    .then((neonUser) => {
      if (neonUser) {
        req.user = neonUser;
        return next();
      }
      passport.authenticate('jwt', { session: false }, (_err: Error | null, user: AuthUser | false) => {
        if (user) req.user = user;
        next();
      })(req, res, next);
    })
    .catch(() => {
      passport.authenticate('jwt', { session: false }, (_err: Error | null, user: AuthUser | false) => {
        if (user) req.user = user;
        next();
      })(req, res, next);
    });
};
