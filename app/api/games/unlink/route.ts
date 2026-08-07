import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getGameConfig } from "@/lib/games.config";
import {
  getCombinedInfo,
  getUserBans,
  adjustVirtualCurrency,
  grantItemsToUser,
  revokeInventoryItem,
  revokeAllBansForUser,
  clearChildGamesTag,
} from "@/lib/playfab";
import type { SnapshotData } from "@/lib/types";

const RequestSchema = z.object({ gameId: z.string().min(1) });

interface InventoryItem {
  ItemInstanceId: string;
  ItemId: string;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "gameId is required" }, { status: 400 });
  }

  const { gameId } = parsed.data;
  const config = getGameConfig(gameId);
  if (!config) {
    return NextResponse.json({ error: "Unknown game" }, { status: 404 });
  }

  const sql = getSql();

  const linkedRows = await sql`
    SELECT id, playfab_id FROM linked_accounts
    WHERE user_id = ${session.userId} AND game_id = ${gameId} AND status = 'linked'
  `;
  const linkedAccount = linkedRows[0] as { id: string; playfab_id: string } | undefined;
  if (!linkedAccount) {
    return NextResponse.json({ error: "This game is not currently linked" }, { status: 404 });
  }

  const snapshotRows = await sql`
    SELECT id, snapshot_data FROM snapshots
    WHERE linked_account_id = ${linkedAccount.id}
    ORDER BY taken_at ASC
    LIMIT 1
  `;
  const snapshotRow = snapshotRows[0] as { id: string; snapshot_data: SnapshotData } | undefined;
  if (!snapshotRow) {
    return NextResponse.json(
      { error: "No pre-link snapshot found for this account. Contact support before unlinking." },
      { status: 500 }
    );
  }
  const snapshot = snapshotRow.snapshot_data;
  const playFabId = linkedAccount.playfab_id;

  // ---- Fetch CURRENT state so we know exactly what to undo ----------------
  const [currentCombined, currentBans] = await Promise.all([
    getCombinedInfo(config, playFabId),
    getUserBans(config, playFabId),
  ]);
  const currentPayload = currentCombined.InfoResultPayload;

  // ---- RESTORE CURRENCY: bring every balance back to its snapshot value ---
  const currentCurrency = (currentPayload.UserVirtualCurrency ?? {}) as Record<string, number>;
  const snapshotCurrency = snapshot.virtualCurrency ?? {};
  const allCurrencyCodes = new Set([
    ...Object.keys(currentCurrency),
    ...Object.keys(snapshotCurrency),
  ]);
  for (const code of allCurrencyCodes) {
    const target = snapshotCurrency[code] ?? 0;
    const current = currentCurrency[code] ?? 0;
    const delta = target - current;
    if (delta !== 0) {
      await adjustVirtualCurrency(config, playFabId, code, delta);
    }
  }

  // ---- RESTORE INVENTORY (cosmetics + items) -------------------------------
  // Revoke any item the player currently holds that was NOT present before
  // linking, then re-grant any item that WAS present before but is missing
  // now. Note: a re-granted item gets a new ItemInstanceId — PlayFab has no
  // native "restore this exact instance" operation, so custom instance data
  // (e.g. a partially-used consumable's remaining uses) can't be perfectly
  // replayed. This covers the overwhelming majority of cosmetic/economy
  // items correctly.
  const currentInventory = (currentPayload.UserInventory ?? []) as InventoryItem[];
  const snapshotInventory = (snapshot.inventory ?? []) as InventoryItem[];
  const snapshotInstanceIds = new Set(snapshotInventory.map((i) => i.ItemInstanceId));
  const currentInstanceIds = new Set(currentInventory.map((i) => i.ItemInstanceId));

  const toRevoke = currentInventory.filter((i) => !snapshotInstanceIds.has(i.ItemInstanceId));
  for (const item of toRevoke) {
    await revokeInventoryItem(config, playFabId, item.ItemInstanceId);
  }

  const missingItemIds = snapshotInventory
    .filter((i) => !currentInstanceIds.has(i.ItemInstanceId))
    .map((i) => i.ItemId);
  if (missingItemIds.length > 0) {
    await grantItemsToUser(config, playFabId, missingItemIds);
  }

  // ---- RESTORE BANS ---------------------------------------------------------
  const hadActiveBansBefore = (snapshot.bans ?? []).some(
    (b) => (b as { Active?: boolean }).Active
  );
  const hasActiveBansNow = (currentBans.BanData ?? []).some((b) => b.Active);
  if (!hadActiveBansBefore && hasActiveBansNow) {
    // Account was clean before linking but has active bans now (e.g. bans
    // issued while linked) — lift them as part of the restore.
    await revokeAllBansForUser(config, playFabId);
  }
  // If the account already had active bans before linking, we deliberately
  // do not attempt to reconstruct them automatically — reapplying a ban
  // is a moderation action and is left to game staff via PlayFab Game
  // Manager, logged below for visibility.

  // ---- Remove the Child Games cross-reference tag --------------------------
  await clearChildGamesTag(config, playFabId);

  // ---- Update DB: mark unlinked, mark snapshot restored, drop the cache ----
  await sql`
    UPDATE linked_accounts SET status = 'unlinked', unlinked_at = now()
    WHERE id = ${linkedAccount.id}
  `;
  await sql`
    UPDATE snapshots SET restored_at = now() WHERE id = ${snapshotRow.id}
  `;
  await sql`
    DELETE FROM synced_account_data WHERE linked_account_id = ${linkedAccount.id}
  `;
  await sql`
    INSERT INTO history (user_id, game_id, event_type, event_data)
    VALUES (
      ${session.userId}, ${gameId}, 'unlink',
      ${JSON.stringify({ playFabId, hadActiveBansBeforeLinking: hadActiveBansBefore })}
    )
  `;

  return NextResponse.json({ ok: true });
}
