-- ============================================================================
-- CHILD GAMES PLATFORM — DATABASE SCHEMA
-- ============================================================================
-- Run this entire file ONCE in the Neon dashboard's SQL Editor.
-- See docs/NEON_SETUP.md for exact click-by-click steps (no CLI needed).
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gives us gen_random_uuid()

-- ----------------------------------------------------------------------------
-- USERS
-- Child Games platform accounts (separate from any individual game's PlayFab
-- account). One user can link many games.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username       TEXT UNIQUE NOT NULL,
  email          TEXT UNIQUE NOT NULL,
  password_hash  TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- GAMES
-- Mirrors lib/games.config.ts so the database can foreign-key against a
-- game safely. Kept in sync by /api/admin/sync-games (see docs/ADDING_A_GAME.md).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS games (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  playfab_title_id  TEXT NOT NULL,
  download_url      TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- LINKED ACCOUNTS
-- One row per (user, game) pair that has ever been linked. status flips
-- between 'linked' and 'unlinked' rather than deleting rows, so history
-- and snapshots stay attached to something.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS linked_accounts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id       TEXT NOT NULL REFERENCES games(id) ON DELETE RESTRICT,
  playfab_id    TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'linked' CHECK (status IN ('linked', 'unlinked')),
  linked_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  unlinked_at   TIMESTAMPTZ,
  UNIQUE (user_id, game_id)
);

-- A given PlayFab account should only be actively linked to one Child Games
-- user per game at a time.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_playfab_link
  ON linked_accounts (game_id, playfab_id)
  WHERE status = 'linked';

-- ----------------------------------------------------------------------------
-- SNAPSHOTS
-- Full pre-link state capture, used to restore an account exactly on unlink.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS snapshots (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  linked_account_id   UUID NOT NULL REFERENCES linked_accounts(id) ON DELETE CASCADE,
  snapshot_data        JSONB NOT NULL,
  taken_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  restored_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_snapshots_linked_account
  ON snapshots (linked_account_id, taken_at DESC);

-- ----------------------------------------------------------------------------
-- LINK CODES
-- Generated inside Unity, single-use, expiring. The website exchanges one
-- of these for a completed link.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS link_codes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id      TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  playfab_id   TEXT NOT NULL,
  code         TEXT UNIQUE NOT NULL,
  expires_at   TIMESTAMPTZ NOT NULL,
  used         BOOLEAN NOT NULL DEFAULT FALSE,
  used_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_link_codes_code ON link_codes (code);

-- Rate-limiting ledger for link code generation (5 per 10 minutes per
-- player per game, enforced in lib/rateLimit.ts).
CREATE TABLE IF NOT EXISTS link_code_attempts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id       TEXT NOT NULL,
  playfab_id    TEXT NOT NULL,
  attempted_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_link_code_attempts_lookup
  ON link_code_attempts (game_id, playfab_id, attempted_at);

-- ----------------------------------------------------------------------------
-- HISTORY
-- Login history, name history, linking/unlinking events, sync events, etc.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS history (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id      TEXT REFERENCES games(id) ON DELETE SET NULL,
  event_type   TEXT NOT NULL, -- 'login' | 'link' | 'unlink' | 'sync' | 'name_change' | ...
  event_data   JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_history_user ON history (user_id, created_at DESC);

-- ----------------------------------------------------------------------------
-- CACHED GAME DATA (inventory / bans / account mirror)
-- Synced on link/unlink/manual refresh so pages render fast without hitting
-- PlayFab on every page load. PlayFab remains the source of truth; this is
-- a read-through cache.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS synced_account_data (
  linked_account_id  UUID PRIMARY KEY REFERENCES linked_accounts(id) ON DELETE CASCADE,
  inventory          JSONB NOT NULL DEFAULT '[]',
  virtual_currency   JSONB NOT NULL DEFAULT '{}',
  bans               JSONB NOT NULL DEFAULT '[]',
  account_info       JSONB NOT NULL DEFAULT '{}',
  synced_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
