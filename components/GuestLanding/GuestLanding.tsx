import { useState } from 'react';

/**
 * GuestLanding
 *
 * The first thing anyone sees when they arrive at Mobius Substrate.
 * Replaces the raw auth gate as the initial surface.
 *
 * Purpose: show what Mobius Substrate is before asking anything of the visitor.
 * The passkey registration is a threshold they choose to cross, not a wall.
 *
 * Design: matches substrate aesthetic — stone/dark, constitutional, minimal.
 * No marketing language. No feature lists. Just what this is and what it means.
 */

interface GuestLandingProps {
  onEnter: () => void; // triggers passkey registration flow
  onExplore?: () => void; // explore as guest without auth
}

export function GuestLanding({ onEnter, onExplore }: GuestLandingProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const covenants = [
    {
      id: 'integrity',
      symbol: '⬡',
      name: 'Integrity',
      preview: 'I will not corrupt the shared record.',
      full: 'I will not corrupt the shared record with falsehood or deception.',
    },
    {
      id: 'ecology',
      symbol: '◎',
      name: 'Ecology',
      preview: 'I will consider the cost of my actions.',
      full: 'I will consider the energy, attention, and trust cost of my actions.',
    },
    {
      id: 'custodianship',
      symbol: '⊕',
      name: 'Custodianship',
      preview: 'I hold this identity in trust for the commons.',
      full: 'I hold this identity in trust for the commons, not for private extraction.',
    },
  ];

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center px-4 py-16">
      <main className="flex flex-col items-center w-full max-w-sm" role="main" aria-label="Mobius Substrate introduction">
      {/* Mark */}
      <div className="flex flex-col items-center gap-6 mb-16">
        <div className="relative">
          <span className="text-stone-700 text-6xl select-none leading-none">⬡</span>
          <span className="absolute inset-0 flex items-center justify-center text-stone-500 text-2xl select-none">◎</span>
        </div>
        <div className="text-center flex flex-col gap-1">
          <h1 className="text-stone-200 text-xl font-medium tracking-wide">
            Mobius Substrate
          </h1>
          <p className="text-stone-600 text-xs tracking-widest uppercase">
            Constitutional AI Infrastructure · Beta
          </p>
        </div>
      </div>

      {/* What this is */}
      <div className="max-w-sm w-full flex flex-col gap-8 mb-16">
        <p className="text-stone-400 text-sm leading-relaxed text-center">
          Mobius Substrate is public infrastructure for integrity-backed
          governance. Not a product. Not a platform. A constitutional substrate
          that agents, citizens, and institutions can build on.
        </p>

        <p className="text-stone-600 text-xs leading-relaxed text-center">
          Citizens sign three covenants. Every action is measured against them.
          Integrity is the currency. The record is permanent.
        </p>
      </div>

      {/* Covenants — expandable */}
      <div className="max-w-sm w-full flex flex-col gap-2 mb-16">
        <p className="text-stone-700 text-[10px] uppercase tracking-widest font-medium px-1 mb-1">
          The Three Covenants
        </p>
        {covenants.map((c) => (
          <button
            key={c.id}
            onClick={() => setExpanded(expanded === c.id ? null : c.id)}
            aria-expanded={expanded === c.id}
            aria-controls={`covenant-${c.id}-full`}
            id={`covenant-${c.id}-toggle`}
            className="flex flex-col gap-1.5 py-3 px-4 rounded-xl bg-stone-900/40 border border-stone-800/50 hover:border-stone-700/60 transition-colors text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-stone-500"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-stone-600 text-sm select-none w-4 text-center">
                {c.symbol}
              </span>
              <span className="text-stone-400 text-xs font-medium">{c.name}</span>
              <span className="ml-auto text-stone-700 text-[10px]">
                {expanded === c.id ? '−' : '+'}
              </span>
            </div>
            <p
              id={`covenant-${c.id}-full`}
              role="region"
              aria-labelledby={`covenant-${c.id}-toggle`}
              className={`text-stone-600 text-xs leading-relaxed pl-6 transition-all duration-200 ${
                expanded === c.id ? 'opacity-100 max-h-20' : 'opacity-0 max-h-0 overflow-hidden'
              }`}
            >
              &quot;{c.full}&quot;
            </p>
            {expanded !== c.id && (
              <p className="text-stone-700 text-[10px] pl-6 italic">{c.preview}</p>
            )}
          </button>
        ))}
      </div>

      {/* Genesis grant callout */}
      <div className="max-w-sm w-full mb-10">
        <div className="flex items-center gap-3 py-3 px-4 rounded-xl bg-stone-900/60 border border-stone-800/40">
          <span className="text-stone-500 text-base select-none">◎</span>
          <div className="flex flex-col gap-0.5">
            <p className="text-stone-400 text-xs font-medium">Genesis Grant</p>
            <p className="text-stone-600 text-[10px]">
              Sign the covenants. Receive 50 MIC. Your first act of integrity, recognized.
            </p>
          </div>
          <span className="ml-auto text-stone-500 text-xs font-mono font-medium shrink-0">
            ◎ 50
          </span>
        </div>
      </div>

      {/* Enter CTA */}
      <div className="max-w-sm w-full flex flex-col gap-3">
        <button
          onClick={onEnter}
          aria-label="Become a Citizen — continue to passkey registration"
          className="w-full py-3.5 px-6 bg-stone-800 hover:bg-stone-700 border border-stone-700 hover:border-stone-600 text-stone-200 text-sm rounded-2xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950"
        >
          Become a Citizen →
        </button>
        {onExplore && (
          <button
            onClick={onExplore}
            className="w-full py-2.5 px-6 text-stone-600 hover:text-stone-400 text-xs transition-colors focus:outline-none"
          >
            Explore as guest first →
          </button>
        )}
        <p className="text-stone-700 text-[10px] text-center leading-relaxed">
          Passkey registration. No password. No email required.
          Your identity is yours — held in trust by Mobius Substrate.
        </p>
      </div>

      {/* Footer */}
      <div className="mt-16 flex flex-col items-center gap-1">
        <p className="text-stone-800 text-[10px]">
          mobiussubstrate.org · CC0 Public Domain
        </p>
        <p className="text-stone-800 text-[10px]">
          Beta · No guarantees · Everything is a covenant
        </p>
      </div>
      </main>
    </div>
  );
}
