/**
 * JADEEnhancements.tsx
 * JADE-01 through JADE-20: UI/UX enhancements for the JADE Chamber (C-313)
 */
import React, { useState, useEffect, useCallback } from 'react';
import { ChevronRight, Download, BookOpen, Brain, Target } from 'lucide-react';
import { JADEGraphInsight, KnowledgeGraph, IntentHorizon, KnowledgeDomain } from '../../types';

// ── Shared constants ───────────────────────────────────────────────────────────

export const DOMAIN_COLORS: Record<KnowledgeDomain, string> = {
  learning: '#3b82f6',
  reflection: '#8b5cf6',
  civic: '#10b981',
  system: '#f59e0b',
  personal: '#ec4899',
};

const INSIGHT_META: Record<JADEGraphInsight['type'], { label: string; color: string; bg: string; border: string }> = {
  dominant_theme: {
    label: 'DOMINANT THEME',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  neglected_area: {
    label: 'NEGLECTED AREA',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  emerging_cluster: {
    label: 'EMERGING CLUSTER',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  suggested_connection: {
    label: 'SUGGESTED LINK',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
  },
  knowledge_gap: {
    label: 'KNOWLEDGE GAP',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
  },
};

const INSIGHT_TYPE_VALUES: JADEGraphInsight['type'][] = [
  'dominant_theme',
  'neglected_area',
  'emerging_cluster',
  'suggested_connection',
  'knowledge_gap',
];

// ── JADE-01: InsightCard ──────────────────────────────────────────────────────

interface InsightCardProps {
  insight: JADEGraphInsight;
  onAct?: (insight: JADEGraphInsight) => void;
}

export const InsightCard: React.FC<InsightCardProps> = ({ insight, onAct }) => {
  const meta = INSIGHT_META[insight.type];

  return (
    <div className={`rounded-xl border ${meta.border} ${meta.bg} p-4 space-y-2`}>
      <div className="flex items-center justify-between gap-2">
        <span className={`text-[10px] font-bold uppercase tracking-widest ${meta.color}`}>
          {meta.label}
        </span>
        <ConfidenceScoreBar confidence={insight.confidence} compact />
      </div>
      <div className="font-medium text-slate-800 text-sm">{insight.title}</div>
      <div className="text-xs text-slate-600 leading-relaxed">{insight.description}</div>
      {insight.relatedNodes.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {insight.relatedNodes.slice(0, 4).map((n) => (
            <span key={n} className="px-2 py-0.5 rounded-full bg-white/80 border border-slate-200 text-[10px] text-slate-500 font-mono">
              {n}
            </span>
          ))}
        </div>
      )}
      {insight.actionable && (
        <div className="flex items-center justify-between pt-1 gap-2">
          <span className="text-[11px] text-slate-500 italic flex-1">{insight.actionable}</span>
          {onAct && (
            <button
              type="button"
              onClick={() => onAct(insight)}
              className={`shrink-0 px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors ${meta.color} ${meta.bg} border ${meta.border} hover:opacity-80`}
            >
              Act
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ── JADE-02: DominantThemes ───────────────────────────────────────────────────

interface DominantThemesProps {
  graph: KnowledgeGraph;
}

export const DominantThemes: React.FC<DominantThemesProps> = ({ graph }) => {
  const domainWeights: Partial<Record<KnowledgeDomain, number>> = {};

  graph.nodes.forEach((node) => {
    domainWeights[node.domain] = (domainWeights[node.domain] ?? 0) + node.weight;
  });

  const entries = (Object.entries(domainWeights) as [KnowledgeDomain, number][]).sort((a, b) => b[1] - a[1]);
  const max = entries[0]?.[1] ?? 1;

  if (entries.length === 0) {
    return <div className="text-xs text-slate-400 italic">No domain data yet.</div>;
  }

  return (
    <div className="space-y-3">
      <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
        <Brain className="w-3.5 h-3.5" />
        Domain Weight Distribution
      </div>
      {entries.map(([domain, weight]) => (
        <div key={domain} className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="capitalize text-slate-300">{domain}</span>
            <span className="font-mono text-slate-400">{weight}</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(weight / max) * 100}%`,
                backgroundColor: DOMAIN_COLORS[domain],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// ── JADE-03: NeglectedAreaAlert ───────────────────────────────────────────────

interface NeglectedAreaAlertProps {
  insights: JADEGraphInsight[];
}

export const NeglectedAreaAlert: React.FC<NeglectedAreaAlertProps> = ({ insights }) => {
  const neglected = insights.filter((i) => i.type === 'neglected_area');

  if (neglected.length === 0) return null;

  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-sm">
      <span className="text-xl mt-0.5">⚠️</span>
      <div>
        <div className="font-semibold text-amber-300 mb-1">
          {neglected.length} neglected area{neglected.length > 1 ? 's' : ''} detected
        </div>
        <div className="text-xs text-amber-200/70">
          Some concepts haven't been engaged with recently. Revisiting them can deepen your understanding.
        </div>
        <button
          type="button"
          className="mt-2 text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors"
        >
          View neglected concepts →
        </button>
      </div>
    </div>
  );
};

// ── JADE-04: InsightTypeFilter ────────────────────────────────────────────────

interface InsightTypeFilterProps {
  selected: JADEGraphInsight['type'] | 'all';
  onChange: (type: JADEGraphInsight['type'] | 'all') => void;
  counts: Partial<Record<JADEGraphInsight['type'], number>>;
}

export const InsightTypeFilter: React.FC<InsightTypeFilterProps> = ({ selected, onChange, counts }) => {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onChange('all')}
        className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors border ${
          selected === 'all'
            ? 'bg-slate-200 text-slate-800 border-slate-300'
            : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
        }`}
      >
        All
      </button>
      {INSIGHT_TYPE_VALUES.map((type) => {
        const meta = INSIGHT_META[type];
        const count = counts[type] ?? 0;
        const active = selected === type;

        return (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors border flex items-center gap-1 ${
              active
                ? `${meta.bg} ${meta.color} ${meta.border}`
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
            }`}
          >
            {meta.label.split(' ')[0]}
            {count > 0 && (
              <span className={`ml-1 ${active ? meta.color : 'text-slate-500'}`}>{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};

// ── JADE-05: LearningPathCard ─────────────────────────────────────────────────

interface LearningPathCardProps {
  insight: JADEGraphInsight;
  onStart?: () => void;
}

export const LearningPathCard: React.FC<LearningPathCardProps> = ({ insight, onStart }) => {
  if (insight.type !== 'knowledge_gap') return null;

  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 space-y-3">
      <div className="text-[10px] font-bold uppercase tracking-widest text-red-400">Learning Path</div>
      <div className="font-medium text-slate-200 text-sm">{insight.title}</div>
      {insight.relatedNodes.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {insight.relatedNodes.map((node, i) => (
            <React.Fragment key={node}>
              <span className="px-2 py-1 rounded bg-slate-800 text-xs text-slate-300 font-mono">{node}</span>
              {i < insight.relatedNodes.length - 1 && (
                <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={onStart}
        className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
      >
        <BookOpen className="w-3.5 h-3.5" />
        Start this path in OAA →
      </button>
    </div>
  );
};

// ── JADE-06: JadeThinkingState ────────────────────────────────────────────────

export const JadeThinkingState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-2 border-emerald-400/40 animate-spin" style={{ animationDuration: '1.5s' }} />
        <div className="absolute inset-2 rounded-full border border-cyan-400/30 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
        <div className="absolute inset-0 flex items-center justify-center text-2xl">🔮</div>
      </div>
      <div className="text-center">
        <div className="text-xs font-mono text-emerald-400 uppercase tracking-widest">JADE is analyzing your graph</div>
        <div className="text-[10px] text-slate-500 mt-1">Pattern recognition in progress…</div>
      </div>
    </div>
  );
};

// ── JADE-07: IntentAlignmentPanel ─────────────────────────────────────────────

interface IntentAlignmentPanelProps {
  intents: IntentHorizon[];
  graph: KnowledgeGraph;
}

export const IntentAlignmentPanel: React.FC<IntentAlignmentPanelProps> = ({ intents, graph }) => {
  const graphNodeIds = new Set(graph.nodes.map((n) => n.id));

  const withAlignment = intents.map((intent) => {
    const aligned = intent.relatedConcepts.some((c) => graphNodeIds.has(c));
    return { intent, aligned };
  });

  if (withAlignment.length === 0) {
    return (
      <div className="text-xs text-slate-400 italic text-center py-4">
        No intent horizons set. Add intentions in the Knowledge Graph.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
        <Target className="w-3.5 h-3.5" />
        Intent Alignment
      </div>
      {withAlignment.map(({ intent, aligned }) => (
        <div key={intent.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-200 truncate">{intent.goal}</div>
            <div className="text-[10px] text-slate-500 mt-0.5 font-mono">{intent.horizon}</div>
          </div>
          <span
            className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
              aligned
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}
          >
            {aligned ? 'Aligned' : 'Gap'}
          </span>
        </div>
      ))}
    </div>
  );
};

// ── JADE-08: InsightHistory ───────────────────────────────────────────────────

const INSIGHT_HISTORY_KEY = 'jade_insight_history_v1';

interface InsightHistoryEntry {
  timestamp: string;
  count: number;
}

export const InsightHistory: React.FC = () => {
  const [history, setHistory] = useState<InsightHistoryEntry[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(INSIGHT_HISTORY_KEY);
      if (raw) {
        setHistory(JSON.parse(raw));
      }
    } catch {
      setHistory([]);
    }
  }, []);

  const lastRun = history[history.length - 1];
  const prevRun = history[history.length - 2];
  const newSinceLast = lastRun && prevRun ? Math.max(0, lastRun.count - prevRun.count) : 0;
  const recent = history.slice(-5).reverse();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Analysis History</div>
        {newSinceLast > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold border border-red-500/30">
            +{newSinceLast} new
          </span>
        )}
      </div>
      {recent.length === 0 ? (
        <div className="text-xs text-slate-500 italic">No analysis runs yet.</div>
      ) : (
        <div className="space-y-1">
          {recent.map((entry, i) => (
            <div key={i} className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-[10px]">
                {new Date(entry.timestamp).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </span>
              <span className="text-slate-500">{entry.count} insights</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export function recordInsightRun(count: number): void {
  try {
    const raw = localStorage.getItem(INSIGHT_HISTORY_KEY);
    const history: InsightHistoryEntry[] = raw ? JSON.parse(raw) : [];
    history.push({ timestamp: new Date().toISOString(), count });
    localStorage.setItem(INSIGHT_HISTORY_KEY, JSON.stringify(history.slice(-20)));
  } catch {
    // ignore
  }
}

// ── JADE-09: WeeklyJADEReport ─────────────────────────────────────────────────

interface WeeklyJADEReportProps {
  insights: JADEGraphInsight[];
  graph: KnowledgeGraph;
}

export const WeeklyJADEReport: React.FC<WeeklyJADEReportProps> = ({ insights, graph }) => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const newConcepts = graph.nodes.filter(
    (n) => new Date(n.firstSeen) >= oneWeekAgo,
  ).length;

  const neglectedCount = insights.filter((i) => i.type === 'neglected_area').length;
  const emergingCount = insights.filter((i) => i.type === 'emerging_cluster').length;

  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 px-4 py-4 space-y-3">
      <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Weekly JADE Report</div>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <div className="text-2xl font-mono text-emerald-400">{newConcepts}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">new concepts</div>
        </div>
        <div>
          <div className="text-2xl font-mono text-amber-400">{neglectedCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">neglected areas</div>
        </div>
        <div>
          <div className="text-2xl font-mono text-purple-400">{emergingCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">emerging clusters</div>
        </div>
      </div>
    </div>
  );
};

// ── JADE-10: ConfidenceScoreBar ───────────────────────────────────────────────

interface ConfidenceScoreBarProps {
  confidence: number;
  compact?: boolean;
}

export const ConfidenceScoreBar: React.FC<ConfidenceScoreBarProps> = ({ confidence, compact = false }) => {
  const pct = Math.round(confidence * 100);
  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500';
  const textColor = pct >= 80 ? 'text-emerald-400' : pct >= 60 ? 'text-amber-400' : 'text-red-400';

  if (compact) {
    return (
      <span className={`text-[10px] font-mono font-bold ${textColor}`}>{pct}%</span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-[10px] font-mono font-bold shrink-0 ${textColor}`}>{pct}%</span>
    </div>
  );
};

// ── JADE-11: InsightActCTA ────────────────────────────────────────────────────

interface InsightActCTAProps {
  insight: JADEGraphInsight;
  onNavigate: (chamber: string) => void;
}

const INSIGHT_DESTINATIONS: Record<JADEGraphInsight['type'], { label: string; chamber: string }> = {
  neglected_area: { label: 'Open Reflections prompt', chamber: 'reflections' },
  emerging_cluster: { label: 'Study in OAA', chamber: 'oaa' },
  knowledge_gap: { label: 'New Reflection entry', chamber: 'reflections' },
  suggested_connection: { label: 'Highlight in Knowledge Graph', chamber: 'knowledge_graph' },
  dominant_theme: { label: 'Explore in HIVE', chamber: 'hive' },
};

export const InsightActCTA: React.FC<InsightActCTAProps> = ({ insight, onNavigate }) => {
  const dest = INSIGHT_DESTINATIONS[insight.type];

  return (
    <button
      type="button"
      onClick={() => onNavigate(dest.chamber)}
      className="flex items-center gap-2 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
    >
      <ChevronRight className="w-3.5 h-3.5" />
      {dest.label}
    </button>
  );
};

// ── JADE-12: GraphDiffView ────────────────────────────────────────────────────

const GRAPH_SNAPSHOT_KEY = 'jade_graph_snapshot_v1';

interface GraphDiffViewProps {
  graph: KnowledgeGraph;
}

export const GraphDiffView: React.FC<GraphDiffViewProps> = ({ graph }) => {
  const [addedSinceLast, setAddedSinceLast] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(GRAPH_SNAPSHOT_KEY);
      const prev = raw ? (JSON.parse(raw) as number) : null;
      if (prev !== null) {
        setAddedSinceLast(Math.max(0, graph.nodes.length - prev));
      }
    } catch {
      setAddedSinceLast(0);
    }
  }, [graph.nodes.length]);

  return (
    <div className="flex items-center gap-2 text-xs text-slate-400">
      <span className="font-mono text-emerald-400 font-bold">+{addedSinceLast}</span>
      <span>nodes added since last analysis</span>
    </div>
  );
};

export function snapshotGraphSize(size: number): void {
  try {
    localStorage.setItem(GRAPH_SNAPSHOT_KEY, JSON.stringify(size));
  } catch {
    // ignore
  }
}

// ── JADE-13: CrossChamberSynthesis ────────────────────────────────────────────

export const CrossChamberSynthesis: React.FC = () => {
  return (
    <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-xs text-cyan-300 leading-relaxed">
      <div className="font-bold uppercase tracking-wider text-cyan-400 text-[10px] mb-1">Cross-Chamber Synthesis</div>
      <p>
        Your reflection moods correlate with your learning performance. Periods of exploratory reflection
        tend to precede higher OAA accuracy scores — consider deepening your reflection practice during
        study cycles.
      </p>
    </div>
  );
};

// ── JADE-14: JADEEmptyState ───────────────────────────────────────────────────

interface JADEEmptyStateProps {
  onNavigate?: (chamber: string) => void;
}

export const JADEEmptyState: React.FC<JADEEmptyStateProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
      <div className="text-4xl">🌱</div>
      <p className="text-slate-400 text-sm max-w-xs">
        Your knowledge graph is empty. Begin by completing an OAA module or writing a Reflection to
        build your graph.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onNavigate?.('oaa')}
          className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors"
        >
          📚 Go to OAA
        </button>
        <button
          type="button"
          onClick={() => onNavigate?.('reflections')}
          className="px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-medium hover:bg-purple-500/20 transition-colors"
        >
          ✨ Write Reflection
        </button>
      </div>
    </div>
  );
};

// ── JADE-15: SuggestedConnectionCard ─────────────────────────────────────────

interface SuggestedConnectionCardProps {
  insight: JADEGraphInsight;
}

export const SuggestedConnectionCard: React.FC<SuggestedConnectionCardProps> = ({ insight }) => {
  if (insight.type !== 'suggested_connection' || insight.relatedNodes.length < 2) return null;

  const [nodeA, nodeB] = insight.relatedNodes;

  return (
    <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-4">
      <div className="text-[10px] font-bold uppercase tracking-widest text-purple-400 mb-3">
        Suggested Connection
      </div>
      <div className="flex items-center justify-center gap-3">
        <span className="px-3 py-1.5 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-200 text-xs font-mono">
          {nodeA}
        </span>
        <span className="text-purple-400 font-bold">→</span>
        <span className="px-3 py-1.5 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-200 text-xs font-mono">
          {nodeB}
        </span>
      </div>
      {insight.description && (
        <div className="text-xs text-slate-400 mt-3 text-center">{insight.description}</div>
      )}
    </div>
  );
};

// ── JADE-16: ConceptRecommendation ────────────────────────────────────────────

const DEMO_CONCEPTS = [
  { label: 'Systems Thinking', reason: 'Bridges your civic and learning domains', domain: 'learning' as KnowledgeDomain },
  { label: 'Civic Resilience', reason: 'Complements your existing reflection patterns', domain: 'civic' as KnowledgeDomain },
  { label: 'Pattern Recognition', reason: 'Core to your emerging JADE interactions', domain: 'system' as KnowledgeDomain },
];

export const ConceptRecommendation: React.FC = () => {
  return (
    <div className="space-y-2">
      <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Recommended Concepts</div>
      {DEMO_CONCEPTS.map((c) => (
        <div key={c.label} className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
          <div
            className="w-2.5 h-2.5 rounded-full mt-0.5 shrink-0"
            style={{ backgroundColor: DOMAIN_COLORS[c.domain] }}
          />
          <div>
            <div className="text-xs font-medium text-slate-200">{c.label}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{c.reason}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ── JADE-17: InsightCountBadge ────────────────────────────────────────────────

const UNREAD_KEY = 'jade_unread_insights_v1';

interface InsightCountBadgeProps {
  count: number;
}

export const InsightCountBadge: React.FC<InsightCountBadgeProps> = ({ count }) => {
  if (count === 0) return null;

  return (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
      {count > 9 ? '9+' : count}
    </span>
  );
};

export function getUnreadInsightCount(): number {
  try {
    const raw = localStorage.getItem(UNREAD_KEY);
    return raw ? parseInt(raw, 10) : 0;
  } catch {
    return 0;
  }
}

export function setUnreadInsightCount(count: number): void {
  try {
    localStorage.setItem(UNREAD_KEY, String(count));
  } catch {
    // ignore
  }
}

// ── JADE-18: ExportJADEReport ─────────────────────────────────────────────────

export function exportJADEReport(insights: JADEGraphInsight[], graph: KnowledgeGraph): void {
  const lines: string[] = [
    '# JADE Graph Analysis Report',
    `Generated: ${new Date().toISOString()}`,
    '',
    `## Overview`,
    `- Total nodes: ${graph.nodes.length}`,
    `- Total connections: ${graph.edges.length}`,
    `- Insights found: ${insights.length}`,
    '',
    '## Insights',
    '',
  ];

  insights.forEach((insight, i) => {
    lines.push(`### ${i + 1}. ${insight.title} (${INSIGHT_META[insight.type].label})`);
    lines.push(`**Confidence:** ${Math.round(insight.confidence * 100)}%`);
    lines.push('');
    lines.push(insight.description);
    if (insight.actionable) {
      lines.push('');
      lines.push(`**Action:** ${insight.actionable}`);
    }
    if (insight.relatedNodes.length > 0) {
      lines.push('');
      lines.push(`**Related nodes:** ${insight.relatedNodes.join(', ')}`);
    }
    lines.push('');
  });

  const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `jade-report-${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

interface ExportJADEReportButtonProps {
  insights: JADEGraphInsight[];
  graph: KnowledgeGraph;
}

export const ExportJADEReportButton: React.FC<ExportJADEReportButtonProps> = ({ insights, graph }) => {
  return (
    <button
      type="button"
      onClick={() => exportJADEReport(insights, graph)}
      disabled={insights.length === 0}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <Download className="w-3.5 h-3.5" />
      Export Report
    </button>
  );
};

// ── JADE-19: JADESkeleton ─────────────────────────────────────────────────────

export const JADESkeleton: React.FC = () => {
  return (
    <div className="space-y-3 animate-pulse" aria-label="Loading JADE insights…">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 space-y-2">
          <div className="h-3 w-24 rounded bg-slate-700" />
          <div className="h-4 w-3/4 rounded bg-slate-700/70" />
          <div className="h-3 w-full rounded bg-slate-700/50" />
          <div className="h-3 w-5/6 rounded bg-slate-700/50" />
        </div>
      ))}
    </div>
  );
};

// ── JADE-20: JADEConversationMode ─────────────────────────────────────────────

interface JADEConversationModeProps {
  graph: KnowledgeGraph;
  onSend: (message: string) => void;
  disabled?: boolean;
}

export const JADEConversationMode: React.FC<JADEConversationModeProps> = ({ graph, onSend, disabled = false }) => {
  const [input, setInput] = useState('');

  const topDomain = useCallback(() => {
    const weights: Partial<Record<KnowledgeDomain, number>> = {};
    graph.nodes.forEach((n) => {
      weights[n.domain] = (weights[n.domain] ?? 0) + n.weight;
    });
    const sorted = Object.entries(weights).sort((a, b) => (b[1] as number) - (a[1] as number));
    return sorted[0]?.[0] ?? 'unknown';
  }, [graph]);

  const handleSend = () => {
    if (!input.trim()) return;
    const prefix = `[Graph context: ${graph.nodes.length} nodes, top domain: ${topDomain()}] `;
    onSend(prefix + input.trim());
    setInput('');
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
        placeholder="Ask JADE about your graph…"
        disabled={disabled}
        className="flex-1 bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 disabled:opacity-50 transition"
      />
      <button
        type="button"
        onClick={handleSend}
        disabled={disabled || !input.trim()}
        className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Ask
      </button>
    </div>
  );
};
