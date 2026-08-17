/**
 * Public-facing chamber metadata — School of Chambers language layer.
 */

import { TabId } from '../../types';
import { env } from '../../config/env';

export interface ChamberBadge {
  label: string;
  variant: 'featured' | 'live';
}

export interface PublicChamber {
  id: string;
  tabId: TabId | null;
  /** Tabler-outline icon name — see components/icons/ChamberIcons.tsx */
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
  badge?: ChamberBadge;
}

const TERMINAL_URL = `${env.terminalBase.replace(/\/+$/, '')}/terminal`;
/** Pulse chamber → live Terminal Globe (EPICON events, governance signals, civic heartbeat). */
const TERMINAL_GLOBE_URL = `${env.terminalBase.replace(/\/+$/, '')}/terminal/globe`;
const HANDBOOK_URL = env.canonicalDomain
  ? `${env.canonicalDomain.replace(/\/+$/, '')}/handbook`
  : 'https://handbook.mobius-substrate.com';

/** Seven public chambers shown in onboarding + hallway hero grid */
export const PUBLIC_CHAMBERS: PublicChamber[] = [
  {
    id: 'learn',
    tabId: TabId.OAA,
    icon: 'shield',
    publicName: 'Learn',
    canonName: 'Open Agent Architecture',
    tagline: 'Understand civic AI, constitutional integrity, and the Mobius framework.',
    room: '01',
    slug: 'LEARN',
    dClass: 'd-oaa',
    featured: true,
    badge: { label: 'Start here', variant: 'featured' },
  },
  {
    id: 'memory',
    tabId: TabId.EPICON,
    icon: 'database',
    publicName: 'Memory',
    canonName: 'EPICON Ledger',
    tagline: 'Build and verify personal knowledge through the Witness Protocol and evidence.',
    room: '02',
    slug: 'MEMORY',
    dClass: 'd-epicon',
    featured: true,
  },
  {
    id: 'pulse',
    tabId: null,
    icon: 'zap',
    publicName: 'Pulse',
    canonName: 'Civic Terminal',
    tagline: 'Track live EPICON events, governance signals, and civic heartbeat globally.',
    room: '03',
    slug: 'PULSE',
    dClass: 'd-pulse',
    externalUrl: TERMINAL_GLOBE_URL,
    featured: true,
    badge: { label: '● live', variant: 'live' },
  },
  {
    id: 'world',
    tabId: TabId.HIVE,
    icon: 'globe',
    publicName: 'World',
    canonName: 'HIVE',
    tagline: 'Engage with civic processes, communities, and measurable civic impact.',
    room: '04',
    slug: 'WORLD',
    dClass: 'd-hive',
    featured: true,
  },
  {
    id: 'council',
    tabId: TabId.KNOWLEDGE_GRAPH,
    icon: 'users',
    publicName: 'Council',
    canonName: 'DVA · Sentinels',
    tagline: 'Deliberate and decide collectively on civic governance and institutional direction.',
    room: '05',
    slug: 'COUNCIL',
    dClass: 'd-atlas',
    featured: true,
  },
  {
    id: 'archives',
    tabId: TabId.VAULT,
    icon: 'archive',
    publicName: 'Archives',
    canonName: 'Reserve Blocks',
    tagline: 'Access institutional memory, historical records, and canonical documentation.',
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
    icon: 'settings',
    publicName: 'Core',
    canonName: 'Civic Protocol',
    tagline: 'Technical foundations: block chain, sentinels, EPICON, and reserve architecture.',
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
