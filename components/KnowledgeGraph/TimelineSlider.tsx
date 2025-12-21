/**
 * TimelineSlider
 * 
 * Time-based filter for the knowledge graph.
 * Watch your graph evolve over time.
 */
import React, { useState, useMemo } from 'react';
import { Calendar, Play, Pause, SkipBack, Clock } from 'lucide-react';
import { KnowledgeGraph } from '../../types';

interface TimelineSliderProps {
  timeRange: { start: Date | null; end: Date | null };
  onTimeRangeChange: (range: { start: Date | null; end: Date | null }) => void;
  graph: KnowledgeGraph;
}

export const TimelineSlider: React.FC<TimelineSliderProps> = ({
  timeRange,
  onTimeRangeChange,
  graph,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('all');

  // Calculate time bounds from graph data
  const timeBounds = useMemo(() => {
    if (graph.nodes.length === 0) {
      return { min: new Date(), max: new Date() };
    }

    const dates = graph.nodes.flatMap(n => [
      new Date(n.firstSeen).getTime(),
      new Date(n.lastSeen).getTime(),
    ]);

    return {
      min: new Date(Math.min(...dates)),
      max: new Date(Math.max(...dates)),
    };
  }, [graph.nodes]);

  // Preset time ranges
  const presets = [
    { id: 'all', label: 'All Time', days: null },
    { id: '7d', label: '7 Days', days: 7 },
    { id: '30d', label: '30 Days', days: 30 },
    { id: '90d', label: '90 Days', days: 90 },
  ];

  const handlePresetChange = (presetId: string) => {
    setSelectedPreset(presetId);
    const preset = presets.find(p => p.id === presetId);

    if (!preset || preset.days === null) {
      onTimeRangeChange({ start: null, end: null });
    } else {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - preset.days);
      onTimeRangeChange({ start, end });
    }
  };

  // Calculate activity heatmap (simple version)
  const activityData = useMemo(() => {
    const days = 30;
    const data: number[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(now.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const activity = graph.nodes.filter(n => {
        const nodeDate = new Date(n.lastSeen).toISOString().split('T')[0];
        return nodeDate === dateStr;
      }).length;

      data.push(activity);
    }

    return data;
  }, [graph.nodes]);

  const maxActivity = Math.max(...activityData, 1);

  // Format date for display
  const formatDate = (date: Date | null): string => {
    if (!date) return '-';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-3">
      {/* Preset Buttons */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Clock className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Time Filter:</span>
        </div>
        
        <div className="flex items-center gap-1.5">
          {presets.map(preset => (
            <button
              key={preset.id}
              onClick={() => handlePresetChange(preset.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                selectedPreset === preset.id
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Date Range Display */}
        {(timeRange.start || timeRange.end) && (
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 ml-auto">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {formatDate(timeRange.start)} — {formatDate(timeRange.end)}
            </span>
            <button
              onClick={() => handlePresetChange('all')}
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Activity Heatmap (Mini Timeline) */}
      <div className="flex items-end gap-0.5 h-6">
        {activityData.map((activity, i) => {
          const opacity = activity > 0 ? 0.3 + (activity / maxActivity) * 0.7 : 0.1;
          const isInRange = (() => {
            if (!timeRange.start && !timeRange.end) return true;
            const dayDate = new Date();
            dayDate.setDate(dayDate.getDate() - (29 - i));
            if (timeRange.start && dayDate < timeRange.start) return false;
            if (timeRange.end && dayDate > timeRange.end) return false;
            return true;
          })();

          return (
            <div
              key={i}
              className={`flex-1 rounded-sm transition-all ${
                isInRange ? 'bg-emerald-400' : 'bg-slate-700'
              }`}
              style={{
                height: `${Math.max(15, (activity / maxActivity) * 100)}%`,
                opacity: isInRange ? opacity : 0.2,
              }}
              title={`${activity} activities`}
            />
          );
        })}
      </div>

      {/* Timeline Labels */}
      <div className="flex justify-between text-[10px] text-slate-600">
        <span>30 days ago</span>
        <span>Today</span>
      </div>
    </div>
  );
};

export default TimelineSlider;
