export interface PublicUser {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

export type LinkedAccountStatus = "linked" | "unlinked";

export interface LinkedAccountRow {
  id: string;
  user_id: string;
  game_id: string;
  playfab_id: string;
  linked_at: string;
  status: LinkedAccountStatus;
}

export interface SnapshotData {
  accountInfo: Record<string, unknown>;
  inventory: unknown[];
  virtualCurrency: Record<string, number>;
  statistics: unknown[];
  bans: unknown[];
  readOnlyData: Record<string, unknown>;
  capturedAt: string;
}

export interface HistoryEvent {
  id: string;
  user_id: string;
  game_id: string | null;
  event_type: string;
  event_data: Record<string, unknown> | null;
  created_at: string;
}

export interface GameSummary {
  id: string;
  name: string;
  tagline?: string;
  downloadUrl: string;
  linked: boolean;
}
