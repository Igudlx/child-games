"use client";

import { useEffect, useState } from "react";

interface InventoryItem {
  ItemInstanceId: string;
  ItemId: string;
  DisplayName?: string;
}

interface InventoryData {
  cosmetics: InventoryItem[];
  items: InventoryItem[];
  currency: Record<string, number>;
  syncedAt: string | null;
}

export function InventoryTab({ gameId }: { gameId: string }) {
  const [data, setData] = useState<InventoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(refresh = false) {
    if (refresh) setRefreshing(true);
    const res = await fetch(`/api/games/${gameId}/inventory${refresh ? "?refresh=true" : ""}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    setLoading(true);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  if (loading) return <p className="text-ghost">Loading inventory...</p>;
  if (!data) return <p className="text-ghost">Could not load inventory.</p>;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold tracking-wide text-lg">Inventory</h3>
        <button onClick={() => load(true)} disabled={refreshing} className="outline-btn-sm">
          {refreshing ? "Syncing..." : "Refresh"}
        </button>
      </div>

      <section>
        <h4 className="text-xs uppercase tracking-[0.25em] text-ghost mb-3">Currency</h4>
        {Object.keys(data.currency).length === 0 ? (
          <p className="text-ghost text-sm">No currency balances.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(data.currency).map(([code, amount]) => (
              <div key={code} className="panel p-4 text-center">
                <p className="text-2xl font-display font-black">{amount}</p>
                <p className="text-xs text-ghost uppercase tracking-widest">{code}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h4 className="text-xs uppercase tracking-[0.25em] text-ghost mb-3">Cosmetics</h4>
        <ItemGrid items={data.cosmetics} empty="No cosmetics yet." />
      </section>

      <section>
        <h4 className="text-xs uppercase tracking-[0.25em] text-ghost mb-3">Items</h4>
        <ItemGrid items={data.items} empty="No items yet." />
      </section>

      {data.syncedAt && (
        <p className="text-xs text-ghost">Last synced {new Date(data.syncedAt).toLocaleString()}</p>
      )}
    </div>
  );
}

function ItemGrid({ items, empty }: { items: InventoryItem[]; empty: string }) {
  if (items.length === 0) return <p className="text-ghost text-sm">{empty}</p>;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {items.map((item) => (
        <div key={item.ItemInstanceId} className="panel p-4">
          <p className="font-semibold truncate">{item.DisplayName ?? item.ItemId}</p>
          <p className="text-xs text-ghost truncate mt-1">{item.ItemId}</p>
        </div>
      ))}
    </div>
  );
}
