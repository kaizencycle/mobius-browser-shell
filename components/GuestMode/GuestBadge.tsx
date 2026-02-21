import { useState } from 'react';
import { useGuest } from '../../contexts/GuestContext';

/**
 * GuestBadge
 *
 * Floating badge — bottom-right — visible only to guests.
 * Persistent but unobtrusive. Single clear CTA.
 *
 * Expands on hover to show more context.
 * Disappears the moment citizen identity is established.
 */

export function GuestBadge() {
  const { isGuest, triggerBecomeCitizen } = useGuest();
  const [expanded, setExpanded] = useState(false);

  if (!isGuest) return null;

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2">

      {/* Expanded panel — shows on hover */}
      {expanded && (
        <div className="bg-stone-900 border border-stone-700/60 rounded-2xl px-4 py-3.5 flex flex-col gap-2.5 shadow-xl max-w-56 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex flex-col gap-1">
            <p className="text-stone-300 text-xs font-medium">Exploring as guest</p>
            <p className="text-stone-600 text-[10px] leading-relaxed">
              Sign the Three Covenants to save progress, earn MIC, and establish your citizen identity.
            </p>
          </div>

          {/* Genesis grant teaser */}
          <div className="flex items-center gap-2 py-1.5 px-2.5 rounded-lg bg-stone-800/60 border border-stone-700/40">
            <span className="text-stone-500 text-xs select-none">◎</span>
            <span className="text-stone-500 text-[10px]">50 MIC genesis grant on signup</span>
          </div>

          <button
            onClick={triggerBecomeCitizen}
            className="w-full py-2 px-3 bg-stone-700 hover:bg-stone-600 border border-stone-600 hover:border-stone-500 text-stone-200 text-xs rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-stone-400"
          >
            Become a Citizen →
          </button>
        </div>
      )}

      {/* Badge pill */}
      <button
        onClick={() => setExpanded(!expanded)}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        aria-label="Guest mode — become a citizen"
        className="flex items-center gap-2 py-2 px-3.5 bg-stone-900/90 backdrop-blur border border-stone-700/60 rounded-full shadow-lg hover:border-stone-600 transition-all duration-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-stone-500 group"
      >
        {/* Guest indicator dot */}
        <span className="w-1.5 h-1.5 rounded-full bg-stone-600 group-hover:bg-stone-400 transition-colors" />
        <span className="text-stone-500 text-[11px] group-hover:text-stone-400 transition-colors">
          Guest
        </span>
        <span className="text-stone-700 text-[11px]">·</span>
        <span className="text-stone-400 text-[11px] group-hover:text-stone-300 transition-colors">
          Become a Citizen
        </span>
      </button>

    </div>
  );
}
