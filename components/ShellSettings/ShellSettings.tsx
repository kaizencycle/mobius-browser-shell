import React, { useEffect, useRef } from 'react';
import { useVisitorOnboarding } from '../../hooks/useVisitorOnboarding';
import { ONBOARDING_PATHS } from '../../src/lib/onboarding/paths';
import { getOnboardingState } from '../../src/lib/storage';

interface ShellSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Shell settings drawer — available to all visitors (not just authenticated citizens).
 */
export function ShellSettings({ isOpen, onClose }: ShellSettingsProps) {
  const { state, reset } = useVisitorOnboarding();
  const closeRef = useRef<HTMLButtonElement>(null);
  const pathDef = ONBOARDING_PATHS.find(p => p.id === state.path);
  const canonical = getOnboardingState();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const civicId = state.civicId ?? canonical.civic_id;

  return (
    <>
      <div className="shell-settings-backdrop" onClick={onClose} aria-hidden />
      <aside className="shell-settings" role="dialog" aria-label="Shell settings">
        <div className="shell-settings-head">
          <span>Shell settings</span>
          <button ref={closeRef} onClick={onClose} aria-label="Close settings">×</button>
        </div>

        <div className="shell-settings-body">
          <section className="shell-settings-section">
            <h3>Your path</h3>
            {pathDef ? (
              <p>{pathDef.label} · opens {pathDef.firstChamberLabel} first</p>
            ) : (
              <p className="shell-settings-muted">No path selected</p>
            )}
          </section>

          {civicId && (
            <section className="shell-settings-section">
              <h3>Civic ID</h3>
              <code className="shell-settings-code">{civicId}</code>
            </section>
          )}

          <section className="shell-settings-section">
            <h3>Onboarding</h3>
            <p className="shell-settings-muted">
              Re-run the welcome flow to change your path or review the chambers.
            </p>
            <button
              className="shell-settings-btn"
              onClick={() => {
                reset();
                onClose();
                window.location.reload();
              }}
            >
              Restart onboarding
            </button>
          </section>

          <section className="shell-settings-section shell-settings-section--muted">
            <p>
              localStorage = always available · Terminal reads = best effort ·
              CPC writes = queued when offline
            </p>
          </section>
        </div>
      </aside>
    </>
  );
}
