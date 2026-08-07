# Child Games — Account Platform

A full-stack account platform for Child Games: one login lets players
link, manage, and sync their accounts across every game you ship. Built
with Next.js + TypeScript + Tailwind, deployed on Vercel, backed by Neon
Postgres, integrated with PlayFab per-game, with matching Unity C# scripts
for VR clients.

This project is designed to be built and deployed **entirely through web
dashboards** — GitHub's web UI, Vercel's dashboard, Neon's dashboard, and
PlayFab's Game Manager. No terminal or CLI required at any point.

## Setup order

Follow these in order — each doc is self-contained and dashboard-only:

1. **`docs/GITHUB_UPLOAD.md`** — upload this project to a GitHub repo
2. **`docs/NEON_SETUP.md`** — create the Postgres database and run the schema
3. **`docs/PLAYFAB_SETUP.md`** — set up PlayFab for your first game
4. **`docs/VERCEL_SETUP.md`** — connect GitHub to Vercel, add environment
   variables, deploy
5. **`docs/ADDING_A_GAME.md`** — the exact steps to add each game (repeat
   per game)
6. **`unity/README-Unity-Setup.md`** — wire the Unity scripts into each
   game's project

## How it's organized

```
app/                        Next.js App Router
  page.tsx                  Dashboard (server-side auth gate)
  login/, register/         Auth pages
  api/
    auth/                   register, login, logout, me
    games/                  game list, link, unlink
    games/[gameId]/         inventory, bans, account, history (per game)
    unity/                  generate-link-code (called from Unity only)
    admin/                  sync-games (keeps DB in sync with config)

components/                 React components (dashboard, tabs, UI)

lib/
  games.config.ts           <-- THE ONLY FILE YOU EDIT TO ADD A GAME
  db.ts                     Neon connection
  auth.ts                   Session cookies (JWT), password hashing
  playfab.ts                Server-only PlayFab API client
  rateLimit.ts               Link-code rate limiting
  types.ts, linkedAccount.ts

db/
  schema.sql                 Full Postgres schema — run once in Neon

unity/
  ChildGamesAPI.cs           HTTP client for the Vercel backend
  LinkAccountManager.cs      In-game "generate link code" UI flow
  AccountSyncManager.cs      Loads inventory/currency/bans into gameplay
  README-Unity-Setup.md

docs/                       Every setup guide referenced above
```

## Security model

- Every game has its own PlayFab Title ID (public, lives in
  `lib/games.config.ts`) and its own Secret Key (private, lives ONLY as a
  Vercel Environment Variable, never in git).
- Unity never touches a Secret Key. It sends the player's PlayFab
  **session ticket** to `/api/unity/generate-link-code`, and the Vercel
  backend verifies that ticket server-side using the Secret Key. This is
  what proves account ownership without exposing anything to the client.
- All privileged PlayFab calls (`GetPlayerCombinedInfo`, `GetUserBans`,
  `AddUserVirtualCurrency`, `GrantItemsToUser`, etc.) happen exclusively
  inside `lib/playfab.ts`, which is marked `server-only` — importing it
  from a client component fails the build.
- The website never returns raw PlayFab responses to the browser; every
  API route shapes the data first (e.g. splitting inventory into
  cosmetics/items, computing ban remaining-time).

## Adding a game — the short version

1. Add one object to `lib/games.config.ts`.
2. Add one Secret Key env var in Vercel.
3. Visit `/api/admin/sync-games?secret=...` once.
4. Drop the three Unity scripts into that game's project and point
   `ChildGamesAPI.gameId` at the same id.

Full detail in `docs/ADDING_A_GAME.md`.

## Local development note

You don't need to run anything locally — GitHub + Vercel handles
installing dependencies and building on every push. If you ever do want
to preview changes before pushing, Vercel's dashboard also supports
editing files and previewing deployments without a local terminal.
