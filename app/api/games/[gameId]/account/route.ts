import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSql } from "@/lib/db";
import { getGameConfig } from "@/lib/games.config";
import { getActiveLinkedAccount } from "@/lib/linkedAccount";

export async function GET(_req: Request, { params }: { params: Promise<{ gameId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { gameId } = await params;
  const config = getGameConfig(gameId);
  if (!config) return NextResponse.json({ error: "Unknown game" }, { status: 404 });

  const linked = await getActiveLinkedAccount(session.userId, gameId);
  if (!linked) return NextResponse.json({ error: "Game not linked" }, { status: 404 });

  const sql = getSql();
  const rows = await sql`
    SELECT account_info, synced_at FROM synced_account_data WHERE linked_account_id = ${linked.id}
  `;
  const row = rows[0] as { account_info: Record<string, unknown>; synced_at: string } | undefined;

  return NextResponse.json({
    playFabId: linked.playfab_id,
    linkedAt: linked.linked_at,
    accountInfo: row?.account_info ?? {},
    syncedAt: row?.synced_at ?? null,
  });
}
