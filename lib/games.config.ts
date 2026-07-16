import { GameConfig } from './types';

// =====================================================================
// ADD YOUR GAMES HERE. This is the only file you need to edit to
// register a new game — everything else (tabs, download buttons,
// linking, PlayFab calls) is generated automatically from this list.
//
//   id                 → lowercase, no spaces, used in URLs (e.g. "space-raiders")
//   name                → shown to players
//   downloadLink        → itch.io / Steam / Meta Store / your website — any URL
//   playfabTitleId      → from PlayFab Game Manager → your title → Settings
//   secretKeyVariable   → the NAME of the Vercel env var holding the secret
//                         key for this title. Set the actual value in
//                         Vercel → Settings → Environment Variables.
//                         NEVER put the actual secret key in this file.
// =====================================================================

export const games: GameConfig[] = [
  {
    id: 'example-game-one',
    name: 'Example Game One',
    downloadLink: 'https://example.itch.io/example-game-one',
    playfabTitleId: 'TITLE_ID_ONE',
    secretKeyVariable: 'GAME_ONE_PLAYFAB_SECRET',
  },
  {
    id: 'example-game-two',
    name: 'Example Game Two',
    downloadLink: 'https://store.steampowered.com/app/0000000',
    playfabTitleId: 'TITLE_ID_TWO',
    secretKeyVariable: 'GAME_TWO_PLAYFAB_SECRET',
  },

  // To add a third game, copy the block above and add a comma:
  // {
  //   id: 'my-new-game',
  //   name: 'My New Game',
  //   downloadLink: 'https://example.com/my-new-game',
  //   playfabTitleId: 'TITLE_ID_THREE',
  //   secretKeyVariable: 'GAME_THREE_PLAYFAB_SECRET',
  // },
];

export function getGameById(gameId: string): GameConfig | undefined {
  return games.find((g) => g.id === gameId);
}

/** Resolves a game's PlayFab secret key from its configured env var name. */
export function getGameSecret(game: GameConfig): string {
  const secret = process.env[game.secretKeyVariable];
  if (!secret) {
    throw new Error(
      `Missing environment variable "${game.secretKeyVariable}" for game "${game.id}". ` +
        `Set it in Vercel → Settings → Environment Variables.`
    );
  }
  return secret;
}

/** Games as sent to the browser — no secret variable names, no secrets. */
export function getPublicGameList() {
  return games.map((g) => ({
    id: g.id,
    name: g.name,
    downloadLink: g.downloadLink,
  }));
}
