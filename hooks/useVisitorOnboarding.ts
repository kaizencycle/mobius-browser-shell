import { useState, useCallback } from 'react';
import type { OnboardingPath } from '../src/lib/onboarding/paths';

const STORAGE_KEY = 'mobius_visitor_onboarding';

interface VisitorOnboardingState {
  complete: boolean;
  path: OnboardingPath | null;
  currentStep: number;
  civicId: string | null;
}

function loadState(): VisitorOnboardingState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as VisitorOnboardingState;
  } catch { /* ignore */ }
  return { complete: false, path: null, currentStep: 0, civicId: null };
}

function saveState(state: VisitorOnboardingState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

export function useVisitorOnboarding() {
  const [state, setState] = useState<VisitorOnboardingState>(loadState);

  const setStep = useCallback((step: number) => {
    setState(prev => {
      const next = { ...prev, currentStep: step };
      saveState(next);
      return next;
    });
  }, []);

  const setPath = useCallback((path: OnboardingPath) => {
    setState(prev => {
      const next = { ...prev, path };
      saveState(next);
      return next;
    });
  }, []);

  const complete = useCallback((firstChamber: string) => {
    setState(prev => {
      const next: VisitorOnboardingState = {
        ...prev,
        complete: true,
        civicId: prev.civicId ?? `citizen-${Date.now().toString(36)}`,
      };
      saveState(next);
      return next;
    });
    window.location.hash = firstChamber;
  }, []);

  const skip = useCallback(() => {
    setState(prev => {
      const next = { ...prev, complete: true };
      saveState(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState({ complete: false, path: null, currentStep: 0, civicId: null });
  }, []);

  return { state, setStep, setPath, complete, skip, reset };
}
