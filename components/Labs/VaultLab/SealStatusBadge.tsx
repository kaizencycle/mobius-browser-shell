import React from 'react';
import type { VaultSealStatus } from '../../../types';

const CONFIG: Record<VaultSealStatus, { label: string; cls: string; dot: string }> = {
  sealed:        { label: 'SEALED',        cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  quarantined:   { label: 'QUARANTINED',   cls: 'bg-rose-50 text-rose-700 border-rose-200',         dot: 'bg-rose-500'    },
  pending:       { label: 'PENDING',       cls: 'bg-stone-50 text-stone-600 border-stone-200',       dot: 'bg-stone-400'   },
  reattestation: { label: 'REATTESTATION', cls: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-500'   },
};

export const SealStatusBadge: React.FC<{ status: VaultSealStatus }> = ({ status }) => {
  const { label, cls, dot } = CONFIG[status] ?? CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border font-bold ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
};
