import React from 'react';
import type { HiveQuestData } from '../../../hooks/useHiveWorld';

interface Props {
  quest: HiveQuestData;
}

export const QuestTracker: React.FC<Props> = ({ quest }) => {
  const completedCount = quest.steps.filter((s) => s.completed).length;
  const total = quest.steps.length;
  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  const isComplete = quest.status === 'completed';

  return (
    <div className="rounded-lg border border-indigo-700/40 bg-indigo-900/10 p-3 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] text-stone-500 uppercase tracking-widest">Active Quest</div>
          <div className="text-sm font-semibold font-mono text-indigo-200 mt-0.5">{quest.title}</div>
        </div>
        <span
          className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase flex-shrink-0 ${
            isComplete ? 'bg-emerald-900/40 text-emerald-400' : 'bg-indigo-900/40 text-indigo-400'
          }`}
        >
          {quest.status}
        </span>
      </div>

      <p className="text-[11px] text-stone-400 leading-relaxed">{quest.description}</p>

      {total > 0 && (
        <div className="space-y-2">
          <div className="h-1 rounded-full bg-stone-700 overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <ul className="space-y-1.5">
            {quest.steps.map((step, idx) => {
              const isCurrent = !step.completed && (idx === 0 || quest.steps[idx - 1]?.completed);
              return (
                <li key={step.id} className="flex items-center gap-2">
                  <span
                    className={`w-3.5 h-3.5 rounded-full flex-shrink-0 border flex items-center justify-center text-[8px] ${
                      step.completed
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : isCurrent
                        ? 'border-amber-500 bg-amber-900/30'
                        : 'border-stone-600 bg-stone-800'
                    }`}
                  >
                    {step.completed && '✓'}
                  </span>
                  <span
                    className={`text-[11px] font-mono ${
                      step.completed
                        ? 'text-stone-600 line-through'
                        : isCurrent
                        ? 'text-amber-300'
                        : 'text-stone-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};
