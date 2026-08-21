/**
 * Discovery affordances — map visitor intent to existing chambers.
 * These verbs are navigation labels only; canonical TabId and publicName unchanged.
 */

import type { PublicChamber } from '../chambers';
import { EXTENDED_CHAMBERS } from '../chambers';
import type { OnboardingPath } from '../onboarding/paths';

export type ChamberIntention =
  | 'UNDERSTAND'
  | 'REMEMBER'
  | 'QUESTION'
  | 'OBSERVE'
  | 'DELIBERATE'
  | 'VERIFY'
  | 'PARTICIPATE'
  | 'PROTECT'
  | 'BUILD';

export interface IntentionMapping {
  action: ChamberIntention;
  label: string;
  /** Primary chamber id(s) — discovery routing only */
  chamberIds: string[];
}

export const CHAMBER_INTENTIONS: IntentionMapping[] = [
  { action: 'UNDERSTAND', label: 'Understand an idea', chamberIds: ['learn'] },
  { action: 'REMEMBER', label: 'Trace where it came from', chamberIds: ['memory'] },
  { action: 'QUESTION', label: 'Challenge what you believe', chamberIds: ['reflect', 'jade'] },
  { action: 'OBSERVE', label: 'See what is happening now', chamberIds: ['pulse'] },
  { action: 'DELIBERATE', label: 'Weigh disagreement', chamberIds: ['council'] },
  { action: 'VERIFY', label: 'Check what survived', chamberIds: ['archives'] },
  { action: 'PARTICIPATE', label: 'Act in the civic world', chamberIds: ['world'] },
  { action: 'PROTECT', label: 'Anticipate what could go wrong', chamberIds: ['shield'] },
  { action: 'BUILD', label: 'Preserve without corrupting', chamberIds: ['core'] },
];

export function chambersForIntention(action: ChamberIntention): PublicChamber[] {
  const mapping = CHAMBER_INTENTIONS.find(i => i.action === action);
  if (!mapping) return [];
  return mapping.chamberIds
    .map(id => EXTENDED_CHAMBERS.find(c => c.id === id))
    .filter((c): c is PublicChamber => c != null);
}

/** Best-fit onboarding path for a discovery intention (presentation routing only). */
export const INTENTION_TO_PATH: Record<ChamberIntention, OnboardingPath> = {
  UNDERSTAND: 'learner',
  REMEMBER: 'researcher',
  QUESTION: 'learner',
  OBSERVE: 'operator',
  DELIBERATE: 'researcher',
  VERIFY: 'researcher',
  PARTICIPATE: 'builder',
  PROTECT: 'operator',
  BUILD: 'builder',
};

const CHAMBER_ID_TO_FIRST: Record<string, string> = {
  learn: 'oaa',
  memory: 'epicon',
  pulse: 'terminal',
  world: 'hive',
  council: 'knowledge',
  archives: 'vault',
  reflect: 'reflections',
  shield: 'shield',
  jade: 'jade',
  core: 'cpc',
};

export function primaryChamberForIntention(action: ChamberIntention): PublicChamber | undefined {
  return chambersForIntention(action)[0];
}

/** Primary first-chamber slug for onboarding completion navigation. */
export function intentionToFirstChamber(action: ChamberIntention): string {
  const primary = primaryChamberForIntention(action);
  if (!primary) return 'hallway';
  return CHAMBER_ID_TO_FIRST[primary.id] ?? 'hallway';
}
