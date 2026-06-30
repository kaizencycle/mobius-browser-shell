import { useState, useCallback } from 'react';
import type { OnboardingPath } from '../src/lib/onboarding/paths';
import { syncOnboardingState, KEYS, setLocal } from '../src/lib/storage';
import { resetFirstActions, markFirstAction } from '../src/lib/onboarding/first-actions';
import { env } from '../config/env';
import { TabId } from '../types';

const STORAGE_KEY = KEYS.VISITOR_ONBOARDING;

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
    syncOnboardingState({
      complete: state.complete,
      path: state.path,
      civic_id: state.civicId,
      currentStep: state.currentStep,
      completed_at: state.complete ? new Date().toISOString() : null,
    });
  } catch { /* ignore */ }
}

const CHAMBER_TO_TAB: Record<string, TabId> = {
  oaa:         TabId.OAA,
  hive:        TabId.HIVE,
  reflections: TabId.REFLECTIONS,
  knowledge:   TabId.KNOWLEDGE_GRAPH,
  shield:      TabId.SHIELD,
  jade:        TabId.JADE,
  wallet:      TabId.WALLET,
  vault:       TabId.VAULT,
  epicon:      TabId.EPICON,
  hallway:     TabId.HALLWAY,
  cpc:         TabId.EPICON,
  core:        TabId.EPICON,
};

/** Route to first chamber, using the shell's tab router when available. */
export function navigateToFirstChamber(
  chamber: string,
  setActiveTab?: (tab: TabId) => void,
): void {
  if (chamber === 'terminal' || chamber === 'pulse') {
    markFirstAction('pulse');
    window.open(`${env.terminalBase.replace(/\/+$/, '')}/terminal`, '_blank', 'noopener,noreferrer');
    setActiveTab?.(TabId.HALLWAY);
    return;
  }
  if (chamber === 'handbook') {
    const handbook = env.canonicalDomain
      ? `${env.canonicalDomain.replace(/\/+$/, '')}/handbook`
      : 'https://handbook.mobius-substrate.com';
    window.open(handbook, '_blank', 'noopener,noreferrer');
    setActiveTab?.(TabId.HALLWAY);
    return;
  }
  const tab = CHAMBER_TO_TAB[chamber] ?? TabId.HALLWAY;
  setActiveTab?.(tab);
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

  const complete = useCallback((firstChamber: string, setActiveTab?: (tab: TabId) => void) => {
    setState(prev => {
      const civicId = prev.civicId ?? `citizen-${Date.now().toString(36)}`;
      const next: VisitorOnboardingState = {
        ...prev,
        complete: true,
        civicId,
      };
      saveState(next);
      setLocal(KEYS.ONBOARDING, {
        complete: true,
        path: prev.path,
        civic_id: civicId,
        currentStep: 3,
        completed_at: new Date().toISOString(),
      });
      return next;
    });
    navigateToFirstChamber(firstChamber, setActiveTab);
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
    localStorage.removeItem(KEYS.ONBOARDING);
    resetFirstActions();
    setState({ complete: false, path: null, currentStep: 0, civicId: null });
  }, []);

  return { state, setStep, setPath, complete, skip, reset };
}
