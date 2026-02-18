/**
 * onboardingSteps.ts
 *
 * Ordered step definitions for the citizen onboarding flow.
 * 3-step constitutional flow: Covenants → Handle → Enter.
 *
 * To add a step: append to the ONBOARDING_STEPS array.
 * To make a step skippable: set skippable: true.
 *
 * Flow:
 *   1. Covenants — Three principles: Integrity, Ecology, Custodianship (required)
 *   2. Handle    — Optional @name (skippable)
 *   3. Enter     — Confirmation + launch
 */

export type OnboardingStepId = 'covenants' | 'handle' | 'enter';

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
    id: 'covenants',
    title: 'The Covenants',
    subtitle:
      'Three principles that bind the Mobius network. Not terms of service — a shared commitment.',
    skippable: false,
    field: 'consents',
  },
  {
    id: 'handle',
    title: 'Handle',
    subtitle:
      'An optional @name for display. You can set one later in your profile.',
    skippable: true,
    field: 'handle',
  },
  {
    id: 'enter',
    title: 'Enter',
    subtitle: 'Your citizen identity is ready. Enter Mobius Systems.',
    skippable: false,
  },
];
