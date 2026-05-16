/**
 * KGEnhancements
 *
 * 20 UI/UX optimisation components for the Knowledge Graph lab.
 * KG-01 … KG-20
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  ZoomIn,
  Download,
  AlertCircle,
  BookOpen,
  PenSquare,
  Plus,
  Maximize2,
  Brain,
  SlidersHorizontal,
  Info,
} from 'lucide-react';
import {
  KnowledgeDomain,
  GraphNode,
  GraphLink,
  KnowledgeEdgeType,
  IntentHorizon,
  KnowledgeGraph,
} from '../../types';
import { DOMAIN_COLORS } from '../../contexts/KnowledgeGraphContext';

// ─────────────────────────────────────────────────────────────────────────────
// KG-01  DomainFilterBar
// Color-coded domain toggle pills
// ─────────────────────────────────────────────────────────────────────────────
interface DomainFilterBarProps {
  domainFilter: KnowledgeDomain[];
  setDomainFilter: (domains: KnowledgeDomain[]) => void;
}

export const DomainFilterBar: React.FC<DomainFilterBarProps> = ({
  domainFilter,
  setDomainFilter,
}) => {
  const domains = Object.keys(DOMAIN_COLORS) as KnowledgeDomain[];

  const toggle = (domain: KnowledgeDomain) => {
    if (domainFilter.includes(domain)) {
      setDomainFilter(domainFilter.filter(d => d !== domain));
    } else {
      setDomainFilter([...domainFilter, domain]);
    }
  };

  const allActive = domainFilter.length === 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={() => setDomainFilter([])}
        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
          allActive
            ? 'bg-slate-700 text-slate-100 border-slate-600'
            : 'bg-transparent text-slate-400 border-slate-700 hover:border-slate-600'
        }`}
      >
        All
      </button>
      {domains.map(domain => {
        const active = domainFilter.length === 0 || domainFilter.includes(domain);
        const color = DOMAIN_COLORS[domain];
        return (
          <button
            key={domain}
            onClick={() => toggle(domain)}
            className="px-2.5 py-1 rounded-full text-xs font-medium border transition-all"
            style={{
              backgroundColor: active ? `${color}20` : 'transparent',
              color: active ? color : '#64748b',
              borderColor: active ? color : '#334155',
            }}
          >
            {domain.charAt(0).toUpperCase() + domain.slice(1)}
          </button>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// KG-02  NodeActionButtons
// "Study in OAA" and "Journal" action buttons for NodeDetailsPanel companion
// ─────────────────────────────────────────────────────────────────────────────
interface NodeActionButtonsProps {
  nodeId: string;
  nodeType: string;
  onNavigateToReflections?: () => void;
}

export const NodeActionButtons: React.FC<NodeActionButtonsProps> = ({
  nodeType,
  onNavigateToReflections,
}) => (
  <div className="flex gap-2 p-4 border-t border-slate-700/50">
    {nodeType === 'concept' && (
      <button
        type="button"
        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-medium hover:bg-emerald-500/20 transition-colors"
      >
        <BookOpen className="w-3.5 h-3.5" />
        Study in OAA →
      </button>
    )}
    {onNavigateToReflections && (
      <button
        type="button"
        onClick={onNavigateToReflections}
        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-medium hover:bg-cyan-500/20 transition-colors"
      >
        <PenSquare className="w-3.5 h-3.5" />
        Journal about this →
      </button>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// KG-03  GraphStatsBar
// 4-stat header row
// ─────────────────────────────────────────────────────────────────────────────
interface GraphStatsBarProps {
  totalNodes: number;
  totalEdges: number;
  graph: KnowledgeGraph;
  dominantDomain: KnowledgeDomain | null;
}

export const GraphStatsBar: React.FC<GraphStatsBarProps> = ({
  totalNodes,
  totalEdges,
  graph,
  dominantDomain,
}) => {
  const sevenDaysAgo = Date.now() - 7 * 24 * 3_600_000;
  const newThisWeek = graph.nodes.filter(
    n => new Date(n.lastSeen).getTime() > sevenDaysAgo,
  ).length;

  const stats = [
    { label: 'Concepts', value: totalNodes, color: '#34d399' },
    { label: 'Connections', value: totalEdges, color: '#22d3ee' },
    { label: 'This Week', value: newThisWeek, color: '#a78bfa' },
    {
      label: 'Top Domain',
      value: dominantDomain ? dominantDomain.slice(0, 5) : '—',
      color: dominantDomain ? DOMAIN_COLORS[dominantDomain] : '#64748b',
    },
  ] as const;

  return (
    <div className="grid grid-cols-4 gap-px bg-slate-700/30 rounded-lg overflow-hidden border border-slate-700/50">
      {stats.map(stat => (
        <div key={stat.label} className="bg-slate-900/80 px-3 py-2 text-center">
          <div className="text-sm font-bold" style={{ color: stat.color }}>
            {stat.value}
          </div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider leading-tight">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// KG-04  NodeSearch
// Search input that flies to node on the graph
// ─────────────────────────────────────────────────────────────────────────────
interface NodeSearchProps {
  nodes: GraphNode[];
  graphRef: React.MutableRefObject<any>;
  onSelect?: (nodeId: string) => void;
}

export const NodeSearch: React.FC<NodeSearchProps> = ({ nodes, graphRef, onSelect }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const results = query.length > 1
    ? nodes.filter(n => n.label.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : [];

  const flyTo = useCallback(
    (node: GraphNode) => {
      if (graphRef.current) {
        graphRef.current.centerAt(node.x, node.y, 800);
        graphRef.current.zoom(3, 800);
      }
      onSelect?.(node.id);
      setQuery('');
      setOpen(false);
    },
    [graphRef, onSelect],
  );

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-1.5">
        <Search className="w-3.5 h-3.5 text-slate-400 flex-none" />
        <input
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search concepts…"
          className="bg-transparent text-xs text-slate-200 placeholder-slate-500 outline-none w-36"
          aria-label="Search concepts"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full mt-1 left-0 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
          {results.map(node => (
            <button
              key={node.id}
              onClick={() => flyTo(node)}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-200 hover:bg-slate-700 transition-colors text-left"
            >
              <span
                className="w-2 h-2 rounded-full flex-none"
                style={{ backgroundColor: DOMAIN_COLORS[node.domain as KnowledgeDomain] ?? '#94a3b8' }}
              />
              <span className="truncate">{node.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// KG-05  TemporalFilterBadge
// Shows the current time range filter as a readable label
// ─────────────────────────────────────────────────────────────────────────────
interface TemporalFilterBadgeProps {
  timeRange: { start: Date | null; end: Date | null };
}

export const TemporalFilterBadge: React.FC<TemporalFilterBadgeProps> = ({ timeRange }) => {
  if (!timeRange.start && !timeRange.end) return null;

  const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  const label =
    timeRange.start && timeRange.end
      ? `${fmt(timeRange.start)} – ${fmt(timeRange.end)}`
      : timeRange.start
      ? `From ${fmt(timeRange.start)}`
      : `Until ${fmt(timeRange.end!)}`;

  return (
    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-medium">
      <span>⏱</span>
      {label}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// KG-06  exportGraphPNG
// Takes a canvas ref and downloads as PNG
// ─────────────────────────────────────────────────────────────────────────────
export function exportGraphPNG(canvasRef: React.MutableRefObject<HTMLCanvasElement | null>): void {
  const canvas = canvasRef.current;
  if (!canvas) return;
  const link = document.createElement('a');
  link.download = `knowledge-graph-${new Date().toISOString().slice(0, 10)}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// ─────────────────────────────────────────────────────────────────────────────
// KG-07  EdgeLegend
// Shows the 4 edge types with line style SVG samples
// ─────────────────────────────────────────────────────────────────────────────
interface EdgeLegendProps {
  className?: string;
}

const EDGE_STYLES: { type: KnowledgeEdgeType; color: string; dash?: string }[] = [
  { type: 'co-occurs', color: '#94a3b8' },
  { type: 'builds-on', color: '#34d399', dash: '4 2' },
  { type: 'motivates', color: '#a78bfa', dash: '8 2 2 2' },
  { type: 'contrasts', color: '#f87171', dash: '2 3' },
];

export const EdgeLegend: React.FC<EdgeLegendProps> = ({ className = '' }) => (
  <div
    className={`bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-lg p-3 ${className}`}
  >
    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Edge Types</div>
    <div className="space-y-1.5">
      {EDGE_STYLES.map(({ type, color, dash }) => (
        <div key={type} className="flex items-center gap-2">
          <svg width={28} height={8} aria-hidden="true">
            <line
              x1={2}
              y1={4}
              x2={26}
              y2={4}
              stroke={color}
              strokeWidth={2}
              strokeDasharray={dash}
            />
          </svg>
          <span className="text-xs text-slate-300">{type}</span>
        </div>
      ))}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// KG-08  AddIntentHorizonForm
// Quick-add form for IntentHorizon
// ─────────────────────────────────────────────────────────────────────────────
type HorizonOption = IntentHorizon['horizon'];
const HORIZON_OPTIONS: HorizonOption[] = ['7d', '30d', '90d', '1y', 'open'];

interface AddIntentHorizonFormProps {
  onAdd: (goal: string, horizon: HorizonOption) => void;
}

export const AddIntentHorizonForm: React.FC<AddIntentHorizonFormProps> = ({ onAdd }) => {
  const [goal, setGoal] = useState('');
  const [horizon, setHorizon] = useState<HorizonOption>('30d');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) return;
    onAdd(goal.trim(), horizon);
    setGoal('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">
          Goal
        </label>
        <input
          type="text"
          value={goal}
          onChange={e => setGoal(e.target.value)}
          placeholder="What do you want to achieve?"
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-500 transition-colors"
          required
          maxLength={120}
        />
      </div>
      <div>
        <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">
          Horizon
        </label>
        <div className="flex flex-wrap gap-1.5">
          {HORIZON_OPTIONS.map(h => (
            <button
              key={h}
              type="button"
              onClick={() => setHorizon(h)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                horizon === h
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'text-slate-400 border-slate-700 hover:border-slate-600'
              }`}
            >
              {h}
            </button>
          ))}
        </div>
      </div>
      <button
        type="submit"
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 text-xs font-semibold hover:from-emerald-400 hover:to-cyan-400 transition-all"
      >
        {submitted ? (
          'Intent added!'
        ) : (
          <>
            <Plus className="w-3.5 h-3.5" />
            Add Intent
          </>
        )}
      </button>
    </form>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// KG-09  isNewNode utility
// Returns true if lastSeen is within 7 days
// ─────────────────────────────────────────────────────────────────────────────
export function isNewNode(node: GraphNode): boolean {
  return Date.now() - new Date((node as any).lastSeen ?? 0).getTime() < 7 * 24 * 3_600_000;
}

// ─────────────────────────────────────────────────────────────────────────────
// KG-10  FitToScreenButton
// Button that calls graphRef.current?.zoomToFit
// ─────────────────────────────────────────────────────────────────────────────
interface FitToScreenButtonProps {
  graphRef: React.MutableRefObject<any>;
}

export const FitToScreenButton: React.FC<FitToScreenButtonProps> = ({ graphRef }) => (
  <button
    type="button"
    onClick={() => graphRef.current?.zoomToFit(400)}
    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600 hover:text-slate-200 transition-colors"
    aria-label="Fit graph to screen"
  >
    <Maximize2 className="w-3.5 h-3.5" />
    <span className="hidden sm:inline">Fit</span>
  </button>
);

// ─────────────────────────────────────────────────────────────────────────────
// KG-11  NodeSizeLegend
// Tooltip/legend explaining node sizing
// ─────────────────────────────────────────────────────────────────────────────
export const NodeSizeLegend: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="p-1.5 rounded text-slate-500 hover:text-slate-300 transition-colors"
        aria-label="Node size legend"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-44 bg-slate-800 border border-slate-700 rounded-lg p-2.5 shadow-xl z-50 pointer-events-none">
          <div className="flex items-end gap-2 mb-2 justify-center">
            {[4, 8, 14].map(r => (
              <div
                key={r}
                className="rounded-full bg-slate-400"
                style={{ width: r * 2, height: r * 2 }}
              />
            ))}
          </div>
          <p className="text-[10px] text-slate-400 text-center leading-snug">
            Larger nodes = appear in more sessions
          </p>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// KG-12 + KG-13  CrossLinkToOAA and CrossLinkToReflections
// Action buttons inside NodeDetailsPanel
// ─────────────────────────────────────────────────────────────────────────────
interface CrossLinkToOAAProps {
  nodeType: string;
}

export const CrossLinkToOAA: React.FC<CrossLinkToOAAProps> = ({ nodeType }) => {
  if (nodeType !== 'concept') return null;
  return (
    <button
      type="button"
      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-medium hover:bg-emerald-500/20 transition-colors"
    >
      <BookOpen className="w-3.5 h-3.5" />
      Study in OAA →
    </button>
  );
};

interface CrossLinkToReflectionsProps {
  onNavigateToReflections?: () => void;
}

export const CrossLinkToReflections: React.FC<CrossLinkToReflectionsProps> = ({
  onNavigateToReflections,
}) => {
  if (!onNavigateToReflections) return null;
  return (
    <button
      type="button"
      onClick={onNavigateToReflections}
      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-medium hover:bg-cyan-500/20 transition-colors"
    >
      <PenSquare className="w-3.5 h-3.5" />
      Journal about this →
    </button>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// KG-14  GraphMinimap
// Small canvas overlay mirroring the main graph when zoomed
// ─────────────────────────────────────────────────────────────────────────────
interface GraphMinimapProps {
  nodes: GraphNode[];
  links: GraphLink[];
  visible?: boolean;
}

export const GraphMinimap: React.FC<GraphMinimapProps> = ({ nodes, links, visible = true }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const W = 100;
  const H = 75;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !visible || nodes.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, W, H);

    const xs = nodes.map(n => n.x ?? 0);
    const ys = nodes.map(n => n.y ?? 0);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const pad = 6;

    const tx = (x: number) => pad + ((x - minX) / rangeX) * (W - pad * 2);
    const ty = (y: number) => pad + ((y - minY) / rangeY) * (H - pad * 2);

    ctx.strokeStyle = 'rgba(148,163,184,0.15)';
    ctx.lineWidth = 0.5;
    links.forEach(l => {
      const src = nodes.find(n => n.id === (typeof l.source === 'string' ? l.source : (l.source as any).id));
      const tgt = nodes.find(n => n.id === (typeof l.target === 'string' ? l.target : (l.target as any).id));
      if (!src || !tgt) return;
      ctx.beginPath();
      ctx.moveTo(tx(src.x ?? 0), ty(src.y ?? 0));
      ctx.lineTo(tx(tgt.x ?? 0), ty(tgt.y ?? 0));
      ctx.stroke();
    });

    nodes.forEach(n => {
      ctx.beginPath();
      ctx.arc(tx(n.x ?? 0), ty(n.y ?? 0), 1.5, 0, Math.PI * 2);
      ctx.fillStyle = (n as any).color ?? '#94a3b8';
      ctx.fill();
    });
  }, [nodes, links, visible]);

  if (!visible) return null;

  return (
    <div className="absolute bottom-4 right-4 rounded-lg overflow-hidden border border-slate-700/50 bg-slate-900/80 backdrop-blur-sm shadow-lg">
      <canvas ref={canvasRef} width={W} height={H} aria-hidden="true" />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// KG-15  ForceControls
// Repulsion strength slider
// ─────────────────────────────────────────────────────────────────────────────
interface ForceControlsProps {
  graphRef: React.MutableRefObject<any>;
}

export const ForceControls: React.FC<ForceControlsProps> = ({ graphRef }) => {
  const [strength, setStrength] = useState(-120);

  const apply = (val: number) => {
    setStrength(val);
    const charge = graphRef.current?.d3Force?.('charge');
    if (charge && typeof charge.strength === 'function') {
      charge.strength(val);
      graphRef.current?.d3ReheatSimulation?.();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 flex-none" />
      <label className="text-[10px] text-slate-500 whitespace-nowrap">Repulsion</label>
      <input
        type="range"
        min={-500}
        max={-10}
        step={10}
        value={strength}
        onChange={e => apply(Number(e.target.value))}
        className="w-24 accent-emerald-400"
        aria-label="Repulsion strength"
      />
      <span className="text-[10px] text-slate-400 font-mono w-10">{strength}</span>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// KG-16  KnowledgeGapAlert
// Banner showing count of isolated nodes
// ─────────────────────────────────────────────────────────────────────────────
interface KnowledgeGapAlertProps {
  nodes: GraphNode[];
  links: GraphLink[];
}

export const KnowledgeGapAlert: React.FC<KnowledgeGapAlertProps> = ({ nodes, links }) => {
  const connectedIds = new Set<string>();
  links.forEach(l => {
    connectedIds.add(typeof l.source === 'string' ? l.source : (l.source as any).id);
    connectedIds.add(typeof l.target === 'string' ? l.target : (l.target as any).id);
  });

  const isolated = nodes.filter(n => !connectedIds.has(n.id));
  if (isolated.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-400">
      <AlertCircle className="w-3.5 h-3.5 flex-none" />
      <span>
        {isolated.length} concept{isolated.length > 1 ? 's have' : ' has'} no connections.
      </span>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// KG-17  ClusterHighlight
// Click domain pill to dim non-domain nodes
// ─────────────────────────────────────────────────────────────────────────────
interface ClusterHighlightProps {
  highlighted: KnowledgeDomain | null;
  onHighlight: (domain: KnowledgeDomain | null) => void;
}

export const ClusterHighlight: React.FC<ClusterHighlightProps> = ({
  highlighted,
  onHighlight,
}) => {
  const domains = Object.keys(DOMAIN_COLORS) as KnowledgeDomain[];
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[10px] text-slate-500 uppercase tracking-wider">Highlight:</span>
      {domains.map(d => (
        <button
          key={d}
          onClick={() => onHighlight(highlighted === d ? null : d)}
          className="w-3 h-3 rounded-full border-2 transition-all"
          style={{
            backgroundColor: DOMAIN_COLORS[d],
            borderColor: highlighted === d ? 'white' : 'transparent',
            opacity: highlighted === null || highlighted === d ? 1 : 0.35,
          }}
          title={d}
          aria-label={`Highlight ${d} domain`}
        />
      ))}
      {highlighted && (
        <button
          onClick={() => onHighlight(null)}
          className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors ml-1"
        >
          Clear
        </button>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// KG-18  GraphEmptyState
// When no nodes exist, prompt the user to seed their graph
// ─────────────────────────────────────────────────────────────────────────────
interface GraphEmptyStateProps {
  onNavigateToReflections?: () => void;
}

export const GraphEmptyState: React.FC<GraphEmptyStateProps> = ({ onNavigateToReflections }) => (
  <div className="flex flex-col items-center justify-center gap-4 py-16 text-center px-6">
    <div className="w-16 h-16 rounded-full bg-slate-800/60 border border-slate-700 flex items-center justify-center">
      <Brain className="w-8 h-8 text-slate-500" />
    </div>
    <div>
      <h3 className="text-base font-semibold text-slate-200 mb-1">Your Graph Awaits</h3>
      <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
        Complete an OAA module or write a Reflection to build your graph.
      </p>
    </div>
    {onNavigateToReflections && (
      <button
        type="button"
        onClick={onNavigateToReflections}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-medium text-sm hover:from-emerald-400 hover:to-cyan-400 transition-all"
      >
        <PenSquare className="w-4 h-4" />
        Open Reflections
      </button>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// KG-19  EdgeStrengthTooltip
// Tooltip component to show edge strength on hover
// ─────────────────────────────────────────────────────────────────────────────
interface EdgeStrengthTooltipProps {
  link: GraphLink | null;
  x: number;
  y: number;
  containerWidth: number;
  containerHeight: number;
}

export const EdgeStrengthTooltip: React.FC<EdgeStrengthTooltipProps> = ({
  link,
  x,
  y,
  containerWidth,
  containerHeight,
}) => {
  if (!link) return null;

  const left = Math.min(x + 10, containerWidth - 160);
  const top = Math.min(y + 10, containerHeight - 60);

  return (
    <div
      className="absolute pointer-events-none px-2.5 py-1.5 bg-slate-800/95 backdrop-blur-sm border border-slate-700 rounded-lg shadow-xl z-10 text-xs"
      style={{ left, top }}
    >
      <div className="text-slate-300 font-medium">{link.type}</div>
      <div className="text-slate-400 mt-0.5">
        Strength: <span className="font-mono">{Math.round(link.strength * 100)}%</span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// KG-20  KnowledgeGraphSkeleton
// Animated shimmer loading state
// ─────────────────────────────────────────────────────────────────────────────
export const KnowledgeGraphSkeleton: React.FC = () => (
  <div className="flex-1 flex flex-col items-center justify-center gap-6 animate-pulse p-8">
    {/* Central node */}
    <div className="relative flex items-center justify-center w-40 h-40">
      {/* Spokes */}
      {[0, 60, 120, 180, 240, 300].map(deg => (
        <div
          key={deg}
          className="absolute w-14 h-0.5 bg-slate-700 origin-left rounded-full"
          style={{
            transform: `rotate(${deg}deg)`,
            left: '50%',
            top: '50%',
            marginTop: '-1px',
          }}
        />
      ))}
      {/* Center circle */}
      <div className="w-10 h-10 rounded-full bg-slate-700 z-10" />
      {/* Satellite circles */}
      {[0, 60, 120, 180, 240, 300].map(deg => {
        const rad = (deg * Math.PI) / 180;
        return (
          <div
            key={`s-${deg}`}
            className="absolute w-5 h-5 rounded-full bg-slate-700/60"
            style={{
              left: `calc(50% + ${Math.cos(rad) * 52}px)`,
              top: `calc(50% + ${Math.sin(rad) * 52}px)`,
              transform: 'translate(-50%,-50%)',
            }}
          />
        );
      })}
    </div>
    <div className="space-y-2 w-48 text-center">
      <div className="h-2.5 bg-slate-700 rounded w-3/4 mx-auto" />
      <div className="h-2 bg-slate-800 rounded w-1/2 mx-auto" />
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Download button (helper for exportGraphPNG)
// ─────────────────────────────────────────────────────────────────────────────
interface DownloadGraphButtonProps {
  graphRef: React.MutableRefObject<any>;
}

export const DownloadGraphButton: React.FC<DownloadGraphButtonProps> = ({ graphRef }) => {
  const handleClick = () => {
    const canvas = graphRef.current?.renderer?.domElement as HTMLCanvasElement | undefined;
    if (canvas) {
      exportGraphPNG({ current: canvas });
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600 hover:text-slate-200 transition-colors"
      aria-label="Download graph as PNG"
    >
      <Download className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">Export</span>
    </button>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ZoomIn icon re-export alias used in lab
// ─────────────────────────────────────────────────────────────────────────────
export { ZoomIn as ZoomInIcon };
