import { getSql } from "./db";

export async function getActiveLinkedAccount(userId: string, gameId: string) {
  const sql = getSql();
  const rows = await sql`
    SELECT id, playfab_id, linked_at FROM linked_accounts
    WHERE user_id = ${userId} AND game_id = ${gameId} AND status = 'linked'
  `;
  return rows[0] as { id: string; playfab_id: string; linked_at: string } | undefined;
}
