import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyPassword } from '@/lib/auth';
import { createSession } from '@/lib/session';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const allowed = await checkRateLimit({
    key: `login:${ip}`,
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
  const { emailOrUsername, password } = body ?? {};

  if (!emailOrUsername || !password) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
  }

  const [user] = await sql`
    SELECT id, username, email, password_hash FROM users
    WHERE email = ${emailOrUsername} OR username = ${emailOrUsername}
    LIMIT 1;
  `;

  // Same generic error whether the account doesn't exist or the password is
  // wrong, so we don't leak which usernames/emails are registered.
  const genericError = NextResponse.json(
    { error: 'Incorrect username/email or password.' },
    { status: 401 }
  );

  if (!user) return genericError;

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) return genericError;

  await createSession({ userId: user.id, username: user.username, email: user.email });

  return NextResponse.json({ user: { username: user.username, email: user.email } });
}
