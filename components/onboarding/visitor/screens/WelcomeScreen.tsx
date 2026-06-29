import React, { useEffect, useState } from 'react';

const CHAMBERS = [
  { icon: '📖', publicName: 'Learn',    canonName: 'Open Agent Architecture' },
  { icon: '🧠', publicName: 'Memory',   canonName: 'EPICON Ledger'           },
  { icon: '⚡', publicName: 'Pulse',    canonName: 'Civic Terminal'          },
  { icon: '🌍', publicName: 'World',    canonName: 'HIVE'                    },
  { icon: '⚖️', publicName: 'Council',  canonName: 'DVA'                     },
  { icon: '🗄️', publicName: 'Archives', canonName: 'Reserve Blocks'          },
];

interface GIStatus { gi: number; mode: 'green' | 'yellow' | 'red'; label: string; }

async function fetchGI(): Promise<GIStatus> {
  try {
    const res = await fetch(
      'https://terminal.mobius-substrate.com/api/terminal/snapshot-lite',
      { signal: AbortSignal.timeout(3000) }
    );
    const data = await res.json() as { gi?: number; mode?: string };
    const gi = data.gi ?? 0.90;
    const mode: GIStatus['mode'] = gi >= 0.95 ? 'green' : gi >= 0.80 ? 'yellow' : 'red';
    const label = mode === 'green' ? 'healthy' : mode === 'yellow' ? 'recovering' : 'degraded';
    return { gi, mode, label };
  } catch {
    return { gi: 0.90, mode: 'yellow', label: 'recovering' };
  }
}

interface Props { onContinue: () => void; onSkip: () => void; }

export function WelcomeScreen({ onContinue, onSkip }: Props) {
  const [giStatus, setGIStatus] = useState<GIStatus>({ gi: 0.90, mode: 'yellow', label: 'recovering' });

  useEffect(() => {
    fetchGI().then(setGIStatus);
  }, []);

  const dotColor = giStatus.mode === 'green'
    ? 'bg-emerald-400'
    : giStatus.mode === 'red'
    ? 'bg-red-400'
    : 'bg-amber-400';

  const valColor = giStatus.mode === 'green'
    ? 'text-emerald-400'
    : giStatus.mode === 'red'
    ? 'text-red-400'
    : 'text-amber-400';

  return (
    <div className="visitor-screen">
      <div className="visitor-eyebrow">Mobius Substrate · School of Chambers</div>
      <h1 className="visitor-title">Welcome.</h1>
      <p className="visitor-sub">
        Seven chambers. One substrate. Learn, remember, verify, and participate
        in the civic world — at your own pace, in any order.
      </p>

      {/* Live GI status */}
      <div className="visitor-gi-bar">
        <span className={`visitor-gi-dot ${dotColor} ${giStatus.mode !== 'green' ? 'animate-pulse' : ''}`} />
        <span className="visitor-gi-label">System integrity</span>
        <span className={`visitor-gi-val ${valColor}`}>
          GI {giStatus.gi.toFixed(2)} · {giStatus.label}
        </span>
      </div>

      {/* Chamber grid */}
      <div className="visitor-chamber-grid">
        {CHAMBERS.map(ch => (
          <div key={ch.publicName} className="visitor-chamber-card">
            <span className="visitor-ch-icon">{ch.icon}</span>
            <span className="visitor-ch-public">{ch.publicName}</span>
            <span className="visitor-ch-canon">{ch.canonName}</span>
          </div>
        ))}
      </div>

      <div className="visitor-btn-row">
        <button className="visitor-btn-primary" onClick={onContinue}>
          Choose your path →
        </button>
        <button className="visitor-btn-ghost" onClick={onSkip}>
          Skip to the shell
        </button>
      </div>
    </div>
  );
}
