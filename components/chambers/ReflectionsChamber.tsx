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
      {/* Left: oval mirror */}
      <div className="ch-reflect__mirror" aria-hidden>
        <div className="ch-reflect__mirror-haze" />
        <div className="ch-reflect__candle" />
        <div className="ch-reflect__mirror-text">
          <div className="ch-reflect__role">ROOM 03 · REFLECTIONS</div>
          <h2 className="ch-reflect__h2">Reflection<br />Nook</h2>
          <p className="ch-reflect__obs">
            "The past is not what happened. It is what you chose to remember."
          </p>
        </div>
      </div>
      {/* Right: journal paper wrapping the lab */}
      <div className="ch-reflect__journal">
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
  );
};
