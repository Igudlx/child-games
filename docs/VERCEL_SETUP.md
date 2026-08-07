# Deploying to Vercel (Dashboard Only)

## 1. Import the GitHub repo

1. Go to https://vercel.com and sign in (use "Continue with GitHub" so it
   can access your repo).
2. Click **Add New... -> Project**.
3. Find `child-games-platform` in the repo list and click **Import**.
4. Framework Preset should auto-detect as **Next.js** — leave it as is.
5. Don't click Deploy yet — first add the environment variables below,
   otherwise the first build will fail (it needs DATABASE_URL etc. at
   runtime, and AUTH_SECRET to even boot).

## 2. Add Environment Variables

Still on the "Configure Project" screen (or afterward under
**Project -> Settings -> Environment Variables** if you already deployed
once), add each of the following as a new variable. Apply each to
**Production, Preview, and Development** (the three checkboxes) unless you
have a reason not to.

| Name | Value |
|---|---|
| `DATABASE_URL` | The pooled connection string from Neon (see `docs/NEON_SETUP.md`) |
| `AUTH_SECRET` | A long random string you generate yourself |
| `ADMIN_SYNC_SECRET` | Another long random string you generate yourself |
| `PLAYFAB_SECRET_<GAME_ID>` | One per game — see `docs/ADDING_A_GAME.md` |

To generate a random secret without a terminal, use
https://generate-secret.vercel.app/32 (or any reputable password
generator set to 40+ characters) and paste the result in.

## 3. Deploy

1. Click **Deploy**.
2. Vercel installs dependencies and runs the Next.js build automatically —
   this is what replaces needing to run `npm install` / `npm run build`
   yourself. You never touch a terminal.
3. Once it finishes, you'll get a URL like `https://child-games-platform.vercel.app`.

## 4. Every future update is just a GitHub upload

Because the project is connected to GitHub, any time you edit or add a
file through GitHub's web UI (Add file → Upload files, or the pencil
"edit" icon on an existing file) and commit the change, Vercel
automatically starts a new deployment. No redeploy button, no CLI.

## 5. Custom domain (optional)

Under **Project -> Settings -> Domains**, you can attach a domain you own
(e.g. `accounts.childgames.com`) — Vercel walks you through the DNS
records to add at your domain registrar, all via dashboard.
