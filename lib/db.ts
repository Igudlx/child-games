import { neon, neonConfig } from '@neondatabase/serverless';

// Vercel's serverless functions benefit from connection caching across
// invocations of the same warm instance, which the Neon driver handles
// internally over HTTP (no persistent TCP connection required).
neonConfig.fetchConnectionCache = true;

type SqlFn = ReturnType<typeof neon>;

let cachedSql: SqlFn | undefined;

function getClient(): SqlFn {
  if (cachedSql) return cachedSql;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'Missing DATABASE_URL environment variable. Set it in Vercel → Settings → Environment Variables, then redeploy.'
    );
  }

  cachedSql = neon(connectionString);
  return cachedSql;
}

// `sql` is a tagged-template query function: sql`SELECT * FROM users WHERE id = ${id}`
// Parameters are automatically escaped — never build queries with string concatenation.
// The actual connection is created lazily on first use (see getClient above),
// not at import time, so simply importing this file during `next build`
// (which Next.js does to analyze every API route) never fails even if
// DATABASE_URL isn't set yet.
export const sql: SqlFn = ((...args: Parameters<SqlFn>) => {
  return getClient()(...args);
}) as SqlFn;
