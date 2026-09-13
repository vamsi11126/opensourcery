import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ---------------------------------------------------------------------------
// Production boot guard
//
// Rate limiting is a security control. A security control that silently
// fails open when misconfigured is worse than no control at all, because it
// passes code review ("rate limiting is there") while providing zero runtime
// protection. In production we therefore refuse to start if the required
// Upstash env vars are missing — it is better to crash loudly on first request
// (the serverless cold-start that loads this module) than to serve unlimited
// traffic without any operator realising rate limiting is disabled.
//
// In development and test we keep the graceful fallback (allow + warn) so
// local dev without a Redis instance still works.
// ---------------------------------------------------------------------------
if (process.env.NODE_ENV === 'production') {
  const missing: string[] = [];
  if (!process.env.UPSTASH_REDIS_REST_URL) missing.push('UPSTASH_REDIS_REST_URL');
  if (!process.env.UPSTASH_REDIS_REST_TOKEN) missing.push('UPSTASH_REDIS_REST_TOKEN');
  if (missing.length > 0) {
    throw new Error(
      `[rate-limit] Missing required environment variable(s) in production: ${missing.join(', ')}. ` +
        'Rate limiting is a security control and must be configured before the app serves traffic. ' +
        'Create a free Upstash Redis instance at https://console.upstash.com/ and set these variables.',
    );
  }
}

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
 */
export async function rateLimit(
  key: string,
  limit = 10,
  windowMs = 60_000,
): Promise<boolean> {
  const redis = getRedis();
  if (!redis) {
    // Non-production fallback: warn and allow.
    // This path is unreachable in production because the module-level guard
    // above throws before any code reaches this point if env vars are missing.
    if (process.env.NODE_ENV !== 'test') {
      console.warn(
        '[rate-limit] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not set — ' +
          'rate limiting is disabled. This is acceptable in local dev; set these vars for production.',
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
