import React from 'react';
import { TabId } from '../../types';
import { chamberByTab } from '../../src/lib/chambers';
import { useLocalChamberTime } from '../../hooks/useLocalChamberTime';
import { useTerminal } from '../../contexts/TerminalContext';
import { useAtlasWakeGuard } from '../../hooks/useAtlasWakeGuard';
import { giTextColor } from '../../utils/gi';

const learn = chamberByTab(TabId.OAA)!;

const STATUS_CONFIG = {
  checking: { label: 'Connecting…', cls: 'text-stone-400' },
  online:   { label: 'Online',      cls: 'text-emerald-400' },
  cold:     { label: 'Cold start',  cls: 'text-amber-400' },
  error:    { label: 'Offline',     cls: 'text-rose-400' },
} as const;

export const AtlasChamberHeader: React.FC = () => {
  const { dateLine, timeLine, timeZone, iso } = useLocalChamberTime();
  const { state: terminalState } = useTerminal();
  const wakeStatus = useAtlasWakeGuard();

  const giLabelText = terminalState ? `GI ${terminalState.gi.toFixed(2)}` : 'GI —';
  const giCls = giTextColor(terminalState?.mode, terminalState?.stale);
  const { label: statusLabel, cls: statusCls } = STATUS_CONFIG[wakeStatus];

  return (
    <div className="learn-chamber-bar">
      <div className="learn-chamber-bar__left">
        <span className="learn-chamber-bar__room">
          ROOM {learn.room} · {learn.publicName}
        </span>
        <span className="learn-chamber-bar__canon">{learn.canonName}</span>
      </div>
      <div className="learn-chamber-bar__right">
        <time className="learn-chamber-bar__clock" dateTime={iso} aria-live="polite">
          {dateLine} · {timeLine} {timeZone}
        </time>
        <span className={`learn-chamber-bar__status ${statusCls}`}>{statusLabel}</span>
        <span className={`learn-chamber-bar__gi ${giCls}`}>{giLabelText}</span>
      </div>
    </div>
  );
};
