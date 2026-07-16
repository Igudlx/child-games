export interface GameConfig {
  /** Unique slug used in URLs and API routes, e.g. "example-game" */
  id: string;
  /** Display name shown in the UI */
  name: string;
  /** Opens in a new tab when the player doesn't own/link the game yet */
  downloadLink: string;
  /** PlayFab Title ID for this game (not secret — safe to expose) */
  playfabTitleId: string;
  /** Name of the Vercel environment variable holding this game's PlayFab secret key */
  secretKeyVariable: string;
}

export interface SessionUser {
  userId: string;
  username: string;
  email: string;
}

export interface LinkedAccountSummary {
  gameId: string;
  linked: boolean;
  playfabId?: string;
  linkedDate?: string;
  syncStatus?: 'synced' | 'syncing' | 'error';
}

export interface InventoryItem {
  itemId: string;
  displayName: string;
  itemClass: string;
  quantity: number;
}

export interface CurrencyBalance {
  code: string;
  amount: number;
}

export interface BanRecord {
  banId: string;
  reason: string;
  active: boolean;
  permanent: boolean;
  expires: string | null;
}

export interface HistoryEvent {
  type: 'login' | 'name_change' | 'other';
  description: string;
  timestamp: string;
}

export interface AccountBundle {
  account: {
    playfabId: string;
    username: string | null;
    created: string | null;
  };
  inventory: {
    items: InventoryItem[];
    currency: CurrencyBalance[];
  };
  bans: BanRecord[];
  history: HistoryEvent[];
  syncStatus: 'synced' | 'syncing' | 'error';
}
