import { Sentinel, LearningThread, ReflectionEntry, ShieldAlert } from './types';

export const SENTINELS: Sentinel[] = [
  { id: 'atlas', name: 'ATLAS', role: 'Context & Memory', status: 'active', integrity: 0.99 },
  { id: 'aurea', name: 'AUREA', role: 'Integrity Custodian', status: 'idle', integrity: 1.0 },
  { id: 'echo', name: 'ECHO', role: 'Temporal Sync', status: 'idle', integrity: 0.98 },
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