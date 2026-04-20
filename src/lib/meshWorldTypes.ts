/**
 * Types for HIVE world artifacts (mesh → world → shell).
 * Aligned with mobius-hive /world/*.json layout.
 */

export type MobiusHiveWorldVersion = 'mobius-hive-world.v1';

export interface HiveCurrentCycle {
  version: MobiusHiveWorldVersion;
  cycle: {
    id: string;
    label?: string;
    mesh_freshness_sla_seconds?: number;
  };
  active_event_id: string | null;
  active_quest_id: string | null;
  assigned_sentinel_id: string | null;
  vault?: {
    label?: string;
    progress?: number;
  };
  integrity?: {
    gi?: number;
    mic_readiness?: string;
  };
  kv_status?: string;
  source?: string;
  updated_at?: string;
}

export interface HiveEvent {
  id: string;
  title: string;
  summary?: string;
  sentinel_id?: string;
}

export interface HiveQuest {
  id: string;
  title: string;
  objective?: string;
  sentinel_id?: string;
  event_id?: string;
}

export interface HiveSentinel {
  id: string;
  name: string;
  role?: string;
  lines?: string[];
}
