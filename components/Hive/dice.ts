// components/Hive/dice.ts
// ============================================
// HIVE Dice-Ethics System
// Rolls don't decide if you win — they decide what kind of cost your choice carries
// ============================================

import type { ShardId } from "./shards";
import type { OutcomeBand, DiceOutcome } from "./types";

/**
 * Roll a d12 (1-12)
 * In the future, this could be server-side with cryptographic seeding
 */
export function rollD12(): number {
  return Math.floor(Math.random() * 12) + 1;
}

/**
 * Determine the outcome band based on total roll
 * 
 * Outcome Bands (Moral Resolution Table):
 * - 3-5:   COLLAPSE   - You fail — and others pay
 * - 6-8:   FRACTURE   - You succeed — but damage trust
 * - 9-11:  BURDEN     - You succeed — and carry the cost
 * - 12-13: RECONCILE  - You succeed — and heal something
 * - 14+:   ECHO_EVENT - You change the future trajectory
 */
export function bandForTotal(total: number): OutcomeBand {
  if (total <= 5) return "COLLAPSE";
  if (total <= 8) return "FRACTURE";
  if (total <= 11) return "BURDEN";
  if (total <= 13) return "RECONCILE";
  return "ECHO_EVENT";
}

/**
 * Get display title for outcome band
 */
export function outcomeTitle(band: OutcomeBand): string {
  switch (band) {
    case "COLLAPSE":
      return "Collapse";
    case "FRACTURE":
      return "Fracture";
    case "BURDEN":
      return "Burden";
    case "RECONCILE":
      return "Reconcile";
    case "ECHO_EVENT":
      return "Echo / Dawn Event";
  }
}

/**
 * Generate narrative text for outcome
 * The narrative reflects HIVE philosophy: consequences shape character
 */
export function outcomeNarrative(band: OutcomeBand, shard: ShardId): string {
  switch (band) {
    case "COLLAPSE":
      return `You fail in the moment — and others pay the price. The ${shard} shard records a wound you cannot ignore. This failure will echo in your civic memory.`;
    case "FRACTURE":
      return `You succeed, but trust is damaged. The ${shard} shard echoes with hairline cracks in your integrity. The victory feels hollow.`;
    case "BURDEN":
      return `You succeed and carry the cost yourself. The ${shard} shard deepens: heavier, but more honest. This is the weight of responsibility.`;
    case "RECONCILE":
      return `You succeed and heal something along the way. The ${shard} shard settles into a more stable form. Something broken is now whole.`;
    case "ECHO_EVENT":
      return `This choice will ripple forward. The ${shard} shard triggers an Echo / Dawn event — the future will remember this moment. History shifts.`;
  }
}

/**
 * Calculate MIC XP delta based on outcome
 * Positive outcomes earn XP, failures cost integrity
 */
export function calculateMicDelta(band: OutcomeBand): number {
  switch (band) {
    case "COLLAPSE":
      return -10; // Failure costs integrity
    case "FRACTURE":
      return 0; // Success at a cost - neutral
    case "BURDEN":
      return 5; // Earned through sacrifice
    case "RECONCILE":
      return 10; // Healing earns trust
    case "ECHO_EVENT":
      return 15; // Legendary moments
  }
}

/**
 * Perform a full dice roll with shard modifier
 * 
 * @param shard - The shard being invoked for this action
 * @param shardValue - The character's value in that shard (0-5)
 * @param intent - Optional description of what the character is trying to do
 */
export function rollWithShard(
  shard: ShardId,
  shardValue: number,
  intent?: string
): DiceOutcome {
  const rawRoll = rollD12();
  const total = rawRoll + shardValue;
  const band = bandForTotal(total);

  return {
    rawRoll,
    shardId: shard,
    shardBonus: shardValue,
    total,
    band,
    title: outcomeTitle(band),
    narrative: outcomeNarrative(band, shard),
    intent,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get the CSS classes for an outcome band
 */
export function getOutcomeStyles(band: OutcomeBand): { text: string; bg: string; border: string } {
  switch (band) {
    case "COLLAPSE":
      return { text: "text-red-700", bg: "bg-red-50", border: "border-red-200" };
    case "FRACTURE":
      return { text: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" };
    case "BURDEN":
      return { text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" };
    case "RECONCILE":
      return { text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" };
    case "ECHO_EVENT":
      return { text: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200" };
  }
}

/**
 * Generate a simple dice animation sequence
 * Returns an array of "rolling" values before settling on final
 */
export function generateDiceAnimation(finalValue: number, frames: number = 8): number[] {
  const values: number[] = [];
  for (let i = 0; i < frames; i++) {
    values.push(Math.floor(Math.random() * 12) + 1);
  }
  values.push(finalValue);
  return values;
}
