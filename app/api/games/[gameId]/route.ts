import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/session';
import { getGameById, getGameSecret } from '@/lib/games.config';
import { getFullAccountBundle } from '@/lib/playfab';
import { AccountBundle } from '@/lib/types';

export async function GET(
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
    SELECT id, playfab_id, sync_status FROM linked_accounts
    WHERE user_id = ${session.userId} AND game_id = ${game.id}
    LIMIT 1;
  `;

  if (!linkedAccount) {
    return NextResponse.json({ error: 'This game is not linked.' }, { status: 404 });
  }

  try {
    const secretKey = getGameSecret(game);
    const bundleData = await getFullAccountBundle(
      { titleId: game.playfabTitleId, secretKey },
      linkedAccount.playfab_id
    );

    const history = await sql`
      SELECT event_type, description, occurred_at FROM history_events
      WHERE linked_account_id = ${linkedAccount.id}
      ORDER BY occurred_at DESC
      LIMIT 50;
    `;

    const bundle: AccountBundle = {
      ...bundleData,
      history: history.map((h) => ({
        type: h.event_type,
        description: h.description,
        timestamp: h.occurred_at,
      })),
      syncStatus: linkedAccount.sync_status,
    };

    return NextResponse.json(bundle);
  } catch (err) {
    console.error(`[games/${game.id}] Failed to load PlayFab data:`, err);
    await sql`
      UPDATE linked_accounts SET sync_status = 'error' WHERE id = ${linkedAccount.id};
    `;
    return NextResponse.json(
      { error: 'Could not reach the game server. Try again shortly.' },
      { status: 502 }
    );
  }
}
