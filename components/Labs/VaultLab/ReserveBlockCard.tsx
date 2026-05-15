import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { VaultSeal } from '../../../types';
import { SealStatusBadge } from './SealStatusBadge';
import { AttestationRail } from './AttestationRail';
import { HashChainViewer } from './HashChainViewer';

const BORDER: Record<string, string> = {
  quarantined:   'border-rose-200',
  reattestation: 'border-amber-200',
  sealed:        'border-stone-200',
  pending:       'border-stone-100',
};

export const ReserveBlockCard: React.FC<{ seal: VaultSeal }> = ({ seal }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={`rounded-lg border bg-white transition-shadow hover:shadow-sm ${BORDER[seal.status] ?? 'border-stone-100'}`}>
      <button
        onClick={() => setExpanded(x => !x)}
        className="w-full flex items-start justify-between p-3 text-left"
      >
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-mono font-semibold text-stone-900">{seal.id}</span>
            <SealStatusBadge status={seal.status} />
          </div>
          <div className="flex items-center gap-3 text-[10px] text-stone-400 font-mono flex-wrap">
            <span>Cycle {seal.cycle}</span>
            <span>GI {seal.gi_at_seal?.toFixed(3) ?? '—'} at seal</span>
            <span>◎ {(seal.mic_reserved ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} MIC</span>
            <span>{new Date(seal.sealed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}</span>
          </div>
        </div>
        {expanded
          ? <ChevronDown className="w-4 h-4 text-stone-300 shrink-0 mt-0.5" />
          : <ChevronRight className="w-4 h-4 text-stone-300 shrink-0 mt-0.5" />
        }
      </button>
      {expanded && (
        <div className="px-3 pb-3 border-t border-stone-50 pt-3 flex flex-col gap-3">
          {seal.quarantine_reason && (
            <div className="px-2.5 py-2 rounded bg-rose-50 border border-rose-100">
              <p className="text-[10px] font-mono text-rose-500 uppercase tracking-widest mb-0.5">Quarantine Reason</p>
              <p className="text-xs text-rose-700">{seal.quarantine_reason}</p>
            </div>
          )}
          {seal.reattestation_due && (
            <div className="px-2.5 py-2 rounded bg-amber-50 border border-amber-100">
              <p className="text-[10px] font-mono text-amber-500 uppercase tracking-widest mb-0.5">Reattestation Due</p>
              <p className="text-xs text-amber-700 font-mono">{new Date(seal.reattestation_due).toLocaleString()}</p>
            </div>
          )}
          <div>
            <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest mb-1.5">Attestations</p>
            <AttestationRail attestations={seal.attestations} />
          </div>
          <HashChainViewer prevHash={seal.prev_hash} thisHash={seal.this_hash} />
        </div>
      )}
    </div>
  );
};
