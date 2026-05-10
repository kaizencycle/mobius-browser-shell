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
    <div className="sh-room">
      {/* Header bar */}
      <div className="sh-head">
        <div>
          <h2>Shield Operations<small>ROOM 04 · ECHO + CIVIC RADAR · LIVE</small></h2>
        </div>
        <div className="sh-posture">POSTURE — <b>ELEVATED</b> · 2 critical, 4 high · live</div>
        <div className="sh-clock">ECHO scan<b>00:04:02</b></div>
      </div>

      {/* Radar + content grid */}
      <div className="sh-grid">
        {/* Animated radar panel */}
        <div className="sh-radar" aria-hidden>
          <div className="scope">
            <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet">
              <circle cx="100" cy="100" r="92" className="ring" />
              <circle cx="100" cy="100" r="68" className="ring" />
              <circle cx="100" cy="100" r="42" className="ring" />
              <circle cx="100" cy="100" r="16" className="ring" />
              <line x1="8" y1="100" x2="192" y2="100" className="crosshair" />
              <line x1="100" y1="8" x2="100" y2="192" className="crosshair" />
              <g className="sweep">
                <defs>
                  <linearGradient id="sh-sg" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#10b981" stopOpacity="0" />
                    <stop offset="1" stopColor="#10b981" stopOpacity=".55" />
                  </linearGradient>
                </defs>
                <path d="M100,100 L100,8 A92,92 0 0 1 192,100 Z" fill="url(#sh-sg)" />
              </g>
              <circle cx="135" cy="68" className="blip crit" r="0" />
              <circle cx="62" cy="135" className="blip" r="0" style={{ animationDelay: '.7s' }} />
              <circle cx="148" cy="138" className="blip" r="0" style={{ animationDelay: '1.6s' }} />
              <circle cx="55" cy="62" className="blip crit" r="0" style={{ animationDelay: '2.2s' }} />
            </svg>
          </div>
          <div className="label">ECHO sentinel · <b>SCANNING</b></div>
        </div>

        {/* Lab content */}
        <div className="sh-feed">
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
      <div className="sh-foot">
        <span><span className="pip" /> ECHO ONLINE · ATLAS ONLINE · AUREA ONLINE</span>
        <span>SHIELD ROOM v1.0 · MII 0.95</span>
      </div>
    </div>
  );
};
