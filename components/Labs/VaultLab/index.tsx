import React, { useState } from 'react';
import { useVaultState } from '../../../hooks/useVaultState';
import { VaultHeader } from './VaultHeader';
import { VaultMetricsBar } from './VaultMetricsBar';
import { ReserveBlockCard } from './ReserveBlockCard';
import { MobiusWalletOverview } from './MobiusWalletOverview';
import type { VaultSealStatus } from '../../../types';

type FilterValue = VaultSealStatus | 'all';

const STATUS_FILTERS: { value: FilterValue; label: string }[] = [
  { value: 'all',          label: 'All'          },
  { value: 'sealed',       label: 'Sealed'       },
  { value: 'quarantined',  label: 'Quarantined'  },
  { value: 'reattestation',label: 'Reattestation'},
  { value: 'pending',      label: 'Pending'      },
];

export const VaultLab: React.FC = () => {
  const { state, loading, error, refresh } = useVaultState();
  const [filter, setFilter] = useState<FilterValue>('all');

  const seals = state?.seals ?? [];
  const filtered = filter === 'all' ? seals : seals.filter(s => s.status === filter);

  if (loading && !state) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-stone-50 gap-3">
        <div className="w-5 h-5 border-2 border-stone-300 border-t-stone-700 rounded-full animate-spin" />
        <p className="text-xs text-stone-400 font-mono">Loading vault state…</p>
      </div>
    );
  }

  if (error && !state) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-stone-50 gap-3">
        <p className="text-xs text-rose-500 font-mono">{error}</p>
        <button
          onClick={() => void refresh()}
          className="text-[10px] font-mono px-3 py-1.5 rounded border border-stone-300 text-stone-500 hover:border-stone-400 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-stone-50 overflow-hidden">
      <VaultHeader
        metrics={state?.metrics ?? null}
        ledgerOk={state?.ledger_ok ?? false}
        onRefresh={() => void refresh()}
        loading={loading}
      />

      <MobiusWalletOverview
        metrics={state?.metrics ?? null}
        ledgerOk={state?.ledger_ok ?? false}
      />

      {state?.metrics && <VaultMetricsBar metrics={state.metrics} />}

      {/* Filter tabs */}
      <div className="flex items-center gap-0 px-4 pt-3 pb-0 border-b border-stone-200 overflow-x-auto">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 text-xs font-mono border-b-2 transition-colors whitespace-nowrap ${
              filter === f.value
                ? 'border-stone-900 text-stone-900 font-semibold'
                : 'border-transparent text-stone-400 hover:text-stone-600'
            }`}
          >
            {f.label}
            {f.value !== 'all' && state?.metrics && (
              <span className="ml-1 text-[10px] text-stone-400">
                ({state.metrics[f.value as VaultSealStatus] ?? 0})
              </span>
            )}
          </button>
        ))}
        <div className="flex-1" />
        <span className="text-[10px] text-stone-300 font-mono pb-1.5 ml-3 shrink-0">
          {filtered.length} block{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Seal list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-xs text-stone-400 font-mono">
              No {filter === 'all' ? '' : filter + ' '}seals found
            </p>
          </div>
        ) : (
          filtered.map(seal => <ReserveBlockCard key={seal.id} seal={seal} />)
        )}
      </div>

      {state && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-stone-100 bg-white">
          <span className="text-[10px] text-stone-300 font-mono">Civic Protocol Core Ledger</span>
          <span className="text-[10px] text-stone-300 font-mono">
            Fetched {new Date(state.fetched_at).toLocaleTimeString()}
          </span>
        </div>
      )}
    </div>
  );
};
