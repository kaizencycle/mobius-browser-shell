import React from 'react';
import { CourseSubject, SUBJECT_GROUPS, getCoursesBySubject } from '../../src/lib/oaa/courses';

interface SubjectSelectorProps {
  onSelect: (subject: CourseSubject) => void;
}

export const SubjectSelector: React.FC<SubjectSelectorProps> = ({ onSelect }) => {
  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold text-stone-900 mb-1">Choose a Subject</h2>
        <p className="text-sm text-stone-500">
          Watch 5 seminars → pass a quiz → ask JADE → collect Fractal Shards
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {SUBJECT_GROUPS.map(s => {
          const count = getCoursesBySubject(s.id).length;
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              className={`
                flex items-start gap-3 p-4 rounded-xl border-2 text-left
                transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]
                ${s.bg} ${s.border} hover:shadow-sm
              `}
            >
              <span className="text-2xl leading-none">{s.emoji}</span>
              <div>
                <div className={`font-semibold text-sm ${s.color}`}>{s.label}</div>
                <div className="text-xs text-stone-400 mt-0.5">
                  {count} seminar{count !== 1 ? 's' : ''}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 p-3 bg-stone-50 rounded-lg text-xs text-stone-400 text-center border border-stone-100">
        Swipe too fast? You'll get a secondary gate. Learning integrity is tracked.
      </div>
    </div>
  );
};
