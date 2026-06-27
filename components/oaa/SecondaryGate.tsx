import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Send } from 'lucide-react';
import { CourseVideo } from '../../src/lib/oaa/courses';

interface SecondaryGateProps {
  course: CourseVideo;
  lipScore: number;
  onPass: () => void;
  onFail: () => void;
}

const SYNTHESIS_QUESTIONS: ((title: string) => string)[] = [
  (title: string) => `In your own words, what was the core argument of "${title}"?`,
  (title: string) => `Name one real-world example where the ideas in "${title}" apply.`,
  (title: string) => `If someone hadn't watched "${title}", what one sentence summary would you give them?`,
];

export const SecondaryGate: React.FC<SecondaryGateProps> = ({
  course,
  lipScore,
  onPass,
  onFail,
}) => {
  const [response, setResponse] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Pick a question based on course id (deterministic)
  const qIndex = course.id.charCodeAt(0) % SYNTHESIS_QUESTIONS.length;
  const questionFn = SYNTHESIS_QUESTIONS[qIndex] ?? SYNTHESIS_QUESTIONS[0]!;
  const question = questionFn(course.title);

  const wordCount = response.trim().split(/\s+/).filter(Boolean).length;
  const MIN_WORDS = 20;
  const canSubmit = wordCount >= MIN_WORDS;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitted(true);
    // Simple heuristic: if they wrote enough, pass them through
    // In Phase 3 this would call JADE for semantic evaluation
    if (wordCount >= MIN_WORDS) {
      setTimeout(onPass, 1500);
    } else {
      setTimeout(onFail, 1500);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4">
      <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 space-y-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-amber-800 text-sm">
              Learning Integrity Check
            </h3>
            <p className="text-xs text-amber-700 mt-0.5">
              Your progression speed exceeded expected comprehension time
              (LIP: {lipScore.toFixed(2)}). Please verify understanding before continuing.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-amber-200">
          <p className="text-sm font-semibold text-stone-800 mb-3">{question}</p>
          <textarea
            value={response}
            onChange={e => setResponse(e.target.value)}
            disabled={submitted}
            placeholder="Write at least 20 words…"
            rows={4}
            className="w-full text-sm text-stone-800 placeholder-stone-300 resize-none outline-none"
          />
          <div className="flex items-center justify-between mt-2">
            <span className={`text-xs ${wordCount >= MIN_WORDS ? 'text-emerald-600' : 'text-stone-400'}`}>
              {wordCount} / {MIN_WORDS} words
            </span>
            {wordCount >= MIN_WORDS && !submitted && (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            )}
          </div>
        </div>

        {submitted ? (
          <div className="flex items-center gap-2 text-sm text-emerald-700 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Verified. Continuing…
          </div>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`
              w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm
              transition-all duration-150
              ${canSubmit
                ? 'bg-amber-500 text-white hover:bg-amber-600'
                : 'bg-amber-100 text-amber-400 cursor-not-allowed'
              }
            `}
          >
            <Send className="w-4 h-4" />
            Submit Verification
          </button>
        )}
      </div>
    </div>
  );
};
