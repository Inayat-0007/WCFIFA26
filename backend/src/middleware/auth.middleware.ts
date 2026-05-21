import { Request, Response, NextFunction } from 'express';
import passport from 'passport';

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

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  passport.authenticate('jwt', { session: false }, (err: Error | null, user: AuthUser | false) => {
    if (err) return next(err);
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized — please log in' });
      return;
    }
    req.user = user;
    next();
  })(req, res, next);
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user?.isAdmin) {
    res.status(403).json({ success: false, message: 'Forbidden — admin access required' });
    return;
  }
  next();
};

export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  passport.authenticate('jwt', { session: false }, (_err: Error | null, user: AuthUser | false) => {
    if (user) req.user = user;
    next();
  })(req, res, next);
};
