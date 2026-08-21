import React from 'react';
import type { LearningEvidenceRecord } from '../../src/lib/chamber-journey/types';

interface Props {
  record: LearningEvidenceRecord;
}

export function LearningEvidenceSummary({ record }: Props) {
  return (
    <div className="journey-evidence-record" role="region" aria-label="Learning evidence record">
      <div className="journey-evidence-record-title">
        Your interpretation changed because you engaged the evidence — not because you earned points.
      </div>

      <dl className="journey-evidence-record-grid">
        <div className="journey-evidence-record-row">
          <dt>Initial claim</dt>
          <dd>{record.initialClaim || '—'}</dd>
        </div>
        <div className="journey-evidence-record-row">
          <dt>Evidence reviewed</dt>
          <dd>
            {record.evidenceReviewed.length > 0
              ? record.evidenceReviewed.join(' · ')
              : '—'}
          </dd>
        </div>
        <div className="journey-evidence-record-row">
          <dt>Counterargument encountered</dt>
          <dd>{record.counterargumentEncountered ? 'Yes' : 'No'}</dd>
        </div>
        <div className="journey-evidence-record-row">
          <dt>Revised claim</dt>
          <dd>{record.revisedClaim || '—'}</dd>
        </div>
        <div className="journey-evidence-record-row">
          <dt>Revision reason</dt>
          <dd>{record.revisionReason || '—'}</dd>
        </div>
        <div className="journey-evidence-record-row">
          <dt>Uncertainty remaining</dt>
          <dd>{record.uncertaintyRemaining || '—'}</dd>
        </div>
      </dl>
    </div>
  );
}
