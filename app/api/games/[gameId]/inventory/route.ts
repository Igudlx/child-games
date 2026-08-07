import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSql } from "@/lib/db";
import { getGameConfig } from "@/lib/games.config";
import { getActiveLinkedAccount } from "@/lib/linkedAccount";
import { getCombinedInfo } from "@/lib/playfab";

interface InventoryItem {
  ItemInstanceId: string;
  ItemId: string;
  DisplayName?: string;
  ItemClass?: string;
  RemainingUses?: number;
}

/** Items tagged/classed as cosmetic go in the Cosmetics list; everything
 *  else (consumables, currency-adjacent items, etc.) goes in Items. Adjust
 *  the match below if your catalog uses a different ItemClass string. */
function splitInventory(items: InventoryItem[]) {
  const cosmetics = items.filter((i) => (i.ItemClass ?? "").toLowerCase().includes("cosmetic"));
  const other = items.filter((i) => !(i.ItemClass ?? "").toLowerCase().includes("cosmetic"));
  return { cosmetics, items: other };
}

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
    const combined = await getCombinedInfo(config, linked.playfab_id);
    const payload = combined.InfoResultPayload;
    await sql`
      UPDATE synced_account_data SET
        inventory = ${JSON.stringify(payload.UserInventory ?? [])},
        virtual_currency = ${JSON.stringify(payload.UserVirtualCurrency ?? {})},
        synced_at = now()
      WHERE linked_account_id = ${linked.id}
    `;
  }

  const rows = await sql`
    SELECT inventory, virtual_currency, synced_at FROM synced_account_data
    WHERE linked_account_id = ${linked.id}
  `;
  const row = rows[0] as
    | { inventory: InventoryItem[]; virtual_currency: Record<string, number>; synced_at: string }
    | undefined;

  const { cosmetics, items } = splitInventory(row?.inventory ?? []);

  return NextResponse.json({
    cosmetics,
    items,
    currency: row?.virtual_currency ?? {},
    syncedAt: row?.synced_at ?? null,
  });
}
