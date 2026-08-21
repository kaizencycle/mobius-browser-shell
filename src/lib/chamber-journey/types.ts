/**
 * Chamber journey schema — pedagogical encounter structure.
 * Presentation layer only; no route or TabId changes.
 */

export type LineageRelation =
  | 'influenced'
  | 'reinterpreted'
  | 'parallel'
  | 'responded-to'
  | 'derived-from'
  | 'uncertain';

export interface EvidenceRef {
  claim: string;
  source: string;
  date?: string;
  provenance?: string;
  confidence?: 'high' | 'medium' | 'low' | 'disputed';
  counterpoint?: string;
}

export interface LineageNode {
  id: string;
  label: string;
  period?: string;
  relation?: LineageRelation;
}

export interface Encounter {
  id: string;
  kind: 'hook' | 'position' | 'origin' | 'source' | 'modern' | 'friction' | 'counterpoint' | 'reinterpret' | 'reflect' | 'record';
  title: string;
  body: string;
  prompt?: string;
  evidence?: EvidenceRef[];
  lineage?: LineageNode[];
}

export interface Counterpoint {
  title: string;
  body: string;
  evidence?: EvidenceRef[];
}

export interface ChamberJourney {
  id: string;
  title: string;
  hook: string;
  openingQuestion: string;
  origin?: {
    period: string;
    context: string;
    source?: EvidenceRef;
  };
  encounters: Encounter[];
  frictionPrompt: string;
  counterpoint?: Counterpoint;
  reflectionPrompt: string;
  nextQuestions: string[];
}

/** Non-economic learning evidence — not XP, streaks, or ideological scoring. */
export interface LearningEvidenceRecord {
  journeyId: string;
  initialClaim: string;
  evidenceReviewed: string[];
  counterargumentEncountered: boolean;
  revisedClaim: string;
  revisionReason: string;
  uncertaintyRemaining: string;
  completedAt: string;
}

export type JourneyStepKind = Encounter['kind'];
