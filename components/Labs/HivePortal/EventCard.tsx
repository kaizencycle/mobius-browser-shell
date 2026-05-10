import React, { useEffect, useState } from 'react';
import type { HiveEventData } from '../../../hooks/useHiveWorld';

interface Props {
  event: HiveEventData;
}

function toneStyle(tone: string): { border: string; text: string; badge: string } {
  switch (tone) {
    case 'hope':
      return { border: 'border-amber-700/50', text: 'text-amber-200', badge: 'bg-amber-900/40 text-amber-400' };
    case 'tension':
    case 'alert':
      return { border: 'border-rose-700/50', text: 'text-rose-200', badge: 'bg-rose-900/40 text-rose-400' };
    case 'calm':
    default:
      return { border: 'border-stone-700/50', text: 'text-stone-300', badge: 'bg-stone-800/60 text-stone-500' };
  }
}

function countdown(expiresAt: string | null | undefined): string | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'expired';
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m`;
}

export const EventCard: React.FC<Props> = ({ event }) => {
  const [timer, setTimer] = useState<string | null>(() => countdown(event.expires_at));
  const style = toneStyle(event.tone);

  useEffect(() => {
    if (!event.expires_at) return;
    const id = setInterval(() => setTimer(countdown(event.expires_at)), 30_000);
    return () => clearInterval(id);
  }, [event.expires_at]);

  return (
    <div className={`rounded-lg border p-3 space-y-2 ${style.border} bg-stone-800/40`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] text-stone-500 uppercase tracking-widest">Active Event</div>
          <div className={`text-sm font-semibold font-mono mt-0.5 ${style.text}`}>{event.title}</div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase ${style.badge}`}>{event.severity}</span>
          {timer && <span className="text-[9px] text-stone-600 font-mono">{timer}</span>}
        </div>
      </div>
      <p className="text-[11px] text-stone-400 leading-relaxed">{event.description}</p>
    </div>
  );
};
