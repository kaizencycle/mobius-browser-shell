import React, { Suspense, lazy } from 'react';
import { ShellErrorBoundary } from '../ShellErrorBoundary';
import { ErrorCodes } from '../../errors/errorCodes';
import { useAtlasErrorLog } from '../useAtlasErrorLog';
import { env } from '../../config/env';

const WalletLab = lazy(() =>
  import('../Labs/WalletLab').then((m) => ({ default: m.WalletLab })),
);

interface WalletChamberProps {
  onNavigateToOaa?: () => void;
}

export const WalletChamber: React.FC<WalletChamberProps> = ({ onNavigateToOaa }) => {
  const logToAtlas = useAtlasErrorLog();
  return (
    <div className="wallet-room">
      <div className="wa-room">
        <div className="wa-head">
          <div className="l">
            Room 07 · The Treasury
            <b>Mobius MIC · ledger view</b>
          </div>
          <h2>MIC Vault<small>Provenance over balance</small></h2>
          <div className="r">
            <span className="wa-stamp">
              {env.network.isTestnet ? 'TESTNET' : 'MAINNET'}
            </span>
          </div>
        </div>

        <div className="wa-ledger">
          <ShellErrorBoundary
            appName="MIC Wallet"
            appIcon="◎"
            errorCode={ErrorCodes.MIC_SYNC_FAILED}
            onError={logToAtlas}
          >
            <Suspense fallback={null}>
              <WalletLab onNavigateToOaa={onNavigateToOaa ?? (() => {})} />
            </Suspense>
          </ShellErrorBoundary>
        </div>

        <div className="wa-foot">
          <span>Audited · AUREA-verified</span>
          <b>"Fork the shell, not the integrity."</b>
          <span>Mobius Treasury · 2026</span>
        </div>
      </div>
    </div>
  );
};
