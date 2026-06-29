import React from 'react';
import { ONBOARDING_PATHS } from '../../../../src/lib/onboarding/paths';
import type { OnboardingPath } from '../../../../src/lib/onboarding/paths';

interface Props {
  selectedPath: OnboardingPath | null;
  onSelect: (path: OnboardingPath) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function PathScreen({ selectedPath, onSelect, onContinue, onBack }: Props) {
  return (
    <div className="visitor-screen">
      <div className="visitor-eyebrow">Step 2 of 4 · Your path</div>
      <h2 className="visitor-title">Who are you here as?</h2>
      <p className="visitor-sub">
        This shapes which chamber opens first. You can change it anytime in settings.
      </p>

      <div className="visitor-path-list">
        {ONBOARDING_PATHS.map(path => (
          <div
            key={path.id}
            className={`visitor-path-card${selectedPath === path.id ? ' selected' : ''}`}
            onClick={() => onSelect(path.id)}
            role="radio"
            aria-checked={selectedPath === path.id}
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && onSelect(path.id)}
          >
            <div className="visitor-path-icon">{path.icon}</div>
            <div className="visitor-path-content">
              <div className="visitor-path-title">{path.label}</div>
              <div className="visitor-path-desc">{path.description}</div>
              <span className="visitor-path-tag">↳ {path.tag}</span>
            </div>
            {selectedPath === path.id && (
              <span className="visitor-path-check">✓</span>
            )}
          </div>
        ))}
      </div>

      <div className="visitor-btn-row">
        <button
          className="visitor-btn-primary"
          onClick={onContinue}
          disabled={!selectedPath}
        >
          Continue →
        </button>
        <button className="visitor-btn-ghost" onClick={onBack}>Back</button>
      </div>
    </div>
  );
}
