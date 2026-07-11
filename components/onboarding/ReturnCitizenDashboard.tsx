import React from 'react';
import { TabId } from '../../types';
import { useTerminal } from '../../contexts/TerminalContext';
import { useTerminalData } from '../../hooks/useTerminalData';
import { terminalBridge } from '../../services/terminalBridge';
import { GIGauge } from '../GIDisplay/GIGauge';
import { useAuth } from '../../contexts/AuthContext';

const LAB_TILES: { id: TabId; icon: string; label: string; desc: string }[] = [
  { id: TabId.OAA,            icon: '📚', label: 'OAA Library',     desc: 'Learn → Fractal Shards' },
  { id: TabId.HIVE,           icon: '🎮', label: 'HIVE Arcade',     desc: 'Governance JRPG'     },
  { id: TabId.REFLECTIONS,    icon: '🪞', label: 'Reflections',     desc: 'Journal & mood'      },
  { id: TabId.SHIELD,         icon: '🛡', label: 'Shield',          desc: 'Civic radar'         },
  { id: TabId.KNOWLEDGE_GRAPH,icon: '⬡', label: 'Atlas',           desc: 'Knowledge graph'     },
  { id: TabId.JADE,           icon: '🍵', label: 'JADE',            desc: 'Socratic UX'         },
  { id: TabId.WALLET,         icon: '◎', label: 'Wallet',           desc: 'MIC ledger'          },
  { id: TabId.VAULT,          icon: '🔐', label: 'Vault',           desc: 'Reserve seals'       },
];

interface Props {
  onSelectTab: (tab: TabId) => void;
}

export const ReturnCitizenDashboard: React.FC<Props> = ({ onSelectTab }) => {
  const { state: terminal } = useTerminal();
  const { citizen } = useAuth();
  const handle = citizen?.handle ?? 'Citizen';

  const { data: integrity } = useTerminalData(
    () => terminalBridge.integrityStatus(),
    30_000,
  );
  const { data: epicon } = useTerminalData(
    () => terminalBridge.epiconFeed(5),
    60_000,
  );

  const gi = integrity?.global_integrity ?? terminal?.gi ?? null;
  const cycle = terminal?.cycle ?? '—';

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-stone-50 p-4 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-stone-900">
            Welcome back, {handle}
          </h1>
          <p className="text-xs text-stone-400 font-mono">{cycle} · Mobius Browser Shell</p>
        </div>
        <button
          onClick={() => onSelectTab(TabId.OAA)}
          className="text-xs font-mono px-3 py-1.5 rounded-md border border-stone-300 text-stone-600 hover:bg-stone-100 transition-colors"
        >
          Enter school →
        </button>
      </div>

      {/* GI + Recent intents */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-stone-200 p-4 flex flex-col items-center gap-2">
          <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">Global Integrity</p>
          <GIGauge score={gi} size="full" />
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-4 flex flex-col gap-2">
          <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest mb-1">Recent Intents</p>
          {!epicon && (
            <p className="text-xs text-stone-400 font-mono text-center py-4">Loading…</p>
          )}
          {(epicon ?? []).slice(0, 5).map(e => (
            <div key={e.id} className="flex items-start gap-2">
              <span className={`text-[9px] font-mono shrink-0 mt-0.5 px-1 rounded ${
                e.status === 'executed' ? 'text-emerald-600 bg-emerald-50' :
                e.status === 'pending'  ? 'text-amber-600 bg-amber-50' :
                'text-stone-500 bg-stone-50'
              }`}>{e.status}</span>
              <p className="text-[11px] text-stone-600 leading-snug line-clamp-1">{e.intent ?? e.action ?? '—'}</p>
            </div>
          ))}
          {epicon && (
            <button
              onClick={() => onSelectTab(TabId.EPICON)}
              className="text-[10px] font-mono text-stone-400 hover:text-stone-600 transition-colors mt-auto pt-1 text-left"
            >
              View full feed →
            </button>
          )}
        </div>
      </div>

      {/* Lab launcher */}
      <div>
        <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest mb-2">Chambers</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {LAB_TILES.map(tile => (
            <button
              key={tile.id}
              onClick={() => onSelectTab(tile.id)}
              className="bg-white rounded-lg border border-stone-200 px-3 py-3 text-left hover:border-stone-400 hover:shadow-sm transition-all group"
            >
              <span className="text-xl">{tile.icon}</span>
              <p className="text-xs font-semibold text-stone-800 mt-1 group-hover:text-stone-900">{tile.label}</p>
              <p className="text-[10px] text-stone-400">{tile.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
