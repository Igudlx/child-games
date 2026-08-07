import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { createSessionCookie, verifyPassword, SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/auth";

const LoginSchema = z.object({
  usernameOrEmail: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = LoginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a username/email and password" }, { status: 400 });
  }

  const { usernameOrEmail, password } = parsed.data;
  const sql = getSql();

  const rows = await sql`
    SELECT id, username, password_hash FROM users
    WHERE username = ${usernameOrEmail} OR email = ${usernameOrEmail}
  `;

  const user = rows[0] as { id: string; username: string; password_hash: string } | undefined;

  if (!user) {
    return NextResponse.json({ error: "Incorrect username/email or password" }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return NextResponse.json({ error: "Incorrect username/email or password" }, { status: 401 });
  }

  await sql`
    INSERT INTO history (user_id, event_type, event_data)
    VALUES (${user.id}, 'login', ${JSON.stringify({})})
  `;

  const token = await createSessionCookie({ userId: user.id, username: user.username });

  const res = NextResponse.json({ id: user.id, username: user.username });
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
