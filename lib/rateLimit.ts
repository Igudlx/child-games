import { sql } from './db';

interface RateLimitOptions {
  /** Unique key for what's being limited, e.g. `redeem:${ip}` or `generate:${playfabId}` */
  key: string;
  /** Max attempts allowed within the window */
  maxAttempts: number;
  /** Window length in seconds */
  windowSeconds: number;
}

/**
 * A simple fixed-window rate limiter backed by Postgres, because Vercel
 * serverless functions don't share memory between invocations — an
 * in-memory counter would silently reset on every cold start and provide
 * no real protection.
 *
 * Returns true if the request is allowed, false if the caller should be
 * rejected with 429 Too Many Requests.
 */
export async function checkRateLimit({
  key,
  maxAttempts,
  windowSeconds,
}: RateLimitOptions): Promise<boolean> {
  const rows = await sql`
    INSERT INTO rate_limits (rate_key, attempts, window_start)
    VALUES (${key}, 1, now())
    ON CONFLICT (rate_key) DO UPDATE SET
      attempts = CASE
        WHEN rate_limits.window_start < now() - (${windowSeconds}::text || ' seconds')::interval
          THEN 1
        ELSE rate_limits.attempts + 1
      END,
      window_start = CASE
        WHEN rate_limits.window_start < now() - (${windowSeconds}::text || ' seconds')::interval
          THEN now()
        ELSE rate_limits.window_start
      END
    RETURNING attempts;
  `;

  const attempts = rows[0]?.attempts ?? 1;
  return attempts <= maxAttempts;
}
