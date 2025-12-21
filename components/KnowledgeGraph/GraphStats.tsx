/**
 * GraphStats
 * 
 * Display key statistics about the knowledge graph.
 */
import React from 'react';
import { Network, Link2, TrendingUp, Layers } from 'lucide-react';
import { KnowledgeDomain } from '../../types';
import { DOMAIN_COLORS } from '../../contexts/KnowledgeGraphContext';

interface GraphStatsProps {
  stats: {
    totalNodes: number;
    totalEdges: number;
    avgConnections: number;
    graphDensity: number;
    dominantDomain: KnowledgeDomain | null;
  };
  compact?: boolean;
}

export const GraphStats: React.FC<GraphStatsProps> = ({ stats, compact = false }) => {
  if (compact) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-lg px-3 py-2 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <Network className="w-3 h-3 text-emerald-400" />
          <span className="text-slate-400">{stats.totalNodes}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Link2 className="w-3 h-3 text-cyan-400" />
          <span className="text-slate-400">{stats.totalEdges}</span>
        </div>
        {stats.dominantDomain && (
          <div className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: DOMAIN_COLORS[stats.dominantDomain] }}
            />
            <span className="text-slate-400 capitalize">{stats.dominantDomain}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
      <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
        <Layers className="w-3.5 h-3.5" />
        Graph Statistics
      </h3>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Network className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-slate-100">{stats.totalNodes}</div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Concepts</div>
        </div>
        
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Link2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-slate-100">{stats.totalEdges}</div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Connections</div>
        </div>
        
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-slate-100">{stats.avgConnections}</div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Avg Links</div>
        </div>
        
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          {stats.dominantDomain ? (
            <>
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: DOMAIN_COLORS[stats.dominantDomain] }}
                />
              </div>
              <div className="text-xl font-bold text-slate-100 capitalize">
                {stats.dominantDomain.slice(0, 4)}
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Top Domain</div>
            </>
          ) : (
            <>
              <div className="text-xl font-bold text-slate-500">—</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Top Domain</div>
            </>
          )}
        </div>
      </div>
      
      {/* Graph Density Bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1.5">
          <span>Graph Density</span>
          <span>{Math.round(stats.graphDensity * 100)}%</span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, stats.graphDensity * 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-600 mt-1">
          <span>Sparse</span>
          <span>Dense</span>
        </div>
      </div>
    </div>
  );
};

export default GraphStats;
