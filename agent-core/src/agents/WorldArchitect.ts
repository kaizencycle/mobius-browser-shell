/**
 * PR-011 · WorldArchitect
 * Generates terrain patches, spawns NPCs, and manages weather systems
 * for the HIVE 18-bit world. Runs on a 15-minute autonomous cycle.
 */
import { OAAClient } from '../oaa/OAAClient';
import { ThoughtBroker } from '../substrate/ThoughtBroker';
import { MICIndexer } from '../substrate/MICIndexer';

export type TileType =
  | 'grass' | 'road' | 'water' | 'wall' | 'floor'
  | 'tree' | 'stone' | 'sand' | 'tower' | 'shrine';

export interface TerrainPatch {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  tiles: TileType[][];
  generatedAt: number;
  seed: number;
}

export interface NPCDescriptor {
  id: string;
  zone: string;
  x: number;
  y: number;
  archetype: 'sentinel' | 'merchant' | 'wanderer' | 'guardian';
  dialogue: string[];
  spawnedAt: number;
}

export type WeatherType = 'clear' | 'fog' | 'storm' | 'dust' | 'aurora';

export interface WeatherState {
  type: WeatherType;
  intensity: number; // 0–1
  startedAt: number;
  durationMs: number;
}

const TILE_POOL: TileType[] = ['grass', 'grass', 'grass', 'road', 'water', 'tree', 'stone', 'sand'];
const ARCHETYPES: NPCDescriptor['archetype'][] = ['sentinel', 'merchant', 'wanderer', 'guardian'];

/** Seeded pseudo-random number generator */
function makeRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

export class WorldArchitect {
  private readonly oaa: OAAClient;
  private readonly broker: ThoughtBroker;
  private readonly mic: MICIndexer;
  private readonly agentId: string;
  private patchCounter = 0;
  private npcCounter = 0;

  constructor(agentId: string, deps: { oaa: OAAClient; broker: ThoughtBroker; mic: MICIndexer }) {
    this.agentId = agentId;
    this.oaa = deps.oaa;
    this.broker = deps.broker;
    this.mic = deps.mic;
  }

  async generateTerrainPatch(params: {
    x: number;
    y: number;
    width?: number;
    height?: number;
    seed?: number;
  }): Promise<TerrainPatch> {
    const width = params.width ?? 16;
    const height = params.height ?? 16;
    const seed = params.seed ?? Math.floor(Math.random() * 0x7fffffff);
    const rng = makeRng(seed);

    const tiles: TileType[][] = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => TILE_POOL[Math.floor(rng() * TILE_POOL.length)]!)
    );

    const patch: TerrainPatch = {
      id: `patch-${++this.patchCounter}`,
      x: params.x,
      y: params.y,
      width,
      height,
      tiles,
      generatedAt: Date.now(),
      seed,
    };

    await this.oaa.append('world:terrain:patches', patch);
    await this.broker.publish('world.terrain.generated', this.agentId, { patchId: patch.id, x: params.x, y: params.y });
    await this.mic.record({ type: 'earn', agentId: this.agentId, amount: 0.5, reason: 'terrain_generation' });

    return patch;
  }

  async spawnNPC(params: {
    zone: string;
    x: number;
    y: number;
    archetype?: NPCDescriptor['archetype'];
  }): Promise<NPCDescriptor> {
    const archetype = params.archetype ?? ARCHETYPES[Math.floor(Math.random() * ARCHETYPES.length)]!;

    const npc: NPCDescriptor = {
      id: `npc-${++this.npcCounter}`,
      zone: params.zone,
      x: params.x,
      y: params.y,
      archetype,
      dialogue: this.generateDialogue(archetype),
      spawnedAt: Date.now(),
    };

    await this.oaa.append('world:npcs', npc);
    await this.broker.publish('world.npc.spawned', this.agentId, { npcId: npc.id, zone: params.zone, archetype });
    await this.mic.record({ type: 'earn', agentId: this.agentId, amount: 0.25, reason: 'npc_spawn' });

    return npc;
  }

  async setWeather(type: WeatherType, intensity = 0.5, durationMs = 15 * 60 * 1000): Promise<WeatherState> {
    const weather: WeatherState = { type, intensity, startedAt: Date.now(), durationMs };
    await this.oaa.set('world:weather:current', JSON.stringify(weather));
    await this.broker.publish('world.weather.changed', this.agentId, weather);
    return weather;
  }

  private generateDialogue(archetype: NPCDescriptor['archetype']): string[] {
    const lines: Record<NPCDescriptor['archetype'], string[]> = {
      sentinel:  ['The world holds its breath.', 'Integrity is not a score — it is a practice.'],
      merchant:  ['MIC flows where trust is built.', 'Every shard has a story.'],
      wanderer:  ['I have walked every zone.', 'The signal changes at the border.'],
      guardian:  ['None may pass without purpose.', 'I remember what others forget.'],
    };
    return lines[archetype];
  }
}
