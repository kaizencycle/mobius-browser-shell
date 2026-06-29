import React, { useMemo } from 'react';
import type { PathDefinition } from '../../../../src/lib/onboarding/paths';

interface Props {
  path: PathDefinition | null;
  civicId: string | null;
  onComplete: () => void;
  onBack: () => void;
  onSkip: () => void;
}

interface ChecklistItem {
  id: string;
  label: string;
  sub: (path: PathDefinition | null) => string;
  done: (path: PathDefinition | null) => boolean;
}

const CHECKLIST: ChecklistItem[] = [
  {
    id: 'path',
    label: 'Chose your path',
    sub: p => p ? `${p.label} · opens ${p.firstChamberLabel} first` : 'No path selected',
    done: p => !!p,
  },
  {
    id: 'seminar',
    label: 'Complete first seminar',
    sub: () => 'Pass the quiz gate to earn MIC',
    done: () => false,
  },
  {
    id: 'jade',
    label: 'Ask JADE a question',
    sub: () => 'Unlocks personalized seminar routing',
    done: () => false,
  },
  {
    id: 'pulse',
    label: 'View the Pulse chamber',
    sub: () => 'See live system integrity and sentinel activity',
    done: () => false,
  },
];

export function IdentityScreen({ path, civicId, onComplete, onBack, onSkip }: Props) {
  const generatedId = useMemo(
    () => civicId ?? `citizen-${Date.now().toString(36)}`,
    [civicId]
  );

  return (
    <div className="visitor-screen">
      <div className="visitor-eyebrow">Step 4 of 4 · Identity</div>
      <h2 className="visitor-title">Your civic identity.</h2>
      <p className="visitor-sub">
        Your identity is your record in Mobius — contributions, MIC balance,
        and integrity standing. It persists across chambers and cycles.
      </p>

      <div className="visitor-identity-card">
        {[
          { label: 'civic_id',    val: generatedId },
          { label: 'MIC balance', val: '0.000' },
          { label: 'MII score',   val: '0.30 (observer)' },
        ].map(row => (
          <div key={row.label} className="visitor-identity-row">
            <span className="visitor-id-label">{row.label}</span>
            <span className="visitor-id-val">{row.val}</span>
          </div>
        ))}
        <div className="visitor-identity-row">
          <span className="visitor-id-label">status</span>
          <span className="visitor-id-badge">guest → citizen</span>
        </div>
      </div>

      <div className="visitor-checklist">
        {CHECKLIST.map(item => {
          const isDone = item.done(path);
          return (
            <div key={item.id} className={`visitor-check-item${isDone ? ' done' : ''}`}>
              <div className={`visitor-check-icon${isDone ? ' done' : ''}`}>
                {isDone ? '✓' : '·'}
              </div>
              <div className="visitor-check-content">
                <div className="visitor-check-label">{item.label}</div>
                <div className="visitor-check-sub">{item.sub(path)}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="visitor-btn-row">
        <button className="visitor-btn-primary" onClick={onComplete}>
          Enter the {path?.firstChamberLabel ?? 'shell'} chamber →
        </button>
      </div>
      <div className="visitor-btn-row" style={{ marginTop: '8px' }}>
        <button className="visitor-btn-ghost" onClick={onBack}>Back</button>
        <button className="visitor-btn-ghost" onClick={onSkip}>Skip setup</button>
      </div>

      <p className="visitor-footnote">
        Your identity is stored locally. It enters the EPICON ledger once you earn MIC.
      </p>
    </div>
  );
}
