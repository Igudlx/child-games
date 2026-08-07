"use client";

import { useEffect, useState } from "react";

interface Ban {
  BanId: string;
  Active: boolean;
  Expires?: string;
  Reason?: string;
  Permanent: boolean;
  Created: string;
}

interface BansData {
  active: Ban[];
  permanent: Ban[];
  temporary: Ban[];
  syncedAt: string | null;
}

function timeRemaining(expires?: string): string {
  if (!expires) return "—";
  const ms = new Date(expires).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h`;
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

export function BansTab({ gameId }: { gameId: string }) {
  const [data, setData] = useState<BansData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/games/${gameId}/bans`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [gameId]);

  if (loading) return <p className="text-ghost">Loading bans...</p>;
  if (!data) return <p className="text-ghost">Could not load ban status.</p>;

  if (data.active.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <p className="font-display font-black text-2xl tracking-wide">No Active Bans</p>
        <p className="text-ghost text-sm">This account is in good standing.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h3 className="font-display font-bold tracking-wide text-lg">Bans</h3>

      {data.permanent.length > 0 && (
        <section>
          <h4 className="text-xs uppercase tracking-[0.25em] text-ghost mb-3">Permanent Bans</h4>
          <div className="flex flex-col gap-2">
            {data.permanent.map((b) => (
              <div key={b.BanId} className="panel p-4 border-white/40">
                <p className="font-semibold">Permanent</p>
                {b.Reason && <p className="text-sm text-ghost mt-1">{b.Reason}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {data.temporary.length > 0 && (
        <section>
          <h4 className="text-xs uppercase tracking-[0.25em] text-ghost mb-3">
            Temporary Bans — Remaining Time
          </h4>
          <div className="flex flex-col gap-2">
            {data.temporary.map((b) => (
              <div key={b.BanId} className="panel p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{b.Reason ?? "No reason provided"}</p>
                  <p className="text-xs text-ghost mt-1">
                    Since {new Date(b.Created).toLocaleDateString()}
                  </p>
                </div>
                <p className="font-display font-bold">{timeRemaining(b.Expires)}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
