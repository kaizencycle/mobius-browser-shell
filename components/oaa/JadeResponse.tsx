import React from 'react';
import { Sparkles, ArrowRight, RefreshCw } from 'lucide-react';
import { JadeOutput } from '../../src/lib/oaa/jade-routing';
import { getCourseById } from '../../src/lib/oaa/courses';

interface JadeResponseProps {
  output: JadeOutput;
  onStartNext: (courseId: string) => void;
  onChooseNew: () => void;
}

export const JadeResponse: React.FC<JadeResponseProps> = ({
  output,
  onStartNext,
  onChooseNew,
}) => {
  const nextCourse = output.nextCourseId ? getCourseById(output.nextCourseId) : null;

  return (
    <div className="max-w-xl mx-auto px-4 space-y-4">
      {/* JADE reply */}
      <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-200 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">JADE</span>
          {output.micBonus > 0 && (
            <span className="ml-auto text-xs font-bold text-amber-500 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              +{output.micBonus} MIC bonus
            </span>
          )}
        </div>

        <p className="text-sm text-stone-800 leading-relaxed">{output.responseText}</p>

        {output.semanticDepth >= 0.7 && (
          <p className="mt-2 text-xs text-indigo-500 italic">
            Strong question — cross-topic synthesis detected.
          </p>
        )}
      </div>

      {/* Next seminar card */}
      {nextCourse && (
        <div className="bg-white border-2 border-stone-200 rounded-2xl p-4">
          <div className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">
            Next Seminar
          </div>
          <h3 className="font-bold text-stone-900 text-base mb-1">{nextCourse.title}</h3>
          {nextCourse.professorName && (
            <p className="text-xs text-stone-500 mb-3">
              {nextCourse.professorName}
              {nextCourse.institution && ` · ${nextCourse.institution}`}
            </p>
          )}
          <div className="flex flex-wrap gap-1 mb-4">
            {nextCourse.tags.slice(0, 3).map(tag => (
              <span key={tag} className="px-1.5 py-0.5 bg-stone-50 border border-stone-100 rounded text-xs text-stone-400">
                {tag}
              </span>
            ))}
          </div>
          <button
            onClick={() => onStartNext(nextCourse.id)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-stone-900 text-white rounded-xl font-semibold text-sm hover:bg-stone-800 transition-colors"
          >
            Start Next Seminar
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <button
        onClick={onChooseNew}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 text-sm text-stone-500 hover:text-stone-800 transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Choose a different subject
      </button>
    </div>
  );
};
