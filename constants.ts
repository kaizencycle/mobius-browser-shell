import { Sentinel, LearningThread, ReflectionEntry, ShieldAlert, LabDefinition, TabId } from './types';
import { env } from './config/env';

export const SENTINELS: Sentinel[] = [
  { id: 'atlas', name: 'ATLAS', role: 'Context & Memory', status: 'active', integrity: 0.99 },
  { id: 'aurea', name: 'AUREA', role: 'Integrity Custodian', status: 'idle', integrity: 1.0 },
  { id: 'echo', name: 'ECHO', role: 'Threat Intelligence', status: 'active', integrity: 0.98 },
  { id: 'jade', name: 'JADE', role: 'Pattern & Narrative', status: 'thinking', integrity: 0.99 },
  { id: 'eve', name: 'EVE', role: 'Ethics & Values', status: 'active', integrity: 0.99 },
];

export const MOCK_THREADS: LearningThread[] = [
  { id: '1', title: 'Thermodynamics & Information Theory', progress: 45, lastActive: '2 hours ago', tags: ['Physics', 'Systems'] },
  { id: '2', title: 'The History of Banking Systems', progress: 12, lastActive: 'Yesterday', tags: ['Economics', 'History'] },
  { id: '3', title: 'Regenerative Agriculture Models', progress: 88, lastActive: '3 days ago', tags: ['Ecology', 'Design'] },
];

export const MOCK_REFLECTIONS: ReflectionEntry[] = [
  { id: 'r1', date: 'Oct 24, 2025', preview: 'Realized today that optimization often kills resilience. The HIVE simulation showed...', mood: 'Curious', tags: ['Systems', 'Philosophy'] },
  { id: 'r2', date: 'Oct 23, 2025', preview: 'Felt resistance to starting the new module. Why? Perhaps fear of failing the...', mood: 'Anxious', tags: ['Personal', 'Growth'] },
];

export const MOCK_ALERTS: ShieldAlert[] = [
  { id: 'a1', level: 'medium', message: 'Unusual data egress pattern detected on port 8080.', source: 'Network Monitor' },
  { id: 'a2', level: 'low', message: '3 days since last local backup verification.', source: 'Data Hygiene' },
];

/**
 * Lab definitions for the Mobius Browser Shell
 * 
 * Each lab can operate in two modes:
 * 1. Live mode: Embeds the real deployed app via iframe
 * 2. Demo mode: Shows the local mock UI
 * 
 * Set VITE_USE_LIVE_LABS=true and provide URLs to enable live mode
 * 
 * Real Render Endpoints:
 * - OAA Learning Hub: https://lab7-proof.onrender.com
 * - Reflections: https://hive-api-2le8.onrender.com
 * - Citizen Shield: https://lab6-proof-api.onrender.com
 */
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
    name: 'HIVE (16-bit JRPG)',
    description: 'Collaborative governance JRPG – built by the community.',
    url: env.labs.hive,
    comingSoon: !env.labs.hive, // Coming soon unless URL is provided
  },
  {
    id: TabId.WALLET,
    name: 'Fractal Wallet',
    description: 'Your MIC balance, shards, and integrity ledger.',
    useDemo: true, // Wallet is always local UI
  },
];

/**
 * Get a lab definition by TabId
 */
export function getLabById(id: TabId): LabDefinition | undefined {
  return LABS.find(lab => lab.id === id);
}

/**
 * Get all labs that have live URLs
 */
export function getActiveLabs(): LabDefinition[] {
  return LABS.filter(lab => lab.url && !lab.comingSoon);
}

/**
 * Get all labs that are coming soon
 */
export function getComingSoonLabs(): LabDefinition[] {
  return LABS.filter(lab => lab.comingSoon);
}