/**
 * OnboardingGate
 *
 * Intercepts citizens with onboarded=false immediately after authentication.
 * Renders the onboarding flow instead of the shell until completion.
 *
 * Layer order (outermost → innermost):
 *   RootErrorBoundary
 *     └─ AuthProvider
 *         └─ AuthGate           ← blocks unauthenticated
 *             └─ OnboardingGate ← blocks unboarded citizens  ← THIS
 *                 └─ App        ← the shell
 *
 * Design principles:
 * - 3 steps: Covenants → Handle → Enter
 * - Progressive: one step at a time, no overwhelm
 * - Skippable steps are clearly marked — citizens own their data
 * - No intermediate persistence — single POST at end
 */

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ONBOARDING_STEPS } from './onboardingSteps';
import { CovenantsStep } from './steps/CovenantsStep';
import { HandleStep } from './steps/HandleStep';
import { EnterStep } from './steps/EnterStep';
import { MICGenesisGrant } from '../MICGrant/MICGenesisGrant';
import type { CovenantsConsents } from './steps/CovenantsStep';

const ONBOARDING_STEP_KEY = 'mobius:onboarding:step';
const ONBOARDING_PENDING_KEY = 'mobius:onboarding:pending';

/**
 * OnboardingGate
 *
 * Pure pass-through for citizen.onboarded === true. Zero overhead for returning citizens.
 * Shows MICGenesisGrant once after covenants signed, before shell.
 */
export function OnboardingGate({ children }: { children: ReactNode }) {
  const { citizen, claimGenesisGrant } = useAuth();
  const [showGenesisGrant, setShowGenesisGrant] = useState(false);

  if (!citizen) return null;
  if (citizen.onboarded && showGenesisGrant) {
    return (
      <>
        {children}
        <MICGenesisGrant
          handle={citizen.handle}
          onComplete={() => {
            claimGenesisGrant();
            setShowGenesisGrant(false);
          }}
        />
      </>
    );
  }
  if (citizen.onboarded) return <>{children}</>;

  return (
    <OnboardingFlow
      onOnboardingComplete={() => setShowGenesisGrant(true)}
    />
  );
}

// ── Flow controller ───────────────────────────────────────────────────────────

interface OnboardingFormState {
  consents: CovenantsConsents;
  handle: string | null;
}

const INITIAL_CONSENTS: CovenantsConsents = {
  integrity: false,
  ecology: false,
  custodianship: false,
};

const INITIAL_FORM_STATE: OnboardingFormState = {
  consents: INITIAL_CONSENTS,
  handle: null,
};

function OnboardingFlow({ onOnboardingComplete }: { onOnboardingComplete?: () => void }) {
  const { citizen, completeOnboarding } = useAuth();
  const [currentStepIndex, setCurrentStepIndex] = useState(() => {
    try {
      const saved = sessionStorage.getItem(ONBOARDING_STEP_KEY);
      if (saved) {
        const idx = parseInt(saved, 10);
        if (idx >= 0 && idx < ONBOARDING_STEPS.length) return idx;
      }
    } catch {
      /* ignore */
    }
    return 0;
  });
  const [formState, setFormState] = useState<OnboardingFormState>(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOfflineQueue, setShowOfflineQueue] = useState(false);

  const currentStep = ONBOARDING_STEPS[currentStepIndex];
  const isLastStep = currentStepIndex === ONBOARDING_STEPS.length - 1;
  const progress = ((currentStepIndex + 1) / ONBOARDING_STEPS.length) * 100;

  const submitPayload = useCallback(
    async (payload: {
      citizenId: string;
      consents: CovenantsConsents;
      handle: string | null;
    }) => {
      const updated = await completeOnboarding(payload);
      return updated;
    },
    [completeOnboarding]
  );

  // Retry pending onboarding when back online
  useEffect(() => {
    if (!navigator.onLine) return;
    try {
      const raw = localStorage.getItem(ONBOARDING_PENDING_KEY);
      if (!raw) return;
      const payload = JSON.parse(raw) as {
        citizenId: string;
        consents: CovenantsConsents;
        handle: string | null;
      };
      localStorage.removeItem(ONBOARDING_PENDING_KEY);
      setShowOfflineQueue(false);
      submitPayload(payload)
        .then(() => {
          sessionStorage.removeItem(ONBOARDING_STEP_KEY);
          onOnboardingComplete?.();
        })
        .catch(() => {
          localStorage.setItem(ONBOARDING_PENDING_KEY, raw);
        });
    } catch {
      localStorage.removeItem(ONBOARDING_PENDING_KEY);
    }
  }, [submitPayload, onOnboardingComplete]);

  useEffect(() => {
    const onOnline = () => {
      try {
        const raw = localStorage.getItem(ONBOARDING_PENDING_KEY);
        if (raw && navigator.onLine) {
          const payload = JSON.parse(raw) as {
            citizenId: string;
            consents: CovenantsConsents;
            handle: string | null;
          };
          localStorage.removeItem(ONBOARDING_PENDING_KEY);
          setShowOfflineQueue(false);
          submitPayload(payload)
            .then(() => {
              sessionStorage.removeItem(ONBOARDING_STEP_KEY);
              onOnboardingComplete?.();
            })
            .catch(() => {
              localStorage.setItem(ONBOARDING_PENDING_KEY, raw);
            });
        }
      } catch {
        localStorage.removeItem(ONBOARDING_PENDING_KEY);
      }
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [submitPayload, onOnboardingComplete]);

  const handleNext = async (
    stepData:
      | { consents: CovenantsConsents }
      | { handle: string | null }
      | Record<string, never>
  ) => {
    const updated = { ...formState };
    if ('consents' in stepData) updated.consents = stepData.consents;
    if ('handle' in stepData) updated.handle = stepData.handle;
    setFormState(updated);

    if (isLastStep) {
      setIsSubmitting(true);
      setError(null);
      const payload = {
        citizenId: citizen!.citizenId,
        consents: updated.consents,
        handle: updated.handle,
      };
      try {
        await submitPayload(payload);
        sessionStorage.removeItem(ONBOARDING_STEP_KEY);
        try {
          localStorage.removeItem(ONBOARDING_PENDING_KEY);
        } catch {
          /* ignore */
        }
        onOnboardingComplete?.();
      } catch (err) {
        if (!navigator.onLine) {
          try {
            localStorage.setItem(ONBOARDING_PENDING_KEY, JSON.stringify(payload));
            setShowOfflineQueue(true);
          } catch {
            setError('Offline. Please reconnect and try again.');
          }
        } else {
          setError(err instanceof Error ? err.message : 'Something went wrong');
        }
        setIsSubmitting(false);
      }
      return;
    }

    const nextIndex = currentStepIndex + 1;
    setCurrentStepIndex(nextIndex);
    try {
      sessionStorage.setItem(ONBOARDING_STEP_KEY, String(nextIndex));
    } catch {
      /* ignore */
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      try {
        sessionStorage.setItem(ONBOARDING_STEP_KEY, String(prevIndex));
      } catch {
        /* ignore */
      }
    }
  };

  if (showOfflineQueue) {
    return (
      <div className="fixed inset-0 flex flex-col bg-stone-950 text-stone-100 items-center justify-center p-6">
        <div className="flex flex-col gap-4 max-w-sm text-center">
          <span className="text-4xl font-retro text-stone-500 select-none">⬡</span>
          <h2 className="text-lg font-semibold text-stone-200">You&apos;re offline</h2>
          <p className="text-stone-500 text-sm">
            We&apos;ll complete your onboarding when you&apos;re back online. No
            need to start over.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-stone-950 text-stone-100">
      {/* Progress bar */}
      <div className="h-0.5 bg-stone-800 w-full">
        <div
          className="h-full bg-stone-400 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step counter */}
      <div className="flex justify-between items-center px-6 py-4">
        <span className="text-stone-600 font-retro text-xs select-none">⬡</span>
        <span className="text-stone-600 text-[10px] font-mono">
          {currentStepIndex + 1} / {ONBOARDING_STEPS.length}
        </span>
      </div>

      {/* Step content */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-sm animate-stepIn" key={currentStep.id}>
          <div className="flex flex-col gap-8">
            {/* Header */}
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-stone-100 leading-tight">
                {currentStep.title}
              </h1>
              <p className="text-stone-400 text-sm leading-relaxed">
                {currentStep.subtitle}
              </p>
            </div>

            {/* Step-specific content */}
            {currentStep.id === 'covenants' && (
              <CovenantsStep
                initial={formState.consents}
                onNext={(consents) => handleNext({ consents })}
              />
            )}
            {currentStep.id === 'handle' && (
              <HandleStep
                initial={formState.handle}
                onNext={(handle) => handleNext({ handle })}
              />
            )}
            {currentStep.id === 'enter' && (
              <EnterStep
                handle={formState.handle}
                isSubmitting={isSubmitting}
                onEnter={() => handleNext({})}
                error={error}
              />
            )}

            {/* Back */}
            {currentStepIndex > 0 && currentStep.id !== 'enter' && (
              <button
                onClick={handleBack}
                className="text-xs text-stone-600 hover:text-stone-400 transition-colors self-start"
              >
                ← Back
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
