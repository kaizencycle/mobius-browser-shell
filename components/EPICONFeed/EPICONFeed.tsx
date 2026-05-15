import './EPICONFeed.css';

import { terminalBridge } from '../../services/terminalBridge';
import { useTerminalData } from '../../hooks/useTerminalData';

export function EPICONFeed() {
  const { data, loading } = useTerminalData(
    () => terminalBridge.epiconFeed(8),
    60_000,
  );

  const entries = Array.isArray(data) ? data : [];

  return (
    <section className="epicon-feed">
      <div className="epicon-feed__header">
        <h2>EPICON Intent Record</h2>
        <span>{loading ? 'syncing…' : `${entries.length} intents`}</span>
      </div>

      <p className="epicon-feed__copy">
        Every civic action in Mobius is declared before execution.
      </p>

      <div className="epicon-feed__entries">
        {entries.map((entry, index) => (
          <article key={entry.id ?? `${entry.intent}-${index}`} className="epicon-entry">
            <div className="epicon-entry__top">
              <span className="epicon-entry__intent">
                {entry.intent ?? 'unknown-intent'}
              </span>
              <span className={`epicon-entry__status status-${entry.status ?? 'unknown'}`}>
                {entry.status ?? 'pending'}
              </span>
            </div>

            <div className="epicon-entry__meta">
              <span>{entry.cycle ?? 'C-???'}</span>
              <span>{entry.agent ?? 'system'}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
