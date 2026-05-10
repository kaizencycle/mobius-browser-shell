import React, { Suspense, lazy } from 'react';
import { ShellErrorBoundary } from '../ShellErrorBoundary';
import { ErrorCodes } from '../../errors/errorCodes';
import { useAtlasErrorLog } from '../useAtlasErrorLog';
import { TabId } from '../../types';

const HiveLab = lazy(() =>
  import('../Labs/HiveLab').then((m) => ({ default: m.HiveLab })),
);

interface HiveChamberProps {
  onNavigateToShield?: () => void;
}

export const HiveChamber: React.FC<HiveChamberProps> = () => {
  const logToAtlas = useAtlasErrorLog();
  return (
    <div className="ch-hive">
      {/* CRT scanlines + vignette overlays */}
      <div className="ch-hive__scanlines" aria-hidden />
      <div className="ch-hive__vignette" aria-hidden />
      {/* Pixel header bar */}
      <div className="ch-hive__header">
        <h2>HIVE — QUEST LOG</h2>
        <div className="ch-hive__stats">
          <span className="ch-hive__stat">ROOM · <b>02</b></span>
          <span className="ch-hive__stat">SHARDS · <b>×24</b></span>
          <span className="ch-hive__stat">MII · <b>0.95</b></span>
          <span className="ch-hive__blink">▶</span>
        </div>
      </div>
      {/* Lab content */}
      <div className="ch-hive__content">
        <ShellErrorBoundary
          appName="HIVE (16-bit JRPG)"
          appIcon="🎮"
          errorCode={ErrorCodes.HIVE_SESSION_LOST}
          onError={logToAtlas}
        >
          <Suspense fallback={null}>
            <HiveLab />
          </Suspense>
        </ShellErrorBoundary>
      </div>
    </div>
  );
};
