import { useEffect, useState } from 'react';

/**
 * MICGenesisGrant
 *
 * The genesis grant moment — fires immediately after covenants are signed
 * at the end of onboarding step 3 (EnterStep).
 *
 * This is not a modal. It's a full-screen constitutional moment.
 * The substrate recognizing the citizen's first act of integrity.
 *
 * Shown once, for ~4 seconds, then transitions to the shell.
 * Cannot be dismissed early — the moment deserves its full weight.
 */

interface MICGenesisGrantProps {
  handle: string | null;
  onComplete: () => void;
}

export function MICGenesisGrant({ handle, onComplete }: MICGenesisGrantProps) {
  const [phase, setPhase] = useState<'enter' | 'reveal' | 'exit'>('enter');

  useEffect(() => {
    // enter → reveal after 600ms
    const t1 = setTimeout(() => setPhase('reveal'), 600);
    // reveal → exit after 4s
    const t2 = setTimeout(() => setPhase('exit'), 4000);
    // exit → onComplete after 4.8s
    const t3 = setTimeout(() => onComplete(), 4800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  const displayName = handle ? `@${handle}` : 'Citizen';

  return (
    <div
      className={`fixed inset-0 bg-stone-950 z-50 flex flex-col items-center justify-center transition-opacity duration-700 ${
        phase === 'exit' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* MIC symbol — pulses in */}
      <div
        className={`flex flex-col items-center gap-8 transition-all duration-700 ${
          phase === 'enter'
            ? 'opacity-0 scale-95 translate-y-4'
            : 'opacity-100 scale-100 translate-y-0'
        }`}
      >
        {/* Large MIC symbol */}
        <div className="relative flex items-center justify-center">
          {/* Outer ring — subtle glow */}
          <div className="absolute w-28 h-28 rounded-full border border-stone-700/40 animate-pulse" />
          <div className="absolute w-20 h-20 rounded-full border border-stone-600/30" />
          <span className="text-stone-400 text-5xl select-none leading-none">◎</span>
        </div>

        {/* Grant text */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-stone-600 text-xs uppercase tracking-widest font-medium">
            Genesis Grant
          </p>
          <p className="text-stone-200 text-3xl font-light tracking-wide">
            ◎ 50 MIC
          </p>
          <p className="text-stone-500 text-xs">
            Covenant Acceptance · {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Recognition statement */}
        <div className="max-w-xs text-center flex flex-col gap-3 mt-2">
          <p className="text-stone-400 text-sm leading-relaxed">
            {displayName}. The substrate recognizes your first act of integrity.
          </p>
          <p className="text-stone-700 text-xs leading-relaxed">
            50 MIC credited to your citizen account.
            Integrity is the only currency that compounds.
          </p>
        </div>

        {/* Covenants confirmation */}
        <div className="flex items-center gap-4 mt-2">
          {[
            { symbol: '⬡', name: 'Integrity' },
            { symbol: '◎', name: 'Ecology' },
            { symbol: '⊕', name: 'Custodianship' },
          ].map(({ symbol, name }) => (
            <div key={name} className="flex flex-col items-center gap-1">
              <span className="text-stone-600 text-base select-none">{symbol}</span>
              <span className="text-stone-800 text-[9px] uppercase tracking-wider">{name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom — entering substrate */}
      <div
        className={`absolute bottom-12 flex flex-col items-center gap-1 transition-all duration-700 delay-1000 ${
          phase === 'enter' ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <p className="text-stone-700 text-[10px]">Entering Mobius Substrate…</p>
      </div>
    </div>
  );
}
