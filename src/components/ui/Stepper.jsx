import { STATUS_ORDER, STATUS_LABELS } from '../../app/store';

export default function Stepper({ status, statusHistory = [] }) {
  const currentIndex = STATUS_ORDER.indexOf(status);
  const atByStatus = Object.fromEntries(statusHistory.map((h) => [h.status, h.at]));

  return (
    <ol className="flex flex-col gap-0">
      {STATUS_ORDER.map((s, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        const at = atByStatus[s];
        return (
          <li key={s} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                  done || active
                    ? 'bg-primary text-white'
                    : 'bg-secondary/10 text-ink-soft'
                }`}
              >
                {done ? '✓' : i + 1}
              </span>
              {i < STATUS_ORDER.length - 1 && (
                <span className={`w-px flex-1 ${done ? 'bg-primary' : 'bg-line'}`} style={{ minHeight: 24 }} />
              )}
            </div>
            <div className="pb-6">
              <div className={`text-sm font-semibold ${active ? 'text-primary' : done ? 'text-secondary' : 'text-ink-soft'}`}>
                {STATUS_LABELS[s]}
              </div>
              {at && (
                <div className="text-xs text-ink-soft">
                  {new Date(at).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
