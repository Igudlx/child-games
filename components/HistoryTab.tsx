"use client";

import { useEffect, useState } from "react";

interface HistoryEvent {
  id: string;
  event_type: string;
  event_data: Record<string, unknown> | null;
  created_at: string;
}

const EVENT_LABELS: Record<string, string> = {
  link: "Account Linked",
  unlink: "Account Unlinked",
  login: "Login",
  sync: "Data Synced",
  name_change: "Name Changed",
  account_created: "Child Games Account Created",
};

export function HistoryTab({ gameId }: { gameId: string }) {
  const [events, setEvents] = useState<HistoryEvent[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/games/${gameId}/history`)
      .then((r) => r.json())
      .then((d) => setEvents(d.events))
      .finally(() => setLoading(false));
  }, [gameId]);

  if (loading) return <p className="text-ghost">Loading history...</p>;
  if (!events || events.length === 0) {
    return <p className="text-ghost">No history recorded for this game yet.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h3 className="font-display font-bold tracking-wide text-lg">History</h3>
      <div className="flex flex-col gap-2">
        {events.map((e) => (
          <div key={e.id} className="panel p-4 flex items-center justify-between gap-4">
            <span className="font-semibold">{EVENT_LABELS[e.event_type] ?? e.event_type}</span>
            <span className="text-xs text-ghost shrink-0">
              {new Date(e.created_at).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
