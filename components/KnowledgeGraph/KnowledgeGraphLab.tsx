/**
 * KnowledgeGraphLab
 * 
 * The Knowledge Graph visualization for Mobius Shell.
 * Shows the user's temporal epistemic graph - their learning journey,
 * conceptual connections, and intent horizons.
 * 
 * Not a notes graph. A visible mind.
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import {
  Network,
  Target,
  Clock,
  Filter,
  Sparkles,
  TrendingUp,
  ChevronRight,
  ChevronLeft,
  Brain,
  Compass,
  BarChart3,
  Plus,
  Eye,
} from 'lucide-react';
import { useKnowledgeGraph, DOMAIN_COLORS } from '../../contexts/KnowledgeGraphContext';
import { KnowledgeDomain, GraphNode, JADEGraphInsight } from '../../types';
import { NodeDetailsPanel } from './NodeDetailsPanel';
import { IntentHorizonPanel } from './IntentHorizonPanel';
import { TimelineSlider } from './TimelineSlider';
import { GraphStats } from './GraphStats';

export const KnowledgeGraphLab: React.FC = () => {
  const {
    graph,
    graphData,
    stats,
    domainFilter,
    setDomainFilter,
    timeRange,
    setTimeRange,
    getDominantThemes,
    analyzeWithJADE,
  } = useKnowledgeGraph();

  // Local state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showIntentPanel, setShowIntentPanel] = useState(false);
  const [showJadeInsights, setShowJadeInsights] = useState(false);
  const [jadeInsights, setJadeInsights] = useState<JADEGraphInsight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [highlightNodes, setHighlightNodes] = useState<Set<string>>(new Set());
  const [hoverNode, setHoverNode] = useState<GraphNode | null>(null);
  
  const graphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height: height - 60 }); // Account for header
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Handle node click
  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNodeId(node.id);
    
    // Zoom to node
    if (graphRef.current) {
      graphRef.current.centerAt(node.x, node.y, 1000);
      graphRef.current.zoom(2, 1000);
    }
  }, []);

  // Handle node hover
  const handleNodeHover = useCallback((node: GraphNode | null) => {
    setHoverNode(node);
    
    if (node) {
      // Highlight connected nodes
      const connected = new Set<string>([node.id]);
      graphData.links.forEach(link => {
        if (link.source === node.id || (link.source as any).id === node.id) {
          connected.add(typeof link.target === 'string' ? link.target : (link.target as any).id);
        }
        if (link.target === node.id || (link.target as any).id === node.id) {
          connected.add(typeof link.source === 'string' ? link.source : (link.source as any).id);
        }
      });
      setHighlightNodes(connected);
    } else {
      setHighlightNodes(new Set());
    }
  }, [graphData.links]);

  // Toggle domain filter
  const toggleDomainFilter = (domain: KnowledgeDomain) => {
    if (domainFilter.includes(domain)) {
      setDomainFilter(domainFilter.filter(d => d !== domain));
    } else {
      setDomainFilter([...domainFilter, domain]);
    }
  };

  // Analyze with JADE
  const handleAnalyzeWithJADE = async () => {
    setIsAnalyzing(true);
    try {
      const insights = await analyzeWithJADE();
      setJadeInsights(insights);
      setShowJadeInsights(true);
    } catch (error) {
      console.error('Failed to analyze with JADE:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Custom node canvas render
  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.label;
    const fontSize = Math.max(10 / globalScale, 3);
    const isHighlighted = highlightNodes.size === 0 || highlightNodes.has(node.id);
    const isHovered = hoverNode?.id === node.id;
    const isSelected = selectedNodeId === node.id;

    // Node size based on weight
    const nodeSize = Math.max(4, Math.log(node.weight + 1) * 4);
    
    // Draw node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI);
    
    // Fill color based on domain and state
    ctx.fillStyle = isHighlighted 
      ? node.color 
      : `${node.color}33`; // Faded if not highlighted
    ctx.fill();
    
    // Border for hovered/selected
    if (isHovered || isSelected) {
      ctx.strokeStyle = isSelected ? '#fff' : '#a78bfa';
      ctx.lineWidth = 2 / globalScale;
      ctx.stroke();
    }

    // Draw label (only if zoomed in enough)
    if (globalScale > 0.8 && isHighlighted) {
      ctx.font = `${fontSize}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = isHighlighted ? '#e2e8f0' : '#64748b';
      ctx.fillText(label, node.x, node.y + nodeSize + 2);
    }
  }, [highlightNodes, hoverNode, selectedNodeId]);

  // Empty state
  if (graph.nodes.length === 0) {
    return (
      <div className="h-full flex flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-700/50 bg-slate-900/80">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-md bg-gradient-to-br from-emerald-500 to-cyan-500">
              <Network className="w-4 h-4 text-slate-950" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight text-slate-100">
                Knowledge Graph
              </div>
              <div className="text-xs text-slate-400 hidden sm:block">
                Your temporal epistemic network
              </div>
            </div>
          </div>
        </div>

        {/* Empty state */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <div className="w-24 h-24 rounded-full bg-slate-800/50 border border-slate-700 flex items-center justify-center mb-6">
            <Brain className="w-12 h-12 text-slate-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-200 mb-2">
            Your Knowledge Graph Awaits
          </h2>
          <p className="text-sm text-slate-400 max-w-md mb-6">
            Begin your journey by writing reflections, completing learning modules,
            or setting intent horizons. Your conceptual network will grow as you explore.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowIntentPanel(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-medium text-sm hover:from-emerald-400 hover:to-cyan-400 transition-all"
            >
              <Target className="w-4 h-4" />
              Set an Intent
            </button>
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Or write a reflection to seed your graph
            </div>
          </div>
        </div>

        {/* Intent Panel (can still be opened in empty state) */}
        {showIntentPanel && (
          <IntentHorizonPanel onClose={() => setShowIntentPanel(false)} />
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-700/50 bg-slate-900/80 flex-none">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-md bg-gradient-to-br from-emerald-500 to-cyan-500">
            <Network className="w-4 h-4 text-slate-950" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight text-slate-100">
              Knowledge Graph
            </div>
            <div className="text-xs text-slate-400 hidden sm:block">
              {stats.totalNodes} concepts • {stats.totalEdges} connections
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* JADE Analysis Button */}
          <button
            onClick={handleAnalyzeWithJADE}
            disabled={isAnalyzing}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? 'Analyzing...' : 'JADE Insights'}
          </button>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              showFilters || domainFilter.length > 0
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
            {domainFilter.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded bg-cyan-500/30 text-[10px]">
                {domainFilter.length}
              </span>
            )}
          </button>

          {/* Intent Button */}
          <button
            onClick={() => setShowIntentPanel(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-400 border border-emerald-500/30 hover:from-emerald-500/30 hover:to-cyan-500/30 transition-all"
          >
            <Target className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Intent</span>
          </button>
        </div>
      </div>

      {/* Filter Bar (expandable) */}
      {showFilters && (
        <div className="px-4 sm:px-6 py-3 border-b border-slate-700/50 bg-slate-900/60 flex-none">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-slate-500 uppercase tracking-wider">Domains:</span>
            {(Object.keys(DOMAIN_COLORS) as KnowledgeDomain[]).map(domain => (
              <button
                key={domain}
                onClick={() => toggleDomainFilter(domain)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  domainFilter.length === 0 || domainFilter.includes(domain)
                    ? 'opacity-100'
                    : 'opacity-40'
                }`}
                style={{
                  backgroundColor: `${DOMAIN_COLORS[domain]}20`,
                  color: DOMAIN_COLORS[domain],
                  borderWidth: 1,
                  borderColor: domainFilter.includes(domain) ? DOMAIN_COLORS[domain] : 'transparent',
                }}
              >
                {domain.charAt(0).toUpperCase() + domain.slice(1)}
              </button>
            ))}
            
            {domainFilter.length > 0 && (
              <button
                onClick={() => setDomainFilter([])}
                className="px-2 py-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0 relative" ref={containerRef}>
        {/* Graph Visualization */}
        <div className="flex-1 min-w-0 relative">
          <ForceGraph2D
            ref={graphRef}
            graphData={graphData}
            width={dimensions.width - (selectedNodeId ? 320 : 0)}
            height={dimensions.height}
            nodeCanvasObject={nodeCanvasObject}
            nodePointerAreaPaint={(node, color, ctx) => {
              ctx.fillStyle = color;
              ctx.beginPath();
              ctx.arc(node.x!, node.y!, Math.max(4, Math.log((node as any).weight + 1) * 4) + 2, 0, 2 * Math.PI);
              ctx.fill();
            }}
            linkColor={(link) => (link as any).color || 'rgba(148, 163, 184, 0.3)'}
            linkWidth={(link) => Math.max(0.5, (link as any).strength * 3)}
            linkDirectionalParticles={(link) => (link as any).strength > 0.5 ? 2 : 0}
            linkDirectionalParticleWidth={2}
            onNodeClick={handleNodeClick}
            onNodeHover={handleNodeHover}
            backgroundColor="transparent"
            cooldownTicks={100}
            d3AlphaDecay={0.02}
            d3VelocityDecay={0.3}
            enableZoomInteraction={true}
            enablePanInteraction={true}
          />

          {/* Hover Tooltip */}
          {hoverNode && (
            <div
              className="absolute pointer-events-none px-3 py-2 bg-slate-800/95 backdrop-blur-sm border border-slate-700 rounded-lg shadow-xl z-10"
              style={{
                left: Math.min(dimensions.width - 200, Math.max(10, (hoverNode as any).x || 100)),
                top: Math.min(dimensions.height - 80, Math.max(10, ((hoverNode as any).y || 100) + 20)),
              }}
            >
              <div className="text-sm font-medium text-slate-100">{hoverNode.label}</div>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                  style={{ backgroundColor: `${DOMAIN_COLORS[hoverNode.domain]}30`, color: DOMAIN_COLORS[hoverNode.domain] }}
                >
                  {hoverNode.domain}
                </span>
                <span className="text-xs text-slate-400">
                  Weight: {hoverNode.weight}
                </span>
              </div>
            </div>
          )}

          {/* Quick Stats Overlay */}
          <div className="absolute bottom-4 left-4 hidden sm:block">
            <GraphStats stats={stats} compact />
          </div>

          {/* Dominant Themes Quick View */}
          <div className="absolute top-4 left-4 hidden lg:block">
            <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-lg p-3 max-w-[200px]">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Dominant Themes
              </div>
              <div className="space-y-1">
                {getDominantThemes(5).map((node, i) => (
                  <button
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className="w-full text-left px-2 py-1 rounded text-xs hover:bg-slate-800 transition-colors flex items-center justify-between group"
                  >
                    <span className="text-slate-300 truncate">{node.label}</span>
                    <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-slate-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Node Details Panel (slides in from right) */}
        {selectedNodeId && (
          <div className="w-80 border-l border-slate-700/50 bg-slate-900/90 backdrop-blur-sm flex-none overflow-hidden">
            <NodeDetailsPanel
              nodeId={selectedNodeId}
              onClose={() => setSelectedNodeId(null)}
              onNodeClick={setSelectedNodeId}
            />
          </div>
        )}
      </div>

      {/* Timeline Slider */}
      <div className="border-t border-slate-700/50 bg-slate-900/80 px-4 sm:px-6 py-3 flex-none">
        <TimelineSlider
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          graph={graph}
        />
      </div>

      {/* Intent Horizon Panel (modal) */}
      {showIntentPanel && (
        <IntentHorizonPanel onClose={() => setShowIntentPanel(false)} />
      )}

      {/* JADE Insights Panel (modal) */}
      {showJadeInsights && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-xl max-w-lg w-full max-h-[80vh] overflow-hidden shadow-2xl shadow-emerald-500/10">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-semibold text-slate-100">JADE Insights</h2>
              </div>
              <button
                onClick={() => setShowJadeInsights(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                ×
              </button>
            </div>
            
            <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
              {jadeInsights.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No patterns detected yet.</p>
                  <p className="text-xs mt-1">Keep growing your graph!</p>
                </div>
              ) : (
                jadeInsights.map((insight, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-lg border ${
                      insight.type === 'dominant_theme'
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : insight.type === 'neglected_area'
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : insight.type === 'emerging_cluster'
                        ? 'bg-cyan-500/10 border-cyan-500/30'
                        : 'bg-slate-800/50 border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-slate-200">{insight.title}</h3>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">
                        {Math.round(insight.confidence * 100)}%
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 mt-2">{insight.description}</p>
                    {insight.actionable && (
                      <p className="text-xs text-emerald-400 mt-2 flex items-start gap-1">
                        <Compass className="w-3 h-3 mt-0.5 flex-none" />
                        {insight.actionable}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeGraphLab;
