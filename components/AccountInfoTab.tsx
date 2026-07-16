export function AccountInfoTab({
  account,
}: {
  account: { playfabId: string; username: string | null; created: string | null };
}) {
  const rows: { label: string; value: string }[] = [
    { label: 'In-game username', value: account.username || 'Not set' },
    {
      label: 'Account created',
      value: account.created ? new Date(account.created).toLocaleDateString() : 'Unknown',
    },
    { label: 'PlayFab ID', value: account.playfabId },
  ];

  return (
    <div className="flex flex-col divide-y divide-line border border-line">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between px-4 py-4">
          <span className="text-sm text-mist">{row.label}</span>
          <span className="font-medium text-right">{row.value}</span>
        </div>
      ))}
    </div>
  );
}
