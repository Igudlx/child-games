'use client';

import { useState } from 'react';
import { LinkingAnimation } from './LinkingAnimation';

interface LinkPanelProps {
  gameId: string;
  gameName: string;
  downloadLink: string;
  onLinked: () => void;
}

type Phase = 'idle' | 'linking' | 'linked' | 'error';

export function LinkPanel({ gameId, gameName, downloadLink, onLinked }: LinkPanelProps) {
  const [code, setCode] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPhase('linking');

    const res = await fetch('/api/link/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId, code }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Something went wrong.');
      setPhase('error');
      return;
    }

    setPhase('linked');
    setTimeout(() => onLinked(), 900);
  }

  if (phase === 'linking' || phase === 'linked') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <LinkingAnimation done={phase === 'linked'} />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h2 className="font-display text-2xl uppercase tracking-wide mb-8 text-center">
          {gameName}
        </h2>

        <form onSubmit={handleLink} className="flex flex-col gap-4">
          <label htmlFor="link-code" className="eyebrow text-center">
            Enter link code
          </label>
          <input
            id="link-code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={8}
            placeholder="XXXXXXXX"
            className="input-field text-center tracking-[0.4em] font-display"
            required
          />
          {error && (
            <p className="text-sm text-paper border border-line px-3 py-2 text-center">
              {error}
            </p>
          )}
          <button type="submit" className="btn-outline">
            Link account
          </button>
        </form>

        <div className="mt-12 flex flex-col items-center gap-3 border-t border-line pt-8">
          <p className="text-sm text-mist">Don&apos;t have the game?</p>
          <a
            href={downloadLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline"
          >
            Download game
          </a>
        </div>
      </div>
    </div>
  );
}
