import React, { Suspense, lazy } from 'react';
import { ShellErrorBoundary } from '../ShellErrorBoundary';
import { ErrorCodes } from '../../errors/errorCodes';
import { useAtlasErrorLog } from '../useAtlasErrorLog';
import { chamberByTab, chamberPublicName } from '../../src/lib/chambers';
import { TabId } from '../../types';

const learn = chamberByTab(TabId.OAA)!;

const OAALab = lazy(() =>
  import('../Labs/OAALab').then((m) => ({ default: m.OAALab })),
);

interface OAAChamberProps {
  onNavigateToKnowledgeGraph?: () => void;
}

export const OAAChamber: React.FC<OAAChamberProps> = ({ onNavigateToKnowledgeGraph }) => {
  const logToAtlas = useAtlasErrorLog();
  return (
    <div className="oaa-room">
      <div className="oaa-frame">
        <div className="oaa-head">
          <div>
            <div className="label">ROOM {learn.room} · {learn.publicName} · Today's Lesson Plan</div>
            <h2>{learn.publicName}<small>{learn.canonName}</small></h2>
          </div>
          <div className="date">Period 3<b>Mon — Fri</b></div>
        </div>

        <div className="oaa-content">
          <ShellErrorBoundary
            appName={chamberPublicName(TabId.OAA)}
            appIcon="📚"
            errorCode={ErrorCodes.OAA_LOAD_FAILED}
            onError={logToAtlas}
          >
            <Suspense fallback={null}>
              <OAALab onNavigateToKnowledgeGraph={onNavigateToKnowledgeGraph} />
            </Suspense>
          </ShellErrorBoundary>
        </div>

        <div className="oaa-foot">
          <div>Sub: Mrs. ATLAS</div>
          <div>Class dismissed when your portfolio grows.</div>
        </div>

        <div className="oaa-chalk" aria-hidden />
        <div className="oaa-eraser" aria-hidden />
      </div>
    </div>
  );
};
