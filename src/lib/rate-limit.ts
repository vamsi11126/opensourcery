import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Returns the best-effort real client IP from a Next.js Request.
 *
 * Priority:
 * 1. `x-real-ip` — set by most reverse proxies to the actual client IP
 * 2. First entry of `x-forwarded-for` (trim + split on comma) — never trusts the
 *    full header as an opaque string, since clients can append values
 * 3. Falls back to 'unknown' when neither header is present
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

// ---------------------------------------------------------------------------
// Upstash-backed rate limiter
// ---------------------------------------------------------------------------

let _redis: Redis | null = null;
const _limiters = new Map<string, Ratelimit>();

function getRedis(): Redis | null {
  if (_redis) return _redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  _redis = new Redis({ url, token });
  return _redis;
}

/**
 * Rate-limit a key using a sliding-window algorithm backed by Upstash Redis.
 *
 * @param key      Identifier for the rate-limit bucket (e.g. `"register:1.2.3.4"`)
 * @param limit    Maximum requests allowed in the window (default: 10)
 * @param windowMs Window length in milliseconds (default: 60 000)
 * @returns        `true` if the request is allowed, `false` if it should be denied (429)
 *
 * Graceful degradation: if Upstash is not configured (env vars missing) or
 * unavailable, this logs a warning and returns `true` (allow) so the app
 * stays functional during development without Redis configured.
 */
export async function rateLimit(
  key: string,
  limit = 10,
  windowMs = 60_000,
): Promise<boolean> {
  const redis = getRedis();
  if (!redis) {
    // Dev fallback — warn once per process so CI/CD doesn't break
    if (process.env.NODE_ENV !== 'test') {
      console.warn(
        '[rate-limit] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not set — ' +
          'rate limiting is disabled. Set these env vars for production.',
      );
    }
    return true;
  }

  // Cache a Ratelimit instance per (limit, windowMs) combination to avoid
  // recreating on every request.
  const cacheKey = `${limit}:${windowMs}`;
  let limiter = _limiters.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
      prefix: 'rl',
    });
    _limiters.set(cacheKey, limiter);
  }

  try {
    const { success } = await limiter.limit(key);
    return success;
  } catch (err) {
    // If Redis is temporarily unavailable, fail open (allow) rather than
    // hard-blocking all users — log so the issue is visible.
    console.error('[rate-limit] Redis error, failing open:', err);
    return true;
  }
}
