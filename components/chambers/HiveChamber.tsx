import React, { Suspense, lazy, useState } from 'react';
import { ShellErrorBoundary } from '../ShellErrorBoundary';
import { ErrorCodes } from '../../errors/errorCodes';
import { useAtlasErrorLog } from '../useAtlasErrorLog';
import { chamberByTab, chamberPublicName } from '../../src/lib/chambers';
import { TabId } from '../../types';

const world = chamberByTab(TabId.HIVE)!;

const HiveLab = lazy(() =>
  import('../Labs/HivePortal').then((m) => ({ default: m.HivePortal })),
);

type HiveView = 'world' | 'panels';

function simulatorSrc(): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `/hive-simulator/?data=/api/hive/world/&shell=${encodeURIComponent(origin)}`;
}

export const HiveChamber: React.FC = () => {
  const logToAtlas = useAtlasErrorLog();
  const [view, setView] = useState<HiveView>('world');

  return (
    <div className="hive-room">
      <div className="hive-crt">
        <div className="hive-head">
          <h2>{world.publicName} — QUEST LOG</h2>
          <div className="hive-stats">
            <div className="hive-view-toggle" role="tablist" aria-label={`${world.publicName} view`}>
              <button
                type="button"
                role="tab"
                aria-selected={view === 'world'}
                className={`hive-view-btn ${view === 'world' ? 'active' : ''}`}
                onClick={() => setView('world')}
              >
                {world.publicName.toUpperCase()}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={view === 'panels'}
                className={`hive-view-btn ${view === 'panels' ? 'active' : ''}`}
                onClick={() => setView('panels')}
              >
                PANELS
              </button>
            </div>
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
            {view === 'world' ? (
              <iframe
                key={simulatorSrc()}
                className="hive-world-frame"
                title="HIVE World Simulator"
                src={simulatorSrc()}
                sandbox="allow-scripts allow-same-origin allow-popups"
              />
            ) : (
              <Suspense fallback={null}>
                <HiveLab />
              </Suspense>
            )}
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
