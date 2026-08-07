import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { createSessionCookie, hashPassword, SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/auth";

const RegisterSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(24, "Username must be at most 24 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = RegisterSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { username, email, password } = parsed.data;
  const sql = getSql();

  const existing = await sql`
    SELECT id FROM users WHERE username = ${username} OR email = ${email}
  `;
  if (existing.length > 0) {
    return NextResponse.json(
      { error: "That username or email is already registered" },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);

  const rows = await sql`
    INSERT INTO users (username, email, password_hash)
    VALUES (${username}, ${email}, ${passwordHash})
    RETURNING id, username
  `;
  const user = rows[0] as { id: string; username: string };

  await sql`
    INSERT INTO history (user_id, event_type, event_data)
    VALUES (${user.id}, 'account_created', ${JSON.stringify({})})
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
