/**
 * ============================================================================
 * CHILD GAMES — GAME REGISTRY
 * ============================================================================
 * To add a new game to the platform, add ONE object to the GAMES array below.
 * That's it. The website automatically:
 *   - creates a tab for it in the sidebar / mobile menu
 *   - creates a download button
 *   - wires up backend routing for linking, inventory, bans, account, history
 *   - looks up the correct PlayFab Title ID and Secret Key for every request
 *
 * You must ALSO add the matching secret key to Vercel's Environment
 * Variables (see docs/VERCEL_SETUP.md and docs/ADDING_A_GAME.md).
 * The secret key itself never lives in this file or anywhere in git.
 * ============================================================================
 */

export interface GameConfig {
  /** Stable, URL-safe identifier. Lowercase, hyphens only. Never change this
   *  once players have linked accounts — it's used as the DB foreign key. */
  id: string;
  /** Display name shown in tabs, headers, and buttons. */
  name: string;
  /** Where a user goes to download/install the game if they don't have it
   *  (itch.io, Steam, Meta Quest store, your own site, etc). */
  downloadUrl: string;
  /** The PlayFab Title ID for this specific game (found in PlayFab
   *  Game Manager -> your title -> Settings). Not secret. */
  playfabTitleId: string;
  /** The NAME of the Vercel environment variable that holds this game's
   *  PlayFab Secret Key. The actual key value lives only in Vercel, never
   *  here. See docs/ADDING_A_GAME.md. */
  secretKeyEnvVar: string;
  /** Short tagline shown under the game name on its tab (optional). */
  tagline?: string;
}

export const GAMES: GameConfig[] = [
  {
    id: "example-vr-game",
    name: "Example VR Game",
    downloadUrl: "https://example.com/download",
    playfabTitleId: "1A2B3",
    secretKeyEnvVar: "PLAYFAB_SECRET_EXAMPLE_VR_GAME",
    tagline: "Replace this entry with your real game",
  },
];

export function getGameConfig(gameId: string): GameConfig | undefined {
  return GAMES.find((g) => g.id === gameId);
}

export function getAllGameIds(): string[] {
  return GAMES.map((g) => g.id);
}

/** Reads the actual secret key for a game out of process.env at request time.
 *  Throws instead of silently returning undefined, so a misconfigured game
 *  fails loudly on the server instead of leaking a broken request to PlayFab. */
export function getGameSecretKey(config: GameConfig): string {
  const key = process.env[config.secretKeyEnvVar];
  if (!key) {
    throw new Error(
      `Missing environment variable "${config.secretKeyEnvVar}" for game "${config.id}". ` +
        `Set it in Vercel -> Project -> Settings -> Environment Variables.`
    );
  }
  return key;
}
