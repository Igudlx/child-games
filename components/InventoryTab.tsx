import { InventoryItem, CurrencyBalance } from '@/lib/types';

export function InventoryTab({
  items,
  currency,
}: {
  items: InventoryItem[];
  currency: CurrencyBalance[];
}) {
  return (
    <div className="flex flex-col gap-10">
      <section>
        <p className="eyebrow mb-4">Currency</p>
        {currency.length === 0 ? (
          <p className="text-sm text-mist">No currency balances.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {currency.map((c) => (
              <div key={c.code} className="panel px-4 py-3">
                <p className="text-xs text-mist uppercase tracking-widest">{c.code}</p>
                <p className="font-display text-2xl">{c.amount.toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <p className="eyebrow mb-4">Items & cosmetics</p>
        {items.length === 0 ? (
          <p className="text-sm text-mist">No items yet.</p>
        ) : (
          <div className="flex flex-col divide-y divide-line border border-line">
            {items.map((item) => (
              <div
                key={item.itemId}
                className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">{item.displayName}</p>
                  <p className="text-xs text-mist uppercase tracking-wide">{item.itemClass}</p>
                </div>
                <span className="font-display text-mist">×{item.quantity}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
