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
    <div className="ref-room">
      {/* Left: oval candlelit mirror */}
      <div className="ref-mirror">
        <div className="haze" aria-hidden />
        <div className="role">Room 03 · Reflections</div>
        <h2>The mirror<br />asks softly.</h2>
        <p className="obs">
          It's the biggest lab in the shell — rich mood vocabulary, and a space
          that invites you to slow down.
        </p>
        <div className="ref-candle" aria-hidden />
      </div>

      {/* Right: lined journal paper wrapping the lab */}
      <div className="ref-journal">
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
