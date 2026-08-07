import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSql } from "@/lib/db";
import { GAMES } from "@/lib/games.config";
import type { GameSummary } from "@/lib/types";

export async function GET() {
  const session = await getSession();

  let linkedGameIds = new Set<string>();
  if (session) {
    const sql = getSql();
    const rows = await sql`
      SELECT game_id FROM linked_accounts
      WHERE user_id = ${session.userId} AND status = 'linked'
    `;
    linkedGameIds = new Set(rows.map((r) => r.game_id as string));
  }

  const games: GameSummary[] = GAMES.map((g) => ({
    id: g.id,
    name: g.name,
    tagline: g.tagline,
    downloadUrl: g.downloadUrl,
    linked: linkedGameIds.has(g.id),
  }));

  return NextResponse.json({ games });
}
