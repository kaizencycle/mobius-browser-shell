import React from 'react';
import { useVisitorOnboarding } from '../../hooks/useVisitorOnboarding';
import { ONBOARDING_PATHS } from '../../src/lib/onboarding/paths';

const NUDGE_ITEMS = [
  { id: 'path', label: 'Chose your path', check: (hasPath: boolean) => hasPath },
  { id: 'seminar', label: 'Complete first seminar', check: () => false },
  { id: 'jade', label: 'Ask JADE a question', check: () => false },
  { id: 'pulse', label: 'View the Pulse chamber', check: () => false },
] as const;

/**
 * Persistent first-actions checklist — fades when all items complete (C-358 follow-up).
 */
export function OnboardingNudge() {
  const { state } = useVisitorOnboarding();
  const pathDef = ONBOARDING_PATHS.find(p => p.id === state.path);
  const hasPath = !!state.path;

  const items = NUDGE_ITEMS.map(item => ({
    ...item,
    done: item.id === 'path' ? item.check(hasPath) : item.check(),
  }));

  const allDone = items.every(i => i.done);
  if (!state.complete || allDone) return null;

  return (
    <div className="hall-nudge" role="complementary" aria-label="First actions">
      <div className="hall-nudge-head">Your first actions</div>
      <ul className="hall-nudge-list">
        {items.map(item => (
          <li key={item.id} className={`hall-nudge-item${item.done ? ' done' : ''}`}>
            <span className="hall-nudge-check">{item.done ? '✓' : '·'}</span>
            <span>
              {item.label}
              {item.id === 'path' && pathDef && (
                <span className="hall-nudge-sub"> · {pathDef.firstChamberLabel}</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
