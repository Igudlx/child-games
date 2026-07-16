import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/session';
import { getGameById, getGameSecret } from '@/lib/games.config';
import { getUserInventory } from '@/lib/playfab';
import { checkRateLimit } from '@/lib/rateLimit';

/**
 * Called from the website when a player types a link code into a game
 * tab. Validates the code, snapshots the player's current PlayFab
 * state (so unlinking can restore it later), and creates the link.
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const rateOk = await checkRateLimit({
    key: `redeem:${session.userId}:${ip}`,
    maxAttempts: 8,
    windowSeconds: 60 * 10,
  });
  if (!rateOk) {
    return NextResponse.json(
      { error: 'Too many attempts. Wait a few minutes and try again.' },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const { gameId, code } = body ?? {};

  if (!gameId || !code) {
    return NextResponse.json({ error: 'Missing gameId or code.' }, { status: 400 });
  }

  const game = getGameById(gameId);
  if (!game) {
    return NextResponse.json({ error: 'Unknown game.' }, { status: 404 });
  }

  const normalizedCode = String(code).toUpperCase().trim();

  const [linkCode] = await sql`
    SELECT code, game_id, playfab_id, expires_at, used FROM link_codes
    WHERE code = ${normalizedCode} AND game_id = ${game.id}
    LIMIT 1;
  `;

  // Deliberately generic error message — don't reveal whether the code
  // exists, expired, or was already used, to slow down guessing attacks.
  const invalidCodeError = NextResponse.json(
    { error: 'That code is invalid or has expired.' },
    { status: 400 }
  );

  if (!linkCode) return invalidCodeError;
  if (linkCode.used) return invalidCodeError;
  if (new Date(linkCode.expires_at).getTime() < Date.now()) return invalidCodeError;

  // One PlayFab account can only be linked to one Child Games account per game.
  const [alreadyLinkedElsewhere] = await sql`
    SELECT id FROM linked_accounts
    WHERE game_id = ${game.id} AND playfab_id = ${linkCode.playfab_id}
    LIMIT 1;
  `;
  if (alreadyLinkedElsewhere) {
    return NextResponse.json(
      { error: 'That game account is already linked to a Child Games account.' },
      { status: 409 }
    );
  }

  try {
    const secretKey = getGameSecret(game);
    const ctx = { titleId: game.playfabTitleId, secretKey };

    // 1. Snapshot current state BEFORE anything is linked.
    const inventorySnapshot = await getUserInventory(ctx, linkCode.playfab_id);

    // 2. Create the linked account record.
    const [linkedAccount] = await sql`
      INSERT INTO linked_accounts (user_id, game_id, playfab_id, sync_status)
      VALUES (${session.userId}, ${game.id}, ${linkCode.playfab_id}, 'synced')
      RETURNING id;
    `;

    // 3. Persist the snapshot tied to that linked account.
    await sql`
      INSERT INTO snapshots (linked_account_id, inventory_backup, currency_backup, saved_data)
      VALUES (
        ${linkedAccount.id},
        ${JSON.stringify(inventorySnapshot.items)},
        ${JSON.stringify(inventorySnapshot.currency)},
        ${JSON.stringify({})}
      );
    `;

    // 4. Record the event and mark the code used (single statement each,
    //    kept sequential for clarity — Neon's serverless driver does not
    //    support multi-statement transactions over HTTP without the
    //    dedicated transaction() helper, so keep steps small and ordered).
    await sql`
      INSERT INTO history_events (linked_account_id, event_type, description)
      VALUES (${linkedAccount.id}, 'other', 'Game account linked to Child Games');
    `;
    await sql`
      UPDATE link_codes SET used = TRUE, used_by = ${session.userId} WHERE code = ${normalizedCode};
    `;

    return NextResponse.json({ ok: true, gameId: game.id });
  } catch (err) {
    console.error(`[redeem ${game.id}] failed:`, err);
    return NextResponse.json(
      { error: 'Could not link the account right now. Try again shortly.' },
      { status: 502 }
    );
  }
}
