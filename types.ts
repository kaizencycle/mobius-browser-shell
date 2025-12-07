export enum TabId {
  OAA = 'OAA_HUB',
  HIVE = 'HIVE_LAB',
  REFLECTIONS = 'REFLECTIONS',
  SHIELD = 'CITIZEN_SHIELD',
  WALLET = 'WALLET'
}

/**
 * Lab definition for the Mobius Browser Shell
 * Each lab can either display a live iframe or a demo UI
 */
export interface LabDefinition {
  id: TabId;
  name: string;
  description: string;
  url?: string;           // Live URL for iframe embedding
  comingSoon?: boolean;   // For labs not yet deployed
  useDemo?: boolean;      // Force demo mode even if URL exists
}

export interface Sentinel {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'thinking' | 'idle' | 'warning';
  integrity: number;
}

export interface LearningThread {
  id: string;
  title: string;
  progress: number;
  lastActive: string;
  tags: string[];
}

export interface ReflectionEntry {
  id: string;
  date: string;
  preview: string;
  mood: 'Neutral' | 'Curious' | 'Focused' | 'Anxious' | 'Flow';
  tags: string[];
}

export interface ShieldAlert {
  id: string;
  level: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  source: string;
}