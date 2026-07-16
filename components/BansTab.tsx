import { BanRecord } from '@/lib/types';

function formatRemaining(expires: string | null): string {
  if (!expires) return 'Permanent';
  const ms = new Date(expires).getTime() - Date.now();
  if (ms <= 0) return 'Expired';
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  if (days > 0) return `${days}d ${hours}h remaining`;
  return `${hours}h remaining`;
}

export function BansTab({ bans }: { bans: BanRecord[] }) {
  const active = bans.filter((b) => b.active);

  if (active.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="font-display text-lg uppercase tracking-wide mb-2">Clean record</p>
        <p className="text-sm text-mist">No active bans on this account.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-line border border-line">
      {active.map((ban) => (
        <div key={ban.banId} className="flex items-center justify-between px-4 py-4">
          <div>
            <p className="font-medium">{ban.reason}</p>
            <p className="text-xs text-mist uppercase tracking-wide">
              {ban.permanent ? 'Permanent ban' : formatRemaining(ban.expires)}
            </p>
          </div>
          <span className="h-2 w-2 rounded-full bg-paper" />
        </div>
      ))}
    </div>
  );
}
