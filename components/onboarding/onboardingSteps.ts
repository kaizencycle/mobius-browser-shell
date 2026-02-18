/**
 * onboardingSteps.ts
 *
 * Ordered step definitions for the citizen onboarding flow.
 * Each step is a data object — the rendering is handled by OnboardingStep.
 *
 * To add a step: append to the ONBOARDING_STEPS array.
 * To make a step skippable: set skippable: true.
 * To gate a step on a condition: handle in OnboardingGate's handleNext.
 *
 * Current flow (minimal viable):
 *   1. Welcome      — who Mobius is, what citizenship means
 *   2. Handle       — optional display name (skippable)
 *   3. Covenants    — Three Covenants consent (required)
 *   4. Ready        — confirmation + launch
 */

export type OnboardingStepId =
  | 'welcome'
  | 'handle'
  | 'covenants'
  | 'ready';

export interface OnboardingStepDef {
  id: OnboardingStepId;
  title: string;
  subtitle: string;
  skippable: boolean;
  /** Which formState field this step writes to (if any) */
  field?: string;
}

export const ONBOARDING_STEPS: OnboardingStepDef[] = [
  {
    id: 'welcome',
    title: 'Welcome, Citizen.',
    subtitle:
      'Mobius is civic infrastructure — built in public, owned by no one, accountable to everyone. This takes 60 seconds.',
    skippable: false,
  },
  {
    id: 'handle',
    title: 'Choose a handle.',
    subtitle:
      'This is how others will know you in the Mobius network. You can change it later, or skip for now.',
    skippable: true,
    field: 'handle',
  },
  {
    id: 'covenants',
    title: 'Three Covenants.',
    subtitle:
      'Mobius runs on Integrity Economics. These three principles are the foundation — not terms of service, but a shared commitment.',
    skippable: false,
    field: 'consentIntegrity',
  },
  {
    id: 'ready',
    title: "You're in.",
    subtitle:
      'Your citizen identity is established. The shell is yours.',
    skippable: false,
  },
];
