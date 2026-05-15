import React from 'react';

interface Props {
  score: number | null;
  size?: 'compact' | 'full';
}

function zone(score: number | null): { label: string; color: string; stroke: string } {
  if (score === null) return { label: 'Unknown', color: 'text-stone-400', stroke: '#a8a29e' };
  if (score >= 0.7)   return { label: 'Healthy',  color: 'text-emerald-600', stroke: '#10b981' };
  if (score >= 0.4)   return { label: 'Caution',  color: 'text-amber-500',   stroke: '#f59e0b' };
  return { label: 'Critical', color: 'text-rose-600', stroke: '#ef4444' };
}

export const GIGauge: React.FC<Props> = ({ score, size = 'full' }) => {
  const { label, color, stroke } = zone(score);
  const pct = score ?? 0;

  if (size === 'compact') {
    return (
      <span className={`font-mono text-xs font-semibold ${color}`}>
        GI {score !== null ? score.toFixed(3) : '—'}
      </span>
    );
  }

  // Full SVG arc gauge
  const R = 52;
  const cx = 64, cy = 72;
  const startAngle = 200, endAngle = 340;
  const sweep = endAngle - startAngle; // 140°

  function arcPath(pctFill: number) {
    const angle = (startAngle + sweep * pctFill) * (Math.PI / 180);
    const startRad = startAngle * (Math.PI / 180);
    const x1 = cx + R * Math.cos(startRad);
    const y1 = cy + R * Math.sin(startRad);
    const x2 = cx + R * Math.cos(angle);
    const y2 = cy + R * Math.sin(angle);
    const large = sweep * pctFill > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2}`;
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <svg viewBox="0 0 128 96" className="w-32 h-24">
        {/* Track */}
        <path d={arcPath(1)} fill="none" stroke="#e7e5e4" strokeWidth="10" strokeLinecap="round" />
        {/* Fill */}
        {score !== null && (
          <path d={arcPath(pct)} fill="none" stroke={stroke} strokeWidth="10" strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
        )}
        {/* Score text */}
        <text x={cx} y={cy - 4} textAnchor="middle" className="font-mono" fontSize="18" fontWeight="700" fill={stroke}>
          {score !== null ? score.toFixed(2) : '—'}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="9" fill="#a8a29e" fontFamily="monospace">
          GI SCORE
        </text>
      </svg>
      <span className={`text-xs font-mono font-semibold ${color}`}>{label}</span>
    </div>
  );
};
