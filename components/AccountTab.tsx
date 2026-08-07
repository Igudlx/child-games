"use client";

import { useEffect, useState } from "react";

interface AccountData {
  playFabId: string;
  linkedAt: string;
  accountInfo: {
    Username?: string;
    TitleInfo?: { Created?: string; LastLogin?: string };
  };
  syncedAt: string | null;
}

export function AccountTab({ gameId }: { gameId: string }) {
  const [data, setData] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/games/${gameId}/account`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [gameId]);

  if (loading) return <p className="text-ghost">Loading account...</p>;
  if (!data) return <p className="text-ghost">Could not load account info.</p>;

  const rows: Array<[string, string]> = [
    ["In-game Username", data.accountInfo.Username ?? "—"],
    ["Linked Since", new Date(data.linkedAt).toLocaleString()],
    ["Account Created", data.accountInfo.TitleInfo?.Created ? new Date(data.accountInfo.TitleInfo.Created).toLocaleString() : "—"],
    ["Last Login", data.accountInfo.TitleInfo?.LastLogin ? new Date(data.accountInfo.TitleInfo.LastLogin).toLocaleString() : "—"],
  ];

  return (
    <div className="flex flex-col gap-6">
      <h3 className="font-display font-bold tracking-wide text-lg">Account</h3>
      <div className="panel divide-y divide-white/10">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between px-5 py-4">
            <span className="text-ghost text-sm">{label}</span>
            <span className="font-semibold text-right">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
