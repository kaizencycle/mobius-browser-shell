export enum TabId {
  OAA = 'OAA_HUB',
  HIVE = 'HIVE_LAB',
  REFLECTIONS = 'REFLECTIONS',
  SHIELD = 'CITIZEN_SHIELD',
  JADE = 'JADE_CHAMBER',
  WALLET = 'WALLET',
  KNOWLEDGE_GRAPH = 'KNOWLEDGE_GRAPH'
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

// ============================================
// Learning Hub Types
// Learn-to-earn system with MIC rewards
// ============================================

export type LearningDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type LearningModuleStatus = 'not_started' | 'in_progress' | 'completed';

export interface LearningTopic {
  id: string;
  name: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
}

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  difficulty: LearningDifficulty;
  estimatedMinutes: number;
  micReward: number;
  topics: string[];
  questions: QuizQuestion[];
  completed: boolean;
  progress: number; // 0-100
  completedAt?: string;
}

export interface LearningSession {
  moduleId: string;
  startTime: Date;
  endTime?: Date;
  questionsAnswered: number;
  correctAnswers: number;
  micEarned: number;
}

export interface UserLearningProgress {
  totalMicEarned: number;       // MIC IS the XP — sole progression currency
  modulesCompleted: number;
  currentStreak: number;
  bestStreak: number;
  totalLearningMinutes: number;
  totalCorrect: number;
  totalQuestions: number;
  level: number;                // Derived from totalMicEarned
  lastActivityDate?: string;
}

export interface QuizAttempt {
  questionId: string;
  selectedAnswer: number;
  isCorrect: boolean;
  timeSpentSeconds: number;
}

export interface ModuleCompletionResult {
  moduleId: string;
  accuracy: number;
  micEarned: number;            // MIC is the sole reward currency
  baseMic: number;
  streakBonus: number;
  perfectBonus: number;
  newLevel?: number;
  leveledUp?: boolean;
}

// ============================================
// Knowledge Graph Types
// Temporal Epistemic Graph for tracking learning journey
// ============================================

export type KnowledgeNodeType = 'concept' | 'artifact' | 'intent';
export type KnowledgeDomain = 'reflection' | 'learning' | 'civic' | 'system' | 'personal';
export type KnowledgeEdgeType = 'co-occurs' | 'builds-on' | 'motivates' | 'contrasts';

export interface KnowledgeNode {
  id: string;
  label: string;
  type: KnowledgeNodeType;
  domain: KnowledgeDomain;
  weight: number;           // Frequency / importance (higher = more central)
  firstSeen: string;        // ISO timestamp
  lastSeen: string;         // ISO timestamp
  sources: string[];        // IDs of reflections/modules that reference this node
  metadata?: {
    description?: string;
    intentHorizon?: string; // For intent nodes: "30d", "90d", etc.
    goalText?: string;      // For intent nodes: the user's stated goal
    completed?: boolean;    // For intent nodes: was the intent achieved
  };
}

export interface KnowledgeEdge {
  id: string;
  source: string;           // Node ID
  target: string;           // Node ID
  type: KnowledgeEdgeType;
  strength: number;         // 0-1, how strong the connection
  evidence: string[];       // Source IDs that support this edge
  firstSeen: string;
  lastSeen: string;
}

export interface KnowledgeGraph {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  metadata: {
    lastUpdated: string;
    totalConcepts: number;
    totalConnections: number;
    dominantDomains: KnowledgeDomain[];
  };
}

// For the force-graph visualization
export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface GraphNode {
  id: string;
  label: string;
  type: KnowledgeNodeType;
  domain: KnowledgeDomain;
  weight: number;
  val?: number;             // Node size for force-graph
  color?: string;
}

export interface GraphLink {
  source: string;
  target: string;
  type: KnowledgeEdgeType;
  strength: number;
  color?: string;
}

// Intent Horizon for goal setting
export interface IntentHorizon {
  id: string;
  goal: string;
  horizon: '7d' | '30d' | '90d' | '1y' | 'open';
  createdAt: string;
  targetDate?: string;
  relatedConcepts: string[];  // Node IDs
  status: 'active' | 'completed' | 'abandoned';
  progress: number;           // 0-100
  reflections: string[];      // Reflection IDs that mention this intent
}

// JADE Knowledge Graph Analysis
export interface JADEGraphInsight {
  type: 'dominant_theme' | 'neglected_area' | 'emerging_cluster' | 'suggested_connection' | 'knowledge_gap';
  title: string;
  description: string;
  relatedNodes: string[];
  confidence: number;
  actionable?: string;
}