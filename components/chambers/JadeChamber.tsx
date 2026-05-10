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
    hint: 'One question of the day at the omnibar\'s right edge — "What did you avoid yesterday?" — taps route to JADE pre-loaded. The chamber lives outside its tab.',
  },
  {
    n: 'PROPOSITION · 04',
    q: 'Bind JADE to MII drift, not just UX.',
    hint: 'When MII dips, JADE wakes first and explains what looked off — before the sentinel banner. Makes the integrity index human-readable.',
  },
  {
    n: 'PROPOSITION · 05',
    q: 'Aesthetic that earns the name.',
    hint: 'Soft jade gradients. Slow-breathing background. A single column of conversation. The other chambers are dashboards; JADE should feel like a tea room. Differentiation by mood.',
  },
];

export const JadeChamber: React.FC<JadeChamberProps> = ({ onNavigateToOaa, onNavigateToKnowledgeGraph }) => {
  const [notified, setNotified] = useState(false);

  return (
    <div className="ch-jade">
      <div className="ch-jade__breathe" aria-hidden />
      <div className="ch-jade__inner">
        {/* Header */}
        <div className="ch-jade__head">
          <div className="ch-jade__eyebrow">ROOM 06 · SENTINEL</div>
          <h2 className="ch-jade__h2">JADE</h2>
          <p className="ch-jade__obs">
            The room that asks <em>why</em>. Slow down. JADE isn't a chatbot — it's a mirror with questions.
          </p>
        </div>

        {/* Socratic propositions */}
        {PROPOSITIONS.map((p) => (
          <div key={p.n} className="ch-jade__msg">
            <div className="ch-jade__avatar">J</div>
            <div className="ch-jade__bubble">
              <div className="ch-jade__bubble-num">{p.n} · PROPOSITION</div>
              <h4 className="ch-jade__bubble-q">{p.q}</h4>
              <p className="ch-jade__bubble-hint">{p.hint}</p>
            </div>
          </div>
        ))}

        {/* Coming soon / nav cards */}
        <div className="ch-jade__cards">
          <div className="ch-jade__card">
            <div className="ch-jade__card-ico">🔮</div>
            <div>
              <b>JADE Sessions</b>
              <p>Guided socratic dialogue. Coming next cycle.</p>
            </div>
          </div>
          <button className="ch-jade__card ch-jade__card--link" onClick={onNavigateToOaa}>
            <div className="ch-jade__card-ico">📚</div>
            <div>
              <b>OAA Academy</b>
              <p>Apply what JADE surfaces — start a module.</p>
            </div>
          </button>
          <button className="ch-jade__card ch-jade__card--link" onClick={onNavigateToKnowledgeGraph}>
            <div className="ch-jade__card-ico">⬡</div>
            <div>
              <b>ATLAS Knowledge Graph</b>
              <p>See how JADE's propositions map to your concepts.</p>
            </div>
          </button>
        </div>

        {/* Notify CTA */}
        <div className="ch-jade__foot">
          {notified ? (
            <span className="ch-jade__notified">✦ JADE will reach you when ready.</span>
          ) : (
            <button className="ch-jade__notify" onClick={() => setNotified(true)}>
              Notify me when JADE Sessions open
            </button>
          )}
          <p className="ch-jade__motto">
            — take what is useful, leave what is not.
          </p>
        </div>
      </div>
    </div>
  );
};
