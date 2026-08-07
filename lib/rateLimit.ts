import { getSql } from "./db";

const WINDOW_MINUTES = 10;
const MAX_ATTEMPTS_PER_WINDOW = 5;

/**
 * Returns true if the given PlayFab ID is allowed to request another link
 * code for this game right now, and records the attempt if so.
 * Backed by Postgres so it works correctly across serverless function
 * instances (no in-memory counters, which don't survive across invocations).
 */
export async function checkAndRecordLinkCodeAttempt(
  gameId: string,
  playfabId: string
): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  const sql = getSql();

  const recent = await sql`
    SELECT attempted_at FROM link_code_attempts
    WHERE game_id = ${gameId}
      AND playfab_id = ${playfabId}
      AND attempted_at > now() - (${WINDOW_MINUTES} * interval '1 minute')
    ORDER BY attempted_at ASC
  `;

  if (recent.length >= MAX_ATTEMPTS_PER_WINDOW) {
    const oldest = new Date(recent[0].attempted_at as string).getTime();
    const windowEnds = oldest + WINDOW_MINUTES * 60 * 1000;
    const retryAfterSeconds = Math.max(1, Math.ceil((windowEnds - Date.now()) / 1000));
    return { allowed: false, retryAfterSeconds };
  }

  await sql`
    INSERT INTO link_code_attempts (game_id, playfab_id)
    VALUES (${gameId}, ${playfabId})
  `;

  return { allowed: true };
}
