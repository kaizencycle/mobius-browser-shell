import React from 'react';
import { BookOpen, CheckCircle, Clock, FileSearch } from 'lucide-react';
import type { UserLearningProgress } from '../../types';

interface LearnEvidenceStatsProps {
  progress: UserLearningProgress;
}

/** Evidence-oriented stats — no MIC farming or streak display. */
export const LearnEvidenceStats: React.FC<LearnEvidenceStatsProps> = ({ progress }) => {
  const accuracy =
    progress.totalQuestions > 0
      ? Math.round((progress.totalCorrect / progress.totalQuestions) * 100)
      : 0;

  const stats = [
    {
      label: 'Encounters',
      value: progress.modulesCompleted,
      icon: <BookOpen className="w-4 h-4 text-stone-500" />,
    },
    {
      label: 'Comprehension',
      value: progress.totalQuestions > 0 ? `${accuracy}%` : '—',
      icon: <CheckCircle className="w-4 h-4 text-emerald-600" />,
    },
    {
      label: 'Evidence logged',
      value: progress.totalQuestions,
      icon: <FileSearch className="w-4 h-4 text-stone-500" />,
    },
    {
      label: 'Time in chamber',
      value: `${progress.totalLearningMinutes}m`,
      icon: <Clock className="w-4 h-4 text-stone-500" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map(stat => (
        <div
          key={stat.label}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/90 border border-stone-200 shadow-sm"
        >
          {stat.icon}
          <div>
            <div className="text-sm font-bold text-stone-900 leading-none">{stat.value}</div>
            <div className="text-[10px] text-stone-500 mt-0.5">{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
};
