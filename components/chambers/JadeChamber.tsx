import React, { useState } from 'react';

interface JadeChamberProps {
  onNavigateToOaa?: () => void;
  onNavigateToKnowledgeGraph?: () => void;
}

const PROPOSITIONS = [
  {
    n: '01',
    q: "What's one thing you learned this week that surprised you?",
    hint: 'Surprise is often where growth lives. JADE is listening.',
  },
  {
    n: '02',
    q: 'When did you last change your mind about something important?',
    hint: 'Intellectual honesty is the rarest currency. No rush.',
  },
  {
    n: '03',
    q: 'What would you study if there were no credentials, no career, no audience?',
    hint: 'This answer is the truest signal JADE has seen from you.',
  },
  {
    n: '04',
    q: 'What is a belief you hold that most people in your circle disagree with?',
    hint: "Disagreement is data. JADE won't judge.",
  },
  {
    n: '05',
    q: 'If you could send one message to yourself six months ago, what would it say?',
    hint: 'Future-you is watching. What do you want them to know?',
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
            "The unexamined protocol is not worth running." — JADE, v0.1
          </p>
        </div>
      </div>
    </div>
  );
};
