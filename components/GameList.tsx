"use client";

import type { GameSummary } from "@/lib/types";

export function GameList({
  games,
  selectedGameId,
  onSelect,
}: {
  games: GameSummary[];
  selectedGameId: string | null;
  onSelect: (gameId: string) => void;
}) {
  if (games.length === 0) {
    return <p className="text-ghost text-sm px-2">No games configured yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {games.map((game) => {
        const isSelected = game.id === selectedGameId;
        return (
          <button
            key={game.id}
            onClick={() => onSelect(game.id)}
            className={`text-left px-4 py-3 rounded-lg border transition-all duration-200 group
              ${isSelected ? "border-white bg-white text-black" : "border-white/15 hover:border-white/60"}
            `}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold tracking-wide truncate">{game.name}</span>
              <span
                className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border shrink-0
                  ${
                    isSelected
                      ? "border-black text-black"
                      : game.linked
                      ? "border-white/50 text-white"
                      : "border-white/20 text-ghost"
                  }`}
              >
                {game.linked ? "Linked" : "Unlinked"}
              </span>
            </div>
            {game.tagline && (
              <p className={`text-xs mt-1 truncate ${isSelected ? "text-black/60" : "text-ghost"}`}>
                {game.tagline}
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}
