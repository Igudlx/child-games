import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { getGameConfig } from "@/lib/games.config";
import { authenticateSessionTicket, PlayFabError } from "@/lib/playfab";
import { checkAndRecordLinkCodeAttempt } from "@/lib/rateLimit";

const RequestSchema = z.object({
  gameId: z.string().min(1),
  sessionTicket: z.string().min(1),
});

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no O/0/I/1 to avoid ambiguity
const CODE_LENGTH = 8;
const CODE_TTL_MINUTES = 10;

function generateCode(): string {
  let code = "";
  const bytes = crypto.getRandomValues(new Uint32Array(CODE_LENGTH));
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return code;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "gameId and sessionTicket are required" }, { status: 400 });
  }

  const { gameId, sessionTicket } = parsed.data;
  const config = getGameConfig(gameId);
  if (!config) {
    return NextResponse.json({ error: "Unknown game" }, { status: 404 });
  }

  // Prove ownership: exchange the session ticket for a verified PlayFabId.
  // This call requires the game's secret key, which only exists here on
  // the server — Unity never sees it.
  let playFabId: string;
  try {
    const auth = await authenticateSessionTicket(config, sessionTicket);
    playFabId = auth.playFabId;
  } catch (err) {
    if (err instanceof PlayFabError) {
      return NextResponse.json({ error: "Could not verify PlayFab session" }, { status: 401 });
    }
    throw err;
  }

  const rate = await checkAndRecordLinkCodeAttempt(gameId, playFabId);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many link code requests. Try again later.", retryAfterSeconds: rate.retryAfterSeconds },
      { status: 429 }
    );
  }

  const sql = getSql();

  // Invalidate any still-active codes for this player/game so only the
  // newest code works.
  await sql`
    UPDATE link_codes SET used = TRUE, used_at = now()
    WHERE game_id = ${gameId} AND playfab_id = ${playFabId} AND used = FALSE
  `;

  let code = generateCode();
  // Extremely unlikely, but guarantee uniqueness against the unique index.
  for (let attempt = 0; attempt < 5; attempt++) {
    const clash = await sql`SELECT 1 FROM link_codes WHERE code = ${code}`;
    if (clash.length === 0) break;
    code = generateCode();
  }

  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000).toISOString();

  await sql`
    INSERT INTO link_codes (game_id, playfab_id, code, expires_at)
    VALUES (${gameId}, ${playFabId}, ${code}, ${expiresAt})
  `;

  return NextResponse.json({
    code,
    expiresAt,
    expiresInSeconds: CODE_TTL_MINUTES * 60,
  });
}
