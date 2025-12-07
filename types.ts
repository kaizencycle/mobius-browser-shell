export enum TabId {
  OAA = 'OAA_HUB',
  HIVE = 'HIVE_LAB',
  REFLECTIONS = 'REFLECTIONS',
  SHIELD = 'CITIZEN_SHIELD',
  WALLET = 'WALLET'
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