import React from 'react';
import { useFirstActions } from '../../hooks/useFirstActions';
import { useVisitorOnboarding } from '../../hooks/useVisitorOnboarding';
import { ONBOARDING_PATHS } from '../../src/lib/onboarding/paths';
import { FIRST_ACTION_LABELS, type FirstActionId } from '../../src/lib/onboarding/first-actions';

const ORDER: FirstActionId[] = ['path', 'seminar', 'jade', 'pulse'];

interface FirstActionsChecklistProps {
  variant?: 'sidebar' | 'card';
  /** Identity screen always shows checklist even if path-only progress */
  forceShow?: boolean;
}

/**
 * C-358 — Shared first-actions checklist for Identity screen + hallway nudge.
 */
export function FirstActionsChecklist({
  variant = 'card',
  forceShow = false,
}: FirstActionsChecklistProps) {
  const { actions, allComplete } = useFirstActions();
  const { state } = useVisitorOnboarding();
  const pathDef = ONBOARDING_PATHS.find(p => p.id === state.path);

  if (allComplete && !forceShow) return null;

  if (variant === 'sidebar') {
    return (
      <ul className="hall-nudge-list">
        {ORDER.map(id => {
          const done = actions[id];
          const meta = FIRST_ACTION_LABELS[id];
          return (
            <li key={id} className={`hall-nudge-item${done ? ' done' : ''}`}>
              <span className="hall-nudge-check">{done ? '✓' : '·'}</span>
              <span>
                {meta.label}
                {id === 'path' && pathDef && (
                  <span className="hall-nudge-sub"> · {pathDef.firstChamberLabel}</span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="visitor-checklist">
      {ORDER.map(id => {
        const done = actions[id];
        const meta = FIRST_ACTION_LABELS[id];
        const sub = id === 'path' && pathDef
          ? `${pathDef.label} · opens ${pathDef.firstChamberLabel} first`
          : meta.sub;
        return (
          <div key={id} className={`visitor-check-item${done ? ' done' : ''}`}>
            <div className={`visitor-check-icon${done ? ' done' : ''}`}>
              {done ? '✓' : '·'}
            </div>
            <div className="visitor-check-content">
              <div className="visitor-check-label">{meta.label}</div>
              <div className="visitor-check-sub">{sub}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
