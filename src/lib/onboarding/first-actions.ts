/**
 * C-358 — Persistent first-actions checklist (localStorage).
 * Fades from hallway sidebar once all four items are complete.
 */

import { getLocal, setLocal, KEYS, getOnboardingState } from '../storage';

export type FirstActionId = 'path' | 'seminar' | 'jade' | 'pulse';

export interface FirstActionsState {
  seminar: boolean;
  jade: boolean;
  pulse: boolean;
}

const DEFAULT: FirstActionsState = { seminar: false, jade: false, pulse: false };

export const FIRST_ACTIONS_EVENT = 'mobius:first-actions-updated';

export const FIRST_ACTION_LABELS: Record<FirstActionId, { label: string; sub: string }> = {
  path: {
    label: 'Chose your path',
    sub: 'Shapes which chamber opens first',
  },
  seminar: {
    label: 'Complete first seminar',
    sub: 'Pass the quiz gate to collect your first Fractal Shard',
  },
  jade: {
    label: 'Ask JADE a question',
    sub: 'Unlocks personalized seminar routing',
  },
  pulse: {
    label: 'View the Pulse chamber',
    sub: 'See live system integrity and sentinel activity',
  },
};

function loadRaw(): FirstActionsState {
  return getLocal(KEYS.FIRST_ACTIONS, DEFAULT);
}

function notify(): void {
  window.dispatchEvent(new Event(FIRST_ACTIONS_EVENT));
}

export function getFirstActions(): FirstActionsState & { path: boolean } {
  const raw = loadRaw();
  const onboarding = getOnboardingState();
  return {
    ...raw,
    path: !!onboarding.path,
  };
}

export function allFirstActionsComplete(): boolean {
  const s = getFirstActions();
  return s.path && s.seminar && s.jade && s.pulse;
}

export function markFirstAction(action: Exclude<FirstActionId, 'path'>): void {
  const current = loadRaw();
  if (current[action]) return;
  setLocal(KEYS.FIRST_ACTIONS, { ...current, [action]: true });
  notify();
}

export function resetFirstActions(): void {
  setLocal(KEYS.FIRST_ACTIONS, DEFAULT);
  notify();
}
