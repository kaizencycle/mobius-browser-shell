import React, { Suspense, lazy } from 'react';
import { ShellErrorBoundary } from '../ShellErrorBoundary';
import { ErrorCodes } from '../../errors/errorCodes';
import { useAtlasErrorLog } from '../useAtlasErrorLog';

const OAALab = lazy(() =>
  import('../Labs/OAALab').then((m) => ({ default: m.OAALab })),
);

interface OAAChamberProps {
  onNavigateToKnowledgeGraph?: () => void;
}

export const OAAChamber: React.FC<OAAChamberProps> = ({ onNavigateToKnowledgeGraph }) => {
  const logToAtlas = useAtlasErrorLog();
  return (
    <div className="ch-oaa-room">
      <div className="ch-oaa">
        {/* Chalkboard header */}
        <div className="ch-oaa__head">
          <div className="ch-oaa__head-l">
            <div className="ch-oaa__label">ROOM 01 · OAA · Today's Lesson Plan</div>
            <h2 className="ch-oaa__title">
              OAA Library
              <small>learn to earn</small>
            </h2>
          </div>
          <div className="ch-oaa__head-r">Period 3</div>
        </div>

        {/* Lab content */}
        <div className="ch-oaa__content">
          <ShellErrorBoundary
            appName="OAA Learning Hub"
            appIcon="📚"
            errorCode={ErrorCodes.OAA_LOAD_FAILED}
            onError={logToAtlas}
          >
            <Suspense fallback={null}>
              <OAALab onNavigateToKnowledgeGraph={onNavigateToKnowledgeGraph} />
            </Suspense>
          </ShellErrorBoundary>
        </div>

        {/* Chalk + eraser props */}
        <div className="ch-oaa__chalk" aria-hidden />
        <div className="ch-oaa__eraser" aria-hidden />
      </div>
    </div>
  );
};
