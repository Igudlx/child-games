import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSql } from "@/lib/db";
import { getGameConfig } from "@/lib/games.config";
import { getActiveLinkedAccount } from "@/lib/linkedAccount";
import { getUserBans } from "@/lib/playfab";

export async function GET(req: NextRequest, { params }: { params: Promise<{ gameId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { gameId } = await params;
  const config = getGameConfig(gameId);
  if (!config) return NextResponse.json({ error: "Unknown game" }, { status: 404 });

  const linked = await getActiveLinkedAccount(session.userId, gameId);
  if (!linked) return NextResponse.json({ error: "Game not linked" }, { status: 404 });

  const forceRefresh = req.nextUrl.searchParams.get("refresh") === "true";
  const sql = getSql();

  if (forceRefresh) {
    const bans = await getUserBans(config, linked.playfab_id);
    await sql`
      UPDATE synced_account_data SET bans = ${JSON.stringify(bans.BanData ?? [])}, synced_at = now()
      WHERE linked_account_id = ${linked.id}
    `;
  }

  const rows = await sql`
    SELECT bans, synced_at FROM synced_account_data WHERE linked_account_id = ${linked.id}
  `;
  const row = rows[0] as { bans: Array<Record<string, unknown>>; synced_at: string } | undefined;
  const bans = row?.bans ?? [];

  const active = bans.filter((b) => b.Active === true);
  const permanent = active.filter((b) => b.Permanent === true);
  const temporary = active.filter((b) => b.Permanent !== true);

  return NextResponse.json({
    active,
    permanent,
    temporary,
    syncedAt: row?.synced_at ?? null,
  });
}
