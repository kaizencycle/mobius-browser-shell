import React, { Suspense, lazy } from 'react';
import { ShellErrorBoundary } from '../ShellErrorBoundary';
import { ErrorCodes } from '../../errors/errorCodes';
import { useAtlasErrorLog } from '../useAtlasErrorLog';

const ReflectionsLab = lazy(() =>
  import('../Labs/ReflectionsLab').then((m) => ({ default: m.ReflectionsLab })),
);

interface ReflectionsChamberProps {
  onNavigateToKnowledgeGraph?: () => void;
}

export const ReflectionsChamber: React.FC<ReflectionsChamberProps> = ({ onNavigateToKnowledgeGraph }) => {
  const logToAtlas = useAtlasErrorLog();
  return (
    <div className="ch-reflect">
      {/* Left: candlelit oval mirror column */}
      <div className="ch-reflect__mirror-col" aria-hidden>
        <div className="ch-reflect__mirror">
          <div className="ch-reflect__mirror-haze" />
          <div className="ch-reflect__mirror-role">Room 03 · Reflections</div>
          <div className="ch-reflect__mirror-title">The mirror<br />asks softly.</div>
        </div>
        <div className="ch-reflect__candle" />
        <div className="ch-reflect__label">ROOM 03 · CANDLELIGHT</div>
      </div>
      {/* Right: journal paper wrapping the lab */}
      <div className="ch-reflect__journal">
        <div className="ch-reflect__journal-lines" aria-hidden />
        <div className="ch-reflect__journal-content">
          <ShellErrorBoundary
            appName="Reflections Lab"
            appIcon="🪞"
            errorCode={ErrorCodes.REFL_MIRROR_SYNC}
            onError={logToAtlas}
          >
            <Suspense fallback={null}>
              <ReflectionsLab onNavigateToKnowledgeGraph={onNavigateToKnowledgeGraph} />
            </Suspense>
          </ShellErrorBoundary>
        </div>
      </div>
    </div>
  );
};
