/**
 * EnterStep — Confirmation
 *
 * Summary: handle (or "Anonymous"), covenants accepted.
 * Primary CTA: "Enter Mobius Systems"
 */

import type { ReactNode } from 'react';

interface EnterStepProps {
  handle: string | null;
  isSubmitting: boolean;
  onEnter: () => void;
  error: string | null;
}

function PrimaryButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full py-3 px-4 bg-stone-100 text-stone-900 text-sm font-medium rounded-xl hover:bg-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2 focus:ring-offset-stone-950"
    >
      {children}
    </button>
  );
}

export function EnterStep({
  handle,
  isSubmitting,
  onEnter,
  error,
}: EnterStepProps) {
  const displayName = handle ? `@${handle}` : 'Anonymous citizen';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-4 py-4">
        <span className="text-5xl font-retro text-stone-300 select-none animate-pulse-subtle">
          ⬡
        </span>
        <div className="text-center flex flex-col gap-2">
          <p className="text-stone-300 text-sm">
            You will enter as <span className="text-stone-100">{displayName}</span>
          </p>
          <p className="text-stone-600 text-xs">
            Covenants accepted. Integrity Economics starts here.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-xl">
          <p className="text-red-400 text-xs leading-relaxed">{error}</p>
        </div>
      )}

      <PrimaryButton onClick={onEnter} disabled={isSubmitting}>
        {isSubmitting ? (
          <span className="flex items-center gap-2 justify-center">
            <span className="w-3 h-3 border border-stone-600 border-t-stone-300 rounded-full animate-spin" />
            Establishing identity…
          </span>
        ) : (
          'Enter Mobius Systems'
        )}
      </PrimaryButton>
    </div>
  );
}
