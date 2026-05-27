'use client';

import { createAuthClient } from '@neondatabase/neon-js/auth';

// ─── Neon Auth Client ────────────────────────────────────────────────────────
// Powered by Better Auth, hosted by Neon. Handles:
// - Email/password signup with verification codes
// - Google OAuth (shared keys, no credentials needed)
// - Session management

const NEON_AUTH_URL =
  process.env.NEXT_PUBLIC_NEON_AUTH_URL ||
  'https://ep-proud-poetry-aogv5v4v.neonauth.c-2.ap-southeast-1.aws.neon.tech/neondb/auth';

// createAuthClient takes URL as first arg, returns VanillaBetterAuthClient
// API: neonAuth.signIn.email({...}), neonAuth.signUp.email({...}), etc.
export const neonAuth = createAuthClient(NEON_AUTH_URL);

export { NEON_AUTH_URL };
