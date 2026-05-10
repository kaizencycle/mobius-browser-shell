import React, { Suspense, lazy } from 'react';
import { ShellErrorBoundary } from '../ShellErrorBoundary';
import { ErrorCodes } from '../../errors/errorCodes';
import { useAtlasErrorLog } from '../useAtlasErrorLog';

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
          <div className="ch-shield__title">
            Shield Operations
            <small>ROOM 04 · ECHO + CIVIC RADAR · LIVE</small>
          </div>
        </div>
        <div className="ch-shield__posture">
          POSTURE — <b>ELEVATED</b> · 2 critical, 4 high
        </div>
        <div className="ch-shield__clock">
          ECHO scan<b>00:04:02</b>
        </div>
      </div>

      {/* Radar + content grid */}
      <div className="ch-shield__grid">
        {/* Animated radar panel */}
        <div className="ch-shield__radar" aria-hidden>
          <div className="ch-shield__radar-scope">
            <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet">
              <circle cx="100" cy="100" r="92" className="ch-sh-ring" />
              <circle cx="100" cy="100" r="68" className="ch-sh-ring" />
              <circle cx="100" cy="100" r="42" className="ch-sh-ring" />
              <circle cx="100" cy="100" r="16" className="ch-sh-ring" />
              <line x1="8" y1="100" x2="192" y2="100" className="ch-sh-cross" />
              <line x1="100" y1="8" x2="100" y2="192" className="ch-sh-cross" />
              <g className="ch-sh-sweep">
                <defs>
                  <linearGradient id="sg" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#10b981" stopOpacity="0" />
                    <stop offset="1" stopColor="#10b981" stopOpacity=".55" />
                  </linearGradient>
                </defs>
                <path d="M100,100 L100,8 A92,92 0 0 1 192,100 Z" fill="url(#sg)" />
              </g>
              <circle cx="135" cy="68" className="ch-sh-blip ch-sh-blip--crit" r="0" />
              <circle cx="62" cy="135" className="ch-sh-blip" r="0" style={{ animationDelay: '.7s' }} />
              <circle cx="148" cy="138" className="ch-sh-blip" r="0" style={{ animationDelay: '1.6s' }} />
              <circle cx="55" cy="62" className="ch-sh-blip ch-sh-blip--crit" r="0" style={{ animationDelay: '2.2s' }} />
            </svg>
          </div>
          <div className="ch-shield__radar-label">ECHO sentinel · <b>SCANNING</b></div>
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

      {/* Status footer */}
      <div className="ch-shield__foot">
        <span>
          <span className="ch-shield__foot-pip" />
          ECHO ONLINE · ATLAS ONLINE · AUREA ONLINE
        </span>
        <span>SHIELD ROOM v1.0 · MII 0.95</span>
      </div>
    </div>
  );
};
