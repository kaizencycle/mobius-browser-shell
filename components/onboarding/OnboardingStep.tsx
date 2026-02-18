import { useState, useEffect, type ReactNode } from 'react';
import type { OnboardingStepDef } from './onboardingSteps';

interface OnboardingStepProps {
  step: OnboardingStepDef;
  formState: {
    handle: string;
    consentIntegrity: boolean;
    consentData: boolean;
  };
  onNext: (data: Record<string, unknown>) => void;
  onBack?: () => void;
  isSubmitting: boolean;
  isLastStep: boolean;
  error: string | null;
  citizenId?: string;
}

/**
 * OnboardingStep
 *
 * Renders the UI for each onboarding step based on step.id.
 * Each step variant is self-contained — local state for inputs,
 * validated before calling onNext.
 */
export function OnboardingStep({
  step,
  formState,
  onNext,
  onBack,
  isSubmitting,
  isLastStep,
  error,
  citizenId,
}: OnboardingStepProps) {
  // Funnel analytics: track step views for drop-off analysis
  useEffect(() => {
    fetch('/api/atlas/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        type: 'ONBOARDING_STEP_VIEW',
        step: step.id,
        citizenId: citizenId ?? undefined,
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {});
  }, [step.id, citizenId]);

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-100 leading-tight">
          {step.title}
        </h1>
        <p className="text-stone-400 text-sm leading-relaxed">{step.subtitle}</p>
      </div>

      {/* Step-specific content */}
      {step.id === 'welcome' && (
        <WelcomeStep onNext={() => onNext({})} />
      )}
      {step.id === 'handle' && (
        <HandleStep
          initial={formState.handle}
          skippable={step.skippable}
          onNext={(handle) => onNext({ handle })}
        />
      )}
      {step.id === 'covenants' && (
        <CovenantsStep
          initialIntegrity={formState.consentIntegrity}
          initialData={formState.consentData}
          onNext={(consentIntegrity, consentData) =>
            onNext({ consentIntegrity, consentData })
          }
        />
      )}
      {step.id === 'ready' && (
        <ReadyStep
          isSubmitting={isSubmitting}
          onNext={() => onNext({})}
        />
      )}

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-xl">
          <p className="text-red-400 text-xs leading-relaxed">{error}</p>
        </div>
      )}

      {/* Back */}
      {onBack && (
        <button
          onClick={onBack}
          className="text-xs text-stone-600 hover:text-stone-400 transition-colors self-start"
        >
          ← Back
        </button>
      )}
    </div>
  );
}

// ── Step variants ─────────────────────────────────────────────────────────────

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        {[
          { icon: '⬡', label: 'Integrity', desc: 'Every action is traceable and accountable' },
          { icon: '◎', label: 'Ecology', desc: 'Regenerative by design, not extractive' },
          { icon: '⊕', label: 'Custodianship', desc: 'You own your identity and your data' },
        ].map(({ icon, label, desc }) => (
          <div key={label} className="flex items-start gap-3 p-3 rounded-xl bg-stone-900/60 border border-stone-800/50">
            <span className="text-stone-500 text-lg mt-0.5 select-none w-6 text-center">{icon}</span>
            <div>
              <p className="text-stone-200 text-sm font-medium">{label}</p>
              <p className="text-stone-500 text-xs leading-relaxed mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>
      <PrimaryButton onClick={onNext}>Begin →</PrimaryButton>
    </div>
  );
}

function HandleStep({
  initial,
  skippable,
  onNext,
}: {
  initial: string;
  skippable: boolean;
  onNext: (handle: string) => void;
}) {
  const [value, setValue] = useState(initial);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // Debounced handle availability check
  useEffect(() => {
    if (!value || value.length < 2 || !/^[a-zA-Z0-9_-]+$/.test(value)) {
      setAvailability(null);
      return;
    }
    setIsChecking(true);
    setAvailability(null);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/onboarding/check-handle?handle=${encodeURIComponent(value)}`);
        setAvailability(res.ok && (await res.json().catch(() => ({})) as { available?: boolean }).available !== false);
      } catch {
        setAvailability(null); // Fail open
      } finally {
        setIsChecking(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [value]);

  const validate = (v: string) => {
    if (!v) return null; // empty = skip
    if (v.length < 2) return 'Handle must be at least 2 characters';
    if (v.length > 32) return 'Handle must be 32 characters or fewer';
    if (!/^[a-zA-Z0-9_-]+$/.test(v)) return 'Letters, numbers, _ and - only';
    return null;
  };

  const handleSubmit = () => {
    const err = validate(value);
    if (err) { setValidationError(err); return; }
    if (value && availability === false) {
      setValidationError('Handle is already taken');
      return;
    }
    onNext(value.trim());
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-stone-400 text-xs font-medium" htmlFor="handle">
          Handle <span className="text-stone-700">(optional)</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-600 text-sm select-none">@</span>
          <input
            id="handle"
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setValidationError(null);
            }}
            placeholder="your-handle"
            maxLength={32}
            autoComplete="off"
            autoCapitalize="none"
            className="w-full bg-stone-900 border border-stone-700 rounded-xl pl-8 pr-4 py-3 text-sm text-stone-100 placeholder:text-stone-700 focus:outline-none focus:border-stone-500 transition-colors"
          />
        </div>
        {validationError && (
          <p className="text-red-400 text-xs">{validationError}</p>
        )}
        {value && !validationError && (
          <p className="text-stone-600 text-xs flex items-center gap-1.5 flex-wrap">
            {isChecking && <span className="text-stone-500">Checking…</span>}
            {!isChecking && availability === true && <span className="text-emerald-500">● Available</span>}
            {!isChecking && availability === false && <span className="text-red-400">● Taken</span>}
            <span>You&apos;ll appear as <span className="text-stone-400">@{value}</span></span>
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <PrimaryButton onClick={handleSubmit}>
          {value ? 'Set handle →' : 'Skip for now →'}
        </PrimaryButton>
      </div>
    </div>
  );
}

function speakCovenant(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function CovenantsStep({
  initialIntegrity,
  initialData,
  onNext,
}: {
  initialIntegrity: boolean;
  initialData: boolean;
  onNext: (integrity: boolean, data: boolean) => void;
}) {
  const [integrity, setIntegrity] = useState(initialIntegrity);
  const [data, setData] = useState(initialData);
  const canProceed = integrity && data;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <ConsentToggle
          checked={integrity}
          onChange={setIntegrity}
          label="I commit to Integrity"
          description="I will act in good faith. My actions in Mobius systems carry my identity and my accountability."
          onListen={() => speakCovenant('I commit to Integrity. I will act in good faith. My actions in Mobius systems carry my identity and my accountability.')}
        />
        <ConsentToggle
          checked={data}
          onChange={setData}
          label="I understand data custodianship"
          description="Mobius holds my data in trust, not in ownership. I can export or delete it at any time."
          onListen={() => speakCovenant('I understand data custodianship. Mobius holds my data in trust, not in ownership. I can export or delete it at any time.')}
        />
      </div>

      <p className="text-stone-700 text-[10px] leading-relaxed">
        These are not legal terms — they are a civic commitment between you and
        the Mobius network. CC0. No lawyers required.
      </p>

      <PrimaryButton onClick={() => onNext(integrity, data)} disabled={!canProceed}>
        {canProceed ? 'Accept covenants →' : 'Both required to continue'}
      </PrimaryButton>
    </div>
  );
}

function ReadyStep({
  isSubmitting,
  onNext,
}: {
  isSubmitting: boolean;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-4 py-4">
        <span className="text-5xl font-retro text-stone-300 select-none animate-pulse-subtle">⬡</span>
        <div className="text-center flex flex-col gap-1">
          <p className="text-stone-300 text-sm">Your citizen identity is live.</p>
          <p className="text-stone-600 text-xs">Integrity Economics starts here.</p>
        </div>
      </div>

      <PrimaryButton onClick={onNext} disabled={isSubmitting}>
        {isSubmitting ? (
          <span className="flex items-center gap-2 justify-center">
            <span className="w-3 h-3 border border-stone-600 border-t-stone-300 rounded-full animate-spin" />
            Establishing identity…
          </span>
        ) : (
          'Enter the shell →'
        )}
      </PrimaryButton>
    </div>
  );
}

// ── Shared primitives ─────────────────────────────────────────────────────────

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
  onListen,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
  onListen?: () => void;
}) {
  return (
    <div className={`w-full text-left p-4 rounded-xl border transition-all ${
      checked
        ? 'bg-stone-800/60 border-stone-600'
        : 'bg-stone-900/40 border-stone-800 hover:border-stone-700'
    }`}>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="w-full text-left"
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
            <p className={`text-sm font-medium transition-colors ${checked ? 'text-stone-100' : 'text-stone-500'}`}>
              {label}
            </p>
            <p className="text-stone-600 text-xs leading-relaxed">{description}</p>
          </div>
        </div>
      </button>
      {onListen && typeof window !== 'undefined' && 'speechSynthesis' in window && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onListen(); }}
          className="mt-2 text-[10px] text-stone-600 hover:text-stone-400 transition-colors"
        >
          Listen
        </button>
      )}
    </div>
  );
}
