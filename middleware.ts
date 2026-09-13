/**
 * Defense-in-depth middleware for admin routes.
 *
 * next-auth v5 (beta) exposes `auth` as a higher-order middleware wrapper.
 * This runs before any route handler or page render, so an unauthenticated or
 * insufficiently-privileged request never reaches the route handler.
 *
 * Covers:
 *   /admin/*          — admin pages
 *   /api/admin/*      — admin API routes
 */
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAdminRoute =
    pathname.startsWith('/admin') || pathname.startsWith('/api/admin');

  if (isAdminRoute) {
    const role = req.auth?.user?.role;
    if (!req.auth || (role !== 'ADMIN' && role !== 'MODERATOR')) {
      // Redirect unauthenticated or insufficient-role requests to the home page.
      // The route handler is never invoked.
      return NextResponse.redirect(new URL('/', req.url));
    }
  }
});

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
