import type { HiveActionId, HivePlayableSave, HiveQuestState, HiveInteractionEvent } from './hive-action-types';
import type { HiveQuestStep } from './meshWorldTypes';

function newEventId(): string {
  return `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function stepById(quest: HiveQuestState, id: string): HiveQuestStep | undefined {
  return quest.steps?.find((s) => s.id === id);
}

function ensureSteps(quest: HiveQuestState): HiveQuestState {
  if (quest.steps && quest.steps.length > 0) return quest;
  return {
    ...quest,
    status: quest.status ?? 'active',
    progress: quest.progress ?? 0,
    steps: [
      { id: 'inspect', completed: false },
      { id: 'fallback', completed: false },
    ],
  };
}

export function mergeQuestFromBundle(
  quest: HiveQuestState | null | undefined,
  bundleQuest: HiveQuestState | null,
): HiveQuestState {
  const base = bundleQuest
    ? { ...bundleQuest, ...quest, id: bundleQuest.id, title: bundleQuest.title }
    : quest ?? {
        id: 'restore-the-beacon',
        title: 'Restore the Beacon',
        objective: 'Stabilize the mesh.',
      };
  return ensureSteps(base);
}

export function defaultSaveFromBundle(
  seedCycleId: string,
  bundleQuest: HiveQuestState | null,
): HivePlayableSave {
  const quest = mergeQuestFromBundle(undefined, bundleQuest);
  return {
    version: 1,
    seed_cycle_id: seedCycleId,
    quest,
    dialogue_acknowledged: false,
    active_event_id: null,
    interaction_log: { cycle: seedCycleId, events: [] },
  };
}

export function zeusDialogue(save: HivePlayableSave): string {
  if (save.dialogue_acknowledged) {
    return 'Understood. The mesh holds while you work.';
  }
  const q = ensureSteps(save.quest);
  const inspect = stepById(q, 'inspect')?.completed === true;
  const fallback = stepById(q, 'fallback')?.completed === true;
  if (!inspect) {
    return 'The Beacon has not been examined.';
  }
  if (inspect && !fallback) {
    return 'You see the fracture. Now stabilize it.';
  }
  return 'The signal stabilizes. The fog recedes.';
}

export interface HiveActionResult {
  save: HivePlayableSave;
  logEntry: HiveInteractionEvent;
  /** True when both quest steps are complete. */
  questComplete: boolean;
}

const ALLOWED: HiveActionId[] = ['inspect_beacon', 'view_fallback_path', 'acknowledge_sentinel'];

export function applyHiveAction(
  save: HivePlayableSave,
  action: string,
  cycle: string,
  actor: string,
): { ok: true; result: HiveActionResult } | { ok: false; error: string } {
  if (!ALLOWED.includes(action as HiveActionId)) {
    return { ok: false, error: 'Invalid action' };
  }
  const aid = action as HiveActionId;

  let next: HivePlayableSave = {
    ...save,
    quest: { ...ensureSteps(save.quest) },
    interaction_log: {
      cycle: save.interaction_log.cycle,
      events: [...save.interaction_log.events],
    },
  };

  const logEntry: HiveInteractionEvent = {
    id: newEventId(),
    at: new Date().toISOString(),
    action: aid,
    cycle,
    actor,
  };

  if (aid === 'acknowledge_sentinel') {
    next.dialogue_acknowledged = true;
    next.interaction_log.events.push(logEntry);
    return {
      ok: true,
      result: { save: next, logEntry, questComplete: isQuestComplete(next.quest) },
    };
  }

  const q = ensureSteps(next.quest);
  const steps = (q.steps ?? []).map((s) => ({ ...s }));

  if (aid === 'inspect_beacon') {
    const idx = steps.findIndex((s) => s.id === 'inspect');
    if (idx >= 0) steps[idx] = { ...steps[idx]!, completed: true };
    const done = steps.filter((s) => s.completed).length;
    next.quest = { ...q, steps, progress: done / steps.length, status: 'active' };
  }

  if (aid === 'view_fallback_path') {
    const inspectDone = steps.find((s) => s.id === 'inspect')?.completed === true;
    if (!inspectDone) {
      return { ok: false, error: 'Inspect the Beacon first.' };
    }
    const idx = steps.findIndex((s) => s.id === 'fallback');
    if (idx >= 0) steps[idx] = { ...steps[idx]!, completed: true };
    const done = steps.filter((s) => s.completed).length;
    next.quest = { ...q, steps, progress: done / steps.length, status: 'active' };
    next.kv_status = 'ok';
  }

  const inspectDone = steps.find((s) => s.id === 'inspect')?.completed === true;
  const fallbackDone = steps.find((s) => s.id === 'fallback')?.completed === true;

  if (inspectDone && fallbackDone) {
    next.quest = { ...next.quest, steps, progress: 1, status: 'completed' };
    next.active_event_id = null;
    next.kv_status = next.kv_status ?? 'ok';
  }

  next.interaction_log.events.push(logEntry);
  next.interaction_log.cycle = cycle;

  return {
    ok: true,
    result: {
      save: next,
      logEntry,
      questComplete: isQuestComplete(next.quest),
    },
  };
}

function isQuestComplete(quest: HiveQuestState): boolean {
  const q = ensureSteps(quest);
  const inspect = stepById(q, 'inspect')?.completed === true;
  const fallback = stepById(q, 'fallback')?.completed === true;
  return q.status === 'completed' || (inspect && fallback);
}
