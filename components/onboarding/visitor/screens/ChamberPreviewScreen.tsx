import React from 'react';
import { CHAMBER_PREVIEWS } from '../../../../src/lib/onboarding/paths';
import type { PathDefinition } from '../../../../src/lib/onboarding/paths';
import type { ChamberIntention } from '../../../../src/lib/chamber-journey/intentions';
import { primaryChamberForIntention } from '../../../../src/lib/chamber-journey/intentions';
import { ChamberIcon, CHAMBER_ICON_NAMES } from '../../../icons/ChamberIcons';

interface Props {
  path: PathDefinition | null;
  intention: ChamberIntention | null;
  onContinue: () => void;
  onBack: () => void;
}

function PreviewIcon({ icon }: { icon: string }) {
  if (CHAMBER_ICON_NAMES.has(icon)) {
    return <ChamberIcon name={icon} size={22} />;
  }
  return <>{icon}</>;
}

export function ChamberPreviewScreen({ path, intention, onContinue, onBack }: Props) {
  if (!path) return null;

  const intentChamber = intention ? primaryChamberForIntention(intention) : undefined;
  const pathPreview = CHAMBER_PREVIEWS[path.id];

  if (intention && intentChamber) {
    return (
      <div className="visitor-screen">
        <div className="visitor-eyebrow">Step 3 of 4 · First chamber</div>
        <h2 className="visitor-title">Your first chamber is ready.</h2>
        <p className="visitor-sub">
          Your {intention.toLowerCase()} intent opens {intentChamber.publicName}.
        </p>

        <div className="visitor-mic-hint">
          Learn → study, question, and attest comprehension. Recognition flows through integrity attestation — never guaranteed, never ideological.
        </div>

        <div className="visitor-preview-card">
          <div className="visitor-preview-header">
            <span className="visitor-preview-icon">
              <PreviewIcon icon={intentChamber.icon} />
            </span>
            <div>
              <div className="visitor-preview-name">{intentChamber.publicName}</div>
              <div className="visitor-preview-canon font-mono text-[10px] text-stone-500">
                {intentChamber.canonName}
              </div>
            </div>
          </div>
          <p className="visitor-ch-question" style={{ marginBottom: 10 }}>
            &ldquo;{intentChamber.humanQuestion}&rdquo;
          </p>
          <p className="visitor-preview-desc">{intentChamber.tagline}</p>
          <div className="visitor-subjects">
            <span className="visitor-subject-chip">{intention}</span>
            <span className="visitor-subject-chip">CHAMBER {intentChamber.room}</span>
          </div>
        </div>

        <div className="visitor-btn-row">
          <button type="button" className="visitor-btn-primary" onClick={onContinue}>
            Set up identity →
          </button>
          <button type="button" className="visitor-btn-ghost" onClick={onBack}>Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="visitor-screen">
      <div className="visitor-eyebrow">Step 3 of 4 · First chamber</div>
      <h2 className="visitor-title">Your first chamber is ready.</h2>
      <p className="visitor-sub">
        Here&apos;s what you&apos;ll find inside the {path.firstChamberLabel} chamber.
      </p>

      <div className="visitor-mic-hint">
        Learn → study, question, and attest comprehension. Recognition flows through integrity attestation — never guaranteed, never ideological.
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
        <p className="visitor-preview-desc">{pathPreview.description}</p>

        {pathPreview.subjects && (
          <div className="visitor-subjects">
            {pathPreview.subjects.map(s => (
              <span key={s} className="visitor-subject-chip">{s}</span>
            ))}
          </div>
        )}
      </div>

      {pathPreview.rewards && (
        <div className="visitor-rewards">
          <div className="visitor-rewards-label">What you unlock</div>
          {pathPreview.rewards.map(r => (
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
        <button type="button" className="visitor-btn-primary" onClick={onContinue}>
          Set up identity →
        </button>
        <button type="button" className="visitor-btn-ghost" onClick={onBack}>Back</button>
      </div>
    </div>
  );
}
