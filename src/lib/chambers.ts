/**
 * Public-facing chamber metadata — School of Chambers language layer.
 */

import { TabId } from '../../types';
import { env } from '../../config/env';

export interface PublicChamber {
  id: string;
  tabId: TabId | null;
  icon: string;
  publicName: string;
  canonName: string;
  tagline: string;
  room: string;
  slug: string;
  dClass: string;
  externalUrl?: string;
  disabled?: boolean;
  featured?: boolean;
}

const TERMINAL_URL = `${env.terminalBase.replace(/\/+$/, '')}/terminal`;
const HANDBOOK_URL = env.canonicalDomain
  ? `${env.canonicalDomain.replace(/\/+$/, '')}/handbook`
  : 'https://handbook.mobius-substrate.com';

/** Seven public chambers shown in onboarding + hallway hero grid */
export const PUBLIC_CHAMBERS: PublicChamber[] = [
  {
    id: 'learn',
    tabId: TabId.OAA,
    icon: '📖',
    publicName: 'Learn',
    canonName: 'Open Agent Architecture',
    tagline: 'Guided seminars, quiz gates, MIC rewards.',
    room: '01',
    slug: 'LEARN',
    dClass: 'd-oaa',
    featured: true,
  },
  {
    id: 'memory',
    tabId: TabId.EPICON,
    icon: '🧠',
    publicName: 'Memory',
    canonName: 'EPICON Ledger',
    tagline: 'Attestations and actions the system remembers.',
    room: '02',
    slug: 'MEMORY',
    dClass: 'd-epicon',
    featured: true,
  },
  {
    id: 'pulse',
    tabId: null,
    icon: '⚡',
    publicName: 'Pulse',
    canonName: 'Civic Terminal',
    tagline: 'Live GI, sentinel journal, tripwire alerts.',
    room: '03',
    slug: 'PULSE',
    dClass: 'd-pulse',
    externalUrl: TERMINAL_URL,
    featured: true,
  },
  {
    id: 'world',
    tabId: TabId.HIVE,
    icon: '🌍',
    publicName: 'World',
    canonName: 'HIVE',
    tagline: 'Playable civic world — quests, signals, community.',
    room: '04',
    slug: 'WORLD',
    dClass: 'd-hive',
    featured: true,
  },
  {
    id: 'council',
    tabId: TabId.KNOWLEDGE_GRAPH,
    icon: '⚖️',
    publicName: 'Council',
    canonName: 'DVA · Sentinels',
    tagline: 'Agent council, knowledge graph, integrity review.',
    room: '05',
    slug: 'COUNCIL',
    dClass: 'd-atlas',
    featured: true,
  },
  {
    id: 'archives',
    tabId: TabId.VAULT,
    icon: '🗄️',
    publicName: 'Archives',
    canonName: 'Reserve Blocks',
    tagline: 'Sealed history — recover, replay, verify.',
    room: '06',
    slug: 'ARCHIVES',
    dClass: 'd-vault',
    featured: true,
  },
];

/** Additional rooms in the full hallway grid */
export const EXTENDED_CHAMBERS: PublicChamber[] = [
  ...PUBLIC_CHAMBERS,
  {
    id: 'reflect',
    tabId: TabId.REFLECTIONS,
    icon: '🪞',
    publicName: 'Reflect',
    canonName: 'Reflection Nook',
    tagline: 'Journal, mood, E.O.M.M. — past-you meets present-you.',
    room: '07',
    slug: 'REFLECT',
    dClass: 'd-reflect',
  },
  {
    id: 'shield',
    tabId: TabId.SHIELD,
    icon: '🛡',
    publicName: 'Shield',
    canonName: 'Citizen Shield',
    tagline: 'Civic radar and ECHO threat intelligence.',
    room: '08',
    slug: 'SHIELD',
    dClass: 'd-shield',
  },
  {
    id: 'jade',
    tabId: TabId.JADE,
    icon: '🍵',
    publicName: 'JADE',
    canonName: 'Tea Room',
    tagline: 'The room that asks why — Socratic inquiry.',
    room: '09',
    slug: 'JADE',
    dClass: 'd-jade',
  },
  {
    id: 'wallet',
    tabId: TabId.WALLET,
    icon: '◎',
    publicName: 'Wallet',
    canonName: 'MIC Treasury',
    tagline: 'Provenance over balance — ledger view.',
    room: '10',
    slug: 'TREASURY',
    dClass: 'd-wallet',
  },
  {
    id: 'core',
    tabId: TabId.EPICON,
    icon: '⬡',
    publicName: 'Core',
    canonName: 'Civic Protocol',
    tagline: 'Protocol rails — identity, ledger, EPICON intent.',
    room: '11',
    slug: 'CORE',
    dClass: 'd-mii',
    externalUrl: HANDBOOK_URL,
  },
];

export function chamberByTab(tabId: TabId): PublicChamber | undefined {
  return EXTENDED_CHAMBERS.find(c => c.tabId === tabId);
}

/** Document title — public chamber name only (C-363 language layer). */
export function chamberDocumentTitle(tabId: TabId): string {
  const chamber = chamberByTab(tabId);
  return chamber ? `${chamber.publicName} — Mobius Substrate` : 'Mobius Substrate';
}

/** Primary user-facing label for a chamber tab. */
export function chamberPublicName(tabId: TabId): string {
  return chamberByTab(tabId)?.publicName ?? 'Mobius';
}

/** Canonical subtitle shown beneath the public name. */
export function chamberCanonName(tabId: TabId): string {
  return chamberByTab(tabId)?.canonName ?? '';
}

export function pulseChamber(): PublicChamber {
  return PUBLIC_CHAMBERS.find((c) => c.id === 'pulse')!;
}
