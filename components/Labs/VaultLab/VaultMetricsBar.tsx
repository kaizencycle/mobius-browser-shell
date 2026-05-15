import React from 'react';
import type { VaultMetrics } from '../../../types';

const METRIC_DEFS = [
  { key: 'sealed'        as const, label: 'Sealed',        color: 'text-emerald-700' },
  { key: 'quarantined'   as const, label: 'Quarantined',   color: 'text-rose-700'    },
  { key: 'reattestation' as const, label: 'Reattestation', color: 'text-amber-700'   },
  { key: 'pending'       as const, label: 'Pending',        color: 'text-stone-600'   },
];

export const VaultMetricsBar: React.FC<{ metrics: VaultMetrics }> = ({ metrics }) => (
  <div className="flex items-stretch border-b border-stone-200 bg-white overflow-x-auto">
    {METRIC_DEFS.map(({ key, label, color }) => (
      <div key={key} className="flex flex-col items-center justify-center px-5 py-3 border-r border-stone-100 min-w-[80px]">
        <span className={`text-xl font-bold font-mono ${color}`}>{metrics[key]}</span>
        <span className="text-[10px] text-stone-400 font-mono uppercase tracking-widest mt-0.5">{label}</span>
      </div>
    ))}
    <div className="flex flex-col items-center justify-center px-5 py-3 border-r border-stone-100 min-w-[110px]">
      <span className="text-xl font-bold font-mono text-amber-600">
        ◎ {metrics.total_mic_reserved.toLocaleString(undefined, { maximumFractionDigits: 0 })}
      </span>
      <span className="text-[10px] text-stone-400 font-mono uppercase tracking-widest mt-0.5">MIC Reserved</span>
    </div>
    <div className="flex flex-col items-center justify-center px-5 py-3 min-w-[120px]">
      <span className="text-sm font-mono text-stone-600">
        {metrics.last_seal_at
          ? new Date(metrics.last_seal_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : '—'}
      </span>
      <span className="text-[10px] text-stone-400 font-mono uppercase tracking-widest mt-0.5">Last Sealed</span>
    </div>
  </div>
);
