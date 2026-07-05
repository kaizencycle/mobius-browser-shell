import React, { Suspense, lazy, useEffect, useRef } from 'react';
import { ShellErrorBoundary } from '../ShellErrorBoundary';
import { ErrorCodes } from '../../errors/errorCodes';
import { useAtlasErrorLog } from '../useAtlasErrorLog';
import { chamberByTab, chamberPublicName } from '../../src/lib/chambers';
import { TabId } from '../../types';

const council = chamberByTab(TabId.KNOWLEDGE_GRAPH)!;

const KnowledgeGraphLab = lazy(() =>
  import('../KnowledgeGraph').then((m) => ({ default: m.KnowledgeGraphLab })),
);

interface AtlasChamberProps {
  onNavigateToReflections?: () => void;
}

export const AtlasChamber: React.FC<AtlasChamberProps> = ({ onNavigateToReflections }) => {
  const logToAtlas = useAtlasErrorLog();
  const starsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!starsRef.current) return;
    let html = '';
    for (let i = 0; i < 140; i++) {
      const x = (Math.random() * 100).toFixed(2);
      const y = (Math.random() * 100).toFixed(2);
      const d = (Math.random() * 4).toFixed(2);
      const sz = (Math.random() * 1.6 + 0.4).toFixed(1);
      html += `<span style="left:${x}%;top:${y}%;width:${sz}px;height:${sz}px;animation-delay:${d}s"></span>`;
    }
    starsRef.current.innerHTML = html;
  }, []);

  return (
    <div className="at-room">
      {/* Twinkling star field */}
      <div className="at-stars" ref={starsRef} aria-hidden />

      {/* Constellation lines */}
      <svg className="at-svg" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden>
        <line x1="220" y1="280" x2="500" y2="430" className="link bright" />
        <line x1="500" y1="430" x2="780" y2="320" className="link" />
        <line x1="500" y1="430" x2="320" y2="700" className="link bright" />
        <line x1="500" y1="430" x2="720" y2="700" className="link" />
        <line x1="320" y1="700" x2="720" y2="700" className="link" />
        <line x1="220" y1="280" x2="780" y2="320" className="link" />
      </svg>

      {/* Title overlay (top-left) */}
      <div className="at-title">
        <div className="label">Room {council.room} · {council.publicName} · {council.canonName}</div>
        <h2>What you know,<br /><em>arranged by light.</em></h2>
        <p className="obs">
          Force-directed constellations of everything you've learned. Navigate the graph to find your clusters.
        </p>
      </div>

      {/* Legend (bottom-left) */}
      <div className="at-legend" aria-hidden>
        <span><span className="sw" style={{ borderRadius: '50%' }} />concept</span>
        <span><span className="sw s" />artifact</span>
        <span><span className="sw d" />intent</span>
      </div>

      {/* Full-bleed lab content (behind overlays) */}
      <div className="at-content">
        <ShellErrorBoundary
          appName={chamberPublicName(TabId.KNOWLEDGE_GRAPH)}
          appIcon="⬡"
          errorCode={ErrorCodes.ATLAS_GRAPH_LOAD}
          recoverable={false}
          onError={logToAtlas}
        >
          <Suspense fallback={null}>
            <KnowledgeGraphLab onNavigateToReflections={onNavigateToReflections ?? (() => {})} />
          </Suspense>
        </ShellErrorBoundary>
      </div>
    </div>
  );
};
