import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { GAMES } from "@/lib/games.config";

/**
 * Keeps the `games` table in sync with lib/games.config.ts.
 * Protected by a separate admin secret (NOT a PlayFab key) so this can't
 * be triggered by random visitors. Visit:
 *   https://your-site.vercel.app/api/admin/sync-games?secret=YOUR_ADMIN_SECRET
 * after adding or editing a game in the config file and redeploying.
 */
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  const expected = process.env.ADMIN_SYNC_SECRET;

  if (!expected) {
    return NextResponse.json(
      { error: "ADMIN_SYNC_SECRET is not set on the server" },
      { status: 500 }
    );
  }
  if (secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = getSql();
  const results: string[] = [];

  for (const game of GAMES) {
    await sql`
      INSERT INTO games (id, name, playfab_title_id, download_url)
      VALUES (${game.id}, ${game.name}, ${game.playfabTitleId}, ${game.downloadUrl})
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        playfab_title_id = EXCLUDED.playfab_title_id,
        download_url = EXCLUDED.download_url,
        updated_at = now()
    `;
    results.push(game.id);
  }

  return NextResponse.json({ synced: results });
}
