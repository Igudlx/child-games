import { HistoryEvent } from '@/lib/types';

export function HistoryTab({ history }: { history: HistoryEvent[] }) {
  if (history.length === 0) {
    return <p className="text-sm text-mist py-8 text-center">No tracked events yet.</p>;
  }

  return (
    <div className="flex flex-col divide-y divide-line border border-line">
      {history.map((event, i) => (
        <div key={i} className="flex items-center justify-between px-4 py-4">
          <div>
            <p className="font-medium">{event.description}</p>
            <p className="text-xs text-mist uppercase tracking-wide">{event.type.replace('_', ' ')}</p>
          </div>
          <span className="text-xs text-mist shrink-0 ml-4">
            {new Date(event.timestamp).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}
