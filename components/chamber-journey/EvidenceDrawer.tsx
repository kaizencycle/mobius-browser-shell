import React, { useId, useState } from 'react';
import type { EvidenceRef } from '../../src/lib/chamber-journey/types';

interface Props {
  evidence: EvidenceRef[];
  label?: string;
  /** Called once when the drawer is opened — used to attest evidence review */
  onOpen?: (sources: string[]) => void;
}

function confidenceLabel(c?: EvidenceRef['confidence']): string {
  switch (c) {
    case 'high':
      return 'High confidence';
    case 'medium':
      return 'Medium confidence';
    case 'low':
      return 'Low confidence';
    case 'disputed':
      return 'Disputed';
    default:
      return 'Confidence not rated';
  }
}

export function EvidenceDrawer({ evidence, label = 'View evidence', onOpen }: Props) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  if (evidence.length === 0) return null;

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      onOpen?.(evidence.map(e => e.source));
    }
  };

  return (
    <div className="journey-evidence">
      <button
        type="button"
        className="journey-evidence-toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={handleToggle}
      >
        {open ? 'Hide evidence' : label}
        <span className="journey-evidence-count" aria-hidden>
          ({evidence.length})
        </span>
      </button>

      {open && (
        <div id={panelId} className="journey-evidence-panel" role="region" aria-label="Evidence and provenance">
          {evidence.map((item, i) => (
            <div key={`${item.source}-${i}`} className="journey-evidence-item">
              <div className="journey-evidence-claim">
                <span className="journey-evidence-field">Claim</span>
                {item.claim}
              </div>
              <div className="journey-evidence-row">
                <span className="journey-evidence-field">Source</span>
                <span>{item.source}</span>
              </div>
              {item.date && (
                <div className="journey-evidence-row">
                  <span className="journey-evidence-field">Date</span>
                  <span>{item.date}</span>
                </div>
              )}
              {item.provenance && (
                <div className="journey-evidence-row">
                  <span className="journey-evidence-field">Provenance</span>
                  <span>{item.provenance}</span>
                </div>
              )}
              <div className="journey-evidence-row">
                <span className="journey-evidence-field">Confidence</span>
                <span className={`journey-evidence-confidence journey-evidence-confidence--${item.confidence ?? 'medium'}`}>
                  {confidenceLabel(item.confidence)}
                </span>
              </div>
              {item.counterpoint && (
                <div className="journey-evidence-counterpoint">
                  <span className="journey-evidence-field">Counterpoint / dispute</span>
                  {item.counterpoint}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
