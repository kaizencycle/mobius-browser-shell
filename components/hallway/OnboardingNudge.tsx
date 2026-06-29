import React from 'react';
import { useVisitorOnboarding } from '../../hooks/useVisitorOnboarding';
import { useFirstActions } from '../../hooks/useFirstActions';
import { FirstActionsChecklist } from '../onboarding/FirstActionsChecklist';

/**
 * Persistent first-actions nudge in hallway sidebar — fades when all complete (C-358).
 */
export function OnboardingNudge() {
  const { state } = useVisitorOnboarding();
  const { allComplete } = useFirstActions();

  if (!state.complete || allComplete) return null;

  return (
    <div className="hall-nudge" role="complementary" aria-label="First actions">
      <div className="hall-nudge-head">Your first actions</div>
      <FirstActionsChecklist variant="sidebar" />
    </div>
  );
}
