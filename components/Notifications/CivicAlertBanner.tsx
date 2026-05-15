import './CivicAlertBanner.css';

import { useMemo, useState } from 'react';
import { terminalBridge } from '../../services/terminalBridge';
import { useTerminalData } from '../../hooks/useTerminalData';

function buildAlertId(gi: number | null, title: string): string {
  return `${title}:${gi ?? 'unknown'}`;
}

export function CivicAlertBanner() {
  const { data } = useTerminalData(
    () => terminalBridge.integrityStatus(),
    30_000,
  );
  const [dismissedId, setDismissedId] = useState<string | null>(null);

  const gi = typeof data?.gi === 'number' ? data.gi : null;
  const alertTitle = data?.alert?.title ?? (gi != null && gi < 0.7 ? 'Mobius integrity caution state' : null);

  const alert = useMemo(() => {
    if (gi == null || gi >= 0.7 || !alertTitle) return null;

    const severity = data?.alert?.severity ?? (gi < 0.4 ? 'critical' : 'warning');
    const id = data?.alert?.id ?? buildAlertId(gi, alertTitle);

    return {
      id,
      title: alertTitle,
      severity,
      gi,
    };
  }, [data?.alert?.id, data?.alert?.severity, alertTitle, gi]);

  if (!alert || dismissedId === alert.id) {
    return null;
  }

  return (
    <div className={`civic-alert civic-alert--${alert.severity}`} role="status">
      <div className="civic-alert__content">
        <span className="civic-alert__icon">⚠</span>
        <span className="civic-alert__title">{alert.title}</span>
        <span className="civic-alert__gi">GI {alert.gi.toFixed(3)}</span>
      </div>

      <button
        type="button"
        className="civic-alert__dismiss"
        onClick={() => setDismissedId(alert.id)}
        aria-label="Dismiss civic alert"
      >
        ×
      </button>
    </div>
  );
}
