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
    <div className="ch-wallet">
      {/* Red margin line (via CSS ::before) */}
      {/* Ledger header */}
      <div className="ch-wallet__head">
        <div className="ch-wallet__head-l">
          <div className="ch-wallet__head-label">ROOM 07 · TREASURY</div>
          <b>MIC Ledger</b>
        </div>
        <h2 className="ch-wallet__title">
          MIC Vault
          <small>Provenance over balance</small>
        </h2>
        <div className="ch-wallet__head-r">
          <span
            className="ch-wallet__stamp"
            style={{ transform: 'rotate(-4deg)' }}
          >
            {env.network.isTestnet ? 'TESTNET' : 'MAINNET'}
          </span>
        </div>
      </div>
      {/* Wallet lab (full ledger content) */}
      <div className="ch-wallet__content">
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
      {/* Ledger footer */}
      <div className="ch-wallet__foot">
        <span>ATLAS SENTINEL · CERTIFIED</span>
        <span>CC0 · Mobius Substrate</span>
      </div>
    </div>
  );
};
