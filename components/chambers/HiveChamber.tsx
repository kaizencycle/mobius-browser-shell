import React, { Suspense, lazy } from 'react';
import { ShellErrorBoundary } from '../ShellErrorBoundary';
import { ErrorCodes } from '../../errors/errorCodes';
import { useAtlasErrorLog } from '../useAtlasErrorLog';

const HiveLab = lazy(() =>
  import('../Labs/HivePortal').then((m) => ({ default: m.HivePortal })),
);

export const HiveChamber: React.FC = () => {
  const logToAtlas = useAtlasErrorLog();
  return (
    <div className="hive-room">
      <div className="hive-crt">
        <div className="hive-head">
          <h2>HIVE — QUEST LOG</h2>
          <div className="hive-stats">
            <span className="hive-stat">ROOM · <b>02</b></span>
            <span className="hive-stat">SHARDS · <b>×24</b></span>
            <span className="hive-stat">MII · <b>0.95</b></span>
            <span className="hive-blink">▶</span>
          </div>
        </div>

        <div className="hive-content">
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

        <div className="hive-bottom">
          <span>HIVE v1.0 · ROOM 02</span>
          <span>PRESS <span className="hive-blink">▶</span> TO CONTINUE</span>
        </div>
      </div>
    </div>
  );
};
