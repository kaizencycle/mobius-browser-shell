/**
 * NodeDetailsPanel
 * 
 * Shows detailed information about a selected node in the knowledge graph.
 * Displays connections, mentions, and temporal evolution.
 */
import React from 'react';
import {
  X,
  Link2,
  Calendar,
  TrendingUp,
  Clock,
  FileText,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useKnowledgeGraph, DOMAIN_COLORS } from '../../contexts/KnowledgeGraphContext';

interface NodeDetailsPanelProps {
  nodeId: string;
  onClose: () => void;
  onNodeClick: (nodeId: string) => void;
}

export const NodeDetailsPanel: React.FC<NodeDetailsPanelProps> = ({
  nodeId,
  onClose,
  onNodeClick,
}) => {
  const { getNodeDetails, graph } = useKnowledgeGraph();
  
  const details = getNodeDetails(nodeId);
  
  if (!details) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center text-slate-500">
          <p className="text-sm">Node not found</p>
        </div>
      </div>
    );
  }

  const { node, connections, mentions, trajectory } = details;

  // Get edges for this node
  const nodeEdges = graph.edges.filter(e => e.source === nodeId || e.target === nodeId);
  
  // Calculate time since first/last seen
  const firstSeen = new Date(node.firstSeen);
  const lastSeen = new Date(node.lastSeen);
  const daysSinceFirst = Math.floor((Date.now() - firstSeen.getTime()) / (1000 * 60 * 60 * 24));
  const daysSinceLast = Math.floor((Date.now() - lastSeen.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-slate-700/50">
        <div className="flex-1 min-w-0 pr-2">
          <h2 className="text-lg font-semibold text-slate-100 truncate">
            {node.label}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider"
              style={{
                backgroundColor: `${DOMAIN_COLORS[node.domain]}20`,
                color: DOMAIN_COLORS[node.domain],
              }}
            >
              {node.domain}
            </span>
            <span className="text-xs text-slate-500">
              {node.type}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-2 p-4 border-b border-slate-700/50">
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-emerald-400">{node.weight}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Weight</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-cyan-400">{connections.length}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Connections</div>
          </div>
        </div>

        {/* Timeline */}
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Timeline</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">First appeared</span>
              <div className="text-right">
                <div className="text-slate-300">{firstSeen.toLocaleDateString()}</div>
                <div className="text-[10px] text-slate-500">
                  {daysSinceFirst === 0 ? 'Today' : `${daysSinceFirst} days ago`}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Last seen</span>
              <div className="text-right">
                <div className="text-slate-300">{lastSeen.toLocaleDateString()}</div>
                <div className="text-[10px] text-slate-500">
                  {daysSinceLast === 0 ? 'Today' : `${daysSinceLast} days ago`}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Connections */}
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center gap-2 mb-3">
            <Link2 className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Connected Concepts ({connections.length})
            </h3>
          </div>
          
          {connections.length === 0 ? (
            <div className="text-xs text-slate-500 italic py-2">
              No connections yet. Keep exploring to build your network.
            </div>
          ) : (
            <div className="space-y-1">
              {connections.slice(0, 10).map(conn => {
                const edge = nodeEdges.find(e =>
                  (e.source === nodeId && e.target === conn.id) ||
                  (e.target === nodeId && e.source === conn.id)
                );
                
                return (
                  <button
                    key={conn.id}
                    onClick={() => onNodeClick(conn.id)}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-800/50 transition-colors group text-left"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-2 h-2 rounded-full flex-none"
                        style={{ backgroundColor: DOMAIN_COLORS[conn.domain] }}
                      />
                      <span className="text-sm text-slate-300 truncate">{conn.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {edge && (
                        <span className="text-[10px] text-slate-500">
                          {edge.type}
                        </span>
                      )}
                      <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-slate-400 transition-colors" />
                    </div>
                  </button>
                );
              })}
              
              {connections.length > 10 && (
                <div className="text-xs text-slate-500 text-center pt-2">
                  +{connections.length - 10} more connections
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sources / Mentions */}
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Sources ({node.sources.length})
            </h3>
          </div>
          
          {node.sources.length === 0 ? (
            <div className="text-xs text-slate-500 italic py-2">
              No source references recorded.
            </div>
          ) : (
            <div className="space-y-1">
              {node.sources.slice(0, 5).map((sourceId, i) => (
                <div
                  key={sourceId}
                  className="px-2 py-1.5 rounded-lg bg-slate-800/30 text-xs text-slate-400 truncate"
                >
                  {sourceId.startsWith('reflection-') ? '📝 Reflection' : '📚 Learning'}: {sourceId.slice(-8)}
                </div>
              ))}
              
              {node.sources.length > 5 && (
                <div className="text-xs text-slate-500 text-center pt-2">
                  +{node.sources.length - 5} more sources
                </div>
              )}
            </div>
          )}
        </div>

        {/* Growth Trajectory */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Growth Pattern
            </h3>
          </div>
          
          <div className="h-16 flex items-end gap-1">
            {/* Simple bar chart visualization */}
            {Array.from({ length: 7 }).map((_, i) => {
              // Mock data for visualization - in production, use actual trajectory
              const height = Math.min(100, (node.weight / 10) * (100 - i * 10));
              return (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-emerald-500/50 to-emerald-500/20 rounded-t"
                  style={{ height: `${Math.max(10, height)}%` }}
                />
              );
            })}
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-slate-600">
            <span>7d ago</span>
            <span>Today</span>
          </div>
        </div>

        {/* Intent Node Special Content */}
        {node.type === 'intent' && node.metadata?.goalText && (
          <div className="p-4 border-t border-slate-700/50">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Intent Details
              </h3>
            </div>
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
              <p className="text-sm text-cyan-200">{node.metadata.goalText}</p>
              {node.metadata.intentHorizon && (
                <div className="mt-2 text-xs text-cyan-400/70">
                  Horizon: {node.metadata.intentHorizon}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NodeDetailsPanel;
