/**
 * C-357 localStorage abstraction — zero infrastructure client state.
 * Onboarding, OAA progress, chamber history, attestation queue.
 */

export const KEYS = {
  ONBOARDING: 'mobius_onboarding',
  VISITOR_ONBOARDING: 'mobius_visitor_onboarding',
  OAA_PROGRESS: 'mobius_oaa_progress',
  OAA_GRAPH: 'mobius_oaa_knowledge_graph',
  CHAMBER_HISTORY: 'mobius_chamber_history',
  ATTESTATION_QUEUE: 'mobius_attestation_queue',
  MIC_BALANCE_CACHE: 'mobius_mic_balance_cache',
} as const;

export interface OnboardingState {
  complete: boolean;
  path: 'learner' | 'operator' | 'researcher' | 'builder' | null;
  civic_id: string | null;
  currentStep: number;
  completed_at: string | null;
}

export interface OAAProgress {
  seminars_completed: number;
  quizzes_passed: number;
  mic_earned: number;
  last_seminar_id: string | null;
  knowledge_graph: KnowledgeGraphEdge[];
}

export interface KnowledgeGraphEdge {
  source_topic: string;
  target_topic: string;
  weight: number;
  confidence: number;
  last_updated: string;
}

export function getLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage quota — fail silently
  }
}

export function getOnboardingState(): OnboardingState {
  const visitor = getLocal<Partial<OnboardingState> & { civicId?: string }>(
    KEYS.VISITOR_ONBOARDING,
    {},
  );
  const canonical = getLocal<OnboardingState>(KEYS.ONBOARDING, {
    complete: false,
    path: null,
    civic_id: null,
    currentStep: 0,
    completed_at: null,
  });

  if (visitor.complete || visitor.path) {
    return {
      complete: visitor.complete ?? canonical.complete,
      path: (visitor.path as OnboardingState['path']) ?? canonical.path,
      civic_id: visitor.civicId ?? visitor.civic_id ?? canonical.civic_id,
      currentStep: visitor.currentStep ?? canonical.currentStep,
      completed_at: canonical.completed_at,
    };
  }

  return canonical;
}

export function syncOnboardingState(patch: Partial<OnboardingState>): void {
  const current = getOnboardingState();
  const next = { ...current, ...patch };
  setLocal(KEYS.ONBOARDING, next);
}

export function pushChamberHistory(chamberId: string): void {
  const history = getLocal<string[]>(KEYS.CHAMBER_HISTORY, []);
  const filtered = history.filter(id => id !== chamberId);
  setLocal(KEYS.CHAMBER_HISTORY, [chamberId, ...filtered].slice(0, 12));
}
