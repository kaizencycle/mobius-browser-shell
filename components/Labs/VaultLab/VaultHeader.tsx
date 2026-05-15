import React from 'react';
import { ShieldCheck, RefreshCw } from 'lucide-react';
import { useTerminal } from '../../../contexts/TerminalContext';
import type { VaultMetrics } from '../../../types';

interface Props {
  metrics: VaultMetrics | null;
  ledgerOk: boolean;
  onRefresh: () => void;
  loading: boolean;
}

export const VaultHeader: React.FC<Props> = ({ metrics, ledgerOk, onRefresh, loading }) => {
  const { state: terminal } = useTerminal();
  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-stone-50 border-b border-stone-200">
      <div className="flex items-center gap-3">
        <div className="p-1.5 bg-stone-900 rounded-md">
          <ShieldCheck className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-stone-900">Reserve Vault</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-100 text-stone-500 border border-stone-200 uppercase tracking-widest">
              Read-only
            </span>
            {!ledgerOk && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200">
                Degraded
              </span>
            )}
          </div>
          <p className="text-[10px] text-stone-400 font-mono mt-0.5">
            {terminal ? `${terminal.cycle} · GI ${terminal.gi.toFixed(3)}` : 'GI —'}
            {' · '}
            {metrics ? `${metrics.chain_length} blocks on chain` : 'loading…'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {metrics && (
          <span className={`text-[10px] font-mono flex items-center gap-1 ${
            metrics.chain_valid ? 'text-emerald-600' : 'text-rose-500'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${metrics.chain_valid ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            {metrics.chain_valid ? 'Chain Valid' : 'Chain Error'}
          </span>
        )}
        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
          ledgerOk
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-amber-50 text-amber-700 border-amber-200'
        }`}>
          {ledgerOk ? '● Ledger Live' : '◐ Terminal Fallback'}
        </span>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-1.5 rounded-md border border-stone-200 text-stone-500 hover:bg-stone-100 transition-colors disabled:opacity-40"
          title="Refresh vault state"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  );
};
