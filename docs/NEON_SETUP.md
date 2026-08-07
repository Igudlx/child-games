# Setting Up Neon Postgres (Dashboard Only)

## 1. Create a Neon account and project

1. Go to https://neon.tech and sign up / log in.
2. Click **New Project**.
3. Name it `child-games` (or anything you like), pick a region close to
   where most of your players are, and click **Create Project**.

## 2. Run the schema

1. In your new project's dashboard, open the **SQL Editor** tab in the left
   sidebar.
2. Open `db/schema.sql` from this project (in GitHub, click the file, then
   click the "Raw" or copy icon to get the full text).
3. Paste the entire contents into Neon's SQL Editor.
4. Click **Run**. You should see confirmation that all tables were created:
   `users`, `games`, `linked_accounts`, `snapshots`, `link_codes`,
   `link_code_attempts`, `history`, and `synced_account_data`.

## 3. Get your connection string

1. In the Neon dashboard, go to your project's **Dashboard** (overview) page.
2. Find the **Connection Details** panel.
3. Select the **Pooled connection** option (important — this is the
   connection string designed for serverless platforms like Vercel).
4. Copy the full connection string. It looks like:
   `postgresql://user:password@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require`
5. Save this — you'll paste it into Vercel as `DATABASE_URL` in the next
   step (see `docs/VERCEL_SETUP.md`).

## 4. Seed the games table

The `games` table needs one row per game so `linked_accounts` can safely
foreign-key against it. After you deploy the site (next steps), visit:

`https://your-site.vercel.app/api/admin/sync-games`

This isn't created automatically — see `docs/ADDING_A_GAME.md` step 4 for
the tiny admin route that does this, and run it once after adding each new
game to `lib/games.config.ts`.
