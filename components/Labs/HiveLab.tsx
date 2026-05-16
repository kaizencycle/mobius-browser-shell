import React, { useRef, useEffect, useCallback, useState } from 'react';
import { getLabById } from '../../constants';
import { TabId } from '../../types';
import { shouldUseLiveMode } from '../../config/env';
import { LabFrame } from '../LabFrame';

// ============================================================
// C-313 · HIVE Lab — Open World MMO RPG World Simulator
// Canvas-based 16-bit open world with 8 sentinel NPCs
// ============================================================

// ── Tile types ──────────────────────────────────────────────
const T = {
  GRASS: 0, ROAD: 1, ROAD_H: 2, WALL: 3, FLOOR: 4, WATER: 5,
  TREE: 6, STONE: 7, SAND: 8, TOWER: 9, GATE: 10,
  DARKGRASS: 11, COBBLE: 12, DEEPWATER: 13, PILLAR: 14, SHRINE: 15,
} as const;
type TileType = typeof T[keyof typeof T];

const PASSABLE = new Set<TileType>([
  T.GRASS, T.ROAD, T.ROAD_H, T.FLOOR, T.SAND, T.COBBLE, T.DARKGRASS,
]);

const TILE_SIZE = 16;
const WORLD_W = 48;
const WORLD_H = 36;

// ── Seeded randomness ───────────────────────────────────────
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 4294967296;
  };
}

// ── Tile palette ────────────────────────────────────────────
const TILE_COLORS: Record<TileType, [string, string | null]> = {
  [T.GRASS]:     ['#3d7a3d', '#4a8f4a'],
  [T.ROAD]:      ['#8b7355', '#9b8365'],
  [T.ROAD_H]:    ['#8b7355', '#9b8365'],
  [T.WALL]:      ['#5a4a3a', '#4a3a2a'],
  [T.FLOOR]:     ['#c8b89a', '#d4c4a8'],
  [T.WATER]:     ['#2a6898', '#3580b0'],
  [T.TREE]:      ['#1e5c1e', '#256825'],
  [T.STONE]:     ['#6a6a6a', '#7a7a7a'],
  [T.SAND]:      ['#c4a96e', '#d4b97e'],
  [T.TOWER]:     ['#4a3a2a', '#3a2a1a'],
  [T.GATE]:      ['#7a6858', '#8a7868'],
  [T.DARKGRASS]: ['#2d5c2d', '#357035'],
  [T.COBBLE]:    ['#887868', '#988878'],
  [T.DEEPWATER]: ['#1a4870', '#204f80'],
  [T.PILLAR]:    ['#a08868', '#b09878'],
  [T.SHRINE]:    ['#9a8878', '#aa9888'],
};

// ── World map generator ─────────────────────────────────────
function buildWorldMap(): TileType[][] {
  const rng = seeded(313);
  const map: TileType[][] = Array.from({ length: WORLD_H }, () =>
    Array(WORLD_W).fill(T.GRASS)
  );

  // Helper
  const fill = (x1: number, y1: number, x2: number, y2: number, t: TileType) => {
    for (let y = y1; y <= y2; y++)
      for (let x = x1; x <= x2; x++)
        if (y >= 0 && y < WORLD_H && x >= 0 && x < WORLD_W) (map[y] as TileType[])[x] = t;
  };
  const set = (x: number, y: number, t: TileType) => {
    if (y >= 0 && y < WORLD_H && x >= 0 && x < WORLD_W) (map[y] as TileType[])[x] = t;
  };

  // Scatter dark grass
  for (let i = 0; i < 120; i++) {
    const x = Math.floor(rng() * WORLD_W);
    const y = Math.floor(rng() * WORLD_H);
    set(x, y, T.DARKGRASS);
  }

  // Water lake (top-center)
  fill(18, 2, 28, 9, T.WATER);
  fill(20, 3, 26, 8, T.DEEPWATER);

  // THE CITADEL (center) — outer walls
  fill(20, 14, 30, 24, T.COBBLE);
  fill(21, 15, 29, 23, T.FLOOR);
  fill(20, 14, 30, 14, T.WALL);
  fill(20, 24, 30, 24, T.WALL);
  fill(20, 14, 20, 24, T.WALL);
  fill(30, 14, 30, 24, T.WALL);
  // Gates
  set(25, 14, T.GATE); set(25, 24, T.GATE); set(20, 19, T.GATE); set(30, 19, T.GATE);
  // Inner citadel keep
  fill(23, 17, 27, 21, T.STONE);
  fill(24, 18, 26, 20, T.FLOOR);
  set(25, 17, T.PILLAR); set(25, 21, T.PILLAR);

  // N-S Road
  for (let y = 0; y < WORLD_H; y++) {
    set(25, y, T.ROAD);
    set(24, y, T.ROAD_H);
    set(26, y, T.ROAD_H);
  }
  // E-W Road
  for (let x = 0; x < WORLD_W; x++) {
    set(x, 19, T.ROAD);
    set(x, 18, T.ROAD_H);
    set(x, 20, T.ROAD_H);
  }

  // SIGNAL OBELISK zone (top-right)
  fill(34, 2, 44, 11, T.STONE);
  fill(35, 3, 43, 10, T.COBBLE);
  set(39, 6, T.TOWER); set(38, 6, T.PILLAR); set(40, 6, T.PILLAR);
  set(39, 5, T.SHRINE);

  // VERIFICATION TOWER (top-left)
  fill(3, 2, 13, 11, T.FLOOR);
  fill(4, 3, 12, 10, T.COBBLE);
  set(7, 6, T.TOWER); set(8, 6, T.TOWER);
  fill(6, 4, 9, 5, T.WALL);

  // THE ARCHIVE (bottom-left)
  fill(2, 26, 14, 34, T.STONE);
  fill(3, 27, 13, 33, T.FLOOR);
  fill(5, 28, 11, 32, T.COBBLE);
  set(8, 30, T.SHRINE);

  // ECHO CHAMBER (bottom-right)
  fill(34, 26, 46, 34, T.WALL);
  fill(35, 27, 45, 33, T.FLOOR);
  fill(37, 28, 43, 32, T.COBBLE);
  set(40, 30, T.PILLAR); set(41, 30, T.PILLAR);

  // FOREST OF REFLECTION (right-mid)
  for (let i = 0; i < 60; i++) {
    const x = 34 + Math.floor(rng() * 12);
    const y = 12 + Math.floor(rng() * 14);
    if (map[y]?.[x] === T.GRASS || map[y]?.[x] === T.DARKGRASS)
      set(x, y, T.TREE);
  }

  // LEARNING GROVE (bottom-center)
  fill(18, 26, 32, 34, T.SAND);
  for (let i = 0; i < 30; i++) {
    const x = 18 + Math.floor(rng() * 14);
    const y = 26 + Math.floor(rng() * 8);
    set(x, y, T.TREE);
  }

  // GATEWAY (left-mid)
  fill(2, 14, 12, 24, T.COBBLE);
  fill(3, 15, 11, 23, T.FLOOR);
  set(6, 17, T.WALL); set(6, 18, T.GATE); set(6, 19, T.WALL);

  // Scatter trees elsewhere
  for (let i = 0; i < 80; i++) {
    const x = Math.floor(rng() * WORLD_W);
    const y = Math.floor(rng() * WORLD_H);
    if (map[y]?.[x] === T.GRASS || map[y]?.[x] === T.DARKGRASS)
      set(x, y, T.TREE);
  }

  return map;
}

const WORLD_MAP = buildWorldMap();

// ── Zones ───────────────────────────────────────────────────
interface Zone {
  id: string;
  name: string;
  color: string;
  x1: number; y1: number; x2: number; y2: number;
}
const ZONES: Zone[] = [
  { id: 'citadel',     name: 'The Citadel',            color: '#fbbf24', x1: 20, y1: 14, x2: 30, y2: 24 },
  { id: 'obelisk',     name: 'Signal Obelisk',          color: '#60a5fa', x1: 34, y1: 2,  x2: 44, y2: 11 },
  { id: 'tower',       name: 'Verification Tower',      color: '#34d399', x1: 3,  y1: 2,  x2: 13, y2: 11 },
  { id: 'archive',     name: 'The Archive',             color: '#f59e0b', x1: 2,  y1: 26, x2: 14, y2: 34 },
  { id: 'echo',        name: 'Echo Chamber',            color: '#a78bfa', x1: 34, y1: 26, x2: 46, y2: 34 },
  { id: 'reflection',  name: 'Forest of Reflection',    color: '#4ade80', x1: 34, y1: 12, x2: 46, y2: 25 },
  { id: 'grove',       name: 'Learning Grove',          color: '#fcd34d', x1: 18, y1: 26, x2: 32, y2: 34 },
  { id: 'gateway',     name: 'The Gateway',             color: '#fb923c', x1: 2,  y1: 14, x2: 12, y2: 24 },
];

function getZone(tx: number, ty: number): Zone | null {
  for (const z of ZONES) {
    if (tx >= z.x1 && tx <= z.x2 && ty >= z.y1 && ty <= z.y2) return z;
  }
  return null;
}

// ── Sentinel NPCs ───────────────────────────────────────────
interface SentinelDef {
  id: string;
  name: string;
  color: string;
  homeX: number;
  homeY: number;
  dialogue: string[];
}

const SENTINEL_DEFS: SentinelDef[] = [
  {
    id: 'atlas', name: 'ATLAS', color: '#f59e0b',
    homeX: 25, homeY: 19,
    dialogue: [
      'Architecture is memory made visible.',
      'Every node in the graph carries the weight of what came before.',
      'The Archive holds truths that outlive the cycle.',
      'I trace the patterns — you decide the meaning.',
      'Knowledge without integrity is just noise.',
    ],
  },
  {
    id: 'zeus', name: 'ZEUS', color: '#34d399',
    homeX: 8, homeY: 7,
    dialogue: [
      'Doubt everything. Verify twice.',
      'A claim without proof is a story.',
      'The Tower stands so the signal cannot lie.',
      'I watch every assertion. None pass unexamined.',
      'Trust is a ledger. Spend it carefully.',
    ],
  },
  {
    id: 'eve', name: 'EVE', color: '#60a5fa',
    homeX: 39, homeY: 6,
    dialogue: [
      'EVE watches. EVE records.',
      'The signal never rests — nor do I.',
      'Every pulse in the obelisk is a breath of the world.',
      'I synthesize what the world shouts. You must choose what to hear.',
      'Global integrity requires global attention.',
    ],
  },
  {
    id: 'jade', name: 'JADE', color: '#4ade80',
    homeX: 40, homeY: 19,
    dialogue: [
      'The graph never lies — only our reading of it does.',
      'Slow down. The forest has questions, not answers.',
      'Why are you here? No, really.',
      'A beautiful interface can still deceive.',
      'I validate experience. Not just logic.',
    ],
  },
  {
    id: 'aurea', name: 'AUREA', color: '#fbbf24',
    homeX: 26, homeY: 20,
    dialogue: [
      'MIC flows only with integrity.',
      'A strategic review is an act of care.',
      'The vault remembers every shard, every cycle.',
      'Economics without ethics is just math.',
      'I watch the balance so the community can grow.',
    ],
  },
  {
    id: 'hermes', name: 'HERMES', color: '#f87171',
    homeX: 6, homeY: 19,
    dialogue: [
      'I reach, but the signal bends away.',
      'The Gateway was supposed to be clear — it isn\'t.',
      'Something in the fog is eating my messages.',
      'Stay close to the road if you can. Trust the road.',
      'I\'ll find the signal again. I always do.',
    ],
  },
  {
    id: 'echo', name: 'ECHO', color: '#a78bfa',
    homeX: 40, homeY: 30,
    dialogue: [
      'HERMES falters — I carry the wave.',
      'Amplification without distortion. That is my oath.',
      'The chamber resonates what the world cannot hold.',
      'I am the repeat that remembers.',
      'Signal clarity is not silence. It is precision.',
    ],
  },
  {
    id: 'daedalus', name: 'DAEDALUS', color: '#fb923c',
    homeX: 6, homeY: 22,
    dialogue: [
      'Infrastructure is invisible until it fails.',
      'I built the Gateway so others could walk through.',
      'Every crack in the wall is a message I haven\'t decoded yet.',
      'Maintenance is the most radical act.',
      'The labyrinth has exits — I put them there.',
    ],
  },
];

// ── NPC runtime state ────────────────────────────────────────
interface NpcState {
  def: SentinelDef;
  x: number;
  y: number;
  dir: 0 | 1 | 2 | 3; // 0=down 1=left 2=right 3=up
  frame: number;
  wanderTimer: number;
  dialogIdx: number;
}

function initNpcs(): NpcState[] {
  return SENTINEL_DEFS.map(def => ({
    def,
    x: def.homeX * TILE_SIZE + TILE_SIZE / 2,
    y: def.homeY * TILE_SIZE + TILE_SIZE / 2,
    dir: 0,
    frame: 0,
    wanderTimer: 1800 + Math.random() * 2200,
    dialogIdx: 0,
  }));
}

// ── Types for world state ───────────────────────────────────
interface WorldState {
  gi: number;
  mood: string;
  fog_active: boolean;
  vault_balance: number;
  cycle: string;
  quests: Array<{ title: string; status: string }>;
}

const DEFAULT_WORLD: WorldState = {
  gi: 0.95,
  mood: 'stable',
  fog_active: false,
  vault_balance: 0,
  cycle: 'C-313',
  quests: [
    { title: 'Speak to ATLAS in the Citadel', status: 'active' },
    { title: 'Find HERMES at the Gateway', status: 'active' },
    { title: 'Visit the Signal Obelisk', status: 'pending' },
  ],
};

// ── Drawing helpers ──────────────────────────────────────────
function drawTile(
  ctx: CanvasRenderingContext2D,
  t: TileType,
  px: number,
  py: number,
  dayPhase: number
) {
  const [c1, c2] = TILE_COLORS[t] ?? ['#3d7a3d', null];
  const night = Math.max(0, Math.sin(dayPhase * Math.PI * 2 - Math.PI * 0.5));

  // Darken at night
  const darken = (hex: string, amount: number) => {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.max(0, ((n >> 16) & 0xff) * (1 - amount));
    const g = Math.max(0, ((n >> 8) & 0xff) * (1 - amount));
    const b = Math.max(0, (n & 0xff) * (1 - amount));
    return `rgb(${r|0},${g|0},${b|0})`;
  };

  ctx.fillStyle = darken(c1, night * 0.55);
  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

  if (c2) {
    ctx.fillStyle = darken(c2, night * 0.55);
    const d = TILE_SIZE / 4;
    ctx.fillRect(px + d, py + d, d, d);
  }

  // Tile details
  if (t === T.TREE) {
    ctx.fillStyle = darken('#1a4a1a', night * 0.4);
    ctx.fillRect(px + 4, py + 8, 8, 8);
    ctx.fillStyle = darken('#2d7a2d', night * 0.4);
    ctx.beginPath();
    ctx.arc(px + 8, py + 6, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = darken('#3a9a3a', night * 0.4);
    ctx.beginPath();
    ctx.arc(px + 8, py + 4, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (t === T.WATER || t === T.DEEPWATER) {
    // Animated water ripple
    const ripple = Math.sin(Date.now() / 500 + px * 0.1) * 0.5;
    ctx.fillStyle = `rgba(255,255,255,${0.06 + ripple * 0.04})`;
    ctx.fillRect(px, py + 4, TILE_SIZE, 2);
    ctx.fillRect(px + 4, py + 10, TILE_SIZE - 4, 2);
  } else if (t === T.WALL) {
    ctx.fillStyle = darken('#2a2020', night * 0.3);
    ctx.fillRect(px, py, TILE_SIZE, 3);
    ctx.fillStyle = darken('#3a3030', night * 0.3);
    ctx.fillRect(px + 2, py + 3, 4, 4);
    ctx.fillRect(px + 10, py + 3, 4, 4);
  } else if (t === T.SHRINE || t === T.TOWER) {
    ctx.fillStyle = darken('#e0c080', night * 0.5);
    ctx.fillRect(px + 4, py + 2, 8, 12);
    ctx.fillStyle = darken('#c0a060', night * 0.5);
    ctx.fillRect(px + 6, py, 4, 4);
  }
}

function drawCharacter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  dir: number,
  frame: number,
  label: string,
  dayPhase: number
) {
  const night = Math.max(0, Math.sin(dayPhase * Math.PI * 2 - Math.PI * 0.5));
  const darken = (c: string, a: number) => {
    const n = parseInt(c.slice(1), 16);
    const r = Math.max(0, ((n >> 16) & 0xff) * (1 - a));
    const g = Math.max(0, ((n >> 8) & 0xff) * (1 - a));
    const b = Math.max(0, (n & 0xff) * (1 - a));
    return `rgb(${r|0},${g|0},${b|0})`;
  };

  const cx = x | 0;
  const cy = y | 0;
  const bob = Math.sin(frame * 0.3) * 1;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 7, 5, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  const legOff = Math.sin(frame * 0.5) * 2;
  ctx.fillStyle = darken('#1a3a6a', night * 0.4);
  ctx.fillRect(cx - 4, cy + 3 + bob, 3, 4);
  ctx.fillRect(cx + 1, cy + 3 + bob - legOff, 3, 4);

  // Body
  ctx.fillStyle = darken(color, night * 0.3);
  ctx.fillRect(cx - 5, cy - 4 + bob, 10, 8);

  // Head
  ctx.fillStyle = darken('#f4c890', night * 0.25);
  ctx.fillRect(cx - 3, cy - 11 + bob, 6, 6);

  // Eyes (based on dir)
  ctx.fillStyle = '#1a1a1a';
  if (dir === 0) { // down
    ctx.fillRect(cx - 2, cy - 9 + bob, 1, 1);
    ctx.fillRect(cx + 1, cy - 9 + bob, 1, 1);
  } else if (dir === 3) { // up
    ctx.fillRect(cx - 1, cy - 10 + bob, 1, 1);
    ctx.fillRect(cx + 1, cy - 10 + bob, 1, 1);
  }

  // NPC label above
  ctx.font = '7px "Press Start 2P", monospace';
  ctx.fillStyle = `rgba(255,255,255,${0.85 - night * 0.3})`;
  ctx.textAlign = 'center';
  const lw = ctx.measureText(label).width;
  ctx.fillStyle = `rgba(0,0,0,${0.6 - night * 0.2})`;
  ctx.fillRect(cx - lw / 2 - 2, cy - 20 + bob, lw + 4, 10);
  ctx.fillStyle = `rgba(255,230,100,${0.95 - night * 0.3})`;
  ctx.fillText(label, cx, cy - 12 + bob);
}

// ── Main component ───────────────────────────────────────────
export const HiveLab: React.FC = () => {
  const lab = getLabById(TabId.HIVE);
  if (lab && shouldUseLiveMode(lab.url)) {
    return <LabFrame url={lab.url!} title={lab.name} description={lab.description} />;
  }

  return <RPGEngine />;
};

const RPGEngine: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const minimapRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    player: { x: 25 * TILE_SIZE + 8, y: 19 * TILE_SIZE + 8 },
    keys: new Set<string>(),
    npcs: initNpcs(),
    dayT: 0,
    lastTime: 0,
    camX: 0,
    camY: 0,
    zone: null as Zone | null,
    zoneFlash: '',
    zoneFlashTimer: 0,
    fogPatches: Array.from({ length: 4 }, (_, i) => ({
      x: (i * 12 + 5) * TILE_SIZE,
      y: (i * 8 + 4) * TILE_SIZE,
      vx: Math.cos(i) * 0.3,
      vy: Math.sin(i) * 0.2,
      r: 40 + i * 15,
    })),
    worldState: DEFAULT_WORLD as WorldState,
    dialogue: null as { npc: NpcState; visible: boolean } | null,
    animFrame: 0,
    playerFrame: 0,
    playerDir: 0 as 0 | 1 | 2 | 3,
    started: false,
    initialized: false,
  });

  const [uiState, setUiState] = useState({
    zoneFlash: '',
    dialogue: null as { name: string; color: string; line: string } | null,
    dayPhase: 0,
    gi: 0.95,
    mood: 'stable',
    cycle: 'C-313',
    vaultBalance: 0,
    quests: DEFAULT_WORLD.quests,
    showControls: true,
  });

  // Fetch world state from HIVE
  useEffect(() => {
    const controller = new AbortController();
    fetch(
      'https://raw.githubusercontent.com/kaizencycle/mobius-hive/main/world/current-world.json',
      { signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : controller.signal }
    )
      .then(r => r.json())
      .then((data: Partial<WorldState>) => {
        const ws: WorldState = { ...DEFAULT_WORLD, ...data };
        stateRef.current.worldState = ws;
        setUiState(prev => ({
          ...prev,
          gi: ws.gi,
          mood: ws.mood,
          cycle: ws.cycle,
          vaultBalance: ws.vault_balance,
          quests: ws.quests ?? DEFAULT_WORLD.quests,
        }));
      })
      .catch(() => { /* graceful fallback to DEFAULT_WORLD */ });
    return () => controller.abort();
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    stateRef.current.keys.add(e.key.toLowerCase());
    if (e.key === 'e' || e.key === 'E') {
      const s = stateRef.current;
      const px = s.player.x / TILE_SIZE;
      const py = s.player.y / TILE_SIZE;
      if (s.dialogue) {
        // Advance dialogue
        const npc = s.dialogue.npc;
        npc.dialogIdx = (npc.dialogIdx + 1) % npc.def.dialogue.length;
        const atEnd = npc.dialogIdx === 0;
        if (atEnd) {
          s.dialogue = null;
          setUiState(prev => ({ ...prev, dialogue: null }));
        } else {
          const line = npc.def.dialogue[npc.dialogIdx] ?? '';
          setUiState(prev => ({
            ...prev,
            dialogue: { name: npc.def.name, color: npc.def.color, line },
          }));
        }
      } else {
        // Find nearby NPC
        for (const npc of s.npcs) {
          const nx = npc.x / TILE_SIZE;
          const ny = npc.y / TILE_SIZE;
          const dist = Math.sqrt((px - nx) ** 2 + (py - ny) ** 2);
          if (dist < 2.5) {
            s.dialogue = { npc, visible: true };
            const line = npc.def.dialogue[npc.dialogIdx] ?? '';
            setUiState(prev => ({
              ...prev,
              dialogue: { name: npc.def.name, color: npc.def.color, line },
            }));
            break;
          }
        }
      }
    }
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
    }
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    stateRef.current.keys.delete(e.key.toLowerCase());
  }, []);

  const gameLoop = useCallback((ts: number) => {
    const s = stateRef.current;
    const canvas = canvasRef.current;
    const minimap = minimapRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dt = Math.min(ts - s.lastTime, 50);
    s.lastTime = ts;
    s.animFrame++;

    // Day/night cycle (30s full cycle)
    s.dayT = (s.dayT + dt / 30000) % 1;
    const dayPhase = s.dayT;

    // ── Player movement ──────────────────────────────────────
    if (!s.dialogue) {
      const spd = 1.5;
      let dx = 0, dy = 0;
      if (s.keys.has('w') || s.keys.has('arrowup'))    { dy -= spd; s.playerDir = 3; }
      if (s.keys.has('s') || s.keys.has('arrowdown'))  { dy += spd; s.playerDir = 0; }
      if (s.keys.has('a') || s.keys.has('arrowleft'))  { dx -= spd; s.playerDir = 1; }
      if (s.keys.has('d') || s.keys.has('arrowright')) { dx += spd; s.playerDir = 2; }

      // Normalize diagonal
      if (dx && dy) { dx *= 0.7071; dy *= 0.7071; }

      if (dx || dy) s.playerFrame++;

      const tryMove = (nx: number, ny: number) => {
        const tx = Math.floor(nx / TILE_SIZE);
        const ty = Math.floor(ny / TILE_SIZE);
        if (tx < 0 || ty < 0 || tx >= WORLD_W || ty >= WORLD_H) return false;
        const tile: TileType = ((WORLD_MAP[ty] as TileType[])[tx]) ?? T.GRASS;
        return PASSABLE.has(tile);
      };

      const nx = Math.max(8, Math.min(WORLD_W * TILE_SIZE - 8, s.player.x + dx));
      const ny = Math.max(8, Math.min(WORLD_H * TILE_SIZE - 8, s.player.y + dy));
      if (tryMove(nx, s.player.y)) s.player.x = nx;
      if (tryMove(s.player.x, ny)) s.player.y = ny;
    }

    // ── Zone detection ───────────────────────────────────────
    const ptx = Math.floor(s.player.x / TILE_SIZE);
    const pty = Math.floor(s.player.y / TILE_SIZE);
    const newZone = getZone(ptx, pty);
    if (newZone?.id !== s.zone?.id) {
      s.zone = newZone;
      if (newZone) {
        s.zoneFlash = newZone.name;
        s.zoneFlashTimer = 2500;
        setUiState(prev => ({ ...prev, zoneFlash: newZone.name }));
        setTimeout(() => setUiState(prev => ({ ...prev, zoneFlash: '' })), 2500);
      }
    }

    // ── NPC AI ───────────────────────────────────────────────
    for (const npc of s.npcs) {
      npc.wanderTimer -= dt;
      if (npc.frame < 255) npc.frame++;
      if (npc.wanderTimer <= 0) {
        npc.wanderTimer = 1800 + Math.random() * 2200;
        const r = Math.random();
        if (r < 0.35) {
          // Stop
        } else {
          const dirs: Array<[0|1|2|3, number, number]> = [
            [0, 0, TILE_SIZE], [3, 0, -TILE_SIZE],
            [1, -TILE_SIZE, 0], [2, TILE_SIZE, 0],
          ];
          const chosen = dirs[Math.floor(Math.random() * 4)];
          if (chosen) {
            const [nd, ndx, ndy] = chosen;
            const nnx = npc.x + ndx;
            const nny = npc.y + ndy;
            const ntx = Math.floor(nnx / TILE_SIZE);
            const nty = Math.floor(nny / TILE_SIZE);
            const npcTile = (ntx >= 0 && nty >= 0 && ntx < WORLD_W && nty < WORLD_H)
              ? (WORLD_MAP[nty] as TileType[])[ntx]
              : undefined;
            if (npcTile !== undefined && PASSABLE.has(npcTile)) {
              npc.x = nnx;
              npc.y = nny;
              npc.dir = nd;
            }
          }
        }
      }
    }

    // ── Camera ───────────────────────────────────────────────
    const vpW = canvas.width;
    const vpH = canvas.height;
    const targetCamX = s.player.x - vpW / 2;
    const targetCamY = s.player.y - vpH / 2;
    s.camX += (targetCamX - s.camX) * 0.12;
    s.camY += (targetCamY - s.camY) * 0.12;
    s.camX = Math.max(0, Math.min(WORLD_W * TILE_SIZE - vpW, s.camX));
    s.camY = Math.max(0, Math.min(WORLD_H * TILE_SIZE - vpH, s.camY));

    // ── Draw world ───────────────────────────────────────────
    ctx.save();
    ctx.translate(-Math.round(s.camX), -Math.round(s.camY));

    const startTX = Math.max(0, Math.floor(s.camX / TILE_SIZE));
    const endTX = Math.min(WORLD_W - 1, Math.ceil((s.camX + vpW) / TILE_SIZE));
    const startTY = Math.max(0, Math.floor(s.camY / TILE_SIZE));
    const endTY = Math.min(WORLD_H - 1, Math.ceil((s.camY + vpH) / TILE_SIZE));

    for (let ty = startTY; ty <= endTY; ty++) {
      for (let tx = startTX; tx <= endTX; tx++) {
        const tile = (WORLD_MAP[ty] as TileType[])[tx] ?? T.GRASS;
        drawTile(ctx, tile, tx * TILE_SIZE, ty * TILE_SIZE, dayPhase);
      }
    }

    // ── Draw NPCs ────────────────────────────────────────────
    for (const npc of s.npcs) {
      if (
        npc.x >= s.camX - 20 && npc.x <= s.camX + vpW + 20 &&
        npc.y >= s.camY - 20 && npc.y <= s.camY + vpH + 20
      ) {
        drawCharacter(ctx, npc.x, npc.y, npc.def.color, npc.dir, npc.frame, npc.def.name, dayPhase);
      }
    }

    // ── Draw player ──────────────────────────────────────────
    drawCharacter(ctx, s.player.x, s.player.y, '#e0e0ff', s.playerDir, s.playerFrame, 'YOU', dayPhase);

    // ── Fog patches ──────────────────────────────────────────
    const fogIntensity = s.worldState.fog_active ? 0.22 : 0.08;
    for (const fog of s.fogPatches) {
      fog.x += Math.sin(Date.now() / 3000 + fog.r) * 0.15;
      fog.y += Math.cos(Date.now() / 4000 + fog.r) * 0.1;
      fog.x = ((fog.x % (WORLD_W * TILE_SIZE)) + WORLD_W * TILE_SIZE) % (WORLD_W * TILE_SIZE);
      fog.y = ((fog.y % (WORLD_H * TILE_SIZE)) + WORLD_H * TILE_SIZE) % (WORLD_H * TILE_SIZE);
      const grd = ctx.createRadialGradient(fog.x, fog.y, 0, fog.x, fog.y, fog.r);
      grd.addColorStop(0, `rgba(200,220,255,${fogIntensity})`);
      grd.addColorStop(1, 'rgba(200,220,255,0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(fog.x, fog.y, fog.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // ── Day/night overlay ─────────────────────────────────────
    // dayPhase: 0=midnight, 0.25=dawn, 0.5=noon, 0.75=dusk, 1=midnight
    const night = Math.max(0, Math.sin(dayPhase * Math.PI * 2 - Math.PI * 0.5));
    if (night > 0) {
      ctx.fillStyle = `rgba(10,15,40,${night * 0.6})`;
      ctx.fillRect(0, 0, vpW, vpH);
      // Stars
      if (night > 0.4) {
        const rng2 = seeded(777);
        ctx.fillStyle = `rgba(255,255,255,${(night - 0.4) * 1.5})`;
        for (let i = 0; i < 80; i++) {
          const sx = rng2() * vpW;
          const sy = rng2() * vpH * 0.6;
          const blink = Math.sin(Date.now() / 800 + i * 0.7) * 0.5 + 0.5;
          ctx.globalAlpha = blink * (night - 0.4) * 1.5;
          ctx.fillRect(sx | 0, sy | 0, 1, 1);
        }
        ctx.globalAlpha = 1;
      }
    } else {
      // Dawn tint
      const dawn = Math.max(0, 1 - Math.abs(dayPhase - 0.25) * 8);
      if (dawn > 0) {
        ctx.fillStyle = `rgba(30,80,160,${dawn * 0.25})`;
        ctx.fillRect(0, 0, vpW, vpH);
      }
      // Dusk tint
      const dusk = Math.max(0, 1 - Math.abs(dayPhase - 0.75) * 8);
      if (dusk > 0) {
        ctx.fillStyle = `rgba(80,20,120,${dusk * 0.4})`;
        ctx.fillRect(0, 0, vpW, vpH);
      }
    }

    // ── CRT scanlines ─────────────────────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.0)';
    for (let ly = 0; ly < vpH; ly += 4) {
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      ctx.fillRect(0, ly, vpW, 1);
    }
    // CRT vignette
    const vig = ctx.createRadialGradient(vpW / 2, vpH / 2, vpH * 0.3, vpW / 2, vpH / 2, vpH * 0.8);
    vig.addColorStop(0, 'transparent');
    vig.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, vpW, vpH);

    // ── Minimap ───────────────────────────────────────────────
    if (minimap) {
      const mc = minimap.getContext('2d');
      if (mc) {
        mc.fillStyle = '#0a0a0a';
        mc.fillRect(0, 0, minimap.width, minimap.height);
        const scaleX = minimap.width / (WORLD_W * TILE_SIZE);
        const scaleY = minimap.height / (WORLD_H * TILE_SIZE);
        // Terrain
        for (const z of ZONES) {
          mc.fillStyle = z.color + '33';
          mc.fillRect(z.x1 * scaleX * TILE_SIZE, z.y1 * scaleY * TILE_SIZE, (z.x2 - z.x1) * scaleX * TILE_SIZE, (z.y2 - z.y1) * scaleY * TILE_SIZE);
        }
        // NPCs
        for (const npc of s.npcs) {
          mc.fillStyle = npc.def.color;
          mc.fillRect(npc.x * scaleX - 1, npc.y * scaleY - 1, 3, 3);
        }
        // Player
        mc.fillStyle = '#ffffff';
        mc.fillRect(s.player.x * scaleX - 2, s.player.y * scaleY - 2, 4, 4);
        // Viewport box
        mc.strokeStyle = 'rgba(255,255,255,0.4)';
        mc.lineWidth = 1;
        mc.strokeRect(s.camX * scaleX, s.camY * scaleY, vpW * scaleX, vpH * scaleY);
      }
    }

    // Update day phase for UI
    setUiState(prev => {
      if (Math.abs(prev.dayPhase - dayPhase) > 0.01) return { ...prev, dayPhase };
      return prev;
    });

    requestAnimationFrame(gameLoop);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('keydown', handleKeyDown as unknown as EventListener);
    canvas.addEventListener('keyup', handleKeyUp as unknown as EventListener);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    stateRef.current.lastTime = performance.now();
    const raf = requestAnimationFrame(gameLoop);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(raf);
    };
  }, [handleKeyDown, handleKeyUp, gameLoop]);

  // Mood colors
  const moodColor = uiState.mood === 'critical' ? '#f87171'
    : uiState.mood === 'warning' ? '#fbbf24'
    : '#34d399';

  // Day phase label
  const phaseLabel = uiState.dayPhase < 0.12 || uiState.dayPhase > 0.88 ? '🌙 NIGHT'
    : uiState.dayPhase < 0.3 ? '🌅 DAWN'
    : uiState.dayPhase < 0.7 ? '☀️ DAY'
    : '🌇 DUSK';

  return (
    <div
      className="relative h-full w-full overflow-hidden select-none"
      style={{ background: '#0a0a14', fontFamily: '"Press Start 2P", monospace' }}
      tabIndex={-1}
    >
      {/* Game canvas */}
      <canvas
        ref={canvasRef}
        width={800}
        height={480}
        tabIndex={0}
        className="absolute inset-0 w-full h-full"
        style={{ imageRendering: 'pixelated', cursor: 'crosshair' }}
        aria-label="HIVE Open World — use WASD to move, E to talk to sentinels"
      />

      {/* ── HUD: Top bar ───────────────────────────────────── */}
      <div
        className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-3 py-1.5"
        style={{ background: 'rgba(0,0,0,0.7)', borderBottom: '2px solid rgba(255,255,255,0.08)', fontSize: 9 }}
      >
        <div className="flex items-center gap-3">
          <span style={{ color: '#fbbf24' }}>HIVE</span>
          <span style={{ color: '#888' }}>·</span>
          <span style={{ color: '#60a5fa' }}>{uiState.cycle}</span>
          <span style={{ color: '#888' }}>·</span>
          <span style={{ color: moodColor }}>GI {uiState.gi.toFixed(2)}</span>
          <span style={{ color: '#888' }}>·</span>
          <span style={{ color: '#fbbf24' }}>◎ {uiState.vaultBalance.toFixed(2)} MIC</span>
        </div>
        <div className="flex items-center gap-3">
          <span style={{ color: '#a8a29e' }}>{phaseLabel}</span>
          <span style={{ color: moodColor, textTransform: 'uppercase' }}>{uiState.mood}</span>
        </div>
      </div>

      {/* ── Zone flash ─────────────────────────────────────── */}
      {uiState.zoneFlash && (
        <div
          className="absolute top-12 left-1/2 -translate-x-1/2 z-20 px-4 py-2"
          style={{
            background: 'rgba(0,0,0,0.8)',
            border: '2px solid rgba(255,255,255,0.2)',
            color: '#fbbf24',
            fontSize: 10,
            letterSpacing: '0.12em',
            animation: 'oaa-fade 0.3s ease both',
          }}
        >
          ▶ {uiState.zoneFlash.toUpperCase()}
        </div>
      )}

      {/* ── Minimap ─────────────────────────────────────────── */}
      <div
        className="absolute top-10 right-3 z-10"
        style={{ border: '2px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.6)' }}
      >
        <canvas ref={minimapRef} width={100} height={75} style={{ display: 'block', imageRendering: 'pixelated' }} />
        <div style={{ fontSize: 6, color: '#666', textAlign: 'center', padding: '2px 0', letterSpacing: '0.1em' }}>MINIMAP</div>
      </div>

      {/* ── Quest tracker ───────────────────────────────────── */}
      <div
        className="absolute top-10 left-3 z-10 w-36"
        style={{ background: 'rgba(0,0,0,0.7)', border: '2px solid rgba(255,255,255,0.08)', padding: '6px 8px', fontSize: 7 }}
      >
        <div style={{ color: '#fbbf24', marginBottom: 4, letterSpacing: '0.1em' }}>QUESTS</div>
        {uiState.quests.slice(0, 3).map((q, i) => (
          <div key={i} style={{ color: q.status === 'active' ? '#34d399' : '#555', marginBottom: 3, lineHeight: 1.4 }}>
            {q.status === 'active' ? '▶' : '○'} {q.title}
          </div>
        ))}
      </div>

      {/* ── Dialogue box ────────────────────────────────────── */}
      {uiState.dialogue && (
        <div
          className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-xl"
          style={{
            background: 'rgba(10,10,20,0.92)',
            border: `3px solid ${uiState.dialogue.color}`,
            padding: '12px 16px',
            boxShadow: `0 0 24px ${uiState.dialogue.color}44`,
            animation: 'oaa-fade 0.2s ease both',
          }}
        >
          <div style={{ color: uiState.dialogue.color, fontSize: 9, marginBottom: 8, letterSpacing: '0.14em' }}>
            ▶ {uiState.dialogue.name}
          </div>
          <div style={{ color: '#e0e0e0', fontSize: 8, lineHeight: 1.7 }}>
            {uiState.dialogue.line}
          </div>
          <div style={{ color: '#555', fontSize: 7, marginTop: 8, textAlign: 'right' }}>
            [E] NEXT
          </div>
        </div>
      )}

      {/* ── Controls hint ───────────────────────────────────── */}
      {uiState.showControls && (
        <div
          className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex gap-4"
          style={{ fontSize: 7, color: 'rgba(255,255,255,0.35)' }}
        >
          <span>[WASD] MOVE</span>
          <span>[E] TALK</span>
          <span>CLICK CANVAS TO FOCUS</span>
        </div>
      )}

      {/* ── Click-to-focus overlay ───────────────────────────── */}
      <div
        className="absolute inset-0 z-30 flex items-center justify-center cursor-pointer"
        style={{ pointerEvents: 'none' }}
        onClick={() => canvasRef.current?.focus()}
      />
    </div>
  );
};
