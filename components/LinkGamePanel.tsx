"use client";

import { useState } from "react";
import type { GameSummary } from "@/lib/types";

type Phase = "idle" | "linking" | "linked" | "error";

export function LinkGamePanel({
  game,
  onLinked,
}: {
  game: GameSummary;
  onLinked: () => void;
}) {
  const [code, setCode] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleLink() {
    if (!code.trim()) return;
    setPhase("linking");
    setError(null);
    try {
      const res = await fetch("/api/games/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: game.id, code: code.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Linking failed");
        setPhase("error");
        return;
      }
      setPhase("linked");
      setTimeout(() => onLinked(), 900);
    } catch {
      setError("Network error. Try again.");
      setPhase("error");
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full w-full px-6 gap-8">
      <h2 className="font-display font-black text-3xl sm:text-4xl tracking-wide text-center">
        {game.name}
      </h2>

      {phase === "linking" ? (
        <p className="font-display font-black text-3xl tracking-[0.3em] animate-linking">
          LINKING...
        </p>
      ) : phase === "linked" ? (
        <p className="font-display font-black text-3xl tracking-[0.3em]">LINKED ✓</p>
      ) : (
        <>
          <div className="w-full max-w-sm flex flex-col gap-4">
            <label className="text-xs uppercase tracking-[0.25em] text-ghost text-center">
              Link Code
            </label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={8}
              placeholder="XXXXXXXX"
              className="bg-black border border-white/30 rounded-md px-4 py-3 text-center
                text-2xl tracking-[0.3em] font-display outline-none focus:border-white transition-colors"
            />
            {error && (
              <p className="text-sm text-white/70 border border-white/20 rounded-md p-2 text-center">
                {error}
              </p>
            )}
            <button onClick={handleLink} className="outline-btn w-full">
              Link Account
            </button>
          </div>

          <div className="flex flex-col items-center gap-3 pt-4">
            <p className="text-ghost text-sm">Don&apos;t Have The Game?</p>
            <a
              href={game.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="outline-btn-sm"
            >
              Download Game
            </a>
          </div>
        </>
      )}
    </div>
  );
}
