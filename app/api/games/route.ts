import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { games } from '@/lib/games.config';
import { syncGamesTable } from '@/lib/syncGames';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  await syncGamesTable();

  const linked = await sql`
    SELECT game_id, playfab_id, linked_at, sync_status
    FROM linked_accounts
    WHERE user_id = ${session.userId};
  `;

  const linkedByGameId = new Map(linked.map((row) => [row.game_id, row]));

  const list = games.map((g) => {
    const link = linkedByGameId.get(g.id);
    return {
      id: g.id,
      name: g.name,
      downloadLink: g.downloadLink,
      linked: Boolean(link),
      linkedDate: link?.linked_at ?? null,
      syncStatus: link?.sync_status ?? null,
    };
  });

  return NextResponse.json({ games: list });
}
