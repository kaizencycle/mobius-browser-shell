import React from 'react';
import { CHAMBER_PREVIEWS } from '../../../../src/lib/onboarding/paths';
import type { PathDefinition } from '../../../../src/lib/onboarding/paths';
import type { ChamberIntention } from '../../../../src/lib/chamber-journey/intentions';
import { chambersForIntention } from '../../../../src/lib/chamber-journey/intentions';

interface Props {
  path: PathDefinition | null;
  intention: ChamberIntention | null;
  onContinue: () => void;
  onBack: () => void;
}

export function ChamberPreviewScreen({ path, intention, onContinue, onBack }: Props) {
  if (!path) return null;
  const preview = CHAMBER_PREVIEWS[path.id];
  const intentChambers = intention ? chambersForIntention(intention) : [];

  return (
    <div className="visitor-screen">
      <div className="visitor-eyebrow">Step 3 of 4 · First chamber</div>
      <h2 className="visitor-title">Your first chamber is ready.</h2>
      <p className="visitor-sub">
        {intention
          ? `Your ${intention.toLowerCase()} intent opens the chamber below.`
          : `Here's what you'll find inside the ${path.firstChamberLabel} chamber.`}
      </p>

      <div className="visitor-mic-hint">
        Learn → study, question, and attest comprehension. Recognition flows through integrity attestation — never guaranteed, never ideological.
      </div>

      <div className="visitor-preview-card">
        <div className="visitor-preview-header">
          <span className="visitor-preview-icon">{path.icon}</span>
          <div>
            <div className="visitor-preview-name">
              {intentChambers[0]?.publicName ?? path.firstChamberLabel}
            </div>
            <div className="visitor-preview-canon font-mono text-[10px] text-stone-500">
              {intentChambers[0]?.canonName ?? `${path.label} path`}
            </div>
          </div>
        </div>
        {intentChambers[0] && (
          <p className="visitor-ch-question" style={{ marginBottom: 10 }}>
            &ldquo;{intentChambers[0].humanQuestion}&rdquo;
          </p>
        )}
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
