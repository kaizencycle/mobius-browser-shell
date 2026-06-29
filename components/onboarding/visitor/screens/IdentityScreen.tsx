import React, { useMemo } from 'react';
import type { PathDefinition } from '../../../../src/lib/onboarding/paths';
import { FirstActionsChecklist } from '../../FirstActionsChecklist';
import { useFirstActions } from '../../../../hooks/useFirstActions';

interface Props {
  path: PathDefinition | null;
  civicId: string | null;
  onComplete: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export function IdentityScreen({ path, civicId, onComplete, onBack, onSkip }: Props) {
  const { actions } = useFirstActions();
  const generatedId = useMemo(
    () => civicId ?? `citizen-${Date.now().toString(36)}`,
    [civicId],
  );

  const completedCount = [actions.path, actions.seminar, actions.jade, actions.pulse].filter(Boolean).length;

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

      <div className="visitor-rewards-label" style={{ marginBottom: 8 }}>
        First actions · {completedCount}/4
      </div>
      <FirstActionsChecklist variant="card" forceShow />

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
