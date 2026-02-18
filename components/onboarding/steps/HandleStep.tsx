/**
 * HandleStep — Optional @name
 *
 * Real-time validation (2–32 chars, [a-zA-Z0-9_-]).
 * Debounced availability check. Skippable.
 */

import { useState, useEffect, type ReactNode } from 'react';

const HANDLE_REGEX = /^[a-zA-Z0-9_-]+$/;

interface HandleStepProps {
  initial: string | null;
  onNext: (handle: string | null) => void;
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

function SecondaryButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full py-3 px-4 bg-transparent border border-stone-700 text-stone-400 text-sm font-medium rounded-xl hover:border-stone-600 hover:text-stone-300 transition-colors focus:outline-none focus:ring-2 focus:ring-stone-600 focus:ring-offset-2 focus:ring-offset-stone-950"
    >
      {children}
    </button>
  );
}

function validateHandle(value: string): string | null {
  if (!value) return null;
  if (value.length < 2) return 'Handle must be at least 2 characters';
  if (value.length > 32) return 'Handle must be 32 characters or fewer';
  if (!HANDLE_REGEX.test(value)) return 'Letters, numbers, _ and - only';
  return null;
}

export function HandleStep({ initial, onNext }: HandleStepProps) {
  const [value, setValue] = useState(initial ?? '');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // Debounced handle availability check
  useEffect(() => {
    const trimmed = value.trim();
    if (!trimmed || trimmed.length < 2 || !HANDLE_REGEX.test(trimmed)) {
      setAvailability(null);
      return;
    }
    setIsChecking(true);
    setAvailability(null);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/onboarding/check-handle?handle=${encodeURIComponent(trimmed)}`
        );
        if (res.status === 409) {
          setAvailability(false);
        } else if (res.ok) {
          const data = (await res.json().catch(() => ({}))) as { available?: boolean };
          setAvailability(data.available !== false);
        } else {
          setAvailability(null); // Fail open
        }
      } catch {
        setAvailability(null);
      } finally {
        setIsChecking(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [value]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      onNext(null);
      return;
    }
    const err = validateHandle(trimmed);
    if (err) {
      setValidationError(err);
      return;
    }
    if (availability === false) {
      setValidationError('Handle is already taken');
      return;
    }
    onNext(trimmed);
  };

  const handleSkip = () => {
    onNext(null);
  };

  const trimmed = value.trim();
  const isValidFormat = trimmed.length >= 2 && HANDLE_REGEX.test(trimmed);
  // Fail open: when availability is null (checking or offline), allow submit
  const canSubmit = !trimmed || (isValidFormat && availability !== false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-stone-400 text-xs font-medium" htmlFor="handle">
          Handle <span className="text-stone-700">(optional)</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-600 text-sm select-none">
            @
          </span>
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
            inputMode="text"
            className="w-full bg-stone-900 border border-stone-700 rounded-xl pl-8 pr-4 py-3 text-sm text-stone-100 placeholder:text-stone-700 focus:outline-none focus:border-stone-500 transition-colors"
            aria-invalid={!!validationError}
            aria-describedby={validationError ? 'handle-error' : undefined}
          />
        </div>
        {validationError && (
          <p id="handle-error" className="text-red-400 text-xs">
            {validationError}
          </p>
        )}
        {trimmed && !validationError && (
          <p className="text-stone-600 text-xs flex items-center gap-1.5 flex-wrap">
            {isChecking && <span className="text-stone-500">Checking…</span>}
            {!isChecking && availability === true && (
              <span className="text-emerald-500">● Available</span>
            )}
            {!isChecking && availability === false && (
              <span className="text-red-400">● Taken</span>
            )}
            <span>
              You&apos;ll appear as{' '}
              <span className="text-stone-400">@{trimmed}</span>
            </span>
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <PrimaryButton onClick={handleSubmit} disabled={!canSubmit || isChecking}>
          {trimmed ? 'Set handle →' : 'Skip for now →'}
        </PrimaryButton>
        {trimmed && (
          <SecondaryButton onClick={handleSkip}>Skip for now</SecondaryButton>
        )}
      </div>
    </div>
  );
}
