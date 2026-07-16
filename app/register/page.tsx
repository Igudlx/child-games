'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RobotGraphic } from '@/components/RobotGraphic';
import { ChildGamesLogo } from '@/components/ChildGamesLogo';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Something went wrong.');
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
      <div className="mb-10 flex flex-col items-center gap-4">
        <RobotGraphic className="h-20 w-auto text-paper" />
        <ChildGamesLogo size="small" />
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm panel p-8 flex flex-col gap-5 animate-fadeUp"
      >
        <div>
          <h1 className="font-display text-lg tracking-wide uppercase mb-1">Create account</h1>
          <p className="text-sm text-mist">One login for every Child Games title.</p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="username" className="eyebrow">
            Username
          </label>
          <input
            id="username"
            className="input-field"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            minLength={3}
            maxLength={20}
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="eyebrow">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="eyebrow">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
          <p className="text-xs text-mist">At least 8 characters.</p>
        </div>

        {error && <p className="text-sm text-paper border border-line px-3 py-2">{error}</p>}

        <button type="submit" disabled={loading} className="btn-outline mt-2">
          {loading ? 'Creating account…' : 'Create account'}
        </button>

        <p className="text-center text-sm text-mist">
          Already have an account?{' '}
          <Link href="/login" className="text-paper underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </form>
    </main>
  );
}
