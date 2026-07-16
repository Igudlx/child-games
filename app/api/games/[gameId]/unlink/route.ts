import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/session';
import { getGameById, getGameSecret } from '@/lib/games.config';
import {
  getUserInventory,
  revokeInventoryItem,
  grantItemsToUser,
  setVirtualCurrencyBalance,
} from '@/lib/playfab';

export async function POST(
  req: NextRequest,
  { params }: { params: { gameId: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const game = getGameById(params.gameId);
  if (!game) {
    return NextResponse.json({ error: 'Unknown game.' }, { status: 404 });
  }

  const [linkedAccount] = await sql`
    SELECT id, playfab_id FROM linked_accounts
    WHERE user_id = ${session.userId} AND game_id = ${game.id}
    LIMIT 1;
  `;

  if (!linkedAccount) {
    return NextResponse.json({ error: 'This game is not linked.' }, { status: 404 });
  }

  const [snapshot] = await sql`
    SELECT inventory_backup, currency_backup FROM snapshots
    WHERE linked_account_id = ${linkedAccount.id}
    ORDER BY created_at DESC
    LIMIT 1;
  `;

  try {
    const secretKey = getGameSecret(game);
    const ctx = { titleId: game.playfabTitleId, secretKey };

    if (snapshot) {
      const current = await getUserInventory(ctx, linkedAccount.playfab_id);

      // Restore currency balances to their pre-link amounts.
      const targetCurrency: { code: string; amount: number }[] =
        snapshot.currency_backup || [];
      for (const target of targetCurrency) {
        const currentBalance =
          current.currency.find((c) => c.code === target.code)?.amount ?? 0;
        await setVirtualCurrencyBalance(
          ctx,
          linkedAccount.playfab_id,
          target.code,
          target.amount,
          currentBalance
        );
      }

      // Revoke anything granted while linked that wasn't in the original
      // snapshot, then re-grant any original items that are now missing.
      // NOTE: precise item-level restoration depends on your game's own
      // catalog/instancing rules — this covers the common case of
      // consumable/uses-based items granted during a linked session.
      const originalItemIds = new Set(
        (snapshot.inventory_backup || []).map((i: { itemId: string }) => i.itemId)
      );
      const currentItemIds = new Set(current.items.map((i) => i.itemId));

      for (const item of current.items) {
        if (!originalItemIds.has(item.itemId)) {
          await revokeInventoryItem(ctx, linkedAccount.playfab_id, item.itemId);
        }
      }
      const missingItemIds = [...originalItemIds].filter(
        (id) => !currentItemIds.has(id as string)
      ) as string[];
      if (missingItemIds.length > 0) {
        await grantItemsToUser(ctx, linkedAccount.playfab_id, missingItemIds);
      }
    }

    await sql`DELETE FROM linked_accounts WHERE id = ${linkedAccount.id};`;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`[unlink ${game.id}] failed:`, err);
    return NextResponse.json(
      { error: 'Could not unlink right now. Try again shortly.' },
      { status: 502 }
    );
  }
}
