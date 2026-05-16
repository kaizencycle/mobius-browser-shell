// components/Labs/ReflectionsEnhancements.tsx
// 20 UI/UX enhancement components for the Reflections Lab
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bold,
  Calendar,
  ChevronDown,
  Download,
  Flame,
  Hash,
  Italic,
  List,
  Maximize2,
  Minimize2,
  Network,
  Quote,
  Search,
  Sparkles,
  X,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Mood type and color map (from types.ts ReflectionEntry)
// ─────────────────────────────────────────────────────────────────────────────

export type Mood = 'Neutral' | 'Curious' | 'Focused' | 'Anxious' | 'Flow';

const MOOD_CONFIG: Record<Mood, { emoji: string; color: string; bg: string; score: number; border: string }> = {
  Neutral:  { emoji: '😐', color: 'text-slate-600',  bg: 'bg-slate-100',   border: 'border-slate-400',  score: 3 },
  Curious:  { emoji: '🔍', color: 'text-blue-600',   bg: 'bg-blue-100',    border: 'border-blue-400',   score: 4 },
  Focused:  { emoji: '🎯', color: 'text-violet-600', bg: 'bg-violet-100',  border: 'border-violet-400', score: 4 },
  Anxious:  { emoji: '😰', color: 'text-amber-600',  bg: 'bg-amber-100',   border: 'border-amber-400',  score: 2 },
  Flow:     { emoji: '🌊', color: 'text-teal-600',   bg: 'bg-teal-100',    border: 'border-teal-400',   score: 5 },
};

// ─────────────────────────────────────────────────────────────────────────────
// REF-01: EOMMCycleTracker — 4-phase progress bars (raw/mirror/reframe/recode)
// ─────────────────────────────────────────────────────────────────────────────

type PhaseId = 'raw' | 'mirror' | 'reframe' | 'recode';

const PHASE_COLORS: Record<PhaseId, string> = {
  raw:     'bg-amber-400',
  mirror:  'bg-blue-400',
  reframe: 'bg-violet-400',
  recode:  'bg-emerald-400',
};

const PHASE_LABELS: Record<PhaseId, string> = {
  raw:     'I. Today',
  mirror:  'II. Worldview',
  reframe: 'III. Tomorrow',
  recode:  'IV. Future',
};

interface EOMMCycleTrackerProps {
  activePhase: PhaseId;
  completedPhases: PhaseId[];
}

export const EOMMCycleTracker: React.FC<EOMMCycleTrackerProps> = ({
  activePhase,
  completedPhases,
}) => {
  const phases: PhaseId[] = ['raw', 'mirror', 'reframe', 'recode'];
  const activeIdx = phases.indexOf(activePhase);

  return (
    <div className="flex gap-1 items-end" role="progressbar" aria-label="EOMM phase progress">
      {phases.map((phase, idx) => {
        const isDone = completedPhases.includes(phase);
        const isActive = phase === activePhase;
        const isFuture = idx > activeIdx && !isDone;

        return (
          <div key={phase} className="flex flex-col items-center gap-1 flex-1">
            <span
              className={`text-[9px] font-semibold tracking-wider truncate transition-all ${
                isActive ? 'text-stone-800' : isDone ? 'text-stone-500' : 'text-stone-300'
              }`}
            >
              {PHASE_LABELS[phase]}
            </span>
            <div
              className={`w-full rounded-full transition-all duration-500 ${
                isActive ? 'h-2.5' : 'h-1.5'
              } ${
                isDone
                  ? PHASE_COLORS[phase]
                  : isActive
                  ? `${PHASE_COLORS[phase]} ring-1 ring-offset-1 ring-stone-300`
                  : isFuture
                  ? 'bg-stone-200'
                  : PHASE_COLORS[phase]
              }`}
            />
          </div>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// REF-02: MoodPicker — 5-button emoji grid
// ─────────────────────────────────────────────────────────────────────────────

interface MoodPickerProps {
  value: Mood | null;
  onChange: (mood: Mood) => void;
}

export const MoodPicker: React.FC<MoodPickerProps> = ({ value, onChange }) => {
  const moods = Object.keys(MOOD_CONFIG) as Mood[];

  return (
    <div className="flex gap-2 flex-wrap" role="group" aria-label="Select mood">
      {moods.map((mood) => {
        const cfg = MOOD_CONFIG[mood];
        const isSelected = value === mood;
        return (
          <button
            key={mood}
            type="button"
            onClick={() => onChange(mood)}
            aria-pressed={isSelected}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
              isSelected
                ? `${cfg.bg} ${cfg.color} ${cfg.border} ring-1 ring-current`
                : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
            }`}
          >
            <span className="text-base leading-none">{cfg.emoji}</span>
            <span>{mood}</span>
          </button>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// REF-03: useTagAutocomplete hook + TagAutocomplete component
// ─────────────────────────────────────────────────────────────────────────────

export function useTagAutocomplete(allTags: string[], query: string): string[] {
  return useMemo(() => {
    if (!query.trim()) return [];
    const lower = query.toLowerCase();
    return allTags
      .filter((tag) => tag.toLowerCase().includes(lower) && tag.toLowerCase() !== lower)
      .slice(0, 6);
  }, [allTags, query]);
}

interface TagAutocompleteProps {
  allTags: string[];
  value: string;
  onChange: (value: string) => void;
  onSelectTag: (tag: string) => void;
  placeholder?: string;
}

export const TagAutocomplete: React.FC<TagAutocompleteProps> = ({
  allTags,
  value,
  onChange,
  onSelectTag,
  placeholder = 'Add tag…',
}) => {
  const suggestions = useTagAutocomplete(allTags, value);
  const [focused, setFocused] = useState(false);
  const showSuggestions = focused && suggestions.length > 0;

  return (
    <div className="relative">
      <div className="flex items-center gap-1 border border-stone-200 rounded-lg px-2 py-1.5 bg-white focus-within:ring-1 focus-within:ring-stone-400">
        <Hash className="w-3 h-3 text-stone-400 flex-shrink-0" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder={placeholder}
          className="flex-1 text-xs bg-transparent outline-none text-stone-800 placeholder:text-stone-400"
        />
      </div>
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-stone-200 shadow-md z-20 py-1 overflow-hidden">
          {suggestions.map((tag) => (
            <button
              key={tag}
              type="button"
              onMouseDown={() => onSelectTag(tag)}
              className="w-full text-left px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-50 flex items-center gap-1.5"
            >
              <Hash className="w-3 h-3 text-stone-400" />
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// REF-04: EditorToolbar — bold/italic/bullet/quote insert buttons
// ─────────────────────────────────────────────────────────────────────────────

interface EditorToolbarProps {
  onInsert: (syntax: string, wrap?: boolean) => void;
}

const TOOLBAR_ACTIONS = [
  { icon: Bold,   label: 'Bold',        syntax: '**',   wrap: true  },
  { icon: Italic, label: 'Italic',      syntax: '_',    wrap: true  },
  { icon: List,   label: 'Bullet list', syntax: '- ',   wrap: false },
  { icon: Quote,  label: 'Blockquote',  syntax: '> ',   wrap: false },
] as const;

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ onInsert }) => (
  <div className="flex items-center gap-0.5 px-2 py-1 border border-stone-200 rounded-t-lg bg-stone-50 border-b-0">
    {TOOLBAR_ACTIONS.map(({ icon: Icon, label, syntax, wrap }) => (
      <button
        key={label}
        type="button"
        onClick={() => onInsert(syntax, wrap)}
        title={label}
        aria-label={label}
        className="p-1.5 rounded text-stone-500 hover:text-stone-800 hover:bg-stone-200 transition-colors"
      >
        <Icon className="w-3.5 h-3.5" />
      </button>
    ))}
    <div className="w-px h-4 bg-stone-200 mx-1" />
    <span className="text-[10px] text-stone-400 px-1">Markdown supported</span>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// REF-05: WordCountBar — word count + reading time + auto-save indicator
// ─────────────────────────────────────────────────────────────────────────────

import { AutoSaveStatus } from '../../hooks/useAutoSave';

const SAVE_STATUS_LABELS: Record<AutoSaveStatus, string> = {
  idle:    '',
  pending: '● Unsaved',
  saving:  '● Saving…',
  saved:   '✓ Saved',
  error:   '⚠ Save failed',
};

const SAVE_STATUS_COLORS: Record<AutoSaveStatus, string> = {
  idle:    'text-stone-400',
  pending: 'text-amber-500',
  saving:  'text-blue-500 animate-pulse',
  saved:   'text-emerald-600',
  error:   'text-red-500',
};

interface WordCountBarProps {
  wordCount: number;
  saveStatus: AutoSaveStatus;
}

export const WordCountBar: React.FC<WordCountBarProps> = ({ wordCount, saveStatus }) => {
  const readingMinutes = Math.max(1, Math.round(wordCount / 200));
  const label = SAVE_STATUS_LABELS[saveStatus];
  const color = SAVE_STATUS_COLORS[saveStatus];

  return (
    <div className="flex items-center justify-between text-[11px]">
      <div className="text-stone-400">
        {wordCount} word{wordCount !== 1 ? 's' : ''} · ~{readingMinutes} min read
      </div>
      {label && (
        <div className={`font-medium ${color}`} role="status" aria-live="polite">
          {label}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// REF-06: MoodSparkline — SVG 30-day mood trend chart
// ─────────────────────────────────────────────────────────────────────────────

interface MoodDataPoint {
  date: string;
  mood: Mood;
}

interface MoodSparklineProps {
  data: MoodDataPoint[];
  days?: number;
  width?: number;
  height?: number;
}

export const MoodSparkline: React.FC<MoodSparklineProps> = ({
  data,
  days = 30,
  width = 200,
  height = 40,
}) => {
  const points = useMemo(() => {
    const byDate: Record<string, number> = {};
    data.forEach(({ date, mood }) => {
      byDate[date] = MOOD_CONFIG[mood].score;
    });

    return Array.from({ length: days }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      const key = d.toISOString().slice(0, 10);
      return byDate[key] ?? null;
    });
  }, [data, days]);

  const validPoints = points.map((v, i) => ({ v, i })).filter((p) => p.v !== null);

  if (validPoints.length < 2) {
    return (
      <div className="text-[10px] text-stone-400 italic">Not enough data yet</div>
    );
  }

  const pathD = validPoints
    .map(({ v, i }, idx) => {
      const x = (i / (days - 1)) * width;
      const y = height - ((v! - 1) / 4) * (height - 8) - 4;
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div>
      <div className="text-[10px] text-stone-500 mb-1">30-day mood</div>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        <path d={pathD} fill="none" stroke="#6d28d9" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        {validPoints.slice(-1).map(({ v, i }) => {
          const x = (i / (days - 1)) * width;
          const y = height - ((v! - 1) / 4) * (height - 8) - 4;
          return <circle key="last" cx={x} cy={y} r={3} fill="#6d28d9" />;
        })}
      </svg>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// REF-07: DailyPromptBanner — shows current daily prompt with "Use this" button
// ─────────────────────────────────────────────────────────────────────────────

interface DailyPromptBannerProps {
  prompt: string | null;
  onUse: (prompt: string) => void;
}

export const DailyPromptBanner: React.FC<DailyPromptBannerProps> = ({ prompt, onUse }) => {
  if (!prompt) return null;

  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-stone-200 bg-stone-50">
      <div className="w-7 h-7 rounded-lg bg-stone-900 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
          Today's Prompt
        </div>
        <p className="text-xs text-stone-700 italic leading-relaxed">{prompt}</p>
      </div>
      <button
        type="button"
        onClick={() => onUse(prompt)}
        className="flex-shrink-0 px-2.5 py-1.5 rounded-lg bg-stone-900 text-white text-[10px] font-semibold hover:bg-stone-800 transition-colors whitespace-nowrap"
      >
        Use this
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// REF-08: AutoSaveIndicator — standalone save status display (uses useAutoSave)
// ─────────────────────────────────────────────────────────────────────────────

interface AutoSaveIndicatorProps {
  status: AutoSaveStatus;
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({ status }) => {
  const label = SAVE_STATUS_LABELS[status];
  const color = SAVE_STATUS_COLORS[status];

  if (!label) return null;

  return (
    <span className={`text-[11px] font-medium ${color} transition-colors`} role="status" aria-live="polite">
      {label}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// REF-09: ReflectionCalendar — 84-day (12-week) heatmap
// ─────────────────────────────────────────────────────────────────────────────

interface CalendarEntry {
  createdAt: string;
}

interface ReflectionCalendarProps {
  entries: CalendarEntry[];
  weeks?: number;
}

export const ReflectionCalendar: React.FC<ReflectionCalendarProps> = ({
  entries,
  weeks = 12,
}) => {
  const cells = useMemo(() => {
    const days = weeks * 7;
    const counts: Record<string, number> = {};
    entries.forEach((e) => {
      const key = new Date(e.createdAt).toISOString().slice(0, 10);
      counts[key] = (counts[key] ?? 0) + 1;
    });

    const result: Array<{ date: string; count: number }> = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      result.push({ date: key, count: counts[key] ?? 0 });
    }
    return result;
  }, [entries, weeks]);

  const cellColor = (count: number) => {
    if (count === 0) return 'bg-stone-100';
    if (count >= 3) return 'bg-stone-800';
    if (count === 2) return 'bg-stone-500';
    return 'bg-stone-400';
  };

  const weekColumns: Array<typeof cells> = [];
  for (let w = 0; w < weeks; w++) {
    weekColumns.push(cells.slice(w * 7, w * 7 + 7));
  }

  return (
    <div>
      <div className="text-[10px] font-semibold text-stone-500 mb-2">12-week reflection calendar</div>
      <div className="flex gap-0.5">
        {weekColumns.map((col, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {col.map(({ date, count }) => (
              <div
                key={date}
                title={`${date}: ${count} entr${count !== 1 ? 'ies' : 'y'}`}
                className={`w-3 h-3 rounded-sm ${cellColor(count)} cursor-default`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1 mt-1.5">
        <span className="text-[9px] text-stone-400">Less</span>
        {['bg-stone-100', 'bg-stone-400', 'bg-stone-500', 'bg-stone-800'].map((c) => (
          <div key={c} className={`w-2.5 h-2.5 rounded-sm ${c}`} />
        ))}
        <span className="text-[9px] text-stone-400">More</span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// REF-10: FullscreenEditor — fullscreen writing mode toggle
// ─────────────────────────────────────────────────────────────────────────────

interface FullscreenEditorProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export const FullscreenEditor: React.FC<FullscreenEditorProps> = ({
  isOpen,
  onClose,
  children,
  title,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-950 flex flex-col">
      <div className="flex items-center justify-between px-6 py-3 border-b border-stone-800">
        <span className="text-sm font-semibold text-stone-200">{title ?? 'Focus Mode'}</span>
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 text-stone-400 hover:text-white text-xs transition-colors"
        >
          <Minimize2 className="w-4 h-4" />
          Exit (Esc)
        </button>
      </div>
      <div className="flex-1 overflow-auto p-6 max-w-3xl mx-auto w-full">
        {children}
      </div>
    </div>
  );
};

interface FullscreenButtonProps {
  onClick: () => void;
}

export const FullscreenButton: React.FC<FullscreenButtonProps> = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    title="Enter fullscreen writing mode (Maximize)"
    aria-label="Enter fullscreen writing mode"
    className="p-1.5 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
  >
    <Maximize2 className="w-4 h-4" />
  </button>
);

// ─────────────────────────────────────────────────────────────────────────────
// REF-11: EntrySearch + Highlight — search with keyword highlighting
// ─────────────────────────────────────────────────────────────────────────────

interface HighlightProps {
  text: string;
  query: string;
  className?: string;
}

export const Highlight: React.FC<HighlightProps> = ({ text, query, className }) => {
  if (!query.trim()) {
    return <span className={className}>{text}</span>;
  }

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-amber-200 text-amber-900 rounded-sm px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};

interface EntrySearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const EntrySearch: React.FC<EntrySearchProps> = ({
  value,
  onChange,
  placeholder = 'Search reflections…',
}) => (
  <div className="flex items-center gap-2 px-3 py-2 border border-stone-200 rounded-lg bg-white focus-within:ring-1 focus-within:ring-stone-400">
    <Search className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="flex-1 text-xs bg-transparent outline-none text-stone-800 placeholder:text-stone-400"
    />
    {value && (
      <button
        type="button"
        onClick={() => onChange('')}
        className="text-stone-400 hover:text-stone-600"
        aria-label="Clear search"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// REF-12: PushToKnowledgeGraphButton — push entry to Knowledge Graph
// ─────────────────────────────────────────────────────────────────────────────

interface PushToKGButtonProps {
  onPush: () => void;
  pushed?: boolean;
  disabled?: boolean;
}

export const PushToKGButton: React.FC<PushToKGButtonProps> = ({
  onPush,
  pushed,
  disabled,
}) => (
  <button
    type="button"
    onClick={onPush}
    disabled={disabled || pushed}
    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
      pushed
        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
        : 'bg-stone-100 text-stone-600 border border-stone-200 hover:bg-stone-200 hover:border-stone-300'
    } disabled:cursor-not-allowed`}
    title="Extract concepts and push to Knowledge Graph"
  >
    <Network className="w-3 h-3" />
    {pushed ? 'Added to Graph ✓' : 'Map to Graph'}
  </button>
);

// ─────────────────────────────────────────────────────────────────────────────
// REF-13: RelatedEntries — sidebar showing entries with overlapping mood/content
// ─────────────────────────────────────────────────────────────────────────────

interface SimpleEntry {
  id: string;
  title: string;
  createdAt: string;
  mood?: Mood;
  tags: string[];
}

interface RelatedEntriesProps {
  currentEntryId: string;
  currentMood?: Mood;
  currentTags: string[];
  entries: SimpleEntry[];
  onSelect: (id: string) => void;
}

export const RelatedEntries: React.FC<RelatedEntriesProps> = ({
  currentEntryId,
  currentMood,
  currentTags,
  entries,
  onSelect,
}) => {
  const related = useMemo(() => {
    return entries
      .filter((e) => e.id !== currentEntryId)
      .map((e) => {
        let score = 0;
        if (currentMood && e.mood === currentMood) score += 3;
        currentTags.forEach((tag) => {
          if (e.tags.includes(tag)) score += 1;
        });
        return { ...e, score };
      })
      .filter((e) => e.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  }, [currentEntryId, currentMood, currentTags, entries]);

  if (related.length === 0) return null;

  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 space-y-2">
      <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Related</div>
      {related.map((entry) => {
        const mood = entry.mood ? MOOD_CONFIG[entry.mood] : null;
        return (
          <button
            key={entry.id}
            type="button"
            onClick={() => onSelect(entry.id)}
            className="w-full text-left px-2.5 py-2 rounded-lg bg-white border border-stone-200 hover:border-stone-300 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              {mood && <span className="text-sm">{mood.emoji}</span>}
              <span className="text-[11px] font-semibold text-stone-800 truncate">{entry.title}</span>
            </div>
            <div className="text-[10px] text-stone-400 mt-0.5">
              {new Date(entry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </div>
          </button>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// REF-14: ReflectionStreak — consecutive daily reflection days counter
// ─────────────────────────────────────────────────────────────────────────────

interface ReflectionStreakProps {
  entries: Array<{ createdAt: string }>;
}

export const ReflectionStreak: React.FC<ReflectionStreakProps> = ({ entries }) => {
  const streak = useMemo(() => {
    if (entries.length === 0) return 0;

    const dates = entries
      .map((e) => new Date(e.createdAt).toISOString().slice(0, 10))
      .sort()
      .reverse();

    const uniqueDates = [...new Set(dates)];
    let count = 0;
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) return 0;

    let checkDate = uniqueDates[0] === today ? today : yesterday;
    for (const date of uniqueDates) {
      if (date === checkDate) {
        count++;
        const prev = new Date(checkDate);
        prev.setDate(prev.getDate() - 1);
        checkDate = prev.toISOString().slice(0, 10);
      } else if (date < checkDate) {
        break;
      }
    }
    return count;
  }, [entries]);

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-stone-100 border border-stone-200">
      <Flame className={`w-4 h-4 ${streak > 0 ? 'text-amber-500' : 'text-stone-400'}`} />
      <div>
        <div className="text-sm font-bold text-stone-800 leading-none">{streak}</div>
        <div className="text-[10px] text-stone-500">day streak</div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// REF-15: MarkdownExportButton — enhanced export button with metadata
// ─────────────────────────────────────────────────────────────────────────────

interface MarkdownExportEntry {
  id: string;
  title: string;
  createdAt: string;
  phases: Array<{ label: string; content: string }>;
  mood?: Mood;
  tags?: string[];
}

function buildMarkdown(entry: MarkdownExportEntry): string {
  const date = new Date(entry.createdAt).toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const moodLine = entry.mood ? `\n**Mood:** ${MOOD_CONFIG[entry.mood].emoji} ${entry.mood}` : '';
  const tagsLine = entry.tags?.length ? `\n**Tags:** ${entry.tags.map((t) => `#${t}`).join(' ')}` : '';
  const header = `# ${entry.title}\n\n**Date:** ${date}${moodLine}${tagsLine}\n\n---\n`;
  const body = entry.phases
    .filter((p) => p.content.trim())
    .map((p) => `## ${p.label}\n\n${p.content}`)
    .join('\n\n');
  return `${header}\n${body}\n`;
}

interface MarkdownExportButtonProps {
  entry: MarkdownExportEntry;
}

export const MarkdownExportButton: React.FC<MarkdownExportButtonProps> = ({ entry }) => {
  const handleExport = useCallback(() => {
    const md = buildMarkdown(entry);
    const slug = entry.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'reflection';
    const date = new Date(entry.createdAt).toISOString().slice(0, 10);
    const filename = `${date}-${slug}.md`;
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [entry]);

  return (
    <button
      type="button"
      onClick={handleExport}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 hover:border-stone-300 transition-colors"
      title="Export as Markdown with metadata"
    >
      <Download className="w-3 h-3" />
      Export .md
    </button>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// REF-16: ViewToggle — list / calendar / moods view switcher
// ─────────────────────────────────────────────────────────────────────────────

export type ReflectionsView = 'list' | 'calendar' | 'moods';

interface ViewToggleProps {
  view: ReflectionsView;
  onChange: (view: ReflectionsView) => void;
}

const VIEW_OPTIONS: Array<{ id: ReflectionsView; label: string }> = [
  { id: 'list',     label: 'List'     },
  { id: 'calendar', label: 'Calendar' },
  { id: 'moods',    label: 'Moods'    },
];

export const ViewToggle: React.FC<ViewToggleProps> = ({ view, onChange }) => (
  <div className="flex rounded-lg border border-stone-200 overflow-hidden bg-stone-50" role="group" aria-label="View mode">
    {VIEW_OPTIONS.map(({ id, label }) => (
      <button
        key={id}
        type="button"
        onClick={() => onChange(id)}
        className={`px-3 py-1.5 text-xs font-medium transition-colors ${
          view === id
            ? 'bg-stone-900 text-white'
            : 'text-stone-600 hover:bg-stone-100'
        }`}
        aria-pressed={view === id}
      >
        {label}
      </button>
    ))}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// REF-17: GratitudeEntry — quick-capture 3-item gratitude form
// ─────────────────────────────────────────────────────────────────────────────

interface GratitudeEntryProps {
  onSubmit: (items: [string, string, string]) => void;
}

export const GratitudeEntry: React.FC<GratitudeEntryProps> = ({ onSubmit }) => {
  const [items, setItems] = useState<[string, string, string]>(['', '', '']);

  const setItem = useCallback((idx: number, value: string) => {
    setItems((prev) => {
      const next = [...prev] as [string, string, string];
      next[idx] = value;
      return next;
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.filter((i) => i.trim()).length < 3) return;
    onSubmit(items);
    setItems(['', '', '']);
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-4 h-4 text-amber-500" />
        <span className="text-xs font-bold text-amber-700">3 Things I'm Grateful For</span>
      </div>
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <span className="w-4 text-[11px] text-amber-600 font-semibold">{idx + 1}.</span>
          <input
            type="text"
            value={item}
            onChange={(e) => setItem(idx, e.target.value)}
            placeholder={`Gratitude ${idx + 1}…`}
            className="flex-1 px-3 py-1.5 rounded-lg border border-amber-200 bg-white text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
          />
        </div>
      ))}
      <button
        type="submit"
        disabled={items.filter((i) => i.trim()).length < 3}
        className="w-full py-1.5 rounded-lg bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Add to reflection
      </button>
    </form>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// REF-18: TagCloud — most-used phase/mood patterns as a word cloud
// ─────────────────────────────────────────────────────────────────────────────

interface TagCloudProps {
  entries: Array<{ tags: string[]; mood?: Mood }>;
  maxTags?: number;
}

export const TagCloud: React.FC<TagCloudProps> = ({ entries, maxTags = 20 }) => {
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    entries.forEach((entry) => {
      entry.tags.forEach((tag) => {
        counts[tag] = (counts[tag] ?? 0) + 1;
      });
      if (entry.mood) {
        const key = `mood:${entry.mood}`;
        counts[key] = (counts[key] ?? 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxTags);
  }, [entries, maxTags]);

  if (tagCounts.length === 0) {
    return <div className="text-[11px] text-stone-400 italic">No tags yet</div>;
  }

  const maxCount = tagCounts[0]![1];

  return (
    <div className="flex flex-wrap gap-1.5">
      {tagCounts.map(([tag, count]) => {
        const size = 0.7 + (count / maxCount) * 0.6;
        const isMood = tag.startsWith('mood:');
        const label = isMood ? tag.replace('mood:', '') : tag;
        const mood = isMood ? (label as Mood) : null;
        const moodCfg = mood ? MOOD_CONFIG[mood] : null;

        return (
          <span
            key={tag}
            className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
              moodCfg ? `${moodCfg.bg} ${moodCfg.color}` : 'bg-stone-100 text-stone-600'
            }`}
            style={{ fontSize: `${size}rem` }}
            title={`${count} occurrence${count !== 1 ? 's' : ''}`}
          >
            {moodCfg ? moodCfg.emoji : '#'}{label}
          </span>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// REF-19: ReflectionsSkeleton — loading shimmer for reflections list
// ─────────────────────────────────────────────────────────────────────────────

const ReflectionSkeletonCard: React.FC = () => (
  <div className="animate-pulse rounded-lg border border-stone-200 bg-white p-3 space-y-2">
    <div className="flex items-center justify-between">
      <div className="h-3 bg-stone-200 rounded w-2/3" />
      <div className="h-3 bg-stone-100 rounded w-8" />
    </div>
    <div className="h-2 bg-stone-100 rounded w-1/3" />
    <div className="flex gap-1">
      <div className="h-4 w-12 rounded-full bg-stone-100" />
      <div className="h-4 w-10 rounded-full bg-stone-100" />
    </div>
  </div>
);

interface ReflectionsSkeletonProps {
  count?: number;
}

export const ReflectionsSkeleton: React.FC<ReflectionsSkeletonProps> = ({ count = 4 }) => (
  <div className="space-y-2 px-2">
    {Array.from({ length: count }, (_, i) => (
      <ReflectionSkeletonCard key={i} />
    ))}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// REF-20: MoodBorderCard — entry card with mood color left-border stripe
// ─────────────────────────────────────────────────────────────────────────────

interface MoodBorderCardProps {
  mood?: Mood;
  isActive?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

export const MoodBorderCard: React.FC<MoodBorderCardProps> = ({
  mood,
  isActive,
  onClick,
  children,
}) => {
  const moodCfg = mood ? MOOD_CONFIG[mood] : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-md border flex overflow-hidden transition-all ${
        isActive
          ? 'border-stone-900 bg-white shadow-sm'
          : 'border-stone-200 bg-white/60 hover:border-stone-400'
      }`}
    >
      {moodCfg && (
        <div
          className={`w-1 flex-shrink-0 ${moodCfg.bg}`}
          title={`Mood: ${mood}`}
          aria-hidden="true"
        />
      )}
      <div className="flex-1 px-3 py-2 min-w-0">
        {children}
      </div>
    </button>
  );
};
