# Child Games

A production-ready account platform for a game company with multiple
Unity/PlayFab titles. Players create one Child Games account, link it
to any number of their games, and manage inventory, bans, account info,
and history for each — all from one dashboard.

**Start here:** [`SETUP.md`](./SETUP.md) walks through GitHub upload,
Neon, Vercel, and PlayFab setup with no terminal required.
[`unity-scripts/UNITY_SETUP.md`](./unity-scripts/UNITY_SETUP.md) covers
the in-game side.

---

## How it fits together

```
Unity VR game  ──(session ticket)──▶  Vercel API routes  ──(secret key)──▶  PlayFab
                                             │
                                             ▼
                                       Neon PostgreSQL
                                             ▲
                                             │
Website (Next.js) ───────(session cookie)───┘
```

PlayFab secret keys live **only** in Vercel Environment Variables. The
browser never sees them, never calls PlayFab directly, and never talks
to the database directly — every sensitive operation is mediated by a
Next.js API route running on the server.

---

## Folder structure

```
/app                     Next.js pages and API routes (App Router)
  /login, /register       Auth pages
  /dashboard               The main authenticated dashboard
  /api                     Backend endpoints (see below)
/components               React components shared across pages
/lib                       Server-side helpers (db, auth, PlayFab, config)
/database/schema.sql       Full Postgres schema for Neon
/unity-scripts             C# scripts + setup guide for the Unity game
```

### `/app` — pages

| File | Purpose |
|---|---|
| `app/layout.tsx` | Root layout; loads the display/body fonts and global CSS |
| `app/globals.css` | Tailwind entrypoint + reusable style primitives (`.btn-outline`, `.panel`, etc.) |
| `app/page.tsx` | Redirects to `/dashboard` or `/login` depending on session |
| `app/login/page.tsx` | Sign-in form |
| `app/register/page.tsx` | Account creation form |
| `app/dashboard/page.tsx` | Server component — checks the session, then renders the client dashboard |
| `app/dashboard/DashboardClient.tsx` | The main dashboard shell: desktop/VR layout with the game list panel, mobile layout with the ☰/⚙ menus |

### `/app/api` — backend endpoints

| Route | Purpose |
|---|---|
| `POST /api/auth/register` | Creates a user (hashes password, starts a session) |
| `POST /api/auth/login` | Verifies credentials, starts a session |
| `POST /api/auth/logout` | Clears the session cookie |
| `GET /api/auth/me` | Returns the current session, if any |
| `GET /api/games` | Lists all configured games with this user's link status for each |
| `GET /api/games/[gameId]` | Returns the full linked-account bundle (account, inventory, bans, history) by calling PlayFab server-side |
| `POST /api/games/[gameId]/unlink` | Restores the pre-link snapshot in PlayFab, then deletes the linked-account row |
| `POST /api/link/generate-code` | Called **from Unity**: validates a PlayFab session ticket, issues a one-time link code |
| `POST /api/link/redeem` | Called **from the website**: validates a code, snapshots PlayFab state, creates the link |
| `GET /api/link/status/[code]` | Called **from Unity**: lets the game poll whether its code has been redeemed yet |

### `/lib` — server-side helpers

| File | Purpose |
|---|---|
| `lib/db.ts` | Neon serverless Postgres client (`sql` tagged-template function) |
| `lib/types.ts` | Shared TypeScript interfaces |
| `lib/games.config.ts` | **The file you edit to add/remove games** — everything else generates automatically from this list |
| `lib/syncGames.ts` | Upserts `games.config.ts` into the `games` table on each request |
| `lib/auth.ts` | Password hashing (bcrypt) and input validation |
| `lib/session.ts` | Signs/verifies the httpOnly session cookie (JWT via `jose`) |
| `lib/linkCode.ts` | Generates short, human-friendly, cryptographically random link codes |
| `lib/rateLimit.ts` | Postgres-backed rate limiter (safe across serverless cold starts, unlike an in-memory counter) |
| `lib/playfab.ts` | Every PlayFab **Server API** call (secret-key operations) — account info, inventory, bans, granting/revoking items, adjusting currency |

### `/components` — UI

| File | Purpose |
|---|---|
| `ChildGamesLogo.tsx` | The large centered "Child / Games" wordmark, and a small version for headers |
| `RobotGraphic.tsx` | White line-art robot SVG used on the auth pages |
| `GameListPanel.tsx` | The right-hand game list (desktop/VR) — also reused inside the mobile menu |
| `MobileMenu.tsx` | The ☰ game list overlay and ⚙ settings overlay for mobile |
| `GameTab.tsx` | Container for a selected game: shows `LinkPanel` if unlinked, or the five sub-tabs if linked |
| `LinkPanel.tsx` | Code entry form + download button, shown for unlinked games |
| `LinkingAnimation.tsx` | The white/gray pulsing "LINKING…" text, then "LINKED ✓" |
| `InventoryTab.tsx` | Currency balances and item list |
| `BansTab.tsx` | Active ban list with remaining time |
| `AccountInfoTab.tsx` | Username, created date, PlayFab ID |
| `HistoryTab.tsx` | Login/name-change/event timeline |
| `SettingsTab.tsx` | Unlink flow with a confirmation step |

### `/database`

`schema.sql` — run once in the Neon SQL Editor. Creates `users`,
`games`, `linked_accounts`, `snapshots`, `link_codes`, `history_events`,
and `rate_limits`.

### `/unity-scripts`

`ChildGamesAPI.cs`, `LinkAccountManager.cs`, `AccountSyncManager.cs`,
and `UNITY_SETUP.md` — see that guide for full wiring instructions.

---

## Adding a new game

1. Add an entry to the `games` array in `lib/games.config.ts` (id, name,
   download link, PlayFab Title ID, and the name of an environment
   variable for its secret key).
2. Add that environment variable in Vercel with the actual secret key
   value (from PlayFab → Settings → Secret Keys).
3. Commit and push — Vercel redeploys automatically, and the new game's
   tab, download button, and linking flow appear with no other changes.

## Security notes

- PlayFab secret keys are read only inside `lib/games.config.ts`'s
  `getGameSecret()`, which is only ever called from API routes — never
  from a client component.
- Passwords are hashed with bcrypt (12 salt rounds) — plaintext
  passwords are never stored.
- Sessions are httpOnly, signed JWT cookies — inaccessible to
  client-side JavaScript.
- Link codes are short-lived (10 minutes), one-time use, drawn from a
  32-character alphabet with no ambiguous characters, and rate-limited
  per PlayFab ID and per IP address.
- All PlayFab Server API calls happen server-side; the browser only
  ever receives filtered JSON built specifically for the dashboard.
