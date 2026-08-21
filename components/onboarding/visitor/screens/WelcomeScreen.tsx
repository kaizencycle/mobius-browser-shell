import React, { useEffect, useState } from 'react';
import { PUBLIC_CHAMBERS, EXTENDED_CHAMBERS } from '../../../../src/lib/chambers';
import { CHAMBER_INTENTIONS, chambersForIntention, type ChamberIntention } from '../../../../src/lib/chamber-journey/intentions';
import { FIRE_WE_STOLE } from '../../../../src/lib/chamber-journey/lessons/fire-we-stole';
import { fetchSnapshot } from '../../../../src/lib/api/terminal';
import { ChamberIcon, CHAMBER_ICON_NAMES } from '../../../icons/ChamberIcons';
import { ChamberJourneyFlow } from '../../../chamber-journey/ChamberJourneyFlow';

interface GIStatus {
  gi: number;
  mode: 'green' | 'yellow' | 'red';
  label: string;
}

async function loadGI(): Promise<GIStatus> {
  const data = await fetchSnapshot();
  if (!data) return { gi: 0.90, mode: 'yellow', label: 'recovering' };
  const gi = data.gi ?? 0.90;
  const mode: GIStatus['mode'] = gi >= 0.95 ? 'green' : gi >= 0.80 ? 'yellow' : 'red';
  const label = mode === 'green' ? 'healthy' : mode === 'yellow' ? 'recovering' : 'degraded';
  return { gi, mode, label };
}

type WelcomeView = 'landing' | 'intentions' | 'chambers' | 'journey';

interface Props {
  onContinue: () => void;
  onSkip: () => void;
}

export function WelcomeScreen({ onContinue, onSkip }: Props) {
  const [giStatus, setGIStatus] = useState<GIStatus>({ gi: 0.90, mode: 'yellow', label: 'recovering' });
  const [view, setView] = useState<WelcomeView>('landing');
  const [selectedIntention, setSelectedIntention] = useState<ChamberIntention | null>(null);

  useEffect(() => {
    loadGI().then(setGIStatus);
  }, []);

  const dotColor = giStatus.mode === 'green'
    ? 'bg-emerald-400'
    : giStatus.mode === 'red'
    ? 'bg-red-400'
    : 'bg-amber-400';

  const valColor = giStatus.mode === 'green'
    ? 'text-emerald-400'
    : giStatus.mode === 'red'
    ? 'text-red-400'
    : 'text-amber-400';

  const primaryChambers = PUBLIC_CHAMBERS;
  const extendedOnly = EXTENDED_CHAMBERS.filter(c => !PUBLIC_CHAMBERS.some(p => p.id === c.id));

  if (view === 'journey') {
    return (
      <ChamberJourneyFlow
        journey={FIRE_WE_STOLE}
        onComplete={onContinue}
        onBack={() => setView('landing')}
      />
    );
  }

  if (view === 'chambers') {
    return (
      <div className="visitor-screen visitor-screen--wide">
        <div className="visitor-eyebrow">All chambers</div>
        <h2 className="visitor-title">Each room answers a question.</h2>
        <p className="visitor-sub">
          Public names and canon subtitles preserved. Pick by question, not subsystem.
        </p>

        <div className="visitor-chamber-cycle">
          {primaryChambers.map(ch => (
            <div key={ch.id} className="visitor-chamber-card visitor-chamber-card--question">
              <span className="visitor-ch-room">{ch.room}</span>
              <span className="visitor-ch-icon" aria-hidden>
                {CHAMBER_ICON_NAMES.has(ch.icon) ? <ChamberIcon name={ch.icon} size={20} /> : ch.icon}
              </span>
              <span className="visitor-ch-public">{ch.publicName}</span>
              <span className="visitor-ch-question">&ldquo;{ch.humanQuestion}&rdquo;</span>
              <span className="visitor-ch-canon">{ch.canonName}</span>
            </div>
          ))}
        </div>

        {extendedOnly.length > 0 && (
          <>
            <div className="visitor-section-label">Extended rooms</div>
            <div className="visitor-chamber-cycle visitor-chamber-cycle--compact">
              {extendedOnly.map(ch => (
                <div key={ch.id} className="visitor-chamber-card visitor-chamber-card--question visitor-chamber-card--compact">
                  <span className="visitor-ch-public">{ch.publicName}</span>
                  <span className="visitor-ch-question">&ldquo;{ch.humanQuestion}&rdquo;</span>
                  <span className="visitor-ch-canon">{ch.canonName}</span>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="visitor-gi-bar visitor-gi-bar--subdued">
          <span className={`visitor-gi-dot ${dotColor} ${giStatus.mode !== 'green' ? 'animate-pulse' : ''}`} />
          <span className="visitor-gi-label">System integrity</span>
          <span className={`visitor-gi-val ${valColor}`}>
            GI {giStatus.gi.toFixed(2)} · {giStatus.label}
          </span>
        </div>

        <div className="visitor-btn-row">
          <button type="button" className="visitor-btn-primary" onClick={onContinue}>
            Choose your path →
          </button>
          <button type="button" className="visitor-btn-ghost" onClick={() => setView('landing')}>
            Back
          </button>
        </div>
      </div>
    );
  }

  if (view === 'intentions') {
    const matched = selectedIntention ? chambersForIntention(selectedIntention) : [];

    return (
      <div className="visitor-screen visitor-screen--wide">
        <div className="visitor-eyebrow">What are you trying to do?</div>
        <h2 className="visitor-title">Start with intent, not architecture.</h2>
        <p className="visitor-sub">
          These verbs map to existing chambers. Canonical names and routes are unchanged.
        </p>

        <div className="visitor-intention-grid" role="list">
          {CHAMBER_INTENTIONS.map(item => (
            <button
              key={item.action}
              type="button"
              className={`visitor-intention-card${selectedIntention === item.action ? ' selected' : ''}`}
              onClick={() => setSelectedIntention(item.action)}
              role="listitem"
              aria-pressed={selectedIntention === item.action}
            >
              <span className="visitor-intention-action">{item.action}</span>
              <span className="visitor-intention-label">{item.label}</span>
            </button>
          ))}
        </div>

        {matched.length > 0 && (
          <div className="visitor-intention-match">
            <div className="visitor-section-label">Opens</div>
            {matched.map(ch => (
              <div key={ch.id} className="visitor-chamber-card visitor-chamber-card--question">
                <span className="visitor-ch-public">{ch.publicName}</span>
                <span className="visitor-ch-question">&ldquo;{ch.humanQuestion}&rdquo;</span>
                <span className="visitor-ch-canon">{ch.canonName}</span>
              </div>
            ))}
          </div>
        )}

        <div className="visitor-btn-row">
          <button type="button" className="visitor-btn-primary" onClick={onContinue} disabled={!selectedIntention}>
            Continue with this intent →
          </button>
          <button type="button" className="visitor-btn-ghost" onClick={() => setView('landing')}>
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="visitor-screen visitor-screen--wide">
      <div className="visitor-eyebrow">Mobius Substrate · School of Chambers</div>
      <h1 className="visitor-title visitor-title--hero">School of Chambers</h1>
      <p className="visitor-hero-tagline">Ideas are inherited. Understanding is earned.</p>
      <p className="visitor-sub">
        Enter with a question. Encounter the evidence. Challenge your first interpretation.
        Leave with a clearer one.
      </p>

      <div className="visitor-chamber-cycle">
        {primaryChambers.slice(0, 3).map(ch => (
          <div key={ch.id} className="visitor-chamber-card visitor-chamber-card--question">
            <span className="visitor-ch-room">{ch.room}</span>
            <span className="visitor-ch-public">{ch.publicName}</span>
            <span className="visitor-ch-question">&ldquo;{ch.humanQuestion}&rdquo;</span>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="visitor-link-btn"
        onClick={() => setView('chambers')}
      >
        See all chamber questions →
      </button>

      <div className="visitor-gi-bar visitor-gi-bar--subdued">
        <span className={`visitor-gi-dot ${dotColor} ${giStatus.mode !== 'green' ? 'animate-pulse' : ''}`} />
        <span className="visitor-gi-label">System integrity</span>
        <span className={`visitor-gi-val ${valColor}`}>
          GI {giStatus.gi.toFixed(2)} · {giStatus.label}
        </span>
      </div>

      <div className="visitor-btn-row">
        <button type="button" className="visitor-btn-primary" onClick={() => setView('journey')}>
          Begin with a question →
        </button>
        <button type="button" className="visitor-btn-ghost" onClick={() => setView('intentions')}>
          Explore all Chambers
        </button>
      </div>

      <button type="button" className="visitor-skip-link" onClick={onSkip}>
        Skip to the shell
      </button>
    </div>
  );
}
