// =====================================================================
// PlayFab Server API wrapper.
//
// This file is imported ONLY by API routes (server-side). It is never
// bundled into client JavaScript because Next.js only includes files
// that are actually imported from a "use client" component or the
// browser bundle graph — this file is exclusively imported from
// app/api/** route handlers, which always run on the server.
//
// Every function here requires a title-specific secret key, which is
// read from a Vercel environment variable by lib/games.config.ts and
// passed in — it is never hardcoded and never sent to the browser.
// =====================================================================

import {
  AccountBundle,
  BanRecord,
  CurrencyBalance,
  HistoryEvent,
  InventoryItem,
} from './types';

interface PlayFabContext {
  titleId: string;
  secretKey: string;
}

async function callPlayFabServerApi<T = any>(
  ctx: PlayFabContext,
  action: string,
  body: Record<string, unknown>
): Promise<T> {
  const res = await fetch(`https://${ctx.titleId}.playfabapi.com/Server/${action}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-SecretKey': ctx.secretKey,
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();

  if (!res.ok || json.code >= 400) {
    throw new Error(
      `PlayFab ${action} failed: ${json.errorMessage || res.statusText}`
    );
  }

  return json.data as T;
}

/**
 * Validates a session ticket produced by the Unity client's PlayFab SDK
 * and resolves it to a PlayFabId. This is how we confirm a link-code
 * request actually came from someone logged into that game — not a
 * guess or a replayed request.
 */
export async function authenticateSessionTicket(
  ctx: PlayFabContext,
  sessionTicket: string
): Promise<{ playFabId: string }> {
  const data = await callPlayFabServerApi<{ UserInfo: { PlayFabId: string } }>(
    ctx,
    'AuthenticateSessionTicket',
    { SessionTicket: sessionTicket }
  );
  return { playFabId: data.UserInfo.PlayFabId };
}

export async function getUserAccountInfo(ctx: PlayFabContext, playFabId: string) {
  const data = await callPlayFabServerApi<{ UserInfo: any }>(ctx, 'GetUserAccountInfo', {
    PlayFabId: playFabId,
  });

  return {
    playfabId: data.UserInfo.PlayFabId as string,
    username: (data.UserInfo.TitleInfo?.DisplayName as string) ?? null,
    created: (data.UserInfo.TitleInfo?.Created as string) ?? null,
  };
}

export async function getUserInventory(
  ctx: PlayFabContext,
  playFabId: string
): Promise<{ items: InventoryItem[]; currency: CurrencyBalance[] }> {
  const data = await callPlayFabServerApi<{
    Inventory: any[];
    VirtualCurrency: Record<string, number>;
  }>(ctx, 'GetUserInventory', { PlayFabId: playFabId });

  const items: InventoryItem[] = (data.Inventory || []).map((i) => ({
    itemId: i.ItemInstanceId,
    displayName: i.DisplayName || i.ItemId,
    itemClass: i.ItemClass || 'item',
    quantity: i.RemainingUses ?? 1,
  }));

  const currency: CurrencyBalance[] = Object.entries(data.VirtualCurrency || {}).map(
    ([code, amount]) => ({ code, amount: amount as number })
  );

  return { items, currency };
}

export async function getUserBans(
  ctx: PlayFabContext,
  playFabId: string
): Promise<BanRecord[]> {
  const data = await callPlayFabServerApi<{ BanData: any[] }>(ctx, 'GetUserBans', {
    PlayFabId: playFabId,
  });

  return (data.BanData || []).map((b) => ({
    banId: b.BanId,
    reason: b.Reason || 'No reason provided',
    active: b.Active,
    permanent: !b.Expires,
    expires: b.Expires ?? null,
  }));
}

/** Best-effort login/name-change history from PlayFab's account info. */
export async function getUserHistory(
  ctx: PlayFabContext,
  playFabId: string
): Promise<HistoryEvent[]> {
  const data = await callPlayFabServerApi<{ UserInfo: any }>(ctx, 'GetUserAccountInfo', {
    PlayFabId: playFabId,
  });

  const events: HistoryEvent[] = [];
  if (data.UserInfo?.Created) {
    events.push({
      type: 'other',
      description: 'Account created',
      timestamp: data.UserInfo.Created,
    });
  }
  if (data.UserInfo?.TitleInfo?.LastLogin) {
    events.push({
      type: 'login',
      description: 'Last login to game',
      timestamp: data.UserInfo.TitleInfo.LastLogin,
    });
  }
  return events;
}

/** Fetches the full account bundle used to populate the linked-game tabs. */
export async function getFullAccountBundle(
  ctx: PlayFabContext,
  playFabId: string
): Promise<Omit<AccountBundle, 'syncStatus'>> {
  const [account, inventory, bans, history] = await Promise.all([
    getUserAccountInfo(ctx, playFabId),
    getUserInventory(ctx, playFabId),
    getUserBans(ctx, playFabId),
    getUserHistory(ctx, playFabId),
  ]);

  return { account, inventory, bans, history };
}

// --- Mutating calls used by the unlink/restore flow -------------------

export async function grantItemsToUser(
  ctx: PlayFabContext,
  playFabId: string,
  itemIds: string[]
) {
  if (itemIds.length === 0) return;
  await callPlayFabServerApi(ctx, 'GrantItemsToUser', {
    PlayFabId: playFabId,
    ItemIds: itemIds,
  });
}

export async function revokeInventoryItem(
  ctx: PlayFabContext,
  playFabId: string,
  itemInstanceId: string
) {
  await callPlayFabServerApi(ctx, 'RevokeInventoryItem', {
    PlayFabId: playFabId,
    ItemInstanceId: itemInstanceId,
  });
}

export async function setVirtualCurrencyBalance(
  ctx: PlayFabContext,
  playFabId: string,
  currencyCode: string,
  targetAmount: number,
  currentAmount: number
) {
  const delta = targetAmount - currentAmount;
  if (delta === 0) return;
  if (delta > 0) {
    await callPlayFabServerApi(ctx, 'AddUserVirtualCurrency', {
      PlayFabId: playFabId,
      VirtualCurrency: currencyCode,
      Amount: delta,
    });
  } else {
    await callPlayFabServerApi(ctx, 'SubtractUserVirtualCurrency', {
      PlayFabId: playFabId,
      VirtualCurrency: currencyCode,
      Amount: Math.abs(delta),
    });
  }
}
