import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSql } from "@/lib/db";
import { getGameConfig } from "@/lib/games.config";

export async function GET(_req: Request, { params }: { params: Promise<{ gameId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { gameId } = await params;
  const config = getGameConfig(gameId);
  if (!config) return NextResponse.json({ error: "Unknown game" }, { status: 404 });

  const sql = getSql();
  const rows = await sql`
    SELECT id, event_type, event_data, created_at FROM history
    WHERE user_id = ${session.userId} AND game_id = ${gameId}
    ORDER BY created_at DESC
    LIMIT 100
  `;

  return NextResponse.json({ events: rows });
}
