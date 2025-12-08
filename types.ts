export enum TabId {
  OAA = 'OAA_HUB',
  HIVE = 'HIVE_LAB',
  REFLECTIONS = 'REFLECTIONS',
  SHIELD = 'CITIZEN_SHIELD',
  JADE = 'JADE_CHAMBER',
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

// ============================================
// Civic Radar Types
// Real-time security intelligence for Citizen Shield
// ============================================

export type CivicAlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type CivicAlertCategory = 'security' | 'breach' | 'policy' | 'misinformation' | 'privacy';

export interface CivicAlertAction {
  text: string;
  url?: string;
  module?: string;
}

export interface CivicAlertSource {
  name: string;
  url: string;
}

export interface CivicRadarAlert {
  id: string;
  timestamp: string;
  severity: CivicAlertSeverity;
  category: CivicAlertCategory;
  title: string;
  summary: string;
  impact: string;
  tags: string[];
  actions: CivicAlertAction[];
  sources: CivicAlertSource[];
}

export interface CivicRadarMetadata {
  lastUpdated: string;
  alertCount: number;
  criticalCount: number;
}

export interface CivicRadarResponse {
  alerts: CivicRadarAlert[];
  metadata: CivicRadarMetadata;
}