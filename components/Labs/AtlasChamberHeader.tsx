import React from 'react';
import { useWallet } from '../../contexts/WalletContext';
import { useTerminal } from '../../contexts/TerminalContext';
import { useAtlasWakeGuard } from '../../hooks/useAtlasWakeGuard';
import { giTextColor } from '../../utils/gi';

const STATUS_CONFIG = {
  checking: { label: '◌ Connecting…', cls: 'text-stone-400' },
  online:   { label: '● Online',      cls: 'text-emerald-400' },
  cold:     { label: '◐ Cold Start',  cls: 'text-amber-400' },
  error:    { label: '✕ Offline',     cls: 'text-rose-400' },
} as const;

export const AtlasChamberHeader: React.FC = () => {
  const { wallet } = useWallet();
  const { state: terminalState } = useTerminal();
  const wakeStatus = useAtlasWakeGuard();

  const giLabelText = terminalState ? `GI ${terminalState.gi.toFixed(2)}` : 'GI —';
  const giCls = giTextColor(terminalState?.mode, terminalState?.stale);
  const { label: statusLabel, cls: statusCls } = STATUS_CONFIG[wakeStatus];

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-stone-900 border-b border-stone-700 text-white text-xs font-mono flex-shrink-0">
      <div className="flex items-center gap-3">
        <span className="px-2 py-0.5 rounded bg-stone-700 text-stone-200 tracking-widest uppercase text-[10px]">
          ⬡ ATLAS · Tutor
        </span>
        <span className="text-stone-400">Chamber I · OAA Learning Hub</span>
      </div>
      <div className="flex items-center gap-4">
        <span className={`${statusCls} text-[10px]`}>{statusLabel}</span>
        <span className={giCls}>{giLabelText}</span>
        {wallet && (
          <span className="text-amber-400">
            ◎ {wallet.balance.toFixed(2)} MIC
          </span>
        )}
      </div>
    </div>
  );
};
