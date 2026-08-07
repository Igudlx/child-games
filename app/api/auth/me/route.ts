import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSql } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const sql = getSql();
  const rows = await sql`
    SELECT id, username, email, created_at FROM users WHERE id = ${session.userId}
  `;
  const user = rows[0];
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json({
    id: user.id,
    username: user.username,
    email: user.email,
    createdAt: user.created_at,
  });
}
