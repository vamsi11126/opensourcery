/**
 * Defense-in-depth middleware for admin routes.
 *
 * EDGE RUNTIME COMPATIBILITY:
 * This file runs on the Edge runtime (Vercel Edge Network). It MUST NOT import
 * anything that uses Node.js-native bindings. In particular, @/lib/auth imports
 * PrismaAdapter and the Prisma client — both of which use native Node.js bindings
 * unavailable at the Edge. Importing auth.ts from middleware would cause the
 * middleware to either crash on startup or silently fall back to Node.js runtime,
 * defeating its purpose as a fast edge-layer guard.
 *
 * We therefore import from @/lib/auth.config (edge-safe: no Prisma, no providers,
 * no Node.js-native code) and wrap it with NextAuth's middleware helper directly.
 * The role claim in req.auth.user.role is read directly from the signed JWT
 * cookie — no database access is needed or performed here.
 *
 * Covers:
 *   /admin/*          — admin pages
 *   /api/admin/*      — admin API routes
 */
import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';
import { NextResponse } from 'next/server';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAdminRoute =
    pathname.startsWith('/admin') || pathname.startsWith('/api/admin');

  if (isAdminRoute) {
    const role = req.auth?.user?.role;
    if (!req.auth || (role !== 'ADMIN' && role !== 'MODERATOR')) {
      // Redirect unauthenticated or insufficient-role requests to the home page.
      // The route handler is NEVER invoked — this check happens at the Edge
      // before the request reaches any server-side code.
      return NextResponse.redirect(new URL('/', req.url));
    }
  }
});

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
