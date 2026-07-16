import { neon, neonConfig } from '@neondatabase/serverless';

// Vercel's serverless functions benefit from connection caching across
// invocations of the same warm instance, which the Neon driver handles
// internally over HTTP (no persistent TCP connection required).
neonConfig.fetchConnectionCache = true;

if (!process.env.DATABASE_URL) {
  // We throw lazily (inside functions) rather than at import time in most
  // files, but this module is only ever imported by server code, so it's
  // safe to surface a clear error immediately if it's missing.
  console.warn(
    '[db] DATABASE_URL is not set. Add it in Vercel → Settings → Environment Variables.'
  );
}

// `sql` is a tagged-template query function: sql`SELECT * FROM users WHERE id = ${id}`
// Parameters are automatically escaped — never build queries with string concatenation.
export const sql = neon(process.env.DATABASE_URL || '');
