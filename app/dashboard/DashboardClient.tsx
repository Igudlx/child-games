'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChildGamesLogo } from '@/components/ChildGamesLogo';
import { GameListPanel } from '@/components/GameListPanel';
import { MobileMenu, MobileSettings } from '@/components/MobileMenu';
import { GameTab } from '@/components/GameTab';

interface GameListItem {
  id: string;
  name: string;
  downloadLink: string;
  linked: boolean;
}

export function DashboardClient({ username }: { username: string }) {
  const router = useRouter();
  const [games, setGames] = useState<GameListItem[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);

  const loadGames = useCallback(() => {
    fetch('/api/games')
      .then((res) => res.json())
      .then((data) => setGames(data.games || []));
  }, []);

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  const selectedGame = games.find((g) => g.id === selectedGameId) || null;

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* --- Mobile top bar --- */}
      <div className="flex items-center justify-between border-b border-line px-5 py-4 md:hidden">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="text-2xl leading-none"
          aria-label="Open menu"
        >
          ☰
        </button>
        <ChildGamesLogo size="small" />
        <button
          onClick={() => setMobileSettingsOpen(true)}
          className="text-2xl leading-none"
          aria-label="Open settings"
        >
          ⚙
        </button>
      </div>

      <MobileMenu
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        games={games}
        selectedGameId={selectedGameId}
        onSelectGame={setSelectedGameId}
      />
      <MobileSettings
        open={mobileSettingsOpen}
        onClose={() => setMobileSettingsOpen(false)}
        username={username}
        onLogout={handleLogout}
      />

      {/* --- Main content --- */}
      <main className="order-2 flex flex-1 flex-col md:order-1">
        {selectedGame ? (
          <GameTab
            key={selectedGame.id}
            gameId={selectedGame.id}
            gameName={selectedGame.name}
            downloadLink={selectedGame.downloadLink}
            linked={selectedGame.linked}
            onLinkedChanged={loadGames}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center p-8">
            <ChildGamesLogo size="large" />
          </div>
        )}
      </main>

      {/* --- Desktop / VR right panel --- */}
      <aside className="order-1 hidden w-72 shrink-0 border-l border-line px-6 py-8 md:order-2 md:block">
        <GameListPanel
          games={games}
          selectedGameId={selectedGameId}
          onSelectGame={setSelectedGameId}
          username={username}
          onLogout={handleLogout}
        />
      </aside>
    </div>
  );
}
