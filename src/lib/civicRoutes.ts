/**
 * civicRoutes.ts — History-API routing for the School of Chambers.
 * C-367: promotes #hallway fragments to real, indexable paths.
 *
 * EPICON note: navigation only. No data writes; EP-1.
 */

import { useCallback, useEffect, useState } from 'react';
import { TabId } from '../../types';

const ORIGIN = 'https://mobius-substrate.com';
const HALLWAY_TITLE = 'Hallway — Mobius Substrate';

export interface ChamberRoute {
  path: string;
  tabId: TabId;
  title: string;
  description: string;
}

/** Indexable chamber routes (sitemap-aligned). */
export const CHAMBER_ROUTES = {
  hallway: {
    path: '/hallway',
    tabId: TabId.HALLWAY,
    title: HALLWAY_TITLE,
    description:
      'The hallway of the School of Chambers. Seven doors: Learn, Memory, Pulse, World, Council, Archives, Core.',
  },
  learn: {
    path: '/chambers/learn',
    tabId: TabId.OAA,
    title: 'Learn (OAA) — Mobius Substrate',
    description:
      'The Learn chamber: guided OAA seminars. Prove comprehension, collect Fractal Shards, and build your integrity portfolio — not passive consumption.',
  },
  memory: {
    path: '/chambers/memory',
    tabId: TabId.EPICON,
    title: 'Memory (EPICON Ledger) — Mobius Substrate',
    description:
      'The Memory chamber: the EPICON ledger. Every consequential action leaves a recorded, attestable intent.',
  },
  pulse: {
    path: '/chambers/pulse',
    tabId: TabId.HALLWAY,
    title: 'Pulse (Civic Terminal) — Mobius Substrate',
    description:
      'The Pulse chamber: live civic terminal. Cycles, seals, and Global Integrity in real time.',
  },
  world: {
    path: '/chambers/world',
    tabId: TabId.HIVE,
    title: 'World (HIVE) — Mobius Substrate',
    description:
      'The World chamber: the HIVE civilization shell. Ten realms, one integrity ledger.',
  },
  council: {
    path: '/chambers/council',
    tabId: TabId.KNOWLEDGE_GRAPH,
    title: 'Council (DVA) — Mobius Substrate',
    description:
      'The Council chamber: the sentinel runtime. ATLAS, ZEUS, EVE, JADE, AUREA and the seal quorum.',
  },
  archives: {
    path: '/chambers/archives',
    tabId: TabId.VAULT,
    title: 'Archives (Reserve Blocks) — Mobius Substrate',
    description:
      'The Archives chamber: sealed Reserve Blocks in append-only cold canon. History you can replay.',
  },
  core: {
    path: '/chambers/core',
    tabId: TabId.EPICON,
    title: 'Core (Civic Protocol) — Mobius Substrate',
    description:
      'The Core chamber: Civic Protocol identity, MIC wallet, and the constitutional substrate.',
  },
} satisfies Record<string, ChamberRoute>;

const HALLWAY_ROUTE = CHAMBER_ROUTES.hallway;

/** Extended in-app chambers (not in sitemap; legacy hash support). */
const EXTENDED_TAB_ROUTES: Partial<Record<TabId, ChamberRoute>> = {
  [TabId.REFLECTIONS]: {
    path: '/chambers/reflect',
    tabId: TabId.REFLECTIONS,
    title: 'Reflect — Mobius Substrate',
    description: 'Journal, mood, and reflection in the School of Chambers.',
  },
  [TabId.SHIELD]: {
    path: '/chambers/shield',
    tabId: TabId.SHIELD,
    title: 'Shield — Mobius Substrate',
    description: 'Citizen Shield — civic defense and threat awareness.',
  },
  [TabId.JADE]: {
    path: '/chambers/jade',
    tabId: TabId.JADE,
    title: 'Jade — Mobius Substrate',
    description: 'Jade chamber — integrity reflection and MII signals.',
  },
  [TabId.WALLET]: {
    path: '/chambers/wallet',
    tabId: TabId.WALLET,
    title: 'Wallet — Mobius Substrate',
    description: 'Fractal Shard portfolio and civic identity.',
  },
};

const PATH_TO_ROUTE: Record<string, ChamberRoute> = Object.fromEntries(
  [...Object.values(CHAMBER_ROUTES), ...Object.values(EXTENDED_TAB_ROUTES)]
    .filter(Boolean)
    .map((route) => [route.path, route]),
);

const TAB_TO_ROUTE: Partial<Record<TabId, ChamberRoute>> = {};
for (const route of Object.values(CHAMBER_ROUTES)) {
  if (!TAB_TO_ROUTE[route.tabId]) {
    TAB_TO_ROUTE[route.tabId] = route;
  }
}
Object.assign(TAB_TO_ROUTE, EXTENDED_TAB_ROUTES);

/** Legacy #hash → path (includes pre-C-367 internal tab hashes). */
const LEGACY_HASH_TO_PATH: Record<string, string> = {
  '#hallway': '/hallway',
  '#learn': '/chambers/learn',
  '#oaa': '/chambers/learn',
  '#memory': '/chambers/memory',
  '#epicon': '/chambers/memory',
  '#pulse': '/chambers/pulse',
  '#world': '/chambers/world',
  '#hive': '/chambers/world',
  '#council': '/chambers/council',
  '#knowledge': '/chambers/council',
  '#archives': '/chambers/archives',
  '#vault': '/chambers/archives',
  '#core': '/chambers/core',
  '#reflections': '/chambers/reflect',
  '#shield': '/chambers/shield',
  '#jade': '/chambers/jade',
  '#wallet': '/chambers/wallet',
};

function normalizePath(pathname: string): string {
  const trimmed = pathname.replace(/\/$/, '') || '/';
  return trimmed === '/' ? '/' : trimmed;
}

function routeFromLocation(loc: Location = window.location): ChamberRoute | null {
  const path = normalizePath(loc.pathname);

  if (path === '/') {
    const hash = loc.hash.toLowerCase();
    if (hash && LEGACY_HASH_TO_PATH[hash]) {
      return PATH_TO_ROUTE[LEGACY_HASH_TO_PATH[hash]] ?? null;
    }
    return null;
  }

  return PATH_TO_ROUTE[path] ?? null;
}

function pathForTab(tab: TabId): string {
  return TAB_TO_ROUTE[tab]?.path ?? HALLWAY_ROUTE.path;
}

function applyRouteMeta(route: ChamberRoute): void {
  document.title = route.title;

  const setMeta = (selector: string, attr: string, value: string) => {
    const el = document.head.querySelector<HTMLMetaElement | HTMLLinkElement>(selector);
    if (el) el.setAttribute(attr, value);
  };

  setMeta('meta[name="description"]', 'content', route.description);
  setMeta('meta[property="og:title"]', 'content', route.title);
  setMeta('meta[property="og:description"]', 'content', route.description);
  setMeta('meta[property="og:url"]', 'content', ORIGIN + route.path);
  setMeta('link[rel="canonical"]', 'href', ORIGIN + route.path);
}

function migrateLegacyHash(): void {
  const hash = window.location.hash.toLowerCase();
  if (!hash) return;

  const targetPath = LEGACY_HASH_TO_PATH[hash];
  if (!targetPath) return;

  window.history.replaceState(
    { tabId: PATH_TO_ROUTE[targetPath]?.tabId },
    '',
    targetPath,
  );
}

/**
 * History-API tab routing — drop-in replacement for useHashTab.
 */
export function usePathTab(
  defaultTab: TabId = TabId.HALLWAY,
): [TabId, (tab: TabId) => void] {
  const [activeTab, setActiveTabState] = useState<TabId>(() => {
    const route = routeFromLocation();
    return route?.tabId ?? defaultTab;
  });

  useEffect(() => {
    migrateLegacyHash();
    const route = routeFromLocation();
    if (route) applyRouteMeta(route);
  }, []);

  useEffect(() => {
    const onPopState = () => {
      const route = routeFromLocation();
      const tab = route?.tabId ?? defaultTab;
      setActiveTabState(tab);
      if (route) applyRouteMeta(route);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [defaultTab]);

  const setActiveTab = useCallback((tab: TabId) => {
    const route: ChamberRoute = TAB_TO_ROUTE[tab] ?? HALLWAY_ROUTE;
    const path = route.path;

    if (tab === TabId.HALLWAY) {
      window.history.replaceState({ tabId: tab }, '', path);
    } else {
      window.history.pushState({ tabId: tab }, '', path);
    }

    setActiveTabState(tab);
    applyRouteMeta(route);
  }, []);

  return [activeTab, setActiveTab];
}

export { pathForTab, routeFromLocation, applyRouteMeta };
