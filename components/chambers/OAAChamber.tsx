import React, { Suspense, lazy } from 'react';
import { ShellErrorBoundary } from '../ShellErrorBoundary';
import { ErrorCodes } from '../../errors/errorCodes';
import { useAtlasErrorLog } from '../useAtlasErrorLog';
import { useLocalChamberTime } from '../../hooks/useLocalChamberTime';
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
  const { iso, dateLine, timeLine, timeZone } = useLocalChamberTime();

  return (
    <div className="oaa-room">
      <div className="oaa-frame">
        <header className="oaa-head">
          <div className="oaa-head__intro">
            <div className="label">ROOM {learn.room} · {learn.slug}</div>
            <p className="oaa-head__question">&ldquo;{learn.humanQuestion}&rdquo;</p>
            <h2>
              {learn.publicName}
              <small>{learn.canonName}</small>
            </h2>
            <p className="oaa-head__lede">{learn.tagline}</p>
          </div>
          <div className="oaa-head__clock" aria-live="polite">
            <time className="oaa-head__date" dateTime={iso}>
              {dateLine}
            </time>
            <b className="oaa-head__time">{timeLine}</b>
            <span className="oaa-head__tz">{timeZone}</span>
          </div>
        </header>

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

        <footer className="oaa-foot">
          <div>Study · question · attest comprehension</div>
          <div>Enter with what you believe. Leave able to explain why.</div>
        </footer>

        <div className="oaa-chalk" aria-hidden />
        <div className="oaa-eraser" aria-hidden />
      </div>
    </div>
  );
};
