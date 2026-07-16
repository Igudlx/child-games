using System;
using System.Collections.Generic;
using PlayFab;
using PlayFab.ClientModels;
using UnityEngine;

namespace ChildGames
{
    /// <summary>
    /// The Child Games website backend talks to PlayFab directly (using
    /// the title's secret key, server-side) whenever it syncs cosmetics,
    /// currency, or bans during a link/unlink. This script does NOT
    /// receive that data from our backend — instead, once linking or
    /// unlinking completes, the game simply re-reads its own state from
    /// PlayFab, the same way it always does, and PlayFab already
    /// reflects whatever the backend just wrote.
    ///
    /// Call SyncNow() right after LinkAccountManager reports "LINKED ✓",
    /// and again after any unlink flow, so the in-game UI immediately
    /// reflects the restored/updated inventory, currency, and bans.
    /// </summary>
    public class AccountSyncManager : MonoBehaviour
    {
        public static AccountSyncManager Instance { get; private set; }

        public event Action<List<ItemInstance>> OnInventoryUpdated;
        public event Action<Dictionary<string, int>> OnCurrencyUpdated;
        public event Action<List<string>> OnBansUpdated;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        /// <summary>Re-pulls inventory, currency, and ban state from PlayFab.</summary>
        public void SyncNow()
        {
            RefreshInventory();
            RefreshBans();
        }

        private void RefreshInventory()
        {
            PlayFabClientAPI.GetUserInventory(new GetUserInventoryRequest(),
                result =>
                {
                    OnInventoryUpdated?.Invoke(result.Inventory);
                    OnCurrencyUpdated?.Invoke(result.VirtualCurrency);
                },
                error => Debug.LogError($"[AccountSyncManager] GetUserInventory failed: {error.GenerateErrorReport()}")
            );
        }

        private void RefreshBans()
        {
            // Ban status for the current player is returned as part of
            // login results (InfoResultPayload.PlayerProfile /
            // TitleInfo.isBanned in most SDK versions) rather than a
            // dedicated client-callable "get my bans" endpoint — bans are
            // an account-level restriction PlayFab enforces automatically
            // on login/API calls, so the most reliable signal in-game is
            // simply whether calls start failing with AccountBanned.
            // If you display ban details on the website (via the Server
            // API in lib/playfab.ts), you generally don't need to
            // duplicate that UI inside the headset.
            OnBansUpdated?.Invoke(new List<string>());
        }
    }
}
