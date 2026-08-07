# Unity Setup — Child Games Account Linking

This covers wiring the three C# scripts into a Unity project for a game
that will connect to the Child Games platform.

## 1. Install the PlayFab Unity SDK

1. Download the PlayFab Unity SDK from
   https://github.com/PlayFab/UnitySDK/releases (the `.unitypackage`), or
   install it via the Unity Asset Store.
2. Import it into your project (Assets -> Import Package -> Custom
   Package).
3. Open the PlayFab Editor Extensions window (Window -> PlayFab -> Editor
   Extensions after import, or Window -> PlayFab if using an older SDK
   version) and set the **Title ID** to this game's PlayFab Title ID (see
   `docs/PLAYFAB_SETUP.md` in the main repo).

Make sure your project already has a working PlayFab login flow (e.g.
`PlayFabClientAPI.LoginWithCustomID`, device ID login, or whatever you
use) — the Child Games scripts assume the player is already logged into
PlayFab before the linking screen or account sync run.

## 2. Copy in the Child Games scripts

Create the folder `Assets/ChildGames/Scripts/` and copy in:

- `ChildGamesAPI.cs`
- `LinkAccountManager.cs`
- `AccountSyncManager.cs`

(These three files live in the `unity/` folder of the main repo — copy
them into your Unity project's Assets folder through your OS file
explorer, or drag-and-drop them into the Unity Project window.)

## 3. Set up the manager GameObject

1. In your boot/bootstrap scene (the first scene that loads), create an
   empty GameObject named `ChildGamesManagers`.
2. Attach `ChildGamesAPI` to it.
   - Set **Backend Base Url** to your deployed Vercel URL, e.g.
     `https://child-games-platform.vercel.app` (no trailing slash).
   - Set **Game Id** to the exact same `id` string you used for this game
     in `lib/games.config.ts` on the website.
3. Attach `AccountSyncManager` to the same GameObject.
4. Both scripts call `DontDestroyOnLoad` themselves in `Awake()`, so this
   GameObject and its data survive scene transitions automatically.

## 4. Build the Link Account UI

For VR, use a World Space Canvas placed in front of the player (e.g. in a
menu/lobby room); for flat-screen, a normal Screen Space Canvas works the
same way. You need:

- A `TMP_Text` to show the generated code
- A `TMP_Text` for the countdown/expiry
- A `TMP_Text` for error messages
- A `Button` labeled "Generate Link Code"

Attach `LinkAccountManager` to the Canvas (or a dedicated UI manager
object) and drag each UI element into the matching Inspector field. Wire
the Button's `OnClick` event to `LinkAccountManager.GenerateCode()`.

When the player presses the button, they'll see an 8-character code
appear with a 10-minute countdown — that's the code they type into the
website's "Link Code" field.

## 5. Hook up account sync

Right after your existing login flow succeeds (wherever you currently
call `PlayFabClientAPI.LoginWithX(...)` and get a success callback), add:

```csharp
AccountSyncManager.Instance.RefreshAll();
```

Then anywhere in your game that needs to know about currency, cosmetics,
or ban status, subscribe to the events or read the properties:

```csharp
AccountSyncManager.Instance.OnCurrencyUpdated += (currency) => { /* update HUD */ };
AccountSyncManager.Instance.OnInventoryUpdated += (items) => { /* update inventory UI */ };
AccountSyncManager.Instance.OnBanStatusChanged += (isBanned) => { if (isBanned) { /* kick to menu */ } };

int coins = AccountSyncManager.Instance.GetCurrency("GC");
bool hasHat = AccountSyncManager.Instance.OwnsItem("cosmetic_top_hat");
```

Call `RefreshAll()` again after any purchase or reward grant so the UI
stays current.

## 6. Test the full loop

1. Play the game, log into PlayFab, generate a link code.
2. On the website, sign into (or create) a Child Games account, select
   this game, paste the code, press Link Account.
3. Confirm the website shows `LINKED ✓` and the Inventory/Bans/Account
   tabs populate.
4. Back in Unity, confirm `AccountSyncManager` still reflects the correct
   currency/inventory (call `RefreshAll()` again to double check).
5. On the website, go to Settings -> Unlink Game and confirm the account
   is restored and the game becomes linkable again.
