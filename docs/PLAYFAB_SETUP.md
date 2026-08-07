# PlayFab Setup Per Game

Every game gets its own PlayFab **Title**, its own **Title ID**, and its
own **Secret Key**. Never reuse a Secret Key across games.

## 1. Create a Title for the game

1. Go to https://developer.playfab.com and sign in.
2. In PlayFab Game Manager, click **Add Title** (or use an existing Studio
   -> Add Title if you already have other Child Games titles).
3. Name it after the game (e.g. "Steal a Brainrot VR").
4. Once created, open the title and go to **Settings -> General**. Copy
   the **Title ID** shown there (a short alphanumeric code, e.g. `1A2B3`).
   This is NOT secret — it goes straight into `lib/games.config.ts`.

## 2. Get the Secret Key

1. In the same title, go to **Settings -> Secret Keys**.
2. Click **Create a new secret key** if one doesn't already exist.
3. Copy the key value. This IS secret — it goes ONLY into a Vercel
   Environment Variable, never into any file in the repo.

## 3. Enable the API calls this project uses

By default a fresh PlayFab title already allows the Server API calls this
project relies on (`AuthenticateSessionTicket`, `GetPlayerCombinedInfo`,
`GetUserBans`, `UpdateUserInternalData`, `AddUserVirtualCurrency`,
`SubtractUserVirtualCurrency`, `GrantItemsToUser`, `RevokeInventoryItem`,
`RevokeAllBansForUser`) since these are all called with the Secret Key,
which has full Server API access by default. No extra toggles needed for
a standard title.

## 4. Set up your Catalog and Virtual Currencies (game-specific)

This part depends entirely on your game's own economy design:

1. **Settings -> Catalogs**: define your items (cosmetics, consumables,
   etc). Give cosmetic items an `Item Class` containing the word
   "cosmetic" (e.g. `cosmetic_hat`) — the website's Inventory tab uses
   that to automatically split "Cosmetics" from "Items". If you use a
   different naming scheme, update the check in
   `app/api/games/[gameId]/inventory/route.ts` (`splitInventory` function)
   to match.
2. **Settings -> Currencies**: define your virtual currency codes (e.g.
   `GC` for Gold Coins). These show up automatically in the Inventory tab
   and are what gets restored on unlink.

## 5. Unity SDK

1. In Unity, install the PlayFab SDK via the Unity Asset Store or
   PlayFab's GitHub releases (Window -> Package Manager, or import the
   `.unitypackage`).
2. In the PlayFab SDK's settings (`Assets/PlayFabSdk/Shared/Public/Resources/PlayFabSharedSettings`
   or via the PlayFab Editor Extensions window), set the **Title ID** to
   match this game's Title ID from step 1.
3. Do NOT put the Secret Key anywhere in Unity. The client SDK never
   needs it — only your Vercel backend uses it (see `docs/ADDING_A_GAME.md`
   and the `unity/*.cs` scripts).

Repeat this entire file for every new game you add to the platform.
