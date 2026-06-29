import React, { useState } from 'react';
import { TabId } from '../types';
import { SENTINELS } from '../constants';
import { SentinelStatus } from './SentinelStatus';
import { CitizenProfileButton } from './CitizenProfile/CitizenProfileButton';
import { OnboardingNudge } from './hallway/OnboardingNudge';
import { Coffee, CheckCircle, Settings } from 'lucide-react';
import { useTerminal } from '../contexts/TerminalContext';
import { useWallet } from '../contexts/WalletContext';
import { useAuth } from '../contexts/AuthContext';
import { useGuest } from '../contexts/GuestContext';
import { useVisitorOnboarding } from '../hooks/useVisitorOnboarding';
import { wakeAllServices, env } from '../config/env';
import { EXTENDED_CHAMBERS, type PublicChamber } from '../src/lib/chambers';
import { pushChamberHistory } from '../src/lib/storage';
import { ONBOARDING_PATHS } from '../src/lib/onboarding/paths';
import { type TerminalState } from '../src/lib/terminal-bridge';

const TERMINAL_APP_URL = `${env.terminalBase.replace(/\/+$/, '')}/terminal`;

function giClass(mode: TerminalState['mode'], stale: boolean): string {
  if (stale) return 'hall-gi--dim';
  return mode === 'green' ? 'hall-gi--green' : mode === 'red' ? 'hall-gi--red' : 'hall-gi--yellow';
}

interface HallwayProps {
  onEnter: (tab: TabId) => void;
  onOpenProfile: () => void;
  onOpenSettings?: () => void;
}

function handleChamberClick(
  chamber: PublicChamber,
  onEnter: (tab: TabId) => void,
): void {
  pushChamberHistory(chamber.id);
  if (chamber.externalUrl) {
    window.open(chamber.externalUrl, chamber.id === 'pulse' ? '_blank' : '_blank', 'noopener,noreferrer');
    return;
  }
  if (chamber.tabId) onEnter(chamber.tabId);
}

export const Hallway: React.FC<HallwayProps> = ({ onEnter, onOpenProfile, onOpenSettings }) => {
  const [isWaking, setIsWaking] = useState(false);
  const [wakeComplete, setWakeComplete] = useState(false);
  const { state: terminalState } = useTerminal();
  const { wallet } = useWallet();
  const { citizen } = useAuth();
  const { isGuest, triggerBecomeCitizen } = useGuest();
  const { state: onboarding } = useVisitorOnboarding();

  const pathDef = ONBOARDING_PATHS.find(p => p.id === onboarding.path);

  const handleWakeLabs = async () => {
    setIsWaking(true);
    setWakeComplete(false);
    await wakeAllServices();
    setIsWaking(false);
    setWakeComplete(true);
    setTimeout(() => setWakeComplete(false), 3000);
  };

  const featured = EXTENDED_CHAMBERS.filter(c => c.featured);
  const more = EXTENDED_CHAMBERS.filter(c => !c.featured);

  return (
    <div className="hall-root">
      <div className="hall-inner hall-inner--public">

        <div className="hall-head">
          <div className="brand">
            <div className="glyph">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 4H3"/><path d="M18 8H6"/><path d="M19 12H9"/>
                <path d="M16 16h-6"/><path d="M11 20h2"/>
              </svg>
            </div>
            <div>
              <div className="name">Mobius — School of Chambers</div>
              <div className="sub">
                {env.network.isTestnet && <span className="hall-testnet">TESTNET</span>}
                Seven chambers · one substrate
              </div>
            </div>
          </div>

          <div className="right">
            {terminalState ? (
              <a
                href={TERMINAL_APP_URL}
                target="_blank"
                rel="noreferrer"
                className={`hall-gi ${giClass(terminalState.mode, terminalState.stale)}`}
                title={terminalState.stale ? 'Stale — last-known-good' : 'Open Pulse / Terminal'}
              >
                ↗ GI {terminalState.gi.toFixed(2)}
              </a>
            ) : (
              <span className="hall-gi hall-gi--dim">GI …</span>
            )}

            <span className="hall-chip hall-chip--mic">
              ◎ {wallet
                ? wallet.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : '0.00'}
            </span>

            <button
              className="hall-wake"
              onClick={handleWakeLabs}
              disabled={isWaking}
              title="Wake all Render services"
            >
              {wakeComplete
                ? <CheckCircle size={13} />
                : <Coffee size={13} className={isWaking ? 'animate-pulse' : ''} />}
            </button>

            {onOpenSettings && (
              <button className="hall-settings" onClick={onOpenSettings} title="Shell settings" aria-label="Settings">
                <Settings size={14} />
              </button>
            )}

            {isGuest ? (
              <button className="hall-guest" onClick={triggerBecomeCitizen}>Become citizen</button>
            ) : citizen ? (
              <CitizenProfileButton onClick={onOpenProfile} />
            ) : null}
          </div>
        </div>

        <div className="hall-body-grid">
          <div className="hall-main-col">
            <div className="hall-title hall-title--public">
              <div className="eyebrow">Welcome to the school</div>
              <h1>
                Pick a chamber.
                <em> Each one is its own world.</em>
              </h1>
              <p className="lede">
                Learn, remember, verify, and participate — at your own pace.
                {pathDef && (
                  <span className="hall-path-badge">
                    Your path: <strong>{pathDef.label}</strong> · opens {pathDef.firstChamberLabel} first
                  </span>
                )}
              </p>
            </div>

            <div className="hall-section-label">Start here</div>
            <div className="doors doors--featured">
              {featured.map(chamber => (
                <button
                  key={chamber.id}
                  className={['door', 'door--public', chamber.dClass].join(' ')}
                  onClick={() => handleChamberClick(chamber, onEnter)}
                  aria-label={`Enter ${chamber.publicName}`}
                >
                  <span className="lit" aria-hidden />
                  <span className="glow" aria-hidden />
                  <span className="num">CHAMBER {chamber.room} · {chamber.slug}</span>
                  <span className="body">
                    <span className="icon" aria-hidden>{chamber.icon}</span>
                    <span className="door-title">{chamber.publicName}</span>
                    <span className="canon-name">{chamber.canonName}</span>
                    <span className="role">{chamber.tagline}</span>
                  </span>
                  <span className="enter">
                    <span>{chamber.externalUrl ? 'Open' : 'Enter'}</span>
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M5 12h14" stroke="currentColor" strokeWidth="2"/>
                      <path d="M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </span>
                </button>
              ))}
            </div>

            <div className="hall-section-label">More rooms</div>
            <div className="doors doors--more">
              {more.map(chamber => (
                <button
                  key={chamber.id}
                  className={['door', 'door--public', 'door--compact', chamber.dClass].join(' ')}
                  onClick={() => handleChamberClick(chamber, onEnter)}
                  disabled={chamber.disabled}
                  aria-label={`Enter ${chamber.publicName}`}
                >
                  <span className="lit" aria-hidden />
                  <span className="body">
                    <span className="icon" aria-hidden>{chamber.icon}</span>
                    <span className="door-title">{chamber.publicName}</span>
                    <span className="canon-name">{chamber.canonName}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <aside className="hall-sidebar">
            <OnboardingNudge />
            <div className="hall-sidebar-card">
              <div className="hall-sidebar-label">Sentinels</div>
              <div className="hall-sentinel-row hall-sentinel-row--sidebar">
                <span className="pip" aria-hidden />
                {SENTINELS.length} online · MII {terminalState?.echo?.avgMii?.toFixed(2) ?? '0.95'}
              </div>
              <div className="hall-sentinels-detail hall-sentinels-detail--sidebar">
                <SentinelStatus sentinels={SENTINELS} mii={terminalState?.echo?.avgMii ?? null} />
              </div>
            </div>
          </aside>
        </div>

      </div>
    </div>
  );
};
