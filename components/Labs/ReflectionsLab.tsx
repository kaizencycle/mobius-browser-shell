// components/Labs/ReflectionsLab.tsx
import React, { useEffect, useState } from 'react';
import {
  Plus,
  BookOpen,
  Sparkles,
  ChevronRight,
  PenLine,
  Trash2,
} from 'lucide-react';

type PhaseId = 'raw' | 'mirror' | 'reframe' | 'recode';

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
}

const STORAGE_KEY = 'mobius_reflections_v1';

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
  };
}

export const ReflectionsLab: React.FC = () => {
  const [entries, setEntries] = useState<ReflectionEntry[]>([]);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [activePhaseId, setActivePhaseId] = useState<PhaseId>('raw');

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as ReflectionEntry[];
      if (Array.isArray(parsed) && parsed.length) {
        setEntries(parsed);
        setActiveEntryId(parsed[0].id);
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
  };

  const handleSelectEntry = (id: string) => {
    setActiveEntryId(id);
    setActivePhaseId('raw');
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

  const handlePhaseChange = (phaseId: PhaseId, content: string) => {
    if (!activeEntryId) return;

    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === activeEntryId
          ? {
              ...entry,
              phases: entry.phases.map((phase) =>
                phase.id === phaseId ? { ...phase, content } : phase
              ),
            }
          : entry
      )
    );
  };

  const activeEntry =
    activeEntryId && entries.find((e) => e.id === activeEntryId)
      ? entries.find((e) => e.id === activeEntryId)!
      : null;

  const activePhase =
    activeEntry?.phases.find((p) => p.id === activePhaseId) ?? null;

  return (
    <div className="h-full flex flex-col bg-stone-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-stone-200 bg-white">
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
          className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium bg-stone-900 text-stone-50 hover:bg-stone-800 transition"
        >
          <Plus className="w-3 h-3" />
          <span>New entry</span>
        </button>
      </div>

      {/* Body: sidebar + editor */}
      <div className="flex-1 flex min-h-0">
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
          <div className="md:hidden border-b border-stone-200 bg-white px-4 py-2">
            <select
              value={activeEntryId || ''}
              onChange={(e) => handleSelectEntry(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-stone-200 rounded-md bg-white"
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
          </div>
        )}

        {/* Right: editor */}
        <section className="flex-1 flex flex-col min-w-0">
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
                    className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    title="Delete entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center space-x-2 mt-2 md:mt-0 overflow-x-auto pb-1 md:pb-0">
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
                        className={`px-2 py-1 rounded-full text-[10px] font-medium border flex items-center space-x-1 whitespace-nowrap ${
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
                  className="flex-1 w-full min-h-[200px] resize-none rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-900/60 focus:border-stone-900/60"
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
                  <span className="hidden sm:inline text-stone-400">
                    Tip: You can always return later to complete the remaining
                    phases.
                  </span>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};
