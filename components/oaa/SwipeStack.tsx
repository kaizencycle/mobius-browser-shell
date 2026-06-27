import React, { useState, useCallback, useRef } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { CourseVideo } from '../../src/lib/oaa/courses';
import { SeminarCard } from './SeminarCard';
import { MIN_VIEW_SECONDS } from '../../src/lib/oaa/quiz-engine';

interface SwipeStackProps {
  courses: CourseVideo[];
  onComplete: (swipeTimestamps: number[]) => void;
}

export const SwipeStack: React.FC<SwipeStackProps> = ({ courses, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardReady, setCardReady] = useState(false);
  const [blockedAttempt, setBlockedAttempt] = useState(false);
  const swipeTimestamps = useRef<number[]>([Date.now()]);

  const handleReady = useCallback(() => {
    setCardReady(true);
  }, []);

  const advanceCard = useCallback(() => {
    if (!cardReady) {
      setBlockedAttempt(true);
      setTimeout(() => setBlockedAttempt(false), 1200);
      return;
    }

    swipeTimestamps.current.push(Date.now());

    if (currentIndex + 1 >= courses.length) {
      onComplete(swipeTimestamps.current);
      return;
    }

    setCurrentIndex(prev => prev + 1);
    setCardReady(false);
    setBlockedAttempt(false);
  }, [cardReady, currentIndex, courses.length, onComplete]);

  const course = courses[currentIndex];
  if (!course) return null;

  return (
    <div className="flex flex-col max-w-2xl mx-auto px-4">
      {/* Stack progress dots */}
      <div className="flex justify-center gap-2 mb-4">
        {courses.map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i < currentIndex
                ? 'w-6 bg-emerald-400'
                : i === currentIndex
                ? 'w-6 bg-amber-500'
                : 'w-2 bg-stone-200'
            }`}
          />
        ))}
      </div>

      {/* Current card — keyed by course.id so React remounts fresh per card */}
      <SeminarCard
        key={course.id}
        course={course}
        index={currentIndex + 1}
        total={courses.length}
        isActive
        onReady={handleReady}
      />

      {/* Advance control */}
      <div className="mt-4 flex flex-col items-center gap-2">
        {blockedAttempt && (
          <div className="text-sm text-amber-600 font-medium bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-center">
            Take a moment — minimum view time not reached yet.
          </div>
        )}

        <button
          onClick={advanceCard}
          disabled={!cardReady}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200
            ${cardReady
              ? 'bg-stone-900 text-white hover:bg-stone-800 shadow-md'
              : 'bg-stone-100 text-stone-400 cursor-not-allowed'
            }
          `}
        >
          {currentIndex + 1 < courses.length ? (
            <>
              Next Seminar
              <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              Go to Quiz
              <ChevronUp className="w-4 h-4" />
            </>
          )}
        </button>

        {!cardReady && (
          <p className="text-xs text-stone-400 text-center">
            Minimum {MIN_VIEW_SECONDS}s viewing required before advancing.
          </p>
        )}
      </div>
    </div>
  );
};
