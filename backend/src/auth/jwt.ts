import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import jwt, { SignOptions } from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface JwtPayload {
  userId: string;
  email: string;
  isAdmin: boolean;
}

export function generateToken(userId: string, email: string, isAdmin: boolean): string {
  const options: SignOptions = { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'] };
  return jwt.sign(
    { userId, email, isAdmin },
    process.env.JWT_SECRET as string,
    options
  );
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
}

export function setupPassport(): void {
  // ─── JWT Strategy ─────────────────────────────────────────────────────────
  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.JWT_SECRET as string,
      },
      async (payload: JwtPayload, done) => {
        try {
          const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: { id: true, email: true, name: true, avatar: true, isAdmin: true, totalPoints: true },
          });
          if (!user) return done(null, false);
          return done(null, user);
        } catch (err) {
          return done(err, false);
        }
      }
    )
  );

  // ─── Google OAuth Strategy ─────────────────────────────────────────────────
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: `${process.env.API_URL || 'http://localhost:4000'}/api/auth/google/callback`,
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            if (!email) return done(new Error('No email from Google'), false);

            let user = await prisma.user.findFirst({
              where: { OR: [{ googleId: profile.id }, { email }] },
            });

            if (!user) {
              user = await prisma.user.create({
                data: {
                  googleId: profile.id,
                  email,
                  name: profile.displayName,
                  avatar: profile.photos?.[0]?.value || '⚽',
                  isAdmin: email === process.env.ADMIN_EMAIL,
                },
              });
            } else if (!user.googleId) {
              user = await prisma.user.update({
                where: { id: user.id },
                data: { googleId: profile.id },
              });
            }
            return done(null, user);
          } catch (err) {
            return done(err, false);
          }
        }
      )
    );
  }
}
