import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getGameConfig } from "@/lib/games.config";
import {
  getCombinedInfo,
  getUserBans,
  tagAccountWithChildGamesUserId,
} from "@/lib/playfab";
import type { SnapshotData } from "@/lib/types";

const RequestSchema = z.object({
  gameId: z.string().min(1),
  code: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "gameId and code are required" }, { status: 400 });
  }

  const { gameId, code } = parsed.data;
  const config = getGameConfig(gameId);
  if (!config) {
    return NextResponse.json({ error: "Unknown game" }, { status: 404 });
  }

  const sql = getSql();

  // ---- STEP 1: verify ownership via the link code ------------------------
  const codeRows = await sql`
    SELECT id, playfab_id, expires_at, used FROM link_codes
    WHERE code = ${code.toUpperCase()} AND game_id = ${gameId}
  `;
  const linkCode = codeRows[0] as
    | { id: string; playfab_id: string; expires_at: string; used: boolean }
    | undefined;

  if (!linkCode) {
    return NextResponse.json({ error: "Invalid link code" }, { status: 400 });
  }
  if (linkCode.used) {
    return NextResponse.json({ error: "This link code has already been used" }, { status: 400 });
  }
  if (new Date(linkCode.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "This link code has expired" }, { status: 400 });
  }

  const playFabId = linkCode.playfab_id;

  // A PlayFab account can only be actively linked to one Child Games user
  // per game at a time.
  const existingActiveLink = await sql`
    SELECT id FROM linked_accounts
    WHERE game_id = ${gameId} AND playfab_id = ${playFabId} AND status = 'linked'
  `;
  if (existingActiveLink.length > 0) {
    return NextResponse.json(
      { error: "This game account is already linked to a Child Games account" },
      { status: 409 }
    );
  }

  const existingUserLink = await sql`
    SELECT id FROM linked_accounts
    WHERE user_id = ${session.userId} AND game_id = ${gameId} AND status = 'linked'
  `;
  if (existingUserLink.length > 0) {
    return NextResponse.json(
      { error: "You already have this game linked. Unlink it first." },
      { status: 409 }
    );
  }

  // ---- STEP 2: pull full account state from PlayFab -----------------------
  const [combined, bansResult] = await Promise.all([
    getCombinedInfo(config, playFabId),
    getUserBans(config, playFabId),
  ]);

  const payload = combined.InfoResultPayload;

  const snapshotData: SnapshotData = {
    accountInfo: payload.AccountInfo ?? {},
    inventory: payload.UserInventory ?? [],
    virtualCurrency: payload.UserVirtualCurrency ?? {},
    statistics: payload.PlayerStatistics ?? [],
    bans: bansResult.BanData ?? [],
    readOnlyData: payload.UserReadOnlyData ?? {},
    capturedAt: new Date().toISOString(),
  };

  // ---- STEP 3: create the linked_accounts row + snapshot (in one tx-ish flow) ----
  const linkedRows = await sql`
    INSERT INTO linked_accounts (user_id, game_id, playfab_id, status)
    VALUES (${session.userId}, ${gameId}, ${playFabId}, 'linked')
    RETURNING id
  `;
  const linkedAccountId = linkedRows[0].id as string;

  await sql`
    INSERT INTO snapshots (linked_account_id, snapshot_data)
    VALUES (${linkedAccountId}, ${JSON.stringify(snapshotData)})
  `;

  // ---- STEP 4: tag the PlayFab account with our internal user id ----------
  await tagAccountWithChildGamesUserId(config, playFabId, session.userId);

  // ---- STEP 5: sync inventory / cosmetics / currency / bans / account -----
  // "Sync" here means: cache the current PlayFab state into our own tables
  // so the linked-account pages render instantly without round-tripping to
  // PlayFab on every view. PlayFab stays the source of truth; this is a
  // read-through cache refreshed on link, unlink, and manual refresh.
  await sql`
    INSERT INTO synced_account_data (linked_account_id, inventory, virtual_currency, bans, account_info, synced_at)
    VALUES (
      ${linkedAccountId},
      ${JSON.stringify(payload.UserInventory ?? [])},
      ${JSON.stringify(payload.UserVirtualCurrency ?? {})},
      ${JSON.stringify(bansResult.BanData ?? [])},
      ${JSON.stringify(payload.AccountInfo ?? {})},
      now()
    )
    ON CONFLICT (linked_account_id) DO UPDATE SET
      inventory = EXCLUDED.inventory,
      virtual_currency = EXCLUDED.virtual_currency,
      bans = EXCLUDED.bans,
      account_info = EXCLUDED.account_info,
      synced_at = now()
  `;

  // ---- STEP 6: mark the code used + write history --------------------------
  await sql`
    UPDATE link_codes SET used = TRUE, used_at = now() WHERE id = ${linkCode.id}
  `;

  await sql`
    INSERT INTO history (user_id, game_id, event_type, event_data)
    VALUES (${session.userId}, ${gameId}, 'link', ${JSON.stringify({ playFabId })})
  `;

  return NextResponse.json({ ok: true, linkedAccountId, playFabId });
}
