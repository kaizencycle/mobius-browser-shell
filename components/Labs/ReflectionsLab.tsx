// components/Labs/ReflectionsLab.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  BookOpen,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  PenLine,
  Trash2,
  Network,
} from 'lucide-react';
import { useKnowledgeGraph } from '../../contexts/KnowledgeGraphContext';
import { useWallet } from '../../contexts/WalletContext';

type PhaseId = 'raw' | 'mirror' | 'reframe' | 'recode';
type ReflectionRewardId = 'spark' | 'geist_mode' | 'epiphany';
type ReflectionAnalysis = ReturnType<typeof analyzeReflection>;

interface Phase {
  id: PhaseId;
  label: string;
  prompt: string;
  helper: string;
  content: string;
}

interface ReflectionEntry {
  id: string;
  createdAt: string;
  title: string;
  phases: Phase[];
  rewardClaims: ReflectionRewardId[];
  rewardRollMilestone: number;
}

const STORAGE_KEY = 'mobius_reflections_v1';
const SUBSTANTIVE_PHASE_WORDS = 12;
const HIDDEN_REWARD_WORD_STEP = 48;

const REFLECTION_REWARDS: Array<{
  id: ReflectionRewardId;
  source: string;
  mic: number;
  minWords: number;
  minCompletedPhases: number;
  baseChance: number;
  signalBoostChance: number;
}> = [
  {
    id: 'spark',
    source: 'reflection_spark',
    mic: 4,
    minWords: 24,
    minCompletedPhases: 1,
    baseChance: 0.16,
    signalBoostChance: 0.08,
  },
  {
    id: 'geist_mode',
    source: 'reflection_geist_mode',
    mic: 7,
    minWords: 90,
    minCompletedPhases: 3,
    baseChance: 0.11,
    signalBoostChance: 0.07,
  },
  {
    id: 'epiphany',
    source: 'reflection_epiphany',
    mic: 12,
    minWords: 160,
    minCompletedPhases: 4,
    baseChance: 0.07,
    signalBoostChance: 0.06,
  },
];

const PHASE_TEMPLATE: Omit<Phase, 'content'>[] = [
  {
    id: 'raw',
    label: 'I. Today',
    prompt: "What's your intent for today?",
    helper:
      "Name your focus for *this* cycle. What would make today feel meaningful, even in a small way?",
  },
  {
    id: 'mirror',
    label: 'II. Worldview',
    prompt: "How's your worldview right now?",
    helper:
      "Describe how you're seeing the world at this moment — hopeful, tired, curious, anxious, inspired? Why?",
  },
  {
    id: 'reframe',
    label: 'III. Tomorrow',
    prompt: "What is your intent for tomorrow?",
    helper:
      "If tomorrow were a quiet upgrade from today, what would you want to practice, fix, or gently improve?",
  },
  {
    id: 'recode',
    label: 'IV. Future World',
    prompt: "What are your goals for the future world?",
    helper:
      "Zoom out. What kind of world do you want to help build — and what tiny action connects you to that horizon?",
  },
];

function countWords(input: string): number {
  const text = input.trim();
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

function analyzeReflection(entry: ReflectionEntry) {
  const totalWords = entry.phases.reduce((sum, phase) => sum + countWords(phase.content), 0);
  const completedPhaseCount = entry.phases.filter(
    (phase) => countWords(phase.content) >= SUBSTANTIVE_PHASE_WORDS
  ).length;
  const normalizedText = entry.phases.map((phase) => phase.content).join(' ').toLowerCase();

  const hasSparkSignal = /\b(spark|ignite|ignition|kindle)\b/.test(normalizedText);
  const hasGeistSignal = /\b(geist|giest|geist mode|spirit mode)\b/.test(normalizedText);
  const hasEpiphanySignal = /\b(epiphany|aha|breakthrough|clarity|reali[sz]ation)\b/.test(normalizedText);

  return {
    totalWords,
    completedPhaseCount,
    hasSparkSignal,
    hasGeistSignal,
    hasEpiphanySignal,
  };
}

function secureRandom01(): number {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const randomArray = new Uint32Array(1);
    crypto.getRandomValues(randomArray);
    return randomArray[0] / 0xffffffff;
  }
  return Math.random();
}

function signalBoostForReward(rewardId: ReflectionRewardId, analysis: ReflectionAnalysis): boolean {
  if (rewardId === 'spark') return analysis.hasSparkSignal;
  if (rewardId === 'geist_mode') return analysis.hasGeistSignal;
  return analysis.hasEpiphanySignal;
}

function rollHiddenReward(entry: ReflectionEntry, analysis: ReflectionAnalysis) {
  const claimed = new Set(entry.rewardClaims);
  const sortedRewards = [...REFLECTION_REWARDS].sort((a, b) => b.mic - a.mic);

  for (const reward of sortedRewards) {
    if (claimed.has(reward.id)) continue;
    if (analysis.totalWords < reward.minWords) continue;
    if (analysis.completedPhaseCount < reward.minCompletedPhases) continue;

    const hasSignalBoost = signalBoostForReward(reward.id, analysis);
    const chance = Math.min(
      0.9,
      reward.baseChance + (hasSignalBoost ? reward.signalBoostChance : 0)
    );
    if (secureRandom01() < chance) {
      return reward;
    }
  }

  return null;
}

function createNewEntry(): ReflectionEntry {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return {
    id,
    createdAt: new Date().toISOString(),
    title: 'Untitled reflection',
    phases: PHASE_TEMPLATE.map((p) => ({
      ...p,
      content: '',
    })),
    rewardClaims: [],
    rewardRollMilestone: 0,
  };
}

export const ReflectionsLab: React.FC = () => {
  const [entries, setEntries] = useState<ReflectionEntry[]>([]);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [activePhaseId, setActivePhaseId] = useState<PhaseId>('raw');
  const [conceptsExtracted, setConceptsExtracted] = useState(false);
  const [rewardNotice, setRewardNotice] = useState<string | null>(null);
  
  // Knowledge Graph integration
  const { extractAndAddConcepts, stats } = useKnowledgeGraph();
  const { earnMIC } = useWallet();

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as ReflectionEntry[];
      if (Array.isArray(parsed) && parsed.length) {
        const normalized = parsed.map((entry) => ({
          ...entry,
          rewardClaims: Array.isArray(entry.rewardClaims)
            ? entry.rewardClaims.filter((claim): claim is ReflectionRewardId =>
                REFLECTION_REWARDS.some((reward) => reward.id === claim)
              )
            : [],
          rewardRollMilestone:
            typeof entry.rewardRollMilestone === 'number' && entry.rewardRollMilestone >= 0
              ? Math.floor(entry.rewardRollMilestone)
              : 0,
        }));
        setEntries(normalized);
        setActiveEntryId(normalized[0].id);
      }
    } catch (e) {
      console.error('Failed to load reflections from storage', e);
    }
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (e) {
      console.error('Failed to save reflections to storage', e);
    }
  }, [entries]);

  const handleNewEntry = () => {
    const entry = createNewEntry();
    setEntries((prev) => [entry, ...prev]);
    setActiveEntryId(entry.id);
    setActivePhaseId('raw');
    setRewardNotice(null);
  };

  const handleSelectEntry = (id: string) => {
    setActiveEntryId(id);
    setActivePhaseId('raw');
    setRewardNotice(null);
  };

  const handleDeleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
    if (activeEntryId === id) {
      const remaining = entries.filter((e) => e.id !== id);
      setActiveEntryId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const handleTitleChange = (title: string) => {
    if (!activeEntryId) return;
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === activeEntryId ? { ...entry, title } : entry
      )
    );
  };

  const grantHiddenReward = useCallback(
    async ({
      reward,
      entry,
      analysis,
    }: {
      reward: (typeof REFLECTION_REWARDS)[number];
      entry: ReflectionEntry;
      analysis: ReflectionAnalysis;
    }) => {
      const success = await earnMIC(reward.source, {
        mic_earned: reward.mic,
        xp_earned: reward.mic,
        hidden_reward: true,
        reward_tier: reward.id,
        entry_id: entry.id,
        entry_title: entry.title,
        total_words: analysis.totalWords,
        completed_phases: analysis.completedPhaseCount,
        has_spark_signal: analysis.hasSparkSignal,
        has_geist_signal: analysis.hasGeistSignal,
        has_epiphany_signal: analysis.hasEpiphanySignal,
      });

      if (success) {
        setRewardNotice(`A hidden reflection bonus crystallized: +${reward.mic} MIC XP`);
      } else {
        setRewardNotice('A hidden reflection bonus was detected, but minting failed. Try again soon.');
      }
    },
    [earnMIC]
  );

  const handlePhaseChange = (phaseId: PhaseId, content: string) => {
    if (!activeEntryId) return;

    let hiddenRewardGrant:
      | {
          reward: (typeof REFLECTION_REWARDS)[number];
          entry: ReflectionEntry;
          analysis: ReflectionAnalysis;
        }
      | null = null;

    const updatedEntries = entries.map((entry) => {
      if (entry.id !== activeEntryId) return entry;

      let updatedEntry: ReflectionEntry = {
        ...entry,
        phases: entry.phases.map((phase) =>
          phase.id === phaseId ? { ...phase, content } : phase
        ),
      };

      const analysis = analyzeReflection(updatedEntry);
      const reachedMilestone = Math.floor(analysis.totalWords / HIDDEN_REWARD_WORD_STEP);

      if (reachedMilestone > updatedEntry.rewardRollMilestone) {
        for (
          let milestone = updatedEntry.rewardRollMilestone + 1;
          milestone <= reachedMilestone;
          milestone += 1
        ) {
          updatedEntry = { ...updatedEntry, rewardRollMilestone: milestone };
          if (hiddenRewardGrant) continue;

          const reward = rollHiddenReward(updatedEntry, analysis);
          if (!reward) continue;

          updatedEntry = {
            ...updatedEntry,
            rewardClaims: [...updatedEntry.rewardClaims, reward.id],
          };
          hiddenRewardGrant = { reward, entry: updatedEntry, analysis };
          break;
        }
      }

      return updatedEntry;
    });

    setEntries(updatedEntries);
    
    // Reset concepts extracted flag when content changes
    setConceptsExtracted(false);
    if (hiddenRewardGrant) {
      void grantHiddenReward(hiddenRewardGrant);
    }
  };

  // Extract concepts from reflection and add to knowledge graph
  const handleExtractConcepts = useCallback(() => {
    if (!activeEntryId) return;
    
    const entry = entries.find((e) => e.id === activeEntryId);
    if (!entry) return;
    
    // Combine all phase content
    const allContent = entry.phases
      .map((p) => p.content)
      .filter((c) => c.trim().length > 0)
      .join(' ');
    
    if (allContent.trim().length < 20) return; // Need some content
    
    // Extract concepts and add to knowledge graph
    extractAndAddConcepts(allContent, 'reflection', `reflection-${entry.id}`);
    setConceptsExtracted(true);
  }, [activeEntryId, entries, extractAndAddConcepts]);

  const activeEntry =
    activeEntryId && entries.find((e) => e.id === activeEntryId)
      ? entries.find((e) => e.id === activeEntryId)!
      : null;

  const activePhase =
    activeEntry?.phases.find((p) => p.id === activePhaseId) ?? null;
  const activePhaseIndex = PHASE_TEMPLATE.findIndex((phase) => phase.id === activePhaseId);
  const activeProgressPct = activeEntry
    ? Math.round(
        (activeEntry.phases.filter((phase) => phase.content.trim().length > 0).length /
          activeEntry.phases.length) *
          100
      )
    : 0;

  useEffect(() => {
    if (!rewardNotice) return;
    const timeoutId = window.setTimeout(() => setRewardNotice(null), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [rewardNotice]);

  return (
    <div className="h-full flex flex-col bg-stone-50 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-3 border-b border-stone-200 bg-white">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-md bg-stone-900 text-stone-50">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight text-stone-900">
              Reflections Lab
            </div>
            <div className="text-xs text-stone-500 hidden sm:block">
              Intent & Horizon Loop — daily kaizen through awareness
            </div>
          </div>
        </div>

        <button
          onClick={handleNewEntry}
          className="inline-flex items-center justify-center space-x-2 px-3 py-2 sm:py-1.5 rounded-md text-xs font-medium bg-stone-900 text-stone-50 hover:bg-stone-800 transition w-full sm:w-auto"
        >
          <Plus className="w-3 h-3" />
          <span>New entry</span>
        </button>
      </div>

      {/* Body: sidebar + editor */}
      <div className="flex-1 flex min-h-0 flex-col md:flex-row">
        {/* Left: entries list */}
        <aside className="w-64 border-r border-stone-200 bg-stone-100/60 flex-col hidden md:flex">
          <div className="px-4 py-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-600 tracking-wide">
              ENTRIES
            </span>
            {entries.length > 0 && (
              <span className="text-[10px] text-stone-400">
                {entries.length} saved
              </span>
            )}
          </div>

          <div className="flex-1 overflow-auto px-2 pb-2 space-y-1">
            {entries.length === 0 && (
              <div className="text-xs text-stone-400 px-2 py-4">
                No reflections yet.
                <br />
                Click <span className="font-semibold">New entry</span> to
                begin the loop.
              </div>
            )}

            {entries.map((entry) => {
              const date = new Date(entry.createdAt);
              const isActive = entry.id === activeEntryId;

              const progress =
                entry.phases.filter((p) => p.content.trim().length > 0)
                  .length / entry.phases.length;

              return (
                <button
                  key={entry.id}
                  onClick={() => handleSelectEntry(entry.id)}
                  className={`w-full text-left px-3 py-2 rounded-md border text-xs mb-1 flex flex-col space-y-1 ${
                    isActive
                      ? 'border-stone-900 bg-white shadow-sm'
                      : 'border-stone-200 bg-white/60 hover:border-stone-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[11px] text-stone-900 truncate mr-2">
                      {entry.title || 'Untitled reflection'}
                    </span>
                    <ChevronRight className="w-3 h-3 text-stone-300" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-stone-400">
                      {date.toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <div className="flex items-center space-x-1">
                      <div className="w-12 h-1.5 rounded-full bg-stone-200 overflow-hidden">
                        <div
                          className="h-full bg-stone-900"
                          style={{ width: `${progress * 100}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-stone-400">
                        {Math.round(progress * 100)}%
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Mobile entry selector dropdown */}
        {entries.length > 0 && (
          <div className="md:hidden border-b border-stone-200 bg-white px-4 py-2 space-y-2">
            <select
              value={activeEntryId || ''}
              onChange={(e) => handleSelectEntry(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-stone-200 rounded-md bg-white"
            >
              {entries.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.title || 'Untitled reflection'} —{' '}
                  {new Date(entry.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </option>
              ))}
            </select>
            {activeEntry && (
              <div className="flex items-center justify-between text-[11px] text-stone-500">
                <span>{activeProgressPct}% complete</span>
                <span>Private reflection ledger active</span>
              </div>
            )}
          </div>
        )}

        {/* Right: editor */}
        <section className="flex-1 flex flex-col min-w-0 min-h-0">
          {!activeEntry && (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <Sparkles className="w-8 h-8 text-stone-300 mb-3" />
              <div className="text-sm font-semibold text-stone-800">
                Start an Intent & Horizon Loop
              </div>
              <p className="text-xs text-stone-500 mt-2 max-w-sm">
                Each entry walks through four phases: Today → Worldview →
                Tomorrow → Future World. Small corrections, over and over, with dignity.
              </p>
              <button
                onClick={handleNewEntry}
                className="mt-4 inline-flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium bg-stone-900 text-stone-50 hover:bg-stone-800"
              >
                <Plus className="w-3 h-3" />
                <span>Begin new entry</span>
              </button>
            </div>
          )}

          {activeEntry && activePhase && (
            <>
              {/* Title + phase tabs */}
              <div className="border-b border-stone-200 bg-white px-4 sm:px-6 py-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="flex-1 min-w-0 flex items-center space-x-2">
                  <PenLine className="w-4 h-4 text-stone-400 flex-none" />
                  <input
                    className="w-full bg-transparent border-none outline-none text-sm font-semibold text-stone-900 placeholder:text-stone-400"
                    value={activeEntry.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Give this reflection a name…"
                  />
                  <button
                    onClick={() => handleDeleteEntry(activeEntry.id)}
                    className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    title="Delete entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center space-x-2 mt-2 md:mt-0 overflow-x-auto pb-1 md:pb-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {PHASE_TEMPLATE.map((phaseDef) => {
                    const done = !!activeEntry.phases.find(
                      (p) =>
                        p.id === phaseDef.id && p.content.trim().length > 0
                    );
                    const isActive = activePhaseId === phaseDef.id;

                    return (
                      <button
                        key={phaseDef.id}
                        onClick={() => setActivePhaseId(phaseDef.id)}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-medium border flex items-center space-x-1 whitespace-nowrap ${
                          isActive
                            ? 'bg-stone-900 text-stone-50 border-stone-900'
                            : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-400'
                        }`}
                      >
                        <span>{phaseDef.label}</span>
                        {done && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="md:hidden flex items-center justify-between gap-2">
                  <button
                    onClick={() =>
                      activePhaseIndex > 0 &&
                      setActivePhaseId(PHASE_TEMPLATE[activePhaseIndex - 1].id)
                    }
                    disabled={activePhaseIndex <= 0}
                    className="inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium rounded-md border border-stone-200 bg-stone-50 text-stone-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-3 h-3" />
                    Prev
                  </button>
                  <span className="text-[11px] text-stone-500">
                    Phase {activePhaseIndex + 1} / {PHASE_TEMPLATE.length}
                  </span>
                  <button
                    onClick={() =>
                      activePhaseIndex < PHASE_TEMPLATE.length - 1 &&
                      setActivePhaseId(PHASE_TEMPLATE[activePhaseIndex + 1].id)
                    }
                    disabled={activePhaseIndex >= PHASE_TEMPLATE.length - 1}
                    className="inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium rounded-md border border-stone-200 bg-stone-50 text-stone-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Phase editor */}
              <div className="flex-1 flex flex-col min-h-0 px-4 sm:px-6 py-4 space-y-3 overflow-auto">
                <div>
                  <div className="text-xs font-semibold text-stone-700 tracking-wide">
                    {activePhase.label}
                  </div>
                  <p className="text-xs text-stone-500 mt-1 max-w-xl">
                    {activePhase.prompt}
                  </p>
                </div>

                <textarea
                  className="flex-1 w-full min-h-[42vh] md:min-h-[200px] resize-none rounded-md border border-stone-200 bg-white px-3 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-900/60 focus:border-stone-900/60"
                  value={activePhase.content}
                  onChange={(e) =>
                    handlePhaseChange(activePhase.id, e.target.value)
                  }
                  placeholder={activePhase.helper}
                />

                <div className="text-[11px] text-stone-400 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-1">
                  <span>
                    💾 Your words are stored locally in this browser only. Future
                    Mobius versions can sync this to your HIVE node.
                  </span>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <span className="hidden sm:inline text-stone-400">
                      Tip: You can always return later to complete the remaining
                      phases.
                    </span>
                    {/* Knowledge Graph Integration */}
                    <button
                      onClick={handleExtractConcepts}
                      className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-2 sm:py-1 rounded-md text-[11px] font-medium transition-all w-full sm:w-auto ${
                        conceptsExtracted
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-stone-100 text-stone-600 border border-stone-200 hover:bg-stone-200 hover:border-stone-300'
                      }`}
                      title="Extract concepts and add to your Knowledge Graph"
                    >
                      <Network className="w-3 h-3" />
                      {conceptsExtracted ? (
                        <span>Added to Graph ✓</span>
                      ) : (
                        <span>Map to Graph</span>
                      )}
                    </button>
                  </div>
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 space-y-2">
                  <div className="text-[11px] font-semibold text-amber-700">
                    Reflection XP Loop (hidden RNG)
                  </div>
                  <div className="text-[10px] text-amber-700/80">
                    Bonus rewards trigger stochastically as your reflection deepens. The reward
                    path is intentionally private to prevent gamification.
                  </div>
                  {rewardNotice && (
                    <div className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-1">
                      {rewardNotice}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};
