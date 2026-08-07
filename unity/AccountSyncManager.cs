// AccountSyncManager.cs
//
// WHERE THIS GOES:
//   Assets/ChildGames/Scripts/AccountSyncManager.cs
//
// WHAT IT DOES:
//   After the player logs into PlayFab (via your normal login flow, which
//   may now be attached to a Child Games-linked account), this script
//   pulls their current inventory, virtual currency, and ban status
//   straight from PlayFab using the CLIENT API (safe to call from the
//   game — it only ever acts on the currently logged-in player's own
//   data, and requires no secret key). Gameplay code reads from the
//   public properties/events here instead of calling PlayFab directly
//   all over the codebase.
//
//   This is separate from the website's own "sync" step (which happens
//   server-side in app/api/games/link and caches data into Neon for the
//   dashboard). This script is what makes that same PlayFab data show up
//   correctly *inside the game*.
//
// SETUP IN UNITY:
//   1. Add this script to the same persistent GameObject as ChildGamesAPI
//      (or any DontDestroyOnLoad manager object) in your boot scene.
//   2. Call AccountSyncManager.Instance.RefreshAll() right after a
//      successful PlayFab login, and again after any purchase/reward
//      grant so the UI stays current.
//   3. Subscribe to OnInventoryUpdated / OnCurrencyUpdated / OnBanStatusChanged
//      from your HUD / shop / lobby scripts.

using System;
using System.Collections.Generic;
using PlayFab;
using PlayFab.ClientModels;
using UnityEngine;

namespace ChildGames
{
    public class AccountSyncManager : MonoBehaviour
    {
        public static AccountSyncManager Instance { get; private set; }

        public event Action<List<ItemInstance>> OnInventoryUpdated;
        public event Action<Dictionary<string, int>> OnCurrencyUpdated;
        public event Action<bool> OnBanStatusChanged; // true = currently banned

        public IReadOnlyList<ItemInstance> CurrentInventory => _inventory;
        public IReadOnlyDictionary<string, int> CurrentCurrency => _currency;
        public bool IsBanned { get; private set; }

        private List<ItemInstance> _inventory = new List<ItemInstance>();
        private Dictionary<string, int> _currency = new Dictionary<string, int>();

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

        /// <summary>
        /// Pulls inventory + virtual currency + ban status for the
        /// currently logged-in PlayFab player in one round trip.
        /// Call this right after login and after any transaction.
        /// </summary>
        public void RefreshAll()
        {
            var request = new GetPlayerCombinedInfoRequest
            {
                InfoRequestParameters = new GetPlayerCombinedInfoRequestParams
                {
                    GetUserInventory = true,
                    GetUserVirtualCurrency = true,
                    GetUserAccountInfo = true
                }
            };

            PlayFabClientAPI.GetPlayerCombinedInfo(request, OnCombinedInfoSuccess, OnPlayFabError);
        }

        private void OnCombinedInfoSuccess(GetPlayerCombinedInfoResult result)
        {
            var payload = result.InfoResultPayload;

            _inventory = payload.UserInventory ?? new List<ItemInstance>();
            OnInventoryUpdated?.Invoke(_inventory);

            _currency = new Dictionary<string, int>();
            if (payload.UserVirtualCurrency != null)
            {
                foreach (var kvp in payload.UserVirtualCurrency)
                {
                    _currency[kvp.Key] = kvp.Value;
                }
            }
            OnCurrencyUpdated?.Invoke(_currency);

            // PlayFab typically rejects login entirely for banned accounts
            // (error code AccountBanned) rather than letting them reach
            // gameplay, but we double check ban state here for accounts
            // banned mid-session.
            bool banned = payload.AccountInfo?.TitleInfo?.isBanned ?? false;
            if (banned != IsBanned)
            {
                IsBanned = banned;
                OnBanStatusChanged?.Invoke(IsBanned);
            }
        }

        /// <summary>Convenience helper for gameplay code, e.g. currency to
        /// spend in a shop. Returns 0 if the currency code is unknown.</summary>
        public int GetCurrency(string currencyCode)
        {
            return _currency.TryGetValue(currencyCode, out var amount) ? amount : 0;
        }

        /// <summary>Convenience helper for checking whether the player owns
        /// a cosmetic/item by its Catalog ItemId (not instance id).</summary>
        public bool OwnsItem(string itemId)
        {
            foreach (var item in _inventory)
            {
                if (item.ItemId == itemId) return true;
            }
            return false;
        }

        private void OnPlayFabError(PlayFabError error)
        {
            Debug.LogWarning($"[ChildGames] AccountSyncManager PlayFab error: {error.GenerateErrorReport()}");

            if (error.Error == PlayFabErrorCode.AccountBanned)
            {
                IsBanned = true;
                OnBanStatusChanged?.Invoke(true);
            }
        }
    }
}
