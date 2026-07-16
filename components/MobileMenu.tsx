'use client';

import { ChildGamesLogo } from './ChildGamesLogo';
import { GameListPanel } from './GameListPanel';

interface GameListItem {
  id: string;
  name: string;
  linked: boolean;
}

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  games: GameListItem[];
  selectedGameId: string | null;
  onSelectGame: (gameId: string) => void;
}

export function MobileMenu({ open, onClose, games, selectedGameId, onSelectGame }: MobileMenuProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 bg-void md:hidden animate-fadeUp">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <ChildGamesLogo size="small" />
        <button onClick={onClose} className="btn-ghost text-2xl leading-none px-2">
          ×
        </button>
      </div>
      <div className="px-5 py-6">
        <GameListPanel
          games={games}
          selectedGameId={selectedGameId}
          onSelectGame={(id) => {
            onSelectGame(id);
            onClose();
          }}
          showAccountControls={false}
        />
      </div>
    </div>
  );
}

interface MobileSettingsProps {
  open: boolean;
  onClose: () => void;
  username: string;
  onLogout: () => void;
}

export function MobileSettings({ open, onClose, username, onLogout }: MobileSettingsProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 bg-void md:hidden animate-fadeUp">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <span className="eyebrow">Settings</span>
        <button onClick={onClose} className="btn-ghost text-2xl leading-none px-2">
          ×
        </button>
      </div>
      <div className="px-5 py-6 flex flex-col gap-6">
        <div>
          <p className="eyebrow mb-1">Signed in as</p>
          <p className="font-display font-medium text-lg">{username}</p>
        </div>
        <button
          onClick={onLogout}
          className="btn-outline self-start"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
