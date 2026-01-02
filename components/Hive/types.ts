// components/Hive/types.ts
// ============================================
// HIVE DnD Game Types
// Character sheets, dice outcomes, and game state
// ============================================

import type { ShardId } from "./shards";

/**
 * The Four Orders of the HIVE
 * Each represents a phase of growth + trust + social duty
 */
export type HiveOrder = "SCOUT" | "CITIZEN" | "AGENT" | "ELDER";

export const ORDER_DESCRIPTIONS: Record<HiveOrder, { name: string; description: string; color: string }> = {
  SCOUT: {
    name: "Scout",
    description: "Explorers of uncertainty. They test the edges so others do not break.",
    color: "text-emerald-600",
  },
  CITIZEN: {
    name: "Citizen",
    description: "The heart of the HIVE. They anchor legitimacy and hold leaders accountable.",
    color: "text-blue-600",
  },
  AGENT: {
    name: "Agent",
    description: "Crisis stabilizers who act where others hesitate. They do the necessary work.",
    color: "text-purple-600",
  },
  ELDER: {
    name: "Elder",
    description: "Custodians of consequence. They carry, not command. Leadership is a wound chosen.",
    color: "text-amber-600",
  },
};

/**
 * Shard values for a character
 */
export interface ShardValues {
  [key: string]: number;
}

/**
 * Calculate total shard points allocated
 */
export function calculateTotalShardPoints(shardValues: ShardValues): number {
  return Object.values(shardValues).reduce((sum: number, val: number) => sum + val, 0);
}

/**
 * A single entry in the civic memory ledger
 */
export interface CivicMemoryEntry {
  id: string;
  timestamp: string;
  type: "integrity" | "fracture" | "sacrifice" | "dissent" | "reflection";
  description: string;
  shardAffected?: ShardId;
}

/**
 * Complete HIVE Character Sheet
 */
export interface HiveCharacter {
  id: string;
  name: string;
  order: HiveOrder;
  shardValues: ShardValues;
  civicMemory: CivicMemoryEntry[];
  unresolvedTrial: string;
  micXp: number;
  createdAt: string;
  lastPlayedAt: string;
}

/**
 * Dice roll outcome bands
 * Dice don't decide success - they decide what kind of cost success requires
 */
export type OutcomeBand =
  | "COLLAPSE"
  | "FRACTURE"
  | "BURDEN"
  | "RECONCILE"
  | "ECHO_EVENT";

export interface OutcomeBandDefinition {
  id: OutcomeBand;
  name: string;
  range: string;
  description: string;
  color: string;
  bgColor: string;
}

export const OUTCOME_BANDS: OutcomeBandDefinition[] = [
  {
    id: "COLLAPSE",
    name: "Collapse",
    range: "3-5",
    description: "You fail — and others pay the price.",
    color: "text-red-700",
    bgColor: "bg-red-100",
  },
  {
    id: "FRACTURE",
    name: "Fracture",
    range: "6-8",
    description: "You succeed — but damage trust.",
    color: "text-orange-700",
    bgColor: "bg-orange-100",
  },
  {
    id: "BURDEN",
    name: "Burden",
    range: "9-11",
    description: "You succeed — and carry the cost yourself.",
    color: "text-amber-700",
    bgColor: "bg-amber-100",
  },
  {
    id: "RECONCILE",
    name: "Reconcile",
    range: "12-13",
    description: "You succeed — and heal something along the way.",
    color: "text-emerald-700",
    bgColor: "bg-emerald-100",
  },
  {
    id: "ECHO_EVENT",
    name: "Echo / Dawn Event",
    range: "14+",
    description: "This choice will ripple forward. The future will remember.",
    color: "text-indigo-700",
    bgColor: "bg-indigo-100",
  },
];

/**
 * Result of a dice roll
 */
export interface DiceOutcome {
  rawRoll: number;
  shardId: ShardId;
  shardBonus: number;
  total: number;
  band: OutcomeBand;
  title: string;
  narrative: string;
  intent?: string;
  timestamp: string;
}

/**
 * Game session log entry
 */
export interface GameLogEntry {
  id: string;
  type: "roll" | "choice" | "event" | "reflection";
  timestamp: string;
  data: DiceOutcome | string;
}

/**
 * Create a new character with default values
 */
export function createDefaultCharacter(name: string, order: HiveOrder): HiveCharacter {
  return {
    id: crypto.randomUUID(),
    name,
    order,
    shardValues: {
      ASH: 1,
      VEILS: 1,
      FROST: 1,
      SONG: 1,
      STONE: 1,
      ECHOES: 1,
      DAWN: 1,
    },
    civicMemory: [],
    unresolvedTrial: "",
    micXp: 0,
    createdAt: new Date().toISOString(),
    lastPlayedAt: new Date().toISOString(),
  };
}
