// components/Labs/EveChamberHeader.tsx
// C-307 · EVE · Chamber identity bar — GI mode signal + cycle label
import React from 'react';
import { useTerminal } from '../../contexts/TerminalContext';
import { useWallet } from '../../contexts/WalletContext';

function giPillClass(mode: string | undefined, stale: boolean): string {
  if (stale || !mode) return 'bg-stone-700 text-stone-300';
  if (mode === 'green') return 'bg-emerald-800 text-emerald-200';
  if (mode === 'red') return 'bg-rose-800 text-rose-200';
  return 'bg-amber-800 text-amber-200';
}

function giLabel(mode: string | undefined, gi: number | undefined, stale: boolean): string {
  if (stale || gi === undefined) return 'GI —';
  const tag = mode === 'green' ? '▲' : mode === 'red' ? '▼' : '◆';
  return `${tag} GI ${gi.toFixed(2)}`;
}

export const EveChamberHeader: React.FC = () => {
  const { state } = useTerminal();
  const { wallet } = useWallet();

  const cycle = state?.cycle ?? '—';
  const pillCls = giPillClass(state?.mode, state?.stale ?? false);
  const label = giLabel(state?.mode, state?.gi, state?.stale ?? false);

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-stone-900 border-b border-stone-700 text-white text-xs font-mono flex-shrink-0">
      <div className="flex items-center gap-3">
        <span className="px-2 py-0.5 rounded bg-stone-700 text-stone-200 tracking-widest uppercase text-[10px]">
          ⬡ EVE · Synthesis
        </span>
        <span className="text-stone-400">Chamber V · Global Reflection Hub</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-stone-500 text-[10px]">Cycle: {cycle}</span>
        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${pillCls}`}>
          {label}
        </span>
        {wallet && (
          <span className="text-amber-400">
            ◎ {wallet.balance.toFixed(2)} MIC
          </span>
        )}
      </div>
    </div>
  );
};
