'use client';

import { useState } from 'react';

export function SettingsTab({
  gameId,
  gameName,
  onUnlinked,
}: {
  gameId: string;
  gameName: string;
  onUnlinked: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUnlink() {
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/games/${gameId}/unlink`, { method: 'POST' });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Could not unlink right now.');
      return;
    }

    onUnlinked();
  }

  return (
    <div className="flex flex-col gap-6 max-w-md">
      <div>
        <p className="eyebrow mb-1">Danger zone</p>
        <p className="text-sm text-mist">
          Unlinking restores {gameName} to exactly how it was before you linked it — your
          original inventory, currency, and data. Syncing stops immediately.
        </p>
      </div>

      {error && <p className="text-sm text-paper border border-line px-3 py-2">{error}</p>}

      {!confirming ? (
        <button onClick={() => setConfirming(true)} className="btn-outline self-start">
          Unlink game
        </button>
      ) : (
        <div className="flex flex-col gap-3 border border-line p-4">
          <p className="text-sm">Are you sure? This can&apos;t be undone from here.</p>
          <div className="flex gap-3">
            <button onClick={handleUnlink} disabled={loading} className="btn-outline">
              {loading ? 'Unlinking…' : 'Confirm unlink'}
            </button>
            <button onClick={() => setConfirming(false)} className="btn-ghost">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
