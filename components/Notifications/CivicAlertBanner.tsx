import React, { useState } from 'react';
import { useTerminalData } from '../../hooks/useTerminalData';
import { terminalBridge } from '../../services/terminalBridge';

export const CivicAlertBanner: React.FC = () => {
  const { data } = useTerminalData(() => terminalBridge.integrityStatus(), 30_000);
  const [dismissed, setDismissed] = useState<string | null>(null);

  const alert = data?.alert;
  if (!alert || alert.id === dismissed) return null;
  if ((data?.gi ?? 1) >= 0.7) return null;

  const isCritical = alert.severity === 'critical';

  return (
    <div className={`flex items-center gap-3 px-4 py-2 text-xs font-mono ${
      isCritical
        ? 'bg-rose-600 text-white'
        : 'bg-amber-50 text-amber-800 border-b border-amber-200'
    }`}>
      <span className="shrink-0">{isCritical ? '🔴' : '⚠'}</span>
      <span className="flex-1 font-semibold">{alert.title}</span>
      {data?.gi != null && (
        <span className="shrink-0 opacity-75">GI {data.gi.toFixed(3)}</span>
      )}
      <button
        onClick={() => setDismissed(alert.id)}
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity px-1"
        aria-label="Dismiss alert"
      >
        ✕
      </button>
    </div>
  );
};
