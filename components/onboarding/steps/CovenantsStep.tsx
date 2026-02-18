/**
 * CovenantsStep — The Three Covenants
 *
 * Constitutional commitment: Integrity, Ecology, Custodianship.
 * All three must be accepted to proceed.
 */

import { useState, type ReactNode } from 'react';

const COVENANTS = [
  {
    id: 'integrity' as const,
    label: 'Integrity',
    text: 'I will not corrupt the shared record with falsehood or deception. My contributions are my own or attributed.',
  },
  {
    id: 'ecology' as const,
    label: 'Ecology',
    text: 'I will consider the energy, attention, and trust cost of my actions upon the network.',
  },
  {
    id: 'custodianship' as const,
    label: 'Custodianship',
    text: 'I hold this identity in trust for the commons, not for private extraction.',
  },
] as const;

export interface CovenantsConsents {
  integrity: boolean;
  ecology: boolean;
  custodianship: boolean;
}

interface CovenantsStepProps {
  initial: CovenantsConsents;
  onNext: (consents: CovenantsConsents) => void;
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

function ConsentToggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <div
      className={`w-full text-left p-4 rounded-xl border transition-all ${
        checked
          ? 'bg-stone-800/60 border-stone-600'
          : 'bg-stone-900/40 border-stone-800 hover:border-stone-700'
      }`}
    >
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="w-full text-left"
        aria-pressed={checked}
        aria-label={`${label}: ${description}`}
      >
        <div className="flex items-start gap-3">
          <span
            className={`mt-0.5 text-lg select-none transition-colors ${
              checked ? 'text-stone-300' : 'text-stone-700'
            }`}
          >
            {checked ? '◉' : '○'}
          </span>
          <div className="flex flex-col gap-0.5 flex-1">
            <p
              className={`text-sm font-medium transition-colors ${
                checked ? 'text-stone-100' : 'text-stone-500'
              }`}
            >
              {label}
            </p>
            <p className="text-stone-600 text-xs leading-relaxed">{description}</p>
          </div>
        </div>
      </button>
    </div>
  );
}

export function CovenantsStep({ initial, onNext }: CovenantsStepProps) {
  const [integrity, setIntegrity] = useState(initial.integrity);
  const [ecology, setEcology] = useState(initial.ecology);
  const [custodianship, setCustodianship] = useState(initial.custodianship);

  const canProceed = integrity && ecology && custodianship;
  const acceptedCount = [integrity, ecology, custodianship].filter(Boolean).length;

  const handleContinue = () => {
    onNext({ integrity, ecology, custodianship });
  };

  return (
    <div className="flex flex-col gap-5">
      <p className="text-stone-500 text-xs">
        {acceptedCount} of 3 accepted
      </p>
      <div className="flex flex-col gap-3">
        <ConsentToggle
          checked={integrity}
          onChange={setIntegrity}
          label={COVENANTS[0].label}
          description={COVENANTS[0].text}
        />
        <ConsentToggle
          checked={ecology}
          onChange={setEcology}
          label={COVENANTS[1].label}
          description={COVENANTS[1].text}
        />
        <ConsentToggle
          checked={custodianship}
          onChange={setCustodianship}
          label={COVENANTS[2].label}
          description={COVENANTS[2].text}
        />
      </div>

      <p className="text-stone-700 text-[10px] leading-relaxed">
        These are not legal terms — they are a civic commitment between you and
        the Mobius network. CC0. No lawyers required.
      </p>

      <PrimaryButton onClick={handleContinue} disabled={!canProceed}>
        {canProceed ? 'Continue →' : 'All three required to continue'}
      </PrimaryButton>
    </div>
  );
}
