import React, { Suspense, lazy, useEffect, useRef } from 'react';
import { ShellErrorBoundary } from '../ShellErrorBoundary';
import { ErrorCodes } from '../../errors/errorCodes';
import { useAtlasErrorLog } from '../useAtlasErrorLog';

const KnowledgeGraphLab = lazy(() =>
  import('../KnowledgeGraph').then((m) => ({ default: m.KnowledgeGraphLab })),
);

interface AtlasChamberProps {
  onNavigateToReflections?: () => void;
}

const STAR_COUNT = 140;

export const AtlasChamber: React.FC<AtlasChamberProps> = ({ onNavigateToReflections }) => {
  const logToAtlas = useAtlasErrorLog();
  const starsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!starsRef.current) return;
    let html = '';
    for (let i = 0; i < STAR_COUNT; i++) {
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const delay = (Math.random() * 4).toFixed(2);
      const dur = (3 + Math.random() * 3).toFixed(2);
      const sz = (Math.random() * 1.6 + 0.4).toFixed(1);
      html += `<span style="left:${x}%;top:${y}%;width:${sz}px;height:${sz}px;animation-delay:${delay}s;animation-duration:${dur}s"></span>`;
    }
    starsRef.current.innerHTML = html;
  }, []);

  return (
    <div className="ch-atlas">
      {/* Star field */}
      <div className="ch-atlas__stars" ref={starsRef} aria-hidden />

      {/* SVG constellation */}
      <svg className="ch-atlas__svg" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden>
        <line x1="220" y1="280" x2="500" y2="430" className="ch-at-link ch-at-link--bright" />
        <line x1="500" y1="430" x2="780" y2="320" className="ch-at-link" />
        <line x1="500" y1="430" x2="320" y2="700" className="ch-at-link ch-at-link--bright" />
        <line x1="500" y1="430" x2="720" y2="700" className="ch-at-link" />
        <line x1="320" y1="700" x2="720" y2="700" className="ch-at-link" />
        <line x1="220" y1="280" x2="780" y2="320" className="ch-at-link" />
      </svg>

      {/* Title overlay (top-left) */}
      <div className="ch-atlas__title">
        <div className="ch-atlas__eyebrow">Room 05 · ATLAS · Knowledge Graph</div>
        <h2 className="ch-atlas__h2">
          What you know,<br /><em>arranged by light.</em>
        </h2>
        <p className="ch-atlas__obs">
          Every thought you've captured lives somewhere in here. Navigate the graph to find the clusters.
        </p>
      </div>

      {/* Legend (bottom-left) */}
      <div className="ch-atlas__legend" aria-hidden>
        <span className="ch-atlas__legend-item">
          <span className="ch-atlas__legend-sw" />concept
        </span>
        <span className="ch-atlas__legend-item">
          <span className="ch-atlas__legend-sw ch-atlas__legend-sw--sq" />artifact
        </span>
        <span className="ch-atlas__legend-item">
          <span className="ch-atlas__legend-sw ch-atlas__legend-sw--d" />intent
        </span>
      </div>

      {/* Lab content (full-bleed under overlay) */}
      <div className="ch-atlas__content">
        <ShellErrorBoundary
          appName="ATLAS Sentinel"
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
