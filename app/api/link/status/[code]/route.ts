import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

/**
 * Polled by LinkAccountManager.cs in Unity while showing the "LINKING..."
 * code screen, so the game can confirm on its own when the website side
 * has finished the link and switch its UI to "LINKED ✓" without the
 * player needing to alt-tab back into the headset manually.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase().trim();

  const [linkCode] = await sql`
    SELECT used, expires_at FROM link_codes WHERE code = ${code} LIMIT 1;
  `;

  if (!linkCode) {
    return NextResponse.json({ status: 'not_found' }, { status: 404 });
  }

  if (linkCode.used) {
    return NextResponse.json({ status: 'linked' });
  }

  if (new Date(linkCode.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ status: 'expired' });
  }

  return NextResponse.json({ status: 'pending' });
}
