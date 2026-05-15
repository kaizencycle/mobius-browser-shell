import './SentinelRoster.css';

import { terminalBridge } from '../../services/terminalBridge';
import { useTerminalData } from '../../hooks/useTerminalData';
import type { SentinelEntry } from '../../services/terminalBridge';

const SENTINEL_DEFS = [
  { id: 'ATLAS', role: 'Architectural Review' },
  { id: 'ZEUS', role: 'Verification Sweep' },
  { id: 'EVE', role: 'Global News Synthesis' },
  { id: 'JADE', role: 'UX Validation' },
  { id: 'AUREA', role: 'Strategic Review' },
  { id: 'HERMES', role: 'Narrative Signals' },
  { id: 'ECHO', role: 'Signal Amplification' },
  { id: 'DAEDALUS', role: 'Infrastructure Watch' },
];

export function SentinelRoster() {
  const { data, loading } = useTerminalData(
    () => terminalBridge.integrityStatus(),
    60_000,
  );

  const liveAgents = data?.sentinels ?? data?.agents ?? [];

  return (
    <section className="sentinel-roster">
      <div className="sentinel-roster__header">
        <h2>Sentinel Constellation</h2>
        <span>{loading ? 'syncing…' : `${liveAgents.length || 8} agents`}</span>
      </div>

      <div className="sentinel-roster__grid">
        {SENTINEL_DEFS.map((sentinel) => {
          const live = liveAgents.find((entry: SentinelEntry) => {
            const candidate = String(entry?.id ?? entry?.name ?? '').toUpperCase();
            return candidate === sentinel.id;
          });

          const active = Boolean(live?.active ?? live?.heartbeatOk);
          const confidence = Number(live?.confidence ?? live?.score ?? 0);

          return (
            <article
              key={sentinel.id}
              className={`sentinel-card ${active ? 'is-active' : 'is-dormant'}`}
            >
              <div className="sentinel-card__top">
                <span className="sentinel-card__dot" />
                <span className="sentinel-card__name">{sentinel.id}</span>
              </div>

              <div className="sentinel-card__role">{sentinel.role}</div>

              <div className="sentinel-card__meta">
                <span>{active ? 'live' : 'offline'}</span>
                <span>{confidence ? confidence.toFixed(3) : '—'}</span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
