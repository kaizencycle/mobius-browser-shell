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

const STAR_COUNT = 120;

export const AtlasChamber: React.FC<AtlasChamberProps> = ({ onNavigateToReflections }) => {
  const logToAtlas = useAtlasErrorLog();
  const starsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!starsRef.current) return;
    starsRef.current.innerHTML = '';
    for (let i = 0; i < STAR_COUNT; i++) {
      const s = document.createElement('span');
      s.style.cssText = `
        left:${Math.random() * 100}%;
        top:${Math.random() * 100}%;
        animation-delay:${(Math.random() * 4).toFixed(2)}s;
        animation-duration:${(3 + Math.random() * 3).toFixed(2)}s;
        ${Math.random() > 0.85 ? 'width:2px;height:2px;box-shadow:0 0 4px #fef3c7;' : ''}
      `;
      starsRef.current.appendChild(s);
    }
  }, []);

  return (
    <div className="ch-atlas">
      {/* Star field */}
      <div className="ch-atlas__stars" ref={starsRef} aria-hidden />
      {/* SVG constellation */}
      <svg className="ch-atlas__svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        <line x1="20" y1="30" x2="45" y2="55" className="ch-at-link" />
        <line x1="45" y1="55" x2="70" y2="35" className="ch-at-link ch-at-link--bright" />
        <line x1="70" y1="35" x2="82" y2="65" className="ch-at-link" />
        <line x1="45" y1="55" x2="30" y2="75" className="ch-at-link" />
        <line x1="70" y1="35" x2="55" y2="20" className="ch-at-link ch-at-link--bright" />
      </svg>
      {/* Title overlay (top-left) */}
      <div className="ch-atlas__title">
        <div className="ch-atlas__eyebrow">ROOM 05 · SENTINEL</div>
        <h2 className="ch-atlas__h2">ATLAS<br /><em>Observatory</em></h2>
        <p className="ch-atlas__obs">Every thought you've captured lives somewhere in here. Navigate the graph to find the clusters.</p>
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
