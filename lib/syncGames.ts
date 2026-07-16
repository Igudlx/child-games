import { sql } from './db';
import { games } from './games.config';

/**
 * Upserts every game from lib/games.config.ts into the `games` table.
 * Cheap to call on every request (single round trip, small table) and
 * means editing games.config.ts is the only step required to register
 * a new game — no manual SQL needed.
 */
export async function syncGamesTable(): Promise<void> {
  for (const game of games) {
    await sql`
      INSERT INTO games (id, name, playfab_title_id, download_url)
      VALUES (${game.id}, ${game.name}, ${game.playfabTitleId}, ${game.downloadLink})
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        playfab_title_id = EXCLUDED.playfab_title_id,
        download_url = EXCLUDED.download_url;
    `;
  }
}
