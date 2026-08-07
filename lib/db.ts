import { neon } from "@neondatabase/serverless";

/**
 * Tagged-template SQL client backed by Neon's serverless HTTP driver.
 * Usage:
 *   const rows = await sql`SELECT * FROM users WHERE id = ${userId}`;
 * Values are automatically parameterized — never build query strings with
 * plain JS string concatenation.
 */
export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add it in Vercel -> Project -> Settings -> Environment Variables."
    );
  }
  return neon(url);
}

export const sql = getSql;
