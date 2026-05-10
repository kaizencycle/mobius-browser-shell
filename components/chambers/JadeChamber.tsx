import React, { useState } from 'react';

interface JadeChamberProps {
  onNavigateToOaa?: () => void;
  onNavigateToKnowledgeGraph?: () => void;
}

const PROPOSITIONS = [
  {
    n: 'PROPOSITION · 01',
    q: 'Position JADE as the room that asks why.',
    hint: 'Not analytics. Not settings. A Socratic sentinel. Every other chamber answers; JADE questions. Frame it that way and the empty state has a job.',
  },
  {
    n: 'PROPOSITION · 02',
    q: 'Make the construction page substantive.',
    hint: 'Replace the placeholder with a "what JADE will do" preview — three mock insight cards, one teaser query, opt-in to be pinged at launch. Even paused chambers can earn trust.',
  },
  {
    n: 'PROPOSITION · 03',
    q: 'A daily JADE prompt, pinned across the shell.',
    hint: 'One question of the day at the right edge — "What did you avoid yesterday?" — taps route to JADE pre-loaded. The chamber lives outside its tab.',
  },
  {
    n: 'PROPOSITION · 04',
    q: 'Bind JADE to MII drift, not just UX.',
    hint: 'When MII dips, JADE wakes first and explains what looked off — before the sentinel banner. Makes the integrity index human-readable.',
  },
  {
    n: 'PROPOSITION · 05',
    q: 'Aesthetic that earns the name.',
    hint: 'Soft jade gradients. Slow-breathing background. A single column of conversation. The other chambers are dashboards; JADE should feel like a tea room.',
  },
];

export const JadeChamber: React.FC<JadeChamberProps> = ({ onNavigateToOaa, onNavigateToKnowledgeGraph }) => {
  const [notified, setNotified] = useState(false);

  return (
    <div className="ja-room">
      <div className="ja-inner">
        {/* Header */}
        <div className="ja-head">
          <div className="label">Room 06 · JADE · Currently paused</div>
          <h2>The tea is hot.<br />Sit awhile.</h2>
          <p className="obs">
            JADE isn't a chatbot — it's a mirror with questions. Slow down.
          </p>
        </div>

        {/* Socratic propositions */}
        {PROPOSITIONS.map((p) => (
          <div key={p.n} className="ja-msg">
            <div className="av">J</div>
            <div className="bub">
              <div className="num">{p.n}</div>
              <h4>{p.q}</h4>
              <p>{p.hint}</p>
            </div>
          </div>
        ))}

        {/* Nav links */}
        {(onNavigateToOaa || onNavigateToKnowledgeGraph) && (
          <div className="ja-msg">
            <div className="av">J</div>
            <div className="bub" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {onNavigateToOaa && (
                <button className="ja-nav-btn" onClick={onNavigateToOaa}>📚 OAA Academy</button>
              )}
              {onNavigateToKnowledgeGraph && (
                <button className="ja-nav-btn" onClick={onNavigateToKnowledgeGraph}>⬡ ATLAS Graph</button>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="ja-foot">
          {notified ? (
            <em>✦ JADE will reach you when ready.</em>
          ) : (
            <button className="ja-notify" onClick={() => setNotified(true)}>
              Notify me when JADE Sessions open
            </button>
          )}
          <br />
          <em>— take what is useful, leave what is not.</em>
        </div>
      </div>
    </div>
  );
};
