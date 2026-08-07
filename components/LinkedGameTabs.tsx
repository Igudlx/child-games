"use client";

import { useState } from "react";
import type { GameSummary } from "@/lib/types";
import { InventoryTab } from "./InventoryTab";
import { BansTab } from "./BansTab";
import { AccountTab } from "./AccountTab";
import { HistoryTab } from "./HistoryTab";
import { SettingsTab } from "./SettingsTab";

const TABS = ["Inventory", "Bans", "Account", "History", "Settings"] as const;
type Tab = (typeof TABS)[number];

export function LinkedGameTabs({
  game,
  onUnlinked,
}: {
  game: GameSummary;
  onUnlinked: () => void;
}) {
  const [tab, setTab] = useState<Tab>("Inventory");

  return (
    <div className="flex flex-col h-full w-full">
      <div className="px-6 pt-8">
        <h2 className="font-display font-black text-2xl sm:text-3xl tracking-wide mb-6">
          {game.name}
        </h2>
        <div className="flex gap-2 overflow-x-auto pb-2 border-b border-white/10">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-semibold uppercase tracking-wider whitespace-nowrap
                border-b-2 transition-colors duration-200
                ${tab === t ? "border-white text-white" : "border-transparent text-ghost hover:text-white"}
              `}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8">
        {tab === "Inventory" && <InventoryTab gameId={game.id} />}
        {tab === "Bans" && <BansTab gameId={game.id} />}
        {tab === "Account" && <AccountTab gameId={game.id} />}
        {tab === "History" && <HistoryTab gameId={game.id} />}
        {tab === "Settings" && (
          <SettingsTab gameId={game.id} gameName={game.name} onUnlinked={onUnlinked} />
        )}
      </div>
    </div>
  );
}
