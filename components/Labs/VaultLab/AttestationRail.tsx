import React from 'react';
import type { SentinelAttestation } from '../../../types';

const SENTINEL_COLORS: Record<string, string> = {
  ATLAS: 'bg-sky-500',
  ZEUS:  'bg-violet-500',
  AUREA: 'bg-amber-500',
  JADE:  'bg-emerald-500',
  ECHO:  'bg-rose-400',
};

interface Props {
  attestations: SentinelAttestation[];
  required?: number;
}

export const AttestationRail: React.FC<Props> = ({ attestations, required = 5 }) => {
  const attested = attestations.filter(a => a.attested).length;
  const pct = Math.round((attested / required) * 100);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1 bg-stone-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              attested >= required ? 'bg-emerald-500' : attested >= 3 ? 'bg-amber-400' : 'bg-stone-300'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[10px] font-mono text-stone-400 whitespace-nowrap">{attested}/{required}</span>
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        {attestations.map(a => (
          <span
            key={a.sentinel}
            title={a.attested_at ? `Attested ${new Date(a.attested_at).toLocaleString()}` : 'Not yet attested'}
            className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold transition-opacity ${
              a.attested
                ? `${SENTINEL_COLORS[a.sentinel] ?? 'bg-stone-400'} text-white opacity-100`
                : 'bg-stone-100 text-stone-400 opacity-60'
            }`}
          >
            {a.sentinel}
          </span>
        ))}
      </div>
    </div>
  );
};
