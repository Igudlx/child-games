"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { GameSummary } from "@/lib/types";
import { GameList } from "./GameList";
import { ChildGamesWordmark } from "./ChildGamesWordmark";
import { LinkGamePanel } from "./LinkGamePanel";
import { LinkedGameTabs } from "./LinkedGameTabs";
import { RobotGraphic } from "./RobotGraphic";

type MobileDrawer = null | "menu" | "account";
type MenuSubView = "games" | "settings";

export function Dashboard({ username }: { username: string }) {
  const router = useRouter();
  const [games, setGames] = useState<GameSummary[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<MobileDrawer>(null);
  const [menuSubView, setMenuSubView] = useState<MenuSubView>("games");

  const loadGames = useCallback(async () => {
    const res = await fetch("/api/games");
    if (res.ok) {
      const data = await res.json();
      setGames(data.games);
    }
  }, []);

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  const selectedGame = games.find((g) => g.id === selectedGameId) ?? null;

  function selectGame(id: string) {
    setSelectedGameId(id);
    setDrawer(null);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row overflow-hidden">
      {/* ---------------- MOBILE TOP BAR ---------------- */}
      <div className="md:hidden flex items-center justify-between px-5 py-4 border-b border-white/10">
        <button
          onClick={() => setDrawer("menu")}
          aria-label="Open menu"
          className="text-2xl leading-none"
        >
          ☰
        </button>
        <div className="flex items-center gap-2">
          <RobotGraphic className="w-6 h-7" />
          <span className="font-display font-bold tracking-widest text-sm">CHILD GAMES</span>
        </div>
        <button
          onClick={() => setDrawer("account")}
          aria-label="Open settings"
          className="text-2xl leading-none"
        >
          ⚙
        </button>
      </div>

      {/* ---------------- MOBILE DRAWER ---------------- */}
      {drawer && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setDrawer(null)}
          />
          <div className="relative w-[80%] max-w-xs h-full bg-black border-r border-white/10 p-6 flex flex-col gap-6 animate-fade-up">
            {drawer === "menu" ? (
              <>
                <div className="flex gap-4 border-b border-white/10 pb-4">
                  <button
                    onClick={() => setMenuSubView("games")}
                    className={`text-sm uppercase tracking-widest font-semibold ${
                      menuSubView === "games" ? "text-white" : "text-ghost"
                    }`}
                  >
                    Games
                  </button>
                  <button
                    onClick={() => setMenuSubView("settings")}
                    className={`text-sm uppercase tracking-widest font-semibold ${
                      menuSubView === "settings" ? "text-white" : "text-ghost"
                    }`}
                  >
                    Settings
                  </button>
                </div>
                {menuSubView === "games" ? (
                  <GameList games={games} selectedGameId={selectedGameId} onSelect={selectGame} />
                ) : (
                  <AccountPanel username={username} onLogout={handleLogout} />
                )}
              </>
            ) : (
              <AccountPanel username={username} onLogout={handleLogout} />
            )}
          </div>
        </div>
      )}

      {/* ---------------- MAIN CONTENT ---------------- */}
      <main className="flex-1 h-full overflow-hidden">
        {selectedGame ? (
          selectedGame.linked ? (
            <LinkedGameTabs
              game={selectedGame}
              onUnlinked={() => {
                loadGames();
              }}
            />
          ) : (
            <LinkGamePanel game={selectedGame} onLinked={loadGames} />
          )
        ) : (
          <ChildGamesWordmark />
        )}
      </main>

      {/* ---------------- DESKTOP / VR RIGHT SIDEBAR ---------------- */}
      <aside className="hidden md:flex flex-col w-80 shrink-0 h-full border-l border-white/10 p-6 gap-8">
        <AccountPanel username={username} onLogout={handleLogout} />
        <div className="flex-1 overflow-y-auto flex flex-col gap-4">
          <p className="text-xs uppercase tracking-[0.25em] text-ghost">Games</p>
          <GameList games={games} selectedGameId={selectedGameId} onSelect={selectGame} />
        </div>
      </aside>
    </div>
  );
}

function AccountPanel({ username, onLogout }: { username: string; onLogout: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <RobotGraphic className="w-9 h-11" />
        <div>
          <p className="text-xs text-ghost uppercase tracking-widest">Signed in as</p>
          <p className="font-display font-bold tracking-wide truncate max-w-[10rem]">{username}</p>
        </div>
      </div>
      <button onClick={onLogout} className="outline-btn-sm self-start">
        Logout
      </button>
    </div>
  );
}
