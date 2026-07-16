'use client';

import { useEffect, useState } from 'react';
import { AccountBundle } from '@/lib/types';
import { LinkPanel } from './LinkPanel';
import { InventoryTab } from './InventoryTab';
import { BansTab } from './BansTab';
import { AccountInfoTab } from './AccountInfoTab';
import { HistoryTab } from './HistoryTab';
import { SettingsTab } from './SettingsTab';

type SubTab = 'inventory' | 'bans' | 'account' | 'history' | 'settings';

const SUB_TABS: { key: SubTab; label: string }[] = [
  { key: 'inventory', label: 'Inventory' },
  { key: 'bans', label: 'Bans' },
  { key: 'account', label: 'Account' },
  { key: 'history', label: 'History' },
  { key: 'settings', label: 'Settings' },
];

interface GameTabProps {
  gameId: string;
  gameName: string;
  downloadLink: string;
  linked: boolean;
  onLinkedChanged: () => void;
}

export function GameTab({ gameId, gameName, downloadLink, linked, onLinkedChanged }: GameTabProps) {
  const [subTab, setSubTab] = useState<SubTab>('inventory');
  const [bundle, setBundle] = useState<AccountBundle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!linked) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/games/${gameId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to load.');
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setBundle(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [gameId, linked]);

  if (!linked) {
    return (
      <LinkPanel
        gameId={gameId}
        gameName={gameName}
        downloadLink={downloadLink}
        onLinked={onLinkedChanged}
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col px-6 py-8 md:px-12 md:py-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-2xl uppercase tracking-wide">{gameName}</h2>
        {bundle && (
          <span className="eyebrow">
            {bundle.syncStatus === 'synced' && 'Synced'}
            {bundle.syncStatus === 'syncing' && 'Syncing…'}
            {bundle.syncStatus === 'error' && 'Sync error'}
          </span>
        )}
      </div>

      <div className="mb-8 flex gap-6 overflow-x-auto border-b border-line">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSubTab(tab.key)}
            className={`shrink-0 pb-3 font-display text-xs uppercase tracking-widest transition-colors ${
              subTab === tab.key
                ? 'border-b-2 border-paper text-paper'
                : 'text-mist hover:text-paper'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-mist">Loading…</p>}
      {error && <p className="text-sm text-paper border border-line px-3 py-2 inline-block">{error}</p>}

      {bundle && !loading && (
        <>
          {subTab === 'inventory' && (
            <InventoryTab items={bundle.inventory.items} currency={bundle.inventory.currency} />
          )}
          {subTab === 'bans' && <BansTab bans={bundle.bans} />}
          {subTab === 'account' && <AccountInfoTab account={bundle.account} />}
          {subTab === 'history' && <HistoryTab history={bundle.history} />}
          {subTab === 'settings' && (
            <SettingsTab gameId={gameId} gameName={gameName} onUnlinked={onLinkedChanged} />
          )}
        </>
      )}
    </div>
  );
}
