import React, { useCallback, useMemo, useState } from 'react';
import type { ChamberJourney, LearningEvidenceRecord } from '../../src/lib/chamber-journey/types';
import { LineageVisualization } from './LineageVisualization';
import { EvidenceDrawer } from './EvidenceDrawer';
import { LearningEvidenceSummary } from './LearningEvidenceSummary';

interface Props {
  journey: ChamberJourney;
  onComplete: () => void;
  onBack: () => void;
}

type Phase = 'intro' | 'steps' | 'complete';

function collectEvidenceLabels(journey: ChamberJourney): string[] {
  const labels: string[] = [];
  for (const enc of journey.encounters) {
    enc.evidence?.forEach(e => labels.push(e.source));
  }
  journey.counterpoint?.evidence?.forEach(e => labels.push(e.source));
  if (journey.origin?.source) labels.push(journey.origin.source.source);
  return [...new Set(labels)];
}

export function ChamberJourneyFlow({ journey, onComplete, onBack }: Props) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [stepIndex, setStepIndex] = useState(0);
  const [initialClaim, setInitialClaim] = useState('');
  const [revisedClaim, setRevisedClaim] = useState('');
  const [revisionReason, setRevisionReason] = useState('');
  const [uncertainty, setUncertainty] = useState('');
  const [frictionChoice, setFrictionChoice] = useState('');
  const [counterpointSeen, setCounterpointSeen] = useState(false);

  const interactiveSteps = useMemo(
    () => journey.encounters.filter(e => e.kind !== 'record'),
    [journey.encounters],
  );

  const current = interactiveSteps[stepIndex];
  const progress = phase === 'steps'
    ? ((stepIndex + 1) / interactiveSteps.length) * 100
    : phase === 'complete'
    ? 100
    : 0;

  const record: LearningEvidenceRecord = useMemo(
    () => ({
      journeyId: journey.id,
      initialClaim,
      evidenceReviewed: collectEvidenceLabels(journey),
      counterargumentEncountered: counterpointSeen,
      revisedClaim: revisedClaim || frictionChoice,
      revisionReason,
      uncertaintyRemaining: uncertainty,
      completedAt: new Date().toISOString(),
    }),
    [journey, initialClaim, revisedClaim, frictionChoice, revisionReason, uncertainty, counterpointSeen],
  );

  const advance = useCallback(() => {
    if (stepIndex >= interactiveSteps.length - 1) {
      setPhase('complete');
      return;
    }
    setStepIndex(i => i + 1);
  }, [stepIndex, interactiveSteps.length]);

  const handleStepContinue = () => {
    if (current?.kind === 'counterpoint') setCounterpointSeen(true);
    advance();
  };

  const renderStepInput = () => {
    if (!current) return null;

    if (current.kind === 'position') {
      return (
        <textarea
          className="journey-input"
          rows={3}
          placeholder="Your initial judgment…"
          value={initialClaim}
          onChange={e => setInitialClaim(e.target.value)}
          aria-label="Your first answer"
        />
      );
    }

    if (current.kind === 'friction') {
      return (
        <div className="journey-choice-row" role="radiogroup" aria-label={journey.frictionPrompt}>
          {['Liberator — gift was necessary', 'Stewardship failure — release was reckless', 'Conditional — depends on who decides'].map(opt => (
            <label key={opt} className={`journey-choice${frictionChoice === opt ? ' selected' : ''}`}>
              <input
                type="radio"
                name="friction"
                value={opt}
                checked={frictionChoice === opt}
                onChange={() => setFrictionChoice(opt)}
              />
              {opt}
            </label>
          ))}
        </div>
      );
    }

    if (current.kind === 'reinterpret') {
      return (
        <>
          <textarea
            className="journey-input"
            rows={3}
            placeholder="Restate your judgment…"
            value={revisedClaim}
            onChange={e => setRevisedClaim(e.target.value)}
            aria-label="Revised claim"
          />
          <textarea
            className="journey-input"
            rows={2}
            placeholder="Why — what evidence or counterpoint mattered?"
            value={revisionReason}
            onChange={e => setRevisionReason(e.target.value)}
            aria-label="Revision reason"
          />
        </>
      );
    }

    if (current.kind === 'reflect') {
      return (
        <textarea
          className="journey-input"
          rows={3}
          placeholder={journey.reflectionPrompt}
          value={uncertainty}
          onChange={e => setUncertainty(e.target.value)}
          aria-label="Reflection"
        />
      );
    }

    return null;
  };

  const canContinue = (): boolean => {
    if (!current) return false;
    switch (current.kind) {
      case 'position':
        return initialClaim.trim().length > 0;
      case 'friction':
        return frictionChoice.length > 0;
      case 'reinterpret':
        return revisedClaim.trim().length > 0;
      case 'reflect':
        return uncertainty.trim().length > 0;
      default:
        return true;
    }
  };

  if (phase === 'intro') {
    return (
      <div className="visitor-screen journey-screen">
        <div className="visitor-eyebrow">Exemplar journey</div>
        <h2 className="visitor-title journey-title-serif">{journey.title}</h2>
        <p className="visitor-sub journey-lede">{journey.hook}</p>

        <blockquote className="journey-opening-question">
          {journey.openingQuestion}
        </blockquote>

        <p className="journey-note">
          You will commit an answer before the myth is named. Mobius does not prescribe the correct ideology.
        </p>

        <div className="visitor-btn-row">
          <button type="button" className="visitor-btn-primary" onClick={() => setPhase('steps')}>
            Commit your first answer →
          </button>
          <button type="button" className="visitor-btn-ghost" onClick={onBack}>
            Back
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'complete') {
    return (
      <div className="visitor-screen journey-screen">
        <div className="visitor-eyebrow">Attested learning</div>
        <h2 className="visitor-title">Your interpretation is on record.</h2>
        <p className="visitor-sub">
          Not XP. Not a leaderboard. A trace of what you believed, what challenged you, and what remains uncertain.
        </p>

        <LearningEvidenceSummary record={record} />

        {journey.nextQuestions.length > 0 && (
          <div className="journey-next-questions">
            <div className="journey-section-label">Next questions</div>
            <ul>
              {journey.nextQuestions.map(q => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="visitor-btn-row">
          <button type="button" className="visitor-btn-primary" onClick={onComplete}>
            Continue to the shell →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="visitor-screen journey-screen">
      <div className="journey-progress" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
        <div className="journey-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="visitor-eyebrow">
        Step {stepIndex + 1} of {interactiveSteps.length} · {current?.kind}
      </div>
      <h2 className="visitor-title">{current?.title}</h2>
      <p className="visitor-sub">{current?.body}</p>

      {current?.lineage && current.lineage.length > 0 && (
        <LineageVisualization nodes={current.lineage} />
      )}

      {current?.evidence && current.evidence.length > 0 && (
        <EvidenceDrawer evidence={current.evidence} />
      )}

      {current?.kind === 'counterpoint' && journey.counterpoint && (
        <div className="journey-counterpoint">
          <div className="journey-section-label">{journey.counterpoint.title}</div>
          <p>{journey.counterpoint.body}</p>
          {journey.counterpoint.evidence && (
            <EvidenceDrawer evidence={journey.counterpoint.evidence} label="View counter-evidence" />
          )}
        </div>
      )}

      {current?.prompt && (
        <p className="journey-prompt">{current.prompt}</p>
      )}

      {renderStepInput()}

      <div className="visitor-btn-row">
        <button
          type="button"
          className="visitor-btn-primary"
          onClick={handleStepContinue}
          disabled={!canContinue()}
        >
          {stepIndex >= interactiveSteps.length - 1 ? 'Finish journey →' : 'Continue →'}
        </button>
        <button type="button" className="visitor-btn-ghost" onClick={onBack}>
          Exit
        </button>
      </div>
    </div>
  );
}
