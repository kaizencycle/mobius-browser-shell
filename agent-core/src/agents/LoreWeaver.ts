/**
 * PR-009 · LoreWeaver
 * Procedural quest chain and mythology generation for the HIVE world.
 * Ensures lore consistency score > 0.85 before publishing.
 */
import { OAAClient } from '../oaa/OAAClient';
import { ThoughtBroker } from '../substrate/ThoughtBroker';
import { MICIndexer } from '../substrate/MICIndexer';

export type QuestType = 'rescue' | 'delivery' | 'investigation' | 'ritual' | 'governance' | 'siege';

export interface QuestObjective {
  id: string;
  description: string;
  zone: string;
  npcId?: string;
  micReward: number;
}

export interface QuestChain {
  id: string;
  title: string;
  type: QuestType;
  lore: string;
  objectives: QuestObjective[];
  consistencyScore: number; // 0–1
  generatedAt: number;
  active: boolean;
}

export interface MythologyEntry {
  id: string;
  epoch: string;
  event: string;
  factions: string[];
  consequences: string;
  timestamp: number;
}

const QUEST_TEMPLATES: Record<QuestType, { lore: string; objectiveCount: number }> = {
  rescue:       { lore: 'A sentinel is lost in the signal fog.', objectiveCount: 2 },
  delivery:     { lore: 'The archive must receive critical ledger fragments.', objectiveCount: 3 },
  investigation:{ lore: 'An anomaly was detected in the Verification Tower.', objectiveCount: 4 },
  ritual:       { lore: 'The Citadel gates require re-attestation this cycle.', objectiveCount: 2 },
  governance:   { lore: 'A contested proposal divides the Citadel keep.', objectiveCount: 3 },
  siege:        { lore: 'The signal-fog barrier grows — defend the obelisk.', objectiveCount: 5 },
};

const ZONES = ['Citadel', 'Signal Obelisk', 'The Archive', 'Verification Tower', 'Echo Chamber', 'Learning Grove', 'Gateway'];

export class LoreWeaver {
  private readonly oaa: OAAClient;
  private readonly broker: ThoughtBroker;
  private readonly mic: MICIndexer;
  private readonly agentId: string;
  private questCounter = 0;
  private mythCounter = 0;

  constructor(agentId: string, deps: { oaa: OAAClient; broker: ThoughtBroker; mic: MICIndexer }) {
    this.agentId = agentId;
    this.oaa = deps.oaa;
    this.broker = deps.broker;
    this.mic = deps.mic;
  }

  async generateQuestChain(type: QuestType): Promise<QuestChain | null> {
    const template = QUEST_TEMPLATES[type];
    const objectives: QuestObjective[] = Array.from({ length: template.objectiveCount }, (_, i) => ({
      id: `obj-${this.questCounter}-${i}`,
      description: `Complete step ${i + 1} of the ${type} chain`,
      zone: ZONES[i % ZONES.length]!,
      micReward: 1 + i * 0.5,
    }));

    const consistencyScore = this.computeConsistency(type, objectives);
    if (consistencyScore < 0.85) {
      // Re-roll objectives once
      objectives.forEach((obj, i) => { obj.zone = ZONES[(i + 2) % ZONES.length]!; });
      const retry = this.computeConsistency(type, objectives);
      if (retry < 0.85) return null; // refuse to publish inconsistent lore
    }

    const chain: QuestChain = {
      id: `quest-${++this.questCounter}`,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)}: ${template.lore.split('.')[0]}`,
      type,
      lore: template.lore,
      objectives,
      consistencyScore,
      generatedAt: Date.now(),
      active: true,
    };

    await this.oaa.append('lore:quests', chain);
    await this.broker.publish('lore.quest.generated', this.agentId, { questId: chain.id, type });
    await this.mic.record({ type: 'earn', agentId: this.agentId, amount: 1.0, reason: 'quest_generation' });

    return chain;
  }

  async generateMythologyEntry(epoch: string): Promise<MythologyEntry> {
    const factions = ['Citadel Guard', 'Signal Obelisk Keepers', 'Archive Scholars', 'Echo Resonants'];
    const entry: MythologyEntry = {
      id: `myth-${++this.mythCounter}`,
      epoch,
      event: `The ${epoch} saw a convergence of sentinel energies that reshaped the world topology.`,
      factions: factions.slice(0, 2 + Math.floor(Math.random() * 2)),
      consequences: 'A new zone was born from the confluence, and the GI index shifted measurably.',
      timestamp: Date.now(),
    };

    await this.oaa.append('lore:mythology', entry);
    await this.broker.publish('lore.mythology.written', this.agentId, { mythId: entry.id, epoch });

    return entry;
  }

  private computeConsistency(type: QuestType, objectives: QuestObjective[]): number {
    // Heuristic: penalise if objectives span too many zones or have mismatched types
    const zones = new Set(objectives.map(o => o.zone));
    const zoneScore = zones.size <= 3 ? 1.0 : Math.max(0, 1 - (zones.size - 3) * 0.1);
    const typeBonus = type === 'governance' || type === 'ritual' ? 0.05 : 0;
    return Math.min(1, 0.8 + typeBonus + zoneScore * 0.15);
  }

  async getActiveQuests(): Promise<QuestChain[]> {
    const raw = await this.oaa.get('lore:quests');
    if (!raw) return [];
    return (JSON.parse(raw) as QuestChain[]).filter(q => q.active);
  }
}
