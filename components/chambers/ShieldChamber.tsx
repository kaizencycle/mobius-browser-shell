import React, { Suspense, lazy } from 'react';
import { ShellErrorBoundary } from '../ShellErrorBoundary';
import { ErrorCodes } from '../../errors/errorCodes';
import { useAtlasErrorLog } from '../useAtlasErrorLog';
import { TabId } from '../../types';

const CitizenShieldLab = lazy(() =>
  import('../Labs/CitizenShieldLab').then((m) => ({ default: m.CitizenShieldLab })),
);

interface ShieldChamberProps {
  onNavigateToHive?: () => void;
}

export const ShieldChamber: React.FC<ShieldChamberProps> = ({ onNavigateToHive }) => {
  const logToAtlas = useAtlasErrorLog();
  return (
    <div className="ch-shield">
      {/* War-room header */}
      <div className="ch-shield__head">
        <div className="ch-shield__head-left">
          <h2 className="ch-shield__title">
            Citizen Shield
            <small>ROOM 04 · WAR ROOM</small>
          </h2>
        </div>
        <div className="ch-shield__posture">
          POSTURE: <b>ELEVATED</b> · ECHO online · 3 active alerts
        </div>
        <div className="ch-shield__clock">
          <span>CIVIC RADAR</span>
          <b>LIVE</b>
        </div>
      </div>
      {/* Radar + content grid */}
      <div className="ch-shield__grid">
        {/* Animated radar panel */}
        <div className="ch-shield__radar" aria-hidden>
          <svg viewBox="0 0 200 200" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <circle cx="100" cy="100" r="90" className="ch-sh-ring" />
            <circle cx="100" cy="100" r="60" className="ch-sh-ring" />
            <circle cx="100" cy="100" r="30" className="ch-sh-ring" />
            <line x1="10" y1="100" x2="190" y2="100" className="ch-sh-cross" />
            <line x1="100" y1="10" x2="100" y2="190" className="ch-sh-cross" />
            <path d="M100 100 L100 10 A90 90 0 0 1 190 100 Z" className="ch-sh-sweep" fill="url(#swGrad)" />
            <defs>
              <radialGradient id="swGrad" cx="0%" cy="100%">
                <stop offset="0%" stopColor="rgba(249,115,22,0)" />
                <stop offset="100%" stopColor="rgba(249,115,22,0.35)" />
              </radialGradient>
            </defs>
            <circle cx="140" cy="55" r="3" className="ch-sh-blip" />
            <circle cx="70" cy="145" r="3" className="ch-sh-blip ch-sh-blip--crit" />
            <circle cx="155" cy="120" r="3" className="ch-sh-blip" />
          </svg>
          <div className="ch-shield__radar-label">ROOM 04 · ECHO SENTINEL</div>
        </div>
        {/* Lab content */}
        <div className="ch-shield__content">
          <ShellErrorBoundary
            appName="Citizen Shield"
            appIcon="🛡"
            errorCode={ErrorCodes.SHIELD_AUTH_EXPIRED}
            onError={logToAtlas}
          >
            <Suspense fallback={null}>
              <CitizenShieldLab onNavigateToHive={onNavigateToHive ?? (() => {})} />
            </Suspense>
          </ShellErrorBoundary>
        </div>
      </div>
    </div>
  );
};
