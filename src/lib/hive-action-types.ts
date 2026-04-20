/**
 * Client-local HIVE playable state (C-289). Persisted in localStorage;
 * canonical world JSON from mesh remains the seed.
 */

import type { HiveQuest, HiveQuestStep } from './meshWorldTypes';

export type HiveActionId = 'inspect_beacon' | 'view_fallback_path' | 'acknowledge_sentinel';

export interface HiveQuestState extends HiveQuest {
  status?: 'active' | 'completed';
  progress?: number;
  steps?: HiveQuestStep[];
}

export interface HiveInteractionEvent {
  id: string;
  at: string;
  action: HiveActionId;
  cycle: string;
  actor: string;
}

export interface HiveInteractionLog {
  cycle: string;
  events: HiveInteractionEvent[];
}

export const HIVE_SAVE_VERSION = 1 as const;
export const HIVE_LOCAL_STORAGE_KEY = 'mobius-hive-playable-save-v1';

export interface HivePlayableSave {
  version: typeof HIVE_SAVE_VERSION;
  /** Cycle id this save was started under (from world JSON). */
  seed_cycle_id: string;
  quest: HiveQuestState;
  /** When set, hides the active-event banner (player acknowledged). */
  dialogue_acknowledged?: boolean;
  /** Overlay: null means use mesh bundle event. */
  active_event_id: string | null;
  /** Optional KV display override after player stabilizes path. */
  kv_status?: string;
  interaction_log: HiveInteractionLog;
}
