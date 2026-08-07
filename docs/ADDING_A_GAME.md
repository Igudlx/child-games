# Adding a New Game to the Platform

Adding a game touches exactly two places: one line of config in the repo,
and one environment variable in Vercel. Nothing else in the website needs
to change — tabs, download buttons, linking, and all the backend routes
are generated automatically from this.

## Step 1 — Set up the game in PlayFab

Follow `docs/PLAYFAB_SETUP.md` for this specific game: create its Title,
grab its Title ID, and grab its Secret Key.

## Step 2 — Add the game to `lib/games.config.ts`

Open `lib/games.config.ts` in GitHub's web editor (click the file, then
the pencil icon) and add a new entry to the `GAMES` array:

```ts
{
  id: "steal-a-brainrot-vr",
  name: "Steal a Brainrot VR",
  downloadUrl: "https://your-store-link.example.com",
  playfabTitleId: "ABCDE",
  secretKeyEnvVar: "PLAYFAB_SECRET_STEAL_A_BRAINROT_VR",
  tagline: "Multiplayer VR heist chaos",
},
```

Rules for the fields:
- `id`: lowercase, hyphens only, and permanent — once players start
  linking this game, don't change it (it's used as a database key).
- `secretKeyEnvVar`: pick a unique env var name, conventionally
  `PLAYFAB_SECRET_<GAME_ID_IN_CAPS_WITH_UNDERSCORES>`. This is just a
  variable *name* here — the real key never goes in this file.

Commit the change directly in GitHub's editor (or upload the edited file
again). Vercel will automatically redeploy.

## Step 3 — Add the Secret Key to Vercel

1. Go to your project in Vercel -> **Settings -> Environment Variables**.
2. Add a new variable:
   - Name: exactly what you put in `secretKeyEnvVar` above, e.g.
     `PLAYFAB_SECRET_STEAL_A_BRAINROT_VR`
   - Value: the actual Secret Key you copied from PlayFab in Step 1.
   - Apply to Production, Preview, and Development.
3. Save. Vercel will prompt you to redeploy for the new variable to take
   effect — click **Redeploy**.

## Step 4 — Sync the `games` table in Neon

The database needs a matching row in its `games` table (this is what
`linked_accounts` foreign-keys against). After the redeploy finishes,
visit in your browser:

```
https://your-site.vercel.app/api/admin/sync-games?secret=YOUR_ADMIN_SYNC_SECRET
```

(using the `ADMIN_SYNC_SECRET` value you set in Vercel). You should see a
JSON response listing every game id that was synced, including the new
one.

## Step 5 — Set up the Unity side

In the new game's Unity project, follow `unity/README-Unity-Setup.md` —
in short: install the PlayFab SDK, point it at this game's Title ID, add
the three Child Games scripts, and set `gameId` on the `ChildGamesAPI`
component to match the `id` you used in Step 2 exactly.

## That's it

Reload the website — the new game now has its own tab, its own download
button, and fully working link/inventory/bans/account/history/settings
pages, with zero other code changes required.
