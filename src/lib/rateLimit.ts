/**
 * Simple in-memory fixed-window rate limiter for server-side abuse protection.
 *
 * Suitable for a single-instance deployment. For multi-instance production
 * deployments, replace with a shared store (e.g. Redis/Upstash) — the call
 * signature stays the same.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Periodically purge expired buckets so the map cannot grow unbounded.
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;
let lastSweep = Date.now();

function sweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/**
 * Returns true if the action is allowed, false if the rate limit is exceeded.
 *
 * @param key     Unique identifier for the caller/action (e.g. `orders:<ip>`).
 * @param limit   Maximum number of allowed calls per window.
 * @param windowMs Window length in milliseconds.
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  bucket.count += 1;
  return bucket.count <= limit;
}