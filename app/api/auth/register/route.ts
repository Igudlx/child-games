import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { hashPassword, isValidEmail, isValidUsername, isValidPassword } from '@/lib/auth';
import { createSession } from '@/lib/session';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const allowed = await checkRateLimit({
    key: `register:${ip}`,
    maxAttempts: 10,
    windowSeconds: 60 * 15,
  });
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again later.' },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const { username, email, password } = body ?? {};

  if (!username || !email || !password) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
  }
  if (!isValidUsername(username)) {
    return NextResponse.json(
      { error: 'Username must be 3–20 characters: letters, numbers, underscores.' },
      { status: 400 }
    );
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }
  if (!isValidPassword(password)) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters.' },
      { status: 400 }
    );
  }

  const existing = await sql`
    SELECT id FROM users WHERE email = ${email} OR username = ${username} LIMIT 1;
  `;
  if (existing.length > 0) {
    return NextResponse.json(
      { error: 'That username or email is already registered.' },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);

  const [user] = await sql`
    INSERT INTO users (username, email, password_hash)
    VALUES (${username}, ${email}, ${passwordHash})
    RETURNING id, username, email;
  `;

  await createSession({ userId: user.id, username: user.username, email: user.email });

  return NextResponse.json({ user: { username: user.username, email: user.email } });
}
