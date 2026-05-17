import { Sentinel, LabDefinition, TabId } from './types';
import { env } from './config/env';

// FIX-03: Full 8-sentinel roster with roles matching Terminal canon
export const SENTINELS: Sentinel[] = [
  { id: 'atlas',    name: 'ATLAS',    role: 'Architectural Review',  status: 'active',   integrity: 0.99 },
  { id: 'zeus',     name: 'ZEUS',     role: 'Verification Sweep',    status: 'active',   integrity: 0.97 },
  { id: 'eve',      name: 'EVE',      role: 'Global News Synthesis', status: 'active',   integrity: 0.99 },
  { id: 'jade',     name: 'JADE',     role: 'UX Validation',         status: 'thinking', integrity: 0.99 },
  { id: 'aurea',    name: 'AUREA',    role: 'Strategic Review',      status: 'idle',     integrity: 1.0  },
  { id: 'hermes',   name: 'HERMES',   role: 'Narrative Signals',     status: 'idle',     integrity: 0.95 },
  { id: 'echo',     name: 'ECHO',     role: 'Signal Amplification',  status: 'active',   integrity: 0.98 },
  { id: 'daedalus', name: 'DAEDALUS', role: 'Infrastructure Watch',  status: 'idle',     integrity: 0.96 },
];

export const LABS: LabDefinition[] = [
  {
    id: TabId.OAA,
    name: 'OAA Learning Hub',
    description: 'Multi-model AI tutoring across STEM subjects.',
    url: env.labs.oaa,
  },
  {
    id: TabId.REFLECTIONS,
    name: 'Reflections',
    description: 'AI-assisted journaling and E.O.M.M. cycles.',
    url: env.labs.reflections,
  },
  {
    id: TabId.SHIELD,
    name: 'Citizen Shield',
    description: 'Digital safety & civic resilience practice.',
    url: env.labs.citizenShield,
  },
  {
    id: TabId.HIVE,
    name: 'HIVE',
    description: 'Open world civilization simulator — quests, sentinels, MIC earn.',
    url: env.labs.hive,
    useDemo: true,
    comingSoon: false,
  },
  {
    id: TabId.WALLET,
    name: 'Fractal Wallet',
    description: 'Your MIC balance, shards, and integrity ledger.',
    useDemo: true,
  },
  // FIX-14: KnowledgeGraph registered — getLabById(TabId.KNOWLEDGE_GRAPH) now resolves
  {
    id: TabId.KNOWLEDGE_GRAPH,
    name: 'ATLAS Knowledge Graph',
    description: 'Temporal epistemic graph of your learning journey.',
    useDemo: true,
  },
];

export function getLabById(id: TabId): LabDefinition | undefined {
  return LABS.find(lab => lab.id === id);
}

export function getActiveLabs(): LabDefinition[] {
  return LABS.filter(lab => lab.url && !lab.comingSoon);
}

export function getComingSoonLabs(): LabDefinition[] {
  return LABS.filter(lab => lab.comingSoon);
}
