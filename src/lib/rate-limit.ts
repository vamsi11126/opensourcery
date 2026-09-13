const requests = new Map<string, number[]>();

/**
 * Returns the best-effort real client IP from a Next.js Request.
 */
export function getClientIp(request: Request): string {
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0];
    if (first) return first.trim();
  }

  return 'unknown';
}

/**
 * Simple in-memory sliding-window rate limiter per IP / key.
 *
 * @param key      Identifier for the rate-limit bucket (e.g. IP or user ID)
 * @param limit    Maximum requests allowed in the window (default: 10)
 * @param windowMs Window length in milliseconds (default: 60 000)
 * @returns        `true` if allowed, `false` if rate limited
 */
export function rateLimit(
  key: string,
  limit = 10,
  windowMs = 60_000,
): boolean {
  const now = Date.now();
  const timestamps = (requests.get(key) ?? []).filter((time) => now - time < windowMs);

  if (timestamps.length >= limit) {
    return false;
  }

  timestamps.push(now);
  requests.set(key, timestamps);
  return true;
}
