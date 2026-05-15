import React from 'react';

interface GIGaugeProps {
  score: number | null | undefined;
  size?: 'compact' | 'full';
}

function getZone(score: number | null | undefined) {
  if (score == null) {
    return {
      label: 'unknown',
      color: '#78716c',
    };
  }

  if (score >= 0.7) {
    return {
      label: 'healthy',
      color: '#10b981',
    };
  }

  if (score >= 0.4) {
    return {
      label: 'caution',
      color: '#f59e0b',
    };
  }

  return {
    label: 'critical',
    color: '#ef4444',
  };
}

export function GIGauge({ score, size = 'full' }: GIGaugeProps) {
  const compact = size === 'compact';
  const dimension = compact ? 48 : 140;
  const strokeWidth = compact ? 5 : 10;
  const radius = compact ? 18 : 52;
  const center = dimension / 2;
  const circumference = Math.PI * radius;
  const normalized = Math.max(0, Math.min(1, score ?? 0));
  const dashOffset = circumference * (1 - normalized);

  const zone = getZone(score);

  return (
    <div className="flex flex-col items-center justify-center gap-1">
      <svg width={dimension} height={compact ? dimension / 1.5 : dimension / 1.2} viewBox={`0 0 ${dimension} ${dimension / 1.2}`}>
        <path
          d={`M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`}
          fill="none"
          stroke="#292524"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        <path
          d={`M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`}
          fill="none"
          stroke={zone.color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 400ms ease' }}
        />

        <text
          x={center}
          y={center - (compact ? 2 : 6)}
          textAnchor="middle"
          fontSize={compact ? 11 : 24}
          fill="#fafaf9"
          fontFamily="monospace"
          fontWeight="bold"
        >
          {score == null ? '—' : score.toFixed(2)}
        </text>

        {!compact && (
          <text
            x={center}
            y={center + 22}
            textAnchor="middle"
            fontSize={11}
            fill={zone.color}
            fontFamily="monospace"
            style={{ textTransform: 'uppercase', letterSpacing: '0.12em' }}
          >
            {zone.label}
          </text>
        )}
      </svg>
    </div>
  );
}
