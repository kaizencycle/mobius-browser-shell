/**
 * Mobius HIVE — 16-bit style tile world simulator.
 * Serves read-only world JSON from the repo root (same origin) or optional remote base.
 */

const COLS = 21;
const ROWS = 15;
const TILE = 32;

/**
 * Deterministic 21×15 Midnight Galaxy layout: tree ring, grass, cross paths,
 * four district chambers + central HIVE portal.
 * @returns {string[]}
 */
function buildMap() {
  const W = COLS;
  const H = ROWS;
  /** @type {string[][]} */
  const g = Array.from({ length: H }, () => Array.from({ length: W }, () => "G"));
  const set = (x, y, c) => {
    if (x >= 0 && x < W && y >= 0 && y < H) g[y][x] = c;
  };

  for (let x = 0; x < W; x++) {
    set(x, 0, "T");
    set(x, H - 1, "T");
  }
  for (let y = 0; y < H; y++) {
    set(0, y, "T");
    set(W - 1, y, "T");
  }

  /** @param {number} x0 @param {number} y0 @param {number} x1 @param {number} y1 @param {number} ox @param {number} oy */
  const chamber = (x0, y0, x1, y1, ox, oy) => {
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const edge = x === x0 || x === x1 || y === y0 || y === y1;
        if (!edge) {
          set(x, y, x === ox && y === oy ? "O" : "F");
          continue;
        }
        if (x === ox && y === y1) {
          set(x, y, "F");
          continue;
        }
        set(x, y, "W");
      }
    }
  };

  chamber(2, 2, 6, 5, 4, 3);
  chamber(14, 2, 18, 5, 16, 3);
  chamber(2, 9, 6, 12, 4, 10);
  chamber(14, 9, 18, 12, 16, 10);
  chamber(8, 5, 12, 8, 10, 6);

  for (let y = 6; y <= 12; y++) {
    for (let x = 9; x <= 11; x++) {
      if (g[y][x] === "G") set(x, y, "P");
    }
  }
  for (let x = 3; x <= 17; x++) {
    if (g[7][x] === "G") set(x, 7, "P");
  }

  return g.map((row) => row.join(""));
}

/** @type {string[]} */
const MAP = buildMap();

const WALK = new Set(["G", "P", "F", "O"]);

const PORTALS = {
  "4,3": {
    id: "sentinel",
    label: "SENTINEL QTR",
    blurb: "Integrity rail, warnings, and sentinel rituals.",
    path: "?chamber=sentinel",
  },
  "16,3": {
    id: "oaa",
    label: "OAA HUB",
    blurb: "Operator memory and sovereign recall.",
    path: "?chamber=oaa",
  },
  "4,10": {
    id: "vault",
    label: "VAULT DIST",
    blurb: "Vault progress, fountain locks, and stability credits.",
    path: "?chamber=vault",
  },
  "16,10": {
    id: "reflections",
    label: "REFLECTIONS",
    blurb: "Cycle narrative, annotations, and reflection lanes.",
    path: "?chamber=reflections",
  },
  "10,6": {
    id: "hive",
    label: "HIVE CORE",
    blurb: "Central portal into the Mobius browser shell.",
    path: "?chamber=hive",
  },
};

const ZONE_LABELS = [
  { x: 2, y: 2, text: "SENTINEL QTR", color: "#7ab8ff" },
  { x: 13, y: 2, text: "OAA HUB", color: "#ffb47a" },
  { x: 2, y: 9, text: "VAULT DIST", color: "#8cffa8" },
  { x: 12, y: 9, text: "REFLECTIONS", color: "#c88cff" },
  { x: 7, y: 5, text: "HIVE CORE", color: "#e8c547" },
];

const TILE_COLORS = {
  T: { fill: "#0d2818", edge: "#1a4a2e" },
  G: { fill: "#0f1f14", edge: "#1a3322" },
  P: { fill: "#15152a", edge: "#2a2a48" },
  W: { fill: "#1a2a4a", edge: "#3a5a8a" },
  F: { fill: "#1a2440", edge: "#3a4a70" },
  O: { fill: "#0a2030", edge: "#3dffea" },
};

const DEFAULT_WORLD = {
  cycle: "C-315",
  integrity: { gi: 0.72, kv_status: "ok" },
  vault: { progress: 0.65, fountain_status: "locked" },
  active_events: ["signal-fog"],
  active_quests: ["restore-the-beacon"],
  active_sentinels: ["zeus", "jade", "hermes"],
  world_mood: "fogged",
};

const DEFAULT_NPCS = [
  { id: "zeus", name: "ZEUS", x: 3, y: 3, color: "#4a9fff", lines: ["Hold the line.", "We do not ship fog as truth."] },
  { id: "hermes", name: "HERMES", x: 15, y: 3, color: "#ff9a4a", lines: ["Movement gathers near the Fountain.", "Flow strengthens; keep it steady."] },
  { id: "eve", name: "EVE", x: 3, y: 11, color: "#8cffa8", lines: ["Vault state is terrain.", "Progress is never silent data."] },
  { id: "jade", name: "JADE", x: 16, y: 11, color: "#b47aff", lines: ["The chamber remembers.", "Even in fog, the record persists."] },
  { id: "atlas", name: "ATLAS", x: 9, y: 7, color: "#e8c547", lines: ["No drama is also data.", "Log the null result."] },
];

function assertMap() {
  for (let y = 0; y < MAP.length; y++) {
    if (MAP[y].length !== COLS) {
      throw new Error(`MAP row ${y} length ${MAP[y].length} expected ${COLS}`);
    }
  }
  if (MAP.length !== ROWS) {
    throw new Error(`MAP rows ${MAP.length} expected ${ROWS}`);
  }
}

function tileAt(x, y) {
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return "T";
  return MAP[y][x];
}

function canWalk(x, y) {
  return WALK.has(tileAt(x, y));
}

function parseParams() {
  const u = new URL(window.location.href);
  return {
    demo: u.searchParams.get("demo") === "1",
    shellBase: u.searchParams.get("shell") || "https://mobius-browser-shell.vercel.app",
    dataBase: u.searchParams.get("data") || "",
    commits: u.searchParams.get("commits") || "",
  };
}

function worldDataUrl(path) {
  const { dataBase } = parseParams();
  if (dataBase) {
    const normalized = dataBase.endsWith("/") ? dataBase : `${dataBase}/`;
    const absoluteBase = /^https?:\/\//i.test(normalized)
      ? normalized
      : new URL(normalized, window.location.origin).href;
    return new URL(path.replace(/^\//, ""), absoluteBase).href;
  }
  return new URL(path, window.location.origin).href;
}

async function fetchJson(path) {
  const res = await fetch(worldDataUrl(path), { cache: "no-store" });
  if (!res.ok) throw new Error(`${path} ${res.status}`);
  return res.json();
}

async function loadSentinel(id) {
  try {
    return await fetchJson(`/world/sentinels/${id}.json`);
  } catch {
    return null;
  }
}

async function hydrateWorld() {
  const params = parseParams();
  if (params.demo) {
    return { world: DEFAULT_WORLD, live: false, eventTitle: "Signal Fog", questTitle: "Restore the Beacon" };
  }
  try {
    const [world, cycle, event0, quest0] = await Promise.all([
      fetchJson("/world/current-world.json"),
      fetchJson("/world/current-cycle.json"),
      fetchJson("/world/events/signal-fog.json").catch(() => null),
      fetchJson("/world/quests/restore-the-beacon.json").catch(() => null),
    ]);
    const eid = world.active_event_id ?? world.active_events?.[0];
    const qid = world.active_quest_id ?? world.active_quests?.[0];
    let eventTitle = event0?.title || eid || "";
    let questTitle = quest0?.title || qid || "";
    if (eid && eid !== "signal-fog") {
      try {
        const ev = await fetchJson(`/world/events/${eid}.json`);
        eventTitle = ev.title || eid;
      } catch {
        eventTitle = eid;
      }
    }
    if (qid && qid !== "restore-the-beacon") {
      try {
        const q = await fetchJson(`/world/quests/${qid}.json`);
        questTitle = q.title || qid;
      } catch {
        questTitle = qid;
      }
    }
    return { world, cycle, live: true, eventTitle, questTitle };
  } catch {
    return { world: DEFAULT_WORLD, live: false, eventTitle: "Signal Fog", questTitle: "Restore the Beacon" };
  }
}

async function buildNpcs(world) {
  const ids = ["zeus", "hermes", "jade", "atlas"];
  const loaded = await Promise.all(ids.map(loadSentinel));
  const byId = Object.fromEntries(ids.map((id, i) => [id, loaded[i]]));

  const lineFrom = (s) =>
    s?.voice ||
    s?.runtime_overlay?.voice ||
    s?.dialogue?.default ||
    "…";

  const npcs = [
    {
      id: "zeus",
      name: byId.zeus?.display_name || "ZEUS",
      x: 3,
      y: 3,
      color: "#4a9fff",
      lines: [lineFrom(byId.zeus), byId.zeus?.title || "Sentinel of Integrity"].filter(Boolean),
    },
    {
      id: "hermes",
      name: byId.hermes?.display_name || "HERMES",
      x: 15,
      y: 3,
      color: "#ff9a4a",
      lines: [lineFrom(byId.hermes), byId.hermes?.title || "Sentinel of Flow"].filter(Boolean),
    },
    {
      id: "eve",
      name: "EVE",
      x: 3,
      y: 11,
      color: "#8cffa8",
      lines: [
        `Vault ${Math.round((world.vault?.progress ?? 0) * 100)}% — fountain ${world.vault?.fountain_status ?? "unknown"}.`,
        "Terrain remembers every commit.",
      ],
    },
    {
      id: "jade",
      name: byId.jade?.display_name || "JADE",
      x: 16,
      y: 11,
      color: "#b47aff",
      lines: [lineFrom(byId.jade), byId.jade?.title || "Sentinel of Reflection"].filter(Boolean),
    },
    {
      id: "atlas",
      name: byId.atlas?.display_name || "ATLAS",
      x: 9,
      y: 7,
      color: "#e8c547",
      lines: [lineFrom(byId.atlas), byId.atlas?.title || "Sentinel of Verification"].filter(Boolean),
    },
  ];
  return npcs;
}

function drawTile(ctx, x, y, ch, frame) {
  const px = x * TILE;
  const py = y * TILE;
  const pal = TILE_COLORS[ch] || TILE_COLORS.G;
  ctx.fillStyle = pal.fill;
  ctx.fillRect(px, py, TILE, TILE);
  ctx.strokeStyle = pal.edge;
  ctx.lineWidth = 1;
  ctx.strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);

  if (ch === "T") {
    ctx.fillStyle = "#0a3018";
    ctx.fillRect(px + 8, py + 4, 6, 14);
    ctx.fillRect(px + 6, py + 10, 10, 12);
  }

  if (ch === "O") {
    const pulse = 0.55 + 0.45 * Math.sin(frame * 0.08);
    ctx.strokeStyle = `rgba(61, 255, 234, ${pulse})`;
    ctx.lineWidth = 3;
    ctx.strokeRect(px + 4, py + 4, TILE - 8, TILE - 8);
    ctx.strokeStyle = `rgba(61, 255, 234, ${0.35 + 0.35 * pulse})`;
    ctx.beginPath();
    ctx.moveTo(px + TILE / 2, py + 8);
    ctx.lineTo(px + TILE / 2, py + TILE - 8);
    ctx.moveTo(px + 8, py + TILE / 2);
    ctx.lineTo(px + TILE - 8, py + TILE / 2);
    ctx.stroke();
  }
}

function drawNpc(ctx, npc, frame, nearbyId) {
  const px = npc.x * TILE;
  const py = npc.y * TILE;
  const bob = Math.sin(frame * 0.06 + npc.x) * 2;
  const ny = py + 4 + bob;

  if (nearbyId === npc.id) {
    ctx.strokeStyle = "rgba(61,255,234,0.5)";
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 2, py + 2, TILE - 4, TILE - 4);
  }

  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(px + 6, py + TILE - 6, 20, 4);

  ctx.fillStyle = npc.color;
  ctx.fillRect(px + 8, ny + 10, 16, 14);
  ctx.fillRect(px + 10, ny + 6, 12, 8);
  ctx.fillStyle = "#1a1020";
  ctx.fillRect(px + 11, ny + 8, 3, 3);
  ctx.fillRect(px + 16, ny + 8, 3, 3);

  ctx.fillStyle = "#f0f0ff";
  ctx.font = "7px 'Press Start 2P', monospace";
  ctx.textAlign = "center";
  ctx.fillText(npc.name, px + TILE / 2, py - 2);
}

function drawPlayer(ctx, x, y, frame) {
  const px = x * TILE;
  const py = y * TILE;
  const bob = Math.sin(frame * 0.12) * 1;
  const ny = py + 6 + bob;
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.fillRect(px + 7, py + TILE - 8, 18, 4);
  ctx.fillStyle = "#3dffea";
  ctx.fillRect(px + 8, ny + 8, 16, 14);
  ctx.fillRect(px + 10, ny + 4, 12, 8);
  ctx.fillStyle = "#0a1818";
  ctx.fillRect(px + 12, ny + 6, 3, 3);
  ctx.fillRect(px + 17, ny + 6, 3, 3);
  ctx.fillStyle = "#b8fff8";
  ctx.font = "6px 'Press Start 2P', monospace";
  ctx.textAlign = "center";
  ctx.fillText("YOU", px + TILE / 2, py + TILE - 2);
}

function drawZoneLabels(ctx) {
  ctx.font = "6px 'Press Start 2P', monospace";
  ctx.textAlign = "left";
  for (const z of ZONE_LABELS) {
    ctx.fillStyle = z.color;
    ctx.fillText(z.text, z.x * TILE + 2, z.y * TILE + 10);
  }
}

function drawFog(ctx, w, h, frame) {
  const g = ctx.createLinearGradient(0, 0, w, h);
  const t = frame * 0.02;
  g.addColorStop(0, `rgba(10, 40, 30, ${0.15 + 0.08 * Math.sin(t)})`);
  g.addColorStop(0.5, `rgba(8, 20, 40, ${0.22 + 0.06 * Math.cos(t * 1.1)})`);
  g.addColorStop(1, `rgba(10, 35, 25, ${0.18 + 0.07 * Math.sin(t * 0.9)})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function portalKey(x, y) {
  return `${x},${y}`;
}

function findAdjacentNpc(px, py, npcs) {
  for (const n of npcs) {
    const d = Math.abs(n.x - px) + Math.abs(n.y - py);
    if (d === 1) return n;
  }
  return null;
}

function main() {
  assertMap();

  const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById("game"));
  const ctx = canvas.getContext("2d");
  const hud = document.getElementById("hud");
  const dialogEl = document.getElementById("dialog");
  const dialogWho = document.getElementById("dialog-who");
  const dialogTxt = document.getElementById("dialog-txt");
  const portalOverlay = document.getElementById("portal-overlay");
  const portalTitle = document.getElementById("portal-title");
  const portalDesc = document.getElementById("portal-desc");
  const footerMeta = document.getElementById("footer-meta");
  const dpad = document.getElementById("dpad");

  const params = parseParams();
  footerMeta.textContent = params.commits ? `${params.commits} COMMITS · CC0` : "MOBIUS HIVE · CC0";

  dpad.innerHTML = `
    <button type="button" class="up" data-k="up">▲</button>
    <button type="button" class="left" data-k="left">◀</button>
    <button type="button" class="act" data-k="act">E</button>
    <button type="button" class="right" data-k="right">▶</button>
    <button type="button" class="down" data-k="down">▼</button>
  `;

  const keys = new Set();
  let player = { x: 10, y: 12 };
  let frame = 0;
  let moveCd = 0;
  /** @type {{ world: any, cycle?: any, live: boolean, eventTitle: string, questTitle: string } | null} */
  let bundle = null;
  /** @type {any[]} */
  let npcs = DEFAULT_NPCS;
  let dialogNpc = null;
  let dialogLine = 0;
  /** @type {null | { label: string; blurb: string; url: string }} */
  let activePortal = null;
  let nearbyHint = "";

  function syncHud() {
    if (!bundle) return;
    const w = bundle.world;
    const gi = Math.round((w.integrity?.gi ?? 0) * 100);
    const mic = Math.round(1000 + (w.vault?.progress ?? 0) * 337);
    const cycle = bundle.cycle?.cycle_id || w.cycle?.id || w.cycle || "—";
    const ev = bundle.eventTitle || w.active_event_id || w.active_events?.[0] || "";
    const qu = bundle.questTitle || w.active_quest_id || w.active_quests?.[0] || "";
    const liveTag = bundle.live ? "" : '<span class="muted"> DEMO DATA</span>';
    hud.innerHTML = `
      <span class="gold">MOBIUS HIVE</span>
      <span class="gold">CYCLE ${cycle}</span>
      <span class="green">MIC ${mic}</span>
      <span class="green">GI ${gi}%</span>
      <span class="red warn">${ev}</span>
      <span class="gold quest">${qu}</span>
      ${liveTag}
    `;
  }

  function openDialog(npc) {
    dialogNpc = npc;
    dialogLine = 0;
    dialogWho.textContent = npc.name;
    dialogTxt.textContent = npc.lines[0] || "…";
    dialogEl.classList.add("visible");
  }

  function advanceDialog() {
    if (!dialogNpc) return;
    dialogLine++;
    if (dialogLine >= dialogNpc.lines.length) {
      dialogEl.classList.remove("visible");
      dialogNpc = null;
      return;
    }
    dialogTxt.textContent = dialogNpc.lines[dialogLine];
  }

  function closePortal() {
    portalOverlay.classList.remove("visible");
    activePortal = null;
  }

  function openPortal(info) {
    const base = params.shellBase.replace(/\/$/, "");
    activePortal = {
      label: info.label,
      blurb: info.blurb,
      url: `${base}/${info.path.replace(/^\?/, "?")}`,
    };
    portalTitle.textContent = activePortal.label;
    portalDesc.textContent = activePortal.blurb;
    portalOverlay.classList.add("visible");
  }

  document.getElementById("portal-launch").onclick = () => {
    if (!activePortal) return;
    window.open(activePortal.url, "_blank", "noopener,noreferrer");
  };
  document.getElementById("portal-close").onclick = () => closePortal();

  function tryMove(dx, dy) {
    if (dialogNpc || activePortal) return;
    const nx = player.x + dx;
    const ny = player.y + dy;
    if (canWalk(nx, ny)) {
      player = { x: nx, y: ny };
    }
  }

  function interact() {
    if (activePortal) return;
    if (dialogNpc) {
      advanceDialog();
      return;
    }
    const pk = portalKey(player.x, player.y);
    const portal = PORTALS[pk];
    if (portal) {
      openPortal(portal);
      return;
    }
    const adj = findAdjacentNpc(player.x, player.y, npcs);
    if (adj) openDialog(adj);
  }

  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (k === "escape") {
      dialogEl.classList.remove("visible");
      dialogNpc = null;
      closePortal();
      return;
    }
    if (["arrowup", "w"].includes(k) || e.key === "ArrowUp") keys.add("up");
    if (["arrowdown", "s"].includes(k) || e.key === "ArrowDown") keys.add("down");
    if (["arrowleft", "a"].includes(k) || e.key === "ArrowLeft") keys.add("left");
    if (["arrowright", "d"].includes(k) || e.key === "ArrowRight") keys.add("right");
    if (k === "e") interact();
  });
  window.addEventListener("keyup", (e) => {
    const k = e.key.toLowerCase();
    if (["arrowup", "w"].includes(k) || e.key === "ArrowUp") keys.delete("up");
    if (["arrowdown", "s"].includes(k) || e.key === "ArrowDown") keys.delete("down");
    if (["arrowleft", "a"].includes(k) || e.key === "ArrowLeft") keys.delete("left");
    if (["arrowright", "d"].includes(k) || e.key === "ArrowRight") keys.delete("right");
  });

  dpad.addEventListener("pointerdown", (e) => {
    const t = /** @type {HTMLElement} */ (e.target);
    const k = t?.dataset?.k;
    if (!k) return;
    if (k === "act") {
      interact();
      return;
    }
    keys.add(k);
  });
  dpad.addEventListener("pointerup", () => keys.clear());
  dpad.addEventListener("pointerleave", () => keys.clear());

  hydrateWorld().then(async (b) => {
    bundle = b;
    npcs = await buildNpcs(b.world);
    syncHud();
  });

  function loop() {
    frame++;
    moveCd--;
    if (!dialogNpc && !activePortal && moveCd <= 0) {
      if (keys.has("up")) {
        tryMove(0, -1);
        moveCd = 4;
      } else if (keys.has("down")) {
        tryMove(0, 1);
        moveCd = 4;
      } else if (keys.has("left")) {
        tryMove(-1, 0);
        moveCd = 4;
      } else if (keys.has("right")) {
        tryMove(1, 0);
        moveCd = 4;
      }
    }

    const pk = portalKey(player.x, player.y);
    const onPortal = PORTALS[pk];
    const adj = findAdjacentNpc(player.x, player.y, npcs);
    if (onPortal) nearbyHint = `[E] ENTER ${onPortal.label}`;
    else if (adj && !dialogNpc) nearbyHint = `[E] TALK ${adj.name}`;
    else nearbyHint = "";

    const w = canvas.width;
    const h = canvas.height;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#050510";
    ctx.fillRect(0, 0, w, h);

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        drawTile(ctx, x, y, MAP[y][x], frame);
      }
    }

    drawZoneLabels(ctx);

    const fogOn = bundle
      ? (bundle.world?.active_event_id ?? bundle.world?.active_events?.[0]) === "signal-fog"
      : true;
    if (fogOn) drawFog(ctx, w, h, frame);

    const nearbyId = adj?.id ?? null;
    for (const n of npcs) drawNpc(ctx, n, frame, nearbyId);

    drawPlayer(ctx, player.x, player.y, frame);

    if (onPortal) {
      const pulse = 0.4 + 0.4 * Math.sin(frame * 0.1);
      ctx.strokeStyle = `rgba(61,255,234,${pulse})`;
      ctx.lineWidth = 3;
      ctx.strokeRect(player.x * TILE - 1, player.y * TILE - 1, TILE + 2, TILE + 2);
    }

    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, h - 22, w, 22);
    ctx.fillStyle = nearbyHint ? "#3dffea" : "#6a6a8a";
    ctx.font = "7px 'Press Start 2P', monospace";
    ctx.textAlign = "center";
    ctx.fillText(nearbyHint || "Explore the HIVE — data loads from /world/*.json", w / 2, h - 8);

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

main();
