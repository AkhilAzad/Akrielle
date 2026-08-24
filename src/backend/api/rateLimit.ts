/**
 * A tiny in-memory, fixed-window rate limiter, keyed by client IP.
 *
 * Scope & limits: state lives in this module's memory, so it resets on
 * cold start and is NOT shared across multiple server instances (each
 * serverless instance keeps its own window). This is an intentional,
 * zero-dependency baseline safeguard against accidental hammering and
 * casual abuse — not a distributed quota. If AXL later needs a hard,
 * cross-instance limit, back this with a shared store (e.g. the Supabase
 * Postgres planned for persistence, or Upstash Redis).
 */

interface WindowState {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, WindowState>();
let lastSweep = 0;

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the current window resets (for the Retry-After header). */
  retryAfter: number;
  /** Requests still allowed in the current window. */
  remaining: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();

  // Opportunistically drop expired buckets so the map can't grow forever.
  // Runs at most once per window to keep this O(1) amortized.
  if (now - lastSweep > windowMs) {
    for (const [k, win] of buckets) {
      if (now >= win.resetAt) buckets.delete(k);
    }
    lastSweep = now;
  }

  const existing = buckets.get(key);

  if (!existing || now >= existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0, remaining: limit - 1 };
  }

  existing.count += 1;
  const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));

  if (existing.count > limit) {
    return { ok: false, retryAfter, remaining: 0 };
  }

  return {
    ok: true,
    retryAfter,
    remaining: Math.max(0, limit - existing.count),
  };
}

/**
 * Best-effort client IP from common proxy headers (Vercel and most hosts
 * set x-forwarded-for). Falls back to a shared key so the limiter still
 * functions — conservatively — when no IP can be determined.
 */
export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return (
    req.headers.get("x-real-ip") ??
    req.headers.get("cf-connecting-ip") ??
    "unknown"
  );
}
