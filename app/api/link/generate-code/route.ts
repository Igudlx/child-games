import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getGameById, getGameSecret } from '@/lib/games.config';
import { authenticateSessionTicket } from '@/lib/playfab';
import { generateLinkCode, LINK_CODE_TTL_MINUTES } from '@/lib/linkCode';
import { checkRateLimit } from '@/lib/rateLimit';
import { syncGamesTable } from '@/lib/syncGames';

/**
 * Called by ChildGamesAPI.cs inside the Unity game after the player
 * presses "Link Account". Body: { gameId, sessionTicket }.
 *
 * We never trust a client-supplied PlayFabId — instead we hand the
 * player's PlayFab session ticket to PlayFab itself (server-to-server,
 * using the title's secret key) and let PlayFab tell us who it belongs
 * to. This is what makes the code "proof of ownership" rather than a
 * guessable token.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { gameId, sessionTicket } = body ?? {};

  if (!gameId || !sessionTicket) {
    return NextResponse.json({ error: 'Missing gameId or sessionTicket.' }, { status: 400 });
  }

  const game = getGameById(gameId);
  if (!game) {
    return NextResponse.json({ error: 'Unknown game.' }, { status: 404 });
  }

  let playFabId: string;
  try {
    const secretKey = getGameSecret(game);
    const result = await authenticateSessionTicket(
      { titleId: game.playfabTitleId, secretKey },
      sessionTicket
    );
    playFabId = result.playFabId;
  } catch (err) {
    console.error('[generate-code] session ticket rejected:', err);
    return NextResponse.json({ error: 'Invalid or expired session ticket.' }, { status: 401 });
  }

  const rateOk = await checkRateLimit({
    key: `generate-code:${playFabId}`,
    maxAttempts: 5,
    windowSeconds: 60 * 10,
  });
  if (!rateOk) {
    return NextResponse.json(
      { error: 'Too many link code requests. Wait a few minutes and try again.' },
      { status: 429 }
    );
  }

  await syncGamesTable();

  // Retry on the rare primary-key collision instead of trusting a single draw.
  let code = '';
  for (let attempt = 0; attempt < 5; attempt++) {
    code = generateLinkCode();
    const existing = await sql`SELECT code FROM link_codes WHERE code = ${code} LIMIT 1;`;
    if (existing.length === 0) break;
  }

  await sql`
    INSERT INTO link_codes (code, game_id, playfab_id, expires_at)
    VALUES (
      ${code},
      ${game.id},
      ${playFabId},
      now() + (${LINK_CODE_TTL_MINUTES}::text || ' minutes')::interval
    );
  `;

  return NextResponse.json({
    code,
    expiresInMinutes: LINK_CODE_TTL_MINUTES,
  });
}
