import { jwtVerify, createRemoteJWKSet } from 'jose';

// ─── Neon Auth JWKS Verification ─────────────────────────────────────────────
// Neon Auth (powered by Better Auth) signs tokens with asymmetric keys.
// We verify them using the JWKS endpoint, which rotates keys automatically.

const JWKS_URL = process.env.NEON_AUTH_JWKS_URL
  || 'https://ep-proud-poetry-aogv5v4v.neonauth.c-2.ap-southeast-1.aws.neon.tech/neondb/auth/.well-known/jwks.json';

const JWKS = createRemoteJWKSet(new URL(JWKS_URL));

export interface NeonAuthPayload {
  sub: string;       // Neon Auth user ID
  email: string;
  name?: string;
  image?: string;
  iat?: number;
  exp?: number;
  iss?: string;
}

/**
 * Verify a Neon Auth JWT token using the JWKS endpoint.
 * Returns the decoded payload if valid, or null if invalid.
 */
export async function verifyNeonToken(token: string): Promise<NeonAuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWKS);
    return payload as unknown as NeonAuthPayload;
  } catch {
    return null;
  }
}
