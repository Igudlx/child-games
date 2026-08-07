"use client";

import { useState } from "react";

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
  const [unlinking, setUnlinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUnlink() {
    setUnlinking(true);
    setError(null);
    try {
      const res = await fetch("/api/games/unlink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Unlink failed");
        setUnlinking(false);
        return;
      }
      onUnlinked();
    } catch {
      setError("Network error. Try again.");
      setUnlinking(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h3 className="font-display font-bold tracking-wide text-lg">Settings</h3>

      <div className="panel p-6 flex flex-col gap-4">
        <div>
          <p className="font-semibold">Unlink {gameName}</p>
          <p className="text-ghost text-sm mt-1">
            This restores your account to exactly how it was before linking — original
            inventory, cosmetics, currency, and standing are all restored. You can link this
            game again afterward.
          </p>
        </div>

        {error && (
          <p className="text-sm text-white/70 border border-white/20 rounded-md p-2">{error}</p>
        )}

        {!confirming ? (
          <button onClick={() => setConfirming(true)} className="outline-btn-sm self-start">
            Unlink Game
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button onClick={handleUnlink} disabled={unlinking} className="outline-btn-sm">
              {unlinking ? "Restoring..." : "Confirm Unlink"}
            </button>
            <button
              onClick={() => setConfirming(false)}
              disabled={unlinking}
              className="text-ghost text-sm underline underline-offset-4"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
