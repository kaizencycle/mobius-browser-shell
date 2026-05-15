import React from 'react';
import type { VaultMetrics } from '../../../types';
import { useGuest } from '../../../contexts/GuestContext';
import { useWallet } from '../../../contexts/WalletContext';

interface Props {
  metrics: VaultMetrics | null;
  ledgerOk: boolean;
}

function formatMic(value: number | null | undefined): string {
  return `◎ ${(value ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function deriveMfsCount(events: ReturnType<typeof useWallet>['events']): number {
  return events.filter((event) => {
    const source = event.source?.toLowerCase() ?? '';
    const reason = event.reason?.toLowerCase() ?? '';
    const meta = event.meta ? JSON.stringify(event.meta).toLowerCase() : '';
    return source.includes('shard') || source.includes('mfs') || reason.includes('shard') || meta.includes('shard');
  }).length;
}

export const MobiusWalletOverview: React.FC<Props> = ({ metrics, ledgerOk }) => {
  const { wallet, events, loading } = useWallet();
  const { isGuest } = useGuest();

  const availableMic = isGuest ? 0 : (wallet?.balance ?? 0);
  const totalEarned = isGuest ? 0 : (wallet?.total_earned ?? 0);
  const mfsCount = isGuest ? 0 : deriveMfsCount(events);
  const reserveBlocks = metrics?.chain_length ?? metrics?.total_seals ?? 0;
  const reservedMic = metrics?.total_mic_reserved ?? 0;

  return (
    <section className="border-b border-stone-200 bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 text-stone-100">
      <div className="px-4 py-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-amber-300/80">
              MobiusWallet
            </p>
            <h3 className="text-lg font-semibold tracking-tight text-white">
              MIC · MFS · Reserve Blocks
            </h3>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-stone-400">
              Citizen-facing treasury view. MIC shows usable balance, MFS tracks fractal shard provenance,
              and Reserve Blocks reflect the Terminal vault ledger in read-only mode.
            </p>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-stone-400">
            <span className={ledgerOk ? 'text-emerald-300' : 'text-amber-300'}>
              {ledgerOk ? 'ledger live' : 'terminal fallback'}
            </span>
            <span>·</span>
            <span>{loading ? 'wallet syncing' : 'wallet ready'}</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-200/80">
                Available MIC
              </span>
              <span className="rounded-full border border-amber-300/20 px-2 py-0.5 text-[9px] font-mono text-amber-100">
                spendable
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold font-mono text-amber-100">{formatMic(availableMic)}</p>
            <p className="mt-1 text-[11px] text-amber-100/70">
              Lifetime earned: {formatMic(totalEarned)}
            </p>
          </div>

          <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-200/80">
                MFS
              </span>
              <span className="rounded-full border border-cyan-300/20 px-2 py-0.5 text-[9px] font-mono text-cyan-100">
                fractal shards
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold font-mono text-cyan-100">{mfsCount}</p>
            <p className="mt-1 text-[11px] text-cyan-100/70">
              Derived from wallet events that carry shard or MFS provenance.
            </p>
          </div>

          <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-200/80">
                Reserve Blocks
              </span>
              <span className="rounded-full border border-emerald-300/20 px-2 py-0.5 text-[9px] font-mono text-emerald-100">
                read-only
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold font-mono text-emerald-100">{reserveBlocks}</p>
            <p className="mt-1 text-[11px] text-emerald-100/70">
              {formatMic(reservedMic)} reserved through Terminal-sealed vault records.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
