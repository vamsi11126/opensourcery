/**
 * Edge-compatible auth configuration — no Prisma, no Node.js-native modules.
 *
 * REASON FOR THIS SPLIT:
 * middleware.ts runs on the Edge runtime (Vercel Edge Network). Prisma uses
 * native Node.js bindings (@prisma/client) that are not available in the Edge
 * runtime. Importing @/lib/auth (which uses PrismaAdapter and db) from
 * middleware.ts would cause the middleware to fail or silently fall back to
 * Node.js runtime, defeating its purpose as a fast edge-layer guard.
 *
 * This config is a subset of auth.ts that contains only:
 * - The JWT/session callbacks (read-only, no DB access needed — role is stored
 *   in the JWT at login time by the full auth.ts jwt() callback)
 * - The same secret and session strategy
 *
 * The full auth.ts (with PrismaAdapter, Credentials provider, DB lookups) is
 * used everywhere except middleware.
 *
 * See: https://authjs.dev/guides/edge-compatibility
 */
import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
  session: { strategy: 'jwt' },
  pages: { signIn: '/login', newUser: '/welcome' },
  providers: [],
  callbacks: {
    // In middleware, jwt() is NOT called — the token is verified from the
    // existing cookie without re-running the callback. Only session() is used
    // to shape the session object from the already-verified JWT claims.
    session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id);
        session.user.role =
          (token.role as 'USER' | 'MODERATOR' | 'ADMIN') || 'USER';
      }
      return session;
    },
  },
};
