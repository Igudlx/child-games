'use client';

interface GameListItem {
  id: string;
  name: string;
  linked: boolean;
}

interface GameListPanelProps {
  games: GameListItem[];
  selectedGameId: string | null;
  onSelectGame: (gameId: string) => void;
  username?: string;
  onLogout?: () => void;
  showAccountControls?: boolean;
}

export function GameListPanel({
  games,
  selectedGameId,
  onSelectGame,
  username,
  onLogout,
  showAccountControls = true,
}: GameListPanelProps) {
  return (
    <div className="flex h-full flex-col">
      {showAccountControls && (
        <div className="mb-8">
          <p className="eyebrow mb-1">Signed in as</p>
          <p className="font-display font-medium text-lg mb-4 truncate">{username}</p>
          {onLogout && (
            <button onClick={onLogout} className="btn-ghost -ml-4">
              Log out
            </button>
          )}
        </div>
      )}

      <p className="eyebrow mb-3">Games</p>
      <nav className="flex flex-col gap-1 overflow-y-auto">
        {games.map((game) => (
          <button
            key={game.id}
            onClick={() => onSelectGame(game.id)}
            className={`group flex items-center justify-between border-l-2 px-3 py-3 text-left font-display text-sm tracking-wide uppercase transition-colors duration-150 ${
              selectedGameId === game.id
                ? 'border-paper text-paper'
                : 'border-transparent text-mist hover:border-line hover:text-paper'
            }`}
          >
            <span className="truncate">{game.name}</span>
            <span
              className={`ml-2 h-1.5 w-1.5 shrink-0 rounded-full ${
                game.linked ? 'bg-paper' : 'bg-line'
              }`}
              title={game.linked ? 'Linked' : 'Not linked'}
            />
          </button>
        ))}
        {games.length === 0 && (
          <p className="text-sm text-mist py-2">No games configured yet.</p>
        )}
      </nav>
    </div>
  );
}
