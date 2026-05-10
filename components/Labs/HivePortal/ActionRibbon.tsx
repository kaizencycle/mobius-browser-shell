import React, { useState } from 'react';
import type { HiveActionId, HivePlayableSave } from '../../../src/lib/hive-action-types';
import { HIVE_LOCAL_STORAGE_KEY, HIVE_SAVE_VERSION } from '../../../src/lib/hive-action-types';
import type { HiveCycleData } from '../../../hooks/useHiveWorld';

interface Props {
  cycle: HiveCycleData;
  onActionComplete: () => void;
}

interface ActionDef {
  id: HiveActionId;
  label: string;
  description: string;
}

const ACTIONS: ActionDef[] = [
  { id: 'inspect_beacon', label: 'Inspect Beacon', description: 'Scan the signal relay' },
  { id: 'view_fallback_path', label: 'View Fallback', description: 'Check alternate routes' },
  { id: 'acknowledge_sentinel', label: 'Acknowledge', description: 'Confirm sentinel status' },
];

function loadSave(cycleId: string, questId: string | null): HivePlayableSave {
  try {
    const raw = localStorage.getItem(HIVE_LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as HivePlayableSave;
      if (parsed.version === 1) return parsed;
    }
  } catch {
    // fall through to default
  }
  const seed: HivePlayableSave = {
    version: HIVE_SAVE_VERSION,
    seed_cycle_id: cycleId,
    active_event_id: null,
    quest: { id: questId ?? 'unknown', title: '' },
    interaction_log: { cycle: cycleId, events: [] },
  };
  saveToDisk(seed);
  return seed;
}

function saveToDisk(save: HivePlayableSave): void {
  try {
    localStorage.setItem(HIVE_LOCAL_STORAGE_KEY, JSON.stringify(save));
  } catch {
    // quota / private mode
  }
}

export const ActionRibbon: React.FC<Props> = ({ cycle, onActionComplete }) => {
  const [busy, setBusy] = useState<HiveActionId | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const dispatch = async (action: HiveActionId) => {
    const save = loadSave(cycle.cycle_id, cycle.active_quest_id);
    setBusy(action);
    try {
      const res = await fetch('/api/hive/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, cycle: cycle.cycle_id, actor: 'player', save }),
      });
      const data = (await res.json()) as { ok?: boolean; save?: HivePlayableSave; dialogue?: string; error?: string };
      if (data.ok && data.save) {
        saveToDisk(data.save);
        setToast(data.dialogue ?? 'Action registered.');
        onActionComplete();
      } else {
        setToast(data.error ?? 'Action failed.');
      }
    } catch {
      setToast('Cannot reach action endpoint.');
    } finally {
      setBusy(null);
      setTimeout(() => setToast(null), 4000);
    }
  };

  return (
    <div className="flex-shrink-0 border-t border-stone-700 bg-stone-900 px-3 py-2 space-y-2">
      {toast && (
        <div className="text-[10px] font-mono text-amber-300 bg-amber-900/20 border border-amber-700/40 rounded px-2 py-1 text-center">
          {toast}
        </div>
      )}
      <div className="flex gap-2">
        {ACTIONS.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => void dispatch(a.id)}
            disabled={busy !== null}
            title={a.description}
            className={`flex-1 text-[10px] font-mono px-2 py-1.5 rounded border transition-colors ${
              busy === a.id
                ? 'border-amber-600 bg-amber-900/30 text-amber-300 cursor-wait'
                : busy !== null
                ? 'border-stone-700 text-stone-600 cursor-not-allowed'
                : 'border-stone-600 text-stone-400 hover:border-stone-400 hover:text-stone-200'
            }`}
          >
            {busy === a.id ? '…' : a.label}
          </button>
        ))}
      </div>
    </div>
  );
};
