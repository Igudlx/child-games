# Unity VR Setup Guide

This covers wiring `ChildGamesAPI.cs`, `LinkAccountManager.cs`, and
`AccountSyncManager.cs` into a Unity C# / Meta Quest project that already
uses the PlayFab SDK.

## 1. Prerequisites in Unity

1. Install the **PlayFab SDK** for Unity (Window → Package Manager, or
   import the `.unitypackage` from the PlayFab website).
2. Make sure your game already logs the player into PlayFab on boot
   (e.g. `PlayFabClientAPI.LoginWithCustomID` or your platform's login
   for Meta Quest). `LinkAccountManager` assumes a session ticket
   already exists by the time the player presses "Link Account".
3. Set your PlayFab **Title ID** in `PlayFabSettings` (Unity menu:
   PlayFab → Editor Extensions, or set `PlayFabSettings.staticSettings.TitleId`
   in code). This must match the `playfabTitleId` for this game in the
   website's `lib/games.config.ts`.

## 2. Import the scripts

Copy the three files from `/unity-scripts` into your Unity project,
typically under `Assets/Scripts/ChildGames/`:

- `ChildGamesAPI.cs`
- `LinkAccountManager.cs`
- `AccountSyncManager.cs`

Unity will compile them automatically — no extra packages needed beyond
the PlayFab SDK (they only use `UnityEngine.Networking.UnityWebRequest`,
which ships with Unity).

## 3. Scene setup

1. Create an empty GameObject named **ChildGamesManager**.
2. Add the `ChildGamesAPI` component to it.
   - Set **Child Games Api Base Url** to your deployed Vercel URL,
     e.g. `https://child-games.vercel.app` (no trailing slash).
   - Set **Game Id** to the exact `id` string you used for this game in
     `lib/games.config.ts` (e.g. `example-game-one`).
3. Add the `AccountSyncManager` component to the same GameObject.
4. Both managers call `DontDestroyOnLoad`, so put this GameObject in
   your first/boot scene only — it will persist across scene loads.

## 4. Building the "Link Account" VR panel

1. Build a simple world-space Canvas (VR UI should live on a
   world-space canvas, not screen-space, so it's visible in headset).
2. Add:
   - A **Text** (or TextMeshProUGUI, swap the type in the script if so)
     for the link code — this is `linkCodeText`.
   - A **Text** for status messages — this is `statusText`.
   - A **Button** the player can point-and-click with the VR
     controller/pointer — this is `linkButton`.
3. Add the `LinkAccountManager` component to this Canvas (or a
   controller GameObject) and drag the three UI references into the
   Inspector fields.
4. Set up your XR Interaction Toolkit (or Meta's Interaction SDK) so the
   Button is a valid ray-interactable — this is standard Quest UI setup
   and doesn't require anything custom from this script; it just needs
   `Button.onClick` to fire normally, which `LinkAccountManager`
   subscribes to automatically in `Start()`.

## 5. Trigger a sync after linking

`LinkAccountManager` already shows "LINKED ✓" once the website confirms
the code was redeemed. Call `AccountSyncManager.Instance.SyncNow()` right
after that (for example, subscribe to the moment `statusText.text`
becomes "LINKED ✓", or expose a small `UnityEvent OnLinked` in
`LinkAccountManager` if you'd like a cleaner hook) so inventory and
currency UI in-game refresh immediately.

## 6. Testing the flow end to end

1. Play the game in the Unity Editor (or on-device) and log in via
   PlayFab as usual.
2. Press the Link Account button — you should see a code appear on the
   VR panel within a second or two.
3. Open your deployed website, sign in, select this game's tab, and
   type the code in.
4. Within a couple of seconds the headset UI should flip to "LINKED ✓"
   (it's polling `/api/link/status/{code}` every `pollIntervalSeconds`).
5. Back on the website, the game's tab should now show Inventory, Bans,
   Account, History, and Settings tabs instead of the link-code screen.

## Notes

- The Unity game never talks to PlayFab's Secret Key or the database —
  it only ever calls `ChildGamesAPI`, which hits your Vercel-hosted API
  routes over plain HTTPS, and calls the normal PlayFab **Client** API
  (not Admin/Server) for its own inventory reads.
- If you rename `gameId` in `lib/games.config.ts`, update the
  `Game Id` field on the `ChildGamesAPI` component to match — they must
  be identical strings.
