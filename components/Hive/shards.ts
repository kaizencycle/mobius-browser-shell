// components/Hive/shards.ts
// ============================================
// HIVE Fractal Shard System
// The Seven Shards of Civilization
// ============================================

export type ShardId =
  | "ASH"
  | "VEILS"
  | "FROST"
  | "SONG"
  | "STONE"
  | "ECHOES"
  | "DAWN";

export interface ShardDefinition {
  id: ShardId;
  name: string;
  tagline: string;
  domain: string;
  strength: string;
  flaw: string;
  dilemma: string;
  gift: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

/**
 * The Seven Fractal Shards
 * 
 * Each shard reflects a dimension of moral responsibility.
 * Players are not defined by power stats, but by moral tensions they carry.
 * 
 * Values: 0 = Dormant, 1 = Emerging, 2 = Tempered, 3 = Burdened, 4 = Fractured, 5 = Legendary
 */
export const HIVE_SHARDS: ShardDefinition[] = [
  {
    id: "ASH",
    name: "ASH",
    tagline: "Shard of Endings",
    domain: "Loss, hard choices, irreversibility",
    strength: "Accepts necessary sacrifice",
    flaw: "Grows numb to harm",
    dilemma: "Save one life now or many lives later",
    gift: "Can grieve without collapsing",
    color: "text-slate-600",
    bgColor: "bg-slate-100",
    borderColor: "border-slate-300",
  },
  {
    id: "VEILS",
    name: "VEILS",
    tagline: "Shard of Restraint",
    domain: "Secrets, ethics, forbidden knowledge",
    strength: "Protects others from truths they are not ready for",
    flaw: "Withholds out of control or fear",
    dilemma: "Reveal danger now or contain panic",
    gift: "Can bear what others should not",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    borderColor: "border-purple-300",
  },
  {
    id: "FROST",
    name: "FROST",
    tagline: "Shard of Stability",
    domain: "Infrastructure, logistics, survival",
    strength: "Preserves systems during chaos",
    flaw: "Resists change even when necessary",
    dilemma: "Preserve order or allow needed collapse",
    gift: "Keeps people alive in long winters",
    color: "text-cyan-600",
    bgColor: "bg-cyan-100",
    borderColor: "border-cyan-300",
  },
  {
    id: "SONG",
    name: "SONG",
    tagline: "Shard of Culture",
    domain: "Identity, story, meaning",
    strength: "Gives people a reason to endure",
    flaw: "Mythologizes failure into righteousness",
    dilemma: "Tell a hard truth or keep a people whole",
    gift: "Binds strangers into belonging",
    color: "text-rose-600",
    bgColor: "bg-rose-100",
    borderColor: "border-rose-300",
  },
  {
    id: "STONE",
    name: "STONE",
    tagline: "Shard of Foundation",
    domain: "Law, boundary, justice",
    strength: "Defines consequence with compassion",
    flaw: "Calcifies into dogma",
    dilemma: "Punish wrongdoing or heal the cause",
    gift: "Can say 'no' even when it hurts",
    color: "text-amber-700",
    bgColor: "bg-amber-100",
    borderColor: "border-amber-300",
  },
  {
    id: "ECHOES",
    name: "ECHOES",
    tagline: "Shard of Reflection",
    domain: "Dissent, truth, witness",
    strength: "Protects uncomfortable reality",
    flaw: "Becomes corrosive or cynical",
    dilemma: "Expose truth that may destroy unity",
    gift: "Keeps memory honest when stories drift",
    color: "text-indigo-600",
    bgColor: "bg-indigo-100",
    borderColor: "border-indigo-300",
  },
  {
    id: "DAWN",
    name: "DAWN",
    tagline: "Shard of Becoming",
    domain: "Change, future, emergence",
    strength: "Sees possibility where others see doom",
    flaw: "Sacrifices present lives for future gains",
    dilemma: "Push forward or protect what already exists",
    gift: "Invites worlds that do not yet exist",
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    borderColor: "border-orange-300",
  },
];

export const SHARD_VALUE_MIN = 0;
export const SHARD_VALUE_MAX = 5;

export const SHARD_VALUE_LABELS: Record<number, string> = {
  0: "Dormant",
  1: "Emerging",
  2: "Tempered",
  3: "Burdened",
  4: "Fractured",
  5: "Legendary",
};

export function isValidShardValue(v: number): boolean {
  return Number.isInteger(v) && v >= SHARD_VALUE_MIN && v <= SHARD_VALUE_MAX;
}

export function getShardById(id: ShardId): ShardDefinition | undefined {
  return HIVE_SHARDS.find((s) => s.id === id);
}
