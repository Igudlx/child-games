# Uploading This Project to GitHub (No Terminal Required)

You'll do this entirely through github.com in your browser.

## 1. Create the repository

1. Go to https://github.com/new
2. Repository name: `child-games-platform` (or whatever you'd like)
3. Set it to **Private** (recommended — even though no secrets live in this
   code, there's no reason to make it public).
4. Do **NOT** check "Add a README" — leave the repo completely empty, since
   you're uploading an existing project.
5. Click **Create repository**.

## 2. Upload the project files

GitHub's web UI lets you upload an entire folder structure by drag-and-drop:

1. On your new (empty) repo's page, click **"uploading an existing file"**
   (the link shown on the empty-repo page).
2. Open the unzipped `child-games-platform` folder on your computer in your
   file explorer / Finder.
3. Select **all files and folders inside it** (not the outer folder itself)
   and drag them into the GitHub upload box in your browser.
   - GitHub preserves folder structure when you drag folders in — `app/`,
     `components/`, `lib/`, `db/`, `unity/`, and `docs/` will all show up
     as real folders in the repo.
4. Scroll down, add a commit message like `Initial commit`, and click
   **Commit changes**.

## 3. Double-check nothing secret got uploaded

Before moving on, open the repo on GitHub and confirm:
- There is **no** `.env` or `.env.local` file in the repo (only
  `.env.example`, which contains no real values).
- No file contains an actual PlayFab Secret Key or database password.

The `.gitignore` file included in this project is configured to keep
`.env*` files out automatically if you ever do add one locally, but since
you're uploading via drag-and-drop rather than git, it's worth a manual
glance the first time.

## 4. You're done with GitHub

From here, Vercel will connect directly to this repository and redeploy
automatically every time you upload new/changed files through the same
GitHub web UI (Add file → Upload files, or editing a file directly in
GitHub's browser-based editor). No terminal, no git commands, ever
required.

Continue to `docs/NEON_SETUP.md`, then `docs/VERCEL_SETUP.md`.
