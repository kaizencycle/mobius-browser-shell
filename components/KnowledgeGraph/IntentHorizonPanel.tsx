/**
 * IntentHorizonPanel
 * 
 * Create and manage intent horizons - goals that motivate your learning journey.
 * Intents become special nodes in the knowledge graph, connected to related concepts.
 */
import React, { useState } from 'react';
import {
  Target,
  X,
  Calendar,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Trash2,
  ChevronRight,
} from 'lucide-react';
import { useKnowledgeGraph } from '../../contexts/KnowledgeGraphContext';
import { IntentHorizon } from '../../types';

interface IntentHorizonPanelProps {
  onClose: () => void;
}

export const IntentHorizonPanel: React.FC<IntentHorizonPanelProps> = ({ onClose }) => {
  const { intents, addIntent, updateIntent, getDominantThemes } = useKnowledgeGraph();
  
  const [showNewForm, setShowNewForm] = useState(false);
  const [newGoal, setNewGoal] = useState('');
  const [newHorizon, setNewHorizon] = useState<IntentHorizon['horizon']>('30d');
  const [selectedConcepts, setSelectedConcepts] = useState<string[]>([]);

  // Get active and completed intents
  const activeIntents = intents.filter(i => i.status === 'active');
  const completedIntents = intents.filter(i => i.status === 'completed');

  // Get top concepts for selection
  const topConcepts = getDominantThemes(10);

  const handleCreateIntent = () => {
    if (!newGoal.trim()) return;

    addIntent({
      goal: newGoal.trim(),
      horizon: newHorizon,
      relatedConcepts: selectedConcepts,
    });

    // Reset form
    setNewGoal('');
    setNewHorizon('30d');
    setSelectedConcepts([]);
    setShowNewForm(false);
  };

  const handleCompleteIntent = (id: string) => {
    updateIntent(id, { status: 'completed', progress: 100 });
  };

  const handleAbandonIntent = (id: string) => {
    updateIntent(id, { status: 'abandoned' });
  };

  const toggleConceptSelection = (conceptId: string) => {
    if (selectedConcepts.includes(conceptId)) {
      setSelectedConcepts(selectedConcepts.filter(id => id !== conceptId));
    } else {
      setSelectedConcepts([...selectedConcepts, conceptId]);
    }
  };

  const getHorizonLabel = (horizon: string): string => {
    switch (horizon) {
      case '7d': return '1 Week';
      case '30d': return '30 Days';
      case '90d': return '90 Days';
      case '1y': return '1 Year';
      case 'open': return 'Open-ended';
      default: return horizon;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-cyan-500/30 rounded-xl max-w-lg w-full max-h-[85vh] overflow-hidden shadow-2xl shadow-cyan-500/10">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-slate-100">Intent Horizon</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(85vh-80px)]">
          {/* Introduction */}
          <div className="p-4 border-b border-slate-700/50">
            <p className="text-sm text-slate-400 leading-relaxed">
              Set an intention for your learning journey. Intents become nodes in your knowledge graph,
              connected to the concepts you're exploring. They guide your growth.
            </p>
          </div>

          {/* New Intent Form */}
          {showNewForm ? (
            <div className="p-4 border-b border-slate-700/50 bg-slate-800/30">
              <div className="space-y-4">
                {/* Goal Input */}
                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">
                    What do you want to understand or achieve?
                  </label>
                  <textarea
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    placeholder="e.g., Understand how constitutional AI prevents value drift..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 resize-none h-20"
                  />
                </div>

                {/* Horizon Selection */}
                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">
                    Time Horizon
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(['7d', '30d', '90d', '1y', 'open'] as const).map(h => (
                      <button
                        key={h}
                        onClick={() => setNewHorizon(h)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          newHorizon === h
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                            : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        {getHorizonLabel(h)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Related Concepts */}
                {topConcepts.length > 0 && (
                  <div>
                    <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">
                      Related Concepts (optional)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {topConcepts.map(concept => (
                        <button
                          key={concept.id}
                          onClick={() => toggleConceptSelection(concept.id)}
                          className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                            selectedConcepts.includes(concept.id)
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                              : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
                          }`}
                        >
                          {concept.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={handleCreateIntent}
                    disabled={!newGoal.trim()}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 text-sm font-medium rounded-lg hover:from-cyan-400 hover:to-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Set Intent
                  </button>
                  <button
                    onClick={() => {
                      setShowNewForm(false);
                      setNewGoal('');
                      setSelectedConcepts([]);
                    }}
                    className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 border-b border-slate-700/50">
              <button
                onClick={() => setShowNewForm(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-700 rounded-lg text-sm text-slate-400 hover:border-cyan-500/50 hover:text-cyan-400 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Intent
              </button>
            </div>
          )}

          {/* Active Intents */}
          <div className="p-4 border-b border-slate-700/50">
            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Circle className="w-3 h-3 text-cyan-400" />
              Active Intents ({activeIntents.length})
            </h3>
            
            {activeIntents.length === 0 ? (
              <div className="text-center py-6 text-slate-500">
                <Target className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No active intents</p>
                <p className="text-xs mt-1">Set one to guide your journey</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeIntents.map(intent => (
                  <div
                    key={intent.id}
                    className="bg-slate-800/50 border border-slate-700 rounded-lg p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-200">{intent.goal}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                          <Clock className="w-3 h-3" />
                          <span>{getHorizonLabel(intent.horizon)}</span>
                          <span>•</span>
                          <span>Set {new Date(intent.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCompleteIntent(intent.id)}
                          className="p-1.5 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors"
                          title="Mark complete"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleAbandonIntent(intent.id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                          title="Abandon"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {intent.relatedConcepts.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {intent.relatedConcepts.map(conceptId => (
                          <span
                            key={conceptId}
                            className="px-1.5 py-0.5 rounded bg-slate-700/50 text-[10px] text-slate-400"
                          >
                            {conceptId}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed Intents */}
          {completedIntents.length > 0 && (
            <div className="p-4">
              <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Completed ({completedIntents.length})
              </h3>
              
              <div className="space-y-2">
                {completedIntents.slice(0, 5).map(intent => (
                  <div
                    key={intent.id}
                    className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3"
                  >
                    <p className="text-sm text-slate-400 line-through">{intent.goal}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-emerald-400/70">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Completed</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntentHorizonPanel;
