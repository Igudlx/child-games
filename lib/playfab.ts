import "server-only";
import { GameConfig, getGameSecretKey } from "./games.config";

/**
 * ============================================================================
 * SERVER-ONLY PLAYFAB CLIENT
 * ============================================================================
 * Every function here calls PlayFab's "Server" API family using a game's
 * Secret Key. This file is marked `server-only` so importing it from a
 * client component fails the build instead of silently leaking a secret
 * into the browser bundle.
 *
 * Nothing in this file is ever called directly by the browser or by Unity.
 * Route handlers in app/api/** are the only callers, and they run entirely
 * on Vercel's servers.
 * ============================================================================
 */

class PlayFabError extends Error {
  constructor(message: string, public status: number, public raw?: unknown) {
    super(message);
  }
}

async function callPlayFabServer<T = Record<string, unknown>>(
  config: GameConfig,
  endpoint: string,
  body: Record<string, unknown>
): Promise<T> {
  const secretKey = getGameSecretKey(config);
  const url = `https://${config.playfabTitleId}.playfabapi.com/Server/${endpoint}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-SecretKey": secretKey,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const json = await res.json();

  if (!res.ok || json.code !== 200) {
    throw new PlayFabError(
      json.errorMessage || `PlayFab request to ${endpoint} failed`,
      res.status,
      json
    );
  }

  return json.data as T;
}

/** Exchanges a client session ticket (obtained by the Unity client after
 *  logging into PlayFab normally) for a verified PlayFabId. This is how we
 *  prove "the person holding this Unity session really owns this PlayFab
 *  account" without ever handing the secret key to the client. */
export async function authenticateSessionTicket(
  config: GameConfig,
  sessionTicket: string
): Promise<{ playFabId: string }> {
  const data = await callPlayFabServer<{
    UserInfo: { PlayFabId: string };
  }>(config, "AuthenticateSessionTicket", { SessionTicket: sessionTicket });
  return { playFabId: data.UserInfo.PlayFabId };
}

/** One-call fetch of everything needed for a full account snapshot:
 *  profile / account info, inventory, virtual currency balances, and
 *  player statistics. */
export async function getCombinedInfo(config: GameConfig, playFabId: string) {
  return callPlayFabServer<{
    PlayFabId: string;
    InfoResultPayload: {
      AccountInfo: Record<string, unknown>;
      UserInventory: unknown[];
      UserVirtualCurrency: Record<string, number>;
      PlayerStatistics: unknown[];
      UserReadOnlyData: Record<string, { Value: string }>;
    };
  }>(config, "GetPlayerCombinedInfo", {
    PlayFabId: playFabId,
    InfoRequestParameters: {
      GetUserAccountInfo: true,
      GetUserInventory: true,
      GetUserVirtualCurrency: true,
      GetPlayerStatistics: true,
      GetUserReadOnlyData: true,
      GetUserData: false,
      GetCharacterInventories: false,
      GetCharacterList: false,
      GetTitleData: false,
      GetPlayerProfile: false,
    },
  });
}

export async function getUserBans(config: GameConfig, playFabId: string) {
  return callPlayFabServer<{
    BanData: Array<{
      BanId: string;
      Active: boolean;
      Expires?: string;
      Reason?: string;
      Permanent: boolean;
      Created: string;
    }>;
  }>(config, "GetUserBans", { PlayFabId: playFabId });
}

/** Tags the PlayFab account with our internal Child Games user id, stored
 *  in PlayFab's internal (not client-readable) user data so the two systems
 *  stay cross-referenced. */
export async function tagAccountWithChildGamesUserId(
  config: GameConfig,
  playFabId: string,
  childGamesUserId: string
) {
  return callPlayFabServer(config, "UpdateUserInternalData", {
    PlayFabId: playFabId,
    Data: {
      childGamesUserId,
      childGamesLinkedAt: new Date().toISOString(),
    },
  });
}

export async function clearChildGamesTag(config: GameConfig, playFabId: string) {
  return callPlayFabServer(config, "UpdateUserInternalData", {
    PlayFabId: playFabId,
    Data: {},
    KeysToRemove: ["childGamesUserId", "childGamesLinkedAt"],
  });
}

/** Adjusts a virtual currency balance by a signed delta (positive = grant,
 *  negative = subtract) so a saved snapshot balance can be restored without
 *  PlayFab needing a native "set absolute balance" call. */
export async function adjustVirtualCurrency(
  config: GameConfig,
  playFabId: string,
  currencyCode: string,
  delta: number
) {
  if (delta === 0) return;
  if (delta > 0) {
    await callPlayFabServer(config, "AddUserVirtualCurrency", {
      PlayFabId: playFabId,
      VirtualCurrency: currencyCode,
      Amount: delta,
    });
  } else {
    await callPlayFabServer(config, "SubtractUserVirtualCurrency", {
      PlayFabId: playFabId,
      VirtualCurrency: currencyCode,
      Amount: Math.abs(delta),
    });
  }
}

export async function grantItemsToUser(
  config: GameConfig,
  playFabId: string,
  itemIds: string[]
) {
  if (itemIds.length === 0) return;
  return callPlayFabServer(config, "GrantItemsToUser", {
    PlayFabId: playFabId,
    ItemIds: itemIds,
  });
}

export async function revokeInventoryItem(
  config: GameConfig,
  playFabId: string,
  itemInstanceId: string
) {
  return callPlayFabServer(config, "RevokeInventoryItem", {
    PlayFabId: playFabId,
    ItemInstanceId: itemInstanceId,
  });
}

/** Revokes every active ban for this user in one call. Used when restoring
 *  an account to its pre-link state if the snapshot had zero active bans. */
export async function revokeAllBansForUser(config: GameConfig, playFabId: string) {
  return callPlayFabServer(config, "RevokeAllBansForUser", { PlayFabId: playFabId });
}

export { PlayFabError };
