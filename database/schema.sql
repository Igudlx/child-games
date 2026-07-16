-- =====================================================================
-- Child Games — Database Schema
-- Run this once in the Neon SQL Editor to create all tables.
-- (Neon dashboard → your project → "SQL Editor" tab → paste → Run)
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- for gen_random_uuid()

-- ---------------------------------------------------------------------
-- Users: one Child Games account per player.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      VARCHAR(20) UNIQUE NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Games: a mirror of lib/games.config.ts, kept in the DB so linked
-- accounts and history can reference a stable game_id even if the
-- config file is edited later. Upserted automatically on API calls —
-- see lib/syncGames.ts.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS games (
  id                VARCHAR(64) PRIMARY KEY,   -- matches GameConfig.id
  name              VARCHAR(255) NOT NULL,
  playfab_title_id  VARCHAR(64) NOT NULL,
  download_url      TEXT NOT NULL
);

-- ---------------------------------------------------------------------
-- Linked accounts: one row per (user, game) pairing that is currently
-- linked. Deleted (or marked inactive) when a player unlinks.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS linked_accounts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id      VARCHAR(64) NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  playfab_id   VARCHAR(64) NOT NULL,
  linked_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  sync_status  VARCHAR(16) NOT NULL DEFAULT 'synced', -- synced | syncing | error
  UNIQUE (user_id, game_id),
  UNIQUE (game_id, playfab_id)
);

-- ---------------------------------------------------------------------
-- Snapshots: a backup of a player's PlayFab state taken at the moment
-- of linking, so unlinking can restore it exactly.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS snapshots (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  linked_account_id   UUID NOT NULL REFERENCES linked_accounts(id) ON DELETE CASCADE,
  inventory_backup    JSONB NOT NULL,   -- InventoryItem[]
  currency_backup     JSONB NOT NULL,   -- CurrencyBalance[]
  saved_data          JSONB,            -- anything else worth restoring
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Link codes: short-lived, one-time codes generated in-game and
-- redeemed on the website to prove ownership of a PlayFab account.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS link_codes (
  code        VARCHAR(8) PRIMARY KEY,
  game_id     VARCHAR(64) NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  playfab_id  VARCHAR(64) NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN NOT NULL DEFAULT FALSE,
  used_by     UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_link_codes_expires ON link_codes(expires_at);

-- ---------------------------------------------------------------------
-- History: login times, name changes, and other tracked events per
-- linked account, shown in the "History" tab.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS history_events (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  linked_account_id   UUID NOT NULL REFERENCES linked_accounts(id) ON DELETE CASCADE,
  event_type          VARCHAR(32) NOT NULL, -- login | name_change | other
  description         TEXT NOT NULL,
  occurred_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Rate limiting: generic fixed-window counter used to protect link
-- code generation/redemption from brute-force guessing.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rate_limits (
  rate_key      VARCHAR(255) PRIMARY KEY,
  attempts      INTEGER NOT NULL DEFAULT 0,
  window_start  TIMESTAMPTZ NOT NULL DEFAULT now()
);
