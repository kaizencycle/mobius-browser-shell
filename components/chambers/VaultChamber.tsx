import React, { Suspense, lazy } from 'react';
import { ShellErrorBoundary } from '../ShellErrorBoundary';
import { ErrorCodes } from '../../errors/errorCodes';
import { useAtlasErrorLog } from '../useAtlasErrorLog';
import { chamberByTab, chamberPublicName } from '../../src/lib/chambers';
import { TabId } from '../../types';

const archives = chamberByTab(TabId.VAULT)!;

const VaultLab = lazy(() =>
  import('../Labs/VaultLab').then(m => ({ default: m.VaultLab })),
);

export const VaultChamber: React.FC = () => {
  const logToAtlas = useAtlasErrorLog();
  return (
    <div className="vault-room">
      <div className="va-room">
        <div className="va-head">
          <div className="l">
            Room {archives.room} · {archives.publicName}
            <b>{archives.canonName}</b>
          </div>
          <h2>{archives.publicName}<small>{archives.tagline}</small></h2>
          <div className="r">
            <span className="va-stamp">READ-ONLY</span>
          </div>
        </div>
        <div className="va-ledger">
          <ShellErrorBoundary
            appName={chamberPublicName(TabId.VAULT)}
            appIcon="🔐"
            errorCode={ErrorCodes.MIC_SYNC_FAILED}
            onError={logToAtlas}
          >
            <Suspense fallback={null}>
              <VaultLab />
            </Suspense>
          </ShellErrorBoundary>
        </div>
        <div className="va-foot">
          <span>Attested · 5-sentinel consensus</span>
          <b>"The seal is the covenant."</b>
          <span>Mobius Vault · C-312 · 2026</span>
        </div>
      </div>
    </div>
  );
};
