import React, { useState } from 'react';
import { useTerminalData } from '../../hooks/useTerminalData';
import { terminalBridge } from '../../services/terminalBridge';

export const CivicAlertBanner: React.FC = () => {
  const { data } = useTerminalData(() => terminalBridge.integrityStatus(), 30_000);
  const [dismissed, setDismissed] = useState(false);

  if (!data || dismissed) return null;

  const gi = data.global_integrity ?? 1;
  const isCritical = data.mode === 'red' || (data.degraded === true && gi < 0.5);
  const isWarning = !isCritical && (data.degraded === true || gi < 0.7);

  if (!isCritical && !isWarning) return null;

  const title = isCritical
    ? `Global Integrity critical — GI ${gi.toFixed(3)}`
    : `Integrity degraded — GI ${gi.toFixed(3)}`;

  return (
    <div className={`flex items-center gap-3 px-4 py-2 text-xs font-mono ${
      isCritical
        ? 'bg-rose-600 text-white'
        : 'bg-amber-50 text-amber-800 border-b border-amber-200'
    }`}>
      <span className="shrink-0">{isCritical ? '🔴' : '⚠'}</span>
      <span className="flex-1 font-semibold">{title}</span>
      {data.terminal_status && (
        <span className="shrink-0 opacity-75 hidden sm:inline">{data.terminal_status}</span>
      )}
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity px-1"
        aria-label="Dismiss alert"
      >
        ✕
      </button>
    </div>
  );
};
