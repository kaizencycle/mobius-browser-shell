import { TabId } from '../../types';
import type { TerminalAgent, TerminalState } from './terminal-bridge';

export type MeshHeartbeatState = 'live' | 'warm' | 'stale' | 'offline';

export interface MeshFacultyPersona {
  id: string;
  displayName: string;
  title: string;
  district: string;
  chamber?: TabId;
  color: string;
  description: string;
}

export interface MeshFacultyProjection {
  id: string;
  persona: MeshFacultyPersona;
  heartbeat: MeshHeartbeatState;
  freshnessSeconds: number | null;
  active: boolean;
  terminalStatus: string;
  detail: string;
  source: 'terminal' | 'fallback';
}

export const MESH_PERSONAS: Record<string, MeshFacultyPersona> = {
  ATLAS: {
    id: 'ATLAS',
    displayName: 'ATLAS',
    title: 'Architect Sentinel',
    district: 'Observatory Bastion',
    chamber: TabId.KNOWLEDGE_GRAPH,
    color: '#60a5fa',
    description: 'Topology, structure, route integrity, and architectural continuity.',
  },
  ZEUS: {
    id: 'ZEUS',
    displayName: 'ZEUS',
    title: 'Constitutional Verifier',
    district: 'Citadel of Law',
    chamber: TabId.WALLET,
    color: '#a78bfa',
    description: 'Verification, invariant enforcement, and constitutional checks.',
  },
  JADE: {
    id: 'JADE',
    displayName: 'JADE',
    title: 'Continuity Keeper',
    district: 'Archive Tea House',
    chamber: TabId.JADE,
    color: '#34d399',
    description: 'Semantic continuity, memory, onboarding, and canon preservation.',
  },
  EVE: {
    id: 'EVE',
    displayName: 'EVE',
    title: 'Governance Sentinel',
    district: 'Forum of Echoes',
    chamber: TabId.REFLECTIONS,
    color: '#fb7185',
    description: 'Governance, ethics, consent, and operator sovereignty.',
  },
  HERMES: {
    id: 'HERMES',
    displayName: 'HERMES',
    title: 'Routing Steward',
    district: 'Gate Network',
    chamber: TabId.HALLWAY,
    color: '#f59e0b',
    description: 'Routing, orchestration, workflow coordination, and civic metabolism.',
  },
  AUREA: {
    id: 'AUREA',
    displayName: 'AUREA',
    title: 'Synthesis Overseer',
    district: 'Golden Observatory',
    chamber: TabId.HIVE,
    color: '#facc15',
    description: 'Optimization, synthesis, strategic cohesion, and long-horizon guidance.',
  },
  ECHO: {
    id: 'ECHO',
    displayName: 'ECHO',
    title: 'Signal Sentinel',
    district: 'Signal Towers',
    chamber: TabId.SHIELD,
    color: '#f472b6',
    description: 'Threat ingestion, pulse resonance, anomaly awareness, and reflections.',
  },
};

const DEFAULT_ORDER = ['ATLAS', 'ZEUS', 'EVE', 'JADE', 'AUREA', 'HERMES', 'ECHO'];

export function classifyHeartbeatFreshness(ageSeconds?: number | null): MeshHeartbeatState {
  if (ageSeconds == null || Number.isNaN(ageSeconds)) return 'offline';
  if (ageSeconds <= 90) return 'live';
  if (ageSeconds <= 300) return 'warm';
  if (ageSeconds <= 900) return 'stale';
  return 'offline';
}

function secondsSinceIso(value: string | null | undefined): number | null {
  if (!value) return null;
  const ts = new Date(value).getTime();
  if (!Number.isFinite(ts)) return null;
  return Math.max(0, Math.floor((Date.now() - ts) / 1000));
}

function normalizeAgentId(agent: TerminalAgent): string {
  const raw = agent.id || agent.name || '';
  const upper = raw.toUpperCase();
  for (const id of DEFAULT_ORDER) {
    if (upper.includes(id)) return id;
  }
  return upper || 'UNKNOWN';
}

export function buildMeshFacultyProjection(input: {
  id: string;
  freshnessSeconds?: number | null;
  active?: boolean;
  terminalStatus?: string;
  detail?: string;
  source?: 'terminal' | 'fallback';
}): MeshFacultyProjection {
  const persona = MESH_PERSONAS[input.id] ?? {
    id: input.id,
    displayName: input.id,
    title: 'Unknown Sentinel',
    district: 'Unmapped District',
    color: '#94a3b8',
    description: 'Unmapped mesh faculty projection.',
  };

  return {
    id: input.id,
    persona,
    heartbeat: classifyHeartbeatFreshness(input.freshnessSeconds),
    freshnessSeconds: input.freshnessSeconds ?? null,
    active: Boolean(input.active),
    terminalStatus: input.terminalStatus ?? 'unknown',
    detail: input.detail ?? persona.description,
    source: input.source ?? 'fallback',
  };
}

export function projectTerminalFaculty(state: TerminalState | null): MeshFacultyProjection[] {
  const runtimeAge = secondsSinceIso(state?.heartbeat.runtime);
  const terminalAgents = new Map<string, TerminalAgent>();

  for (const agent of state?.agents ?? []) {
    terminalAgents.set(normalizeAgentId(agent), agent);
  }

  return DEFAULT_ORDER.map((id) => {
    const agent = terminalAgents.get(id);
    return buildMeshFacultyProjection({
      id,
      freshnessSeconds: runtimeAge,
      active: agent ? agent.heartbeatOk : false,
      terminalStatus: agent?.status ?? (state ? state.terminalStatus : 'offline'),
      detail: agent?.detail,
      source: agent ? 'terminal' : 'fallback',
    });
  });
}

export function summarizeMeshFaculty(faculty: MeshFacultyProjection[]): {
  total: number;
  live: number;
  warm: number;
  stale: number;
  offline: number;
  active: number;
} {
  return faculty.reduce(
    (acc, item) => {
      acc.total += 1;
      acc[item.heartbeat] += 1;
      if (item.active) acc.active += 1;
      return acc;
    },
    { total: 0, live: 0, warm: 0, stale: 0, offline: 0, active: 0 },
  );
}
