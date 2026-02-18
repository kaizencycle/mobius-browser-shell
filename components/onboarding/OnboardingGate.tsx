import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { OnboardingStep } from './OnboardingStep';
import { ONBOARDING_STEPS } from './onboardingSteps';

const ONBOARDING_STEP_KEY = 'mobius:onboarding:step';

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
 * - Progressive: one step at a time, no overwhelm
 * - Skippable steps are clearly marked — citizens own their data
 * - Minimum viable: handle + covenant consent is enough to start
 * - State is kept locally until final submit — one API call at the end
 */
export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { citizen } = useAuth();

  // Pass through authenticated + already onboarded citizens immediately
  if (!citizen || citizen.onboarded) return <>{children}</>;

  return <OnboardingFlow />;
}

// ── Flow controller ───────────────────────────────────────────────────────────

interface OnboardingState {
  handle: string;
  consentIntegrity: boolean;
  consentData: boolean;
}

const INITIAL_STATE: OnboardingState = {
  handle: '',
  consentIntegrity: false,
  consentData: false,
};

function OnboardingFlow() {
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
  const [formState, setFormState] = useState<OnboardingState>(INITIAL_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentStep = ONBOARDING_STEPS[currentStepIndex];
  const isLastStep = currentStepIndex === ONBOARDING_STEPS.length - 1;
  const progress = ((currentStepIndex + 1) / ONBOARDING_STEPS.length) * 100;

  const handleNext = async (stepData: Partial<OnboardingState>) => {
    const updated = { ...formState, ...stepData };
    setFormState(updated);

    if (isLastStep) {
      setIsSubmitting(true);
      setError(null);
      try {
        await completeOnboarding({
          citizenId: citizen!.citizenId,
          handle: updated.handle || null,
          consents: {
            integrity: updated.consentIntegrity,
            data: updated.consentData,
          },
        });
        sessionStorage.removeItem(ONBOARDING_STEP_KEY);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
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
        <div className="w-full max-w-sm animate-fadeIn" key={currentStep.id}>
          <OnboardingStep
            step={currentStep}
            formState={formState}
            onNext={handleNext}
            onBack={currentStepIndex > 0 ? handleBack : undefined}
            isSubmitting={isSubmitting}
            isLastStep={isLastStep}
            error={error}
          />
        </div>
      </div>
    </div>
  );
}
