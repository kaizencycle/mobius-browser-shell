import React, { useState, useEffect, useRef } from 'react';
import { Clock, GraduationCap, Tag, AlertCircle } from 'lucide-react';
import { CourseVideo } from '../../src/lib/oaa/courses';
import { MIN_VIEW_SECONDS } from '../../src/lib/oaa/quiz-engine';

interface SeminarCardProps {
  course: CourseVideo;
  index: number;        // 1–5
  total: number;        // always 5
  isActive: boolean;
  onReady: () => void;  // called when MIN_VIEW_SECONDS has elapsed
}

export const SeminarCard: React.FC<SeminarCardProps> = ({
  course,
  index,
  total,
  isActive,
  onReady,
}) => {
  const [elapsed, setElapsed] = useState(0);
  const [playerReady, setPlayerReady] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const calledReady = useRef(false);

  useEffect(() => {
    if (!isActive) return;
    intervalRef.current = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 1;
        if (next >= MIN_VIEW_SECONDS && !calledReady.current) {
          calledReady.current = true;
          onReady();
        }
        return next;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, onReady]);

  const remaining = Math.max(MIN_VIEW_SECONDS - elapsed, 0);
  const progress = Math.min((elapsed / MIN_VIEW_SECONDS) * 100, 100);
  const difficultyColors: Record<string, string> = {
    intro: 'bg-emerald-100 text-emerald-700',
    intermediate: 'bg-blue-100 text-blue-700',
    advanced: 'bg-violet-100 text-violet-700',
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Progress bar */}
      <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
        <span className="font-medium">Seminar {index} of {total}</span>
        {remaining > 0 && isActive && (
          <span className="flex items-center gap-1 text-amber-600 font-medium">
            <AlertCircle className="w-3 h-3" />
            {remaining}s before you can advance
          </span>
        )}
        {remaining === 0 && isActive && (
          <span className="text-emerald-600 font-medium">Ready to advance ↑</span>
        )}
      </div>

      {/* View timer progress bar */}
      {isActive && (
        <div className="h-1 bg-stone-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-400 rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Embed */}
      <div className="relative bg-black rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
        {!playerReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-stone-900">
            <div className="text-center text-stone-400">
              <div className="w-8 h-8 border-2 border-stone-600 border-t-amber-400 rounded-full animate-spin mx-auto mb-2" />
              <span className="text-xs">Loading seminar…</span>
            </div>
          </div>
        )}
        <iframe
          src={`${course.embedUrl}?autoplay=${isActive ? 1 : 0}&rel=0&modestbranding=1`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={() => setPlayerReady(true)}
          title={course.title}
        />
      </div>

      {/* Metadata */}
      <div className="bg-white rounded-xl border border-stone-100 p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-stone-900 text-base leading-snug flex-1">
            {course.title}
          </h3>
          <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-medium ${difficultyColors[course.difficulty]}`}>
            {course.difficulty}
          </span>
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-stone-500">
          {course.professorName && (
            <span className="flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5" />
              {course.professorName}
              {course.institution && ` · ${course.institution}`}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {Math.round(course.durationSeconds / 60)} min
          </span>
        </div>

        <div className="flex flex-wrap gap-1">
          {course.tags.slice(0, 4).map(tag => (
            <span
              key={tag}
              className="flex items-center gap-0.5 px-1.5 py-0.5 bg-stone-50 border border-stone-100 rounded text-xs text-stone-400"
            >
              <Tag className="w-2.5 h-2.5" />
              {tag}
            </span>
          ))}
        </div>

        <div className="text-xs text-stone-400 italic">{course.sourceCredit}</div>
      </div>
    </div>
  );
};
