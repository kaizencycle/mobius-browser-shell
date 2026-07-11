import React from 'react';
import { CHAMBER_PREVIEWS } from '../../../../src/lib/onboarding/paths';
import type { PathDefinition } from '../../../../src/lib/onboarding/paths';

interface Props {
  path: PathDefinition | null;
  onContinue: () => void;
  onBack: () => void;
}

export function ChamberPreviewScreen({ path, onContinue, onBack }: Props) {
  if (!path) return null;
  const preview = CHAMBER_PREVIEWS[path.id];

  return (
    <div className="visitor-screen">
      <div className="visitor-eyebrow">Step 3 of 4 · First chamber</div>
      <h2 className="visitor-title">Your first chamber is ready.</h2>
      <p className="visitor-sub">
        Here's what you'll find inside the {path.firstChamberLabel} chamber.
      </p>

      <div className="visitor-mic-hint">
        Learn → collect Fractal Shards → build your portfolio. Request an Integrity Grade when the network is eligible — recognition is never guaranteed.
      </div>

      <div className="visitor-preview-card">
        <div className="visitor-preview-header">
          <span className="visitor-preview-icon">{path.icon}</span>
          <div>
            <div className="visitor-preview-name">{path.firstChamberLabel}</div>
            <div className="visitor-preview-canon font-mono text-[10px] text-stone-500">
              {path.label} path
            </div>
          </div>
        </div>
        <p className="visitor-preview-desc">{preview.description}</p>

        {preview.subjects && (
          <div className="visitor-subjects">
            {preview.subjects.map(s => (
              <span key={s} className="visitor-subject-chip">{s}</span>
            ))}
          </div>
        )}
      </div>

      {preview.rewards && (
        <div className="visitor-rewards">
          <div className="visitor-rewards-label">What you unlock</div>
          {preview.rewards.map(r => (
            <div key={r.label} className="visitor-reward-row">
              <span className="visitor-reward-name">{r.label}</span>
              <div className="visitor-reward-track">
                <div className="visitor-reward-fill" />
              </div>
              <span className="visitor-reward-val">{r.value}</span>
            </div>
          ))}
        </div>
      )}

      <div className="visitor-btn-row">
        <button className="visitor-btn-primary" onClick={onContinue}>
          Set up identity →
        </button>
        <button className="visitor-btn-ghost" onClick={onBack}>Back</button>
      </div>
    </div>
  );
}
