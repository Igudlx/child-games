# Setup Guide (No Terminal Required)

Follow these steps in order: GitHub → Neon → Vercel → PlayFab → back to
Vercel to add environment variables. Every step is done by clicking
around a website — nothing here requires a command line.

---

## 1. Upload the project to GitHub

1. Go to [github.com](https://github.com) and sign in (or create an account).
2. Click the **+** icon top-right → **New repository**.
3. Name it `child-games` (or anything you like), leave it **Public** or
   **Private** (either works with Vercel), do **not** initialize with a
   README (you already have one), then click **Create repository**.
4. On the next page, click **uploading an existing file**.
5. Drag the **entire contents** of this project folder (not the folder
   itself — its contents: `app`, `components`, `lib`, `database`,
   `unity-scripts`, `package.json`, etc.) into the upload box.
6. Scroll down and click **Commit changes**.

Your code is now on GitHub.

---

## 2. Create the Neon database

1. Go to [neon.tech](https://neon.tech) and sign in or create an account.
2. Click **Create a project**. Give it any name (e.g. `child-games`) and
   pick a region close to you, then click **Create project**.
3. Once created, open the **SQL Editor** tab in the left sidebar.
4. Open the file `database/schema.sql` from this project (in GitHub, or
   on your computer), copy its entire contents, and paste them into the
   SQL Editor.
5. Click **Run**. You should see a success message — this creates all
   the tables (`users`, `games`, `linked_accounts`, `snapshots`,
   `link_codes`, `history_events`, `rate_limits`).
6. Go to the **Dashboard** tab and copy the **Connection string** shown
   there (choose the **pooled connection** if given the option — it's
   labeled something like "Pooled connection"). You'll paste this into
   Vercel in step 4 as `DATABASE_URL`.

---

## 3. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (using your GitHub
   account is easiest — it lets Vercel see your repositories directly).
2. Click **Add New…** → **Project**.
3. Find your `child-games` repository in the list and click **Import**.
4. Leave the default settings (Vercel auto-detects Next.js — Framework
   Preset should already say "Next.js"). Do **not** click Deploy yet —
   first expand **Environment Variables** and add the variables from
   step 4 below, then click **Deploy**.

Vercel will install dependencies and build the project automatically —
you never need to run `npm install` yourself.

---

## 4. Add environment variables in Vercel

In your Vercel project: **Settings → Environment Variables**. Add each
of these (Name / Value), then re-deploy if you added them after the
first deploy (**Deployments** tab → ⋯ menu on the latest deployment →
**Redeploy**):

| Name | Value |
|---|---|
| `DATABASE_URL` | The Neon connection string from step 2.6 |
| `SESSION_SECRET` | A long random string — generate one at [generate-secret.vercel.app/32](https://generate-secret.vercel.app/32) |
| `GAME_ONE_PLAYFAB_SECRET` | The secret key for your first game (see step 5) |
| `GAME_TWO_PLAYFAB_SECRET` | The secret key for your second game, if you have one |

Add one `..._PLAYFAB_SECRET` variable per game listed in
`lib/games.config.ts` — the variable **name** must exactly match the
`secretKeyVariable` value you set for that game in the config file.

See `.env.example` in this project for the full reference list.

---

## 5. Set up PlayFab for each game

For **each** game you want to connect:

1. Go to [developer.playfab.com](https://developer.playfab.com) and sign
   in, then open (or create) the title for that game.
2. Your **Title ID** is shown at the top of the Game Manager — copy it
   into that game's `playfabTitleId` field in `lib/games.config.ts`.
3. Click the gear icon (**Settings**) → **Secret Keys**. Create a
   secret key if one doesn't already exist and copy it.
4. Paste that secret key as the value of the environment variable you
   named in that game's `secretKeyVariable` field (step 4 above).

**Never** put a secret key anywhere in `lib/games.config.ts` or any
other file that gets uploaded to GitHub — it only ever goes into
Vercel's Environment Variables.

---

## 6. Add or edit games any time

Open `lib/games.config.ts` on GitHub (click the file → pencil/edit icon),
add a new entry to the `games` array following the existing examples,
commit the change, then add the matching `..._PLAYFAB_SECRET`
environment variable in Vercel. Vercel automatically rebuilds and
redeploys whenever you commit a change on GitHub — no manual redeploy
button needed (though you can also trigger one manually as described
in step 4).

---

## 7. Verify everything works

1. Visit your Vercel deployment URL (shown on the Vercel project page,
   looks like `https://child-games.vercel.app`).
2. Create an account, sign in, and confirm you land on the dashboard
   with your configured games listed on the right (or behind the ☰ menu
   on mobile).
3. Follow `unity-scripts/UNITY_SETUP.md` to test the in-game linking
   flow against this deployment.

If something doesn't work, check **Vercel → your project → Deployments
→ (latest) → Functions/Logs** for error messages from the API routes —
most issues at this stage are a missing or mistyped environment
variable name.
