import React, { useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, ChevronRight, ArrowLeft } from 'lucide-react';
import { Quiz, QuizQuestion } from '../../src/lib/oaa/courses';
import { QuizSession, scoreQuiz, QuizResult } from '../../src/lib/oaa/quiz-engine';

interface QuizGateProps {
  quiz: Quiz;
  courseId: string;
  userId: string;
  swipeTimestamps: number[];
  seminarDurationSeconds: number;
  onPass: (result: QuizResult, answers: Record<string, string>) => void;
  onReviewNeeded: () => void;
}

export const QuizGate: React.FC<QuizGateProps> = ({
  quiz,
  courseId,
  userId,
  swipeTimestamps,
  seminarDurationSeconds,
  onPass,
  onReviewNeeded,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [startTime] = useState(() => Date.now());

  const question = quiz.questions[currentIdx];
  const isLast = currentIdx === quiz.questions.length - 1;
  const correct = question && selected === question.correctAnswer;

  const handleConfirm = () => {
    if (!selected || !question) return;
    setAnswers(prev => ({ ...prev, [question.id]: selected }));
    setConfirmed(true);
  };

  const handleNext = () => {
    if (!question) return;
    if (isLast) {
      const finalAnswers = { ...answers, [question.id]: selected! };
      const session: QuizSession = {
        userId,
        quizId: quiz.id,
        courseId,
        startTime,
        answers: finalAnswers,
        swipeTimestamps,
        seminarDurationSeconds,
      };
      const result = scoreQuiz(session, quiz);
      if (result.passed) {
        onPass(result, finalAnswers);
      } else {
        onReviewNeeded();
      }
      return;
    }
    setCurrentIdx(prev => prev + 1);
    setSelected(null);
    setConfirmed(false);
  };

  if (!question) return null;

  const optionLabels = ['A', 'B', 'C', 'D'];

  return (
    <div className="max-w-xl mx-auto px-4">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-stone-400 uppercase tracking-wide">
            Quiz Gate
          </span>
          <span className="text-xs text-stone-400">
            {currentIdx + 1} / {quiz.questions.length}
          </span>
        </div>
        <div className="flex gap-1.5">
          {quiz.questions.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                i < currentIdx
                  ? (answers[quiz.questions[i].id] === quiz.questions[i].correctAnswer
                    ? 'bg-emerald-400'
                    : 'bg-rose-400')
                  : i === currentIdx
                  ? 'bg-amber-500'
                  : 'bg-stone-100'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Question */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4">
        <p className="font-semibold text-stone-900 text-base leading-snug">
          {question.text}
        </p>

        {/* Options */}
        <div className="space-y-2.5">
          {(question.options ?? []).map((opt, i) => {
            const letter = optionLabels[i];
            const isSelected = selected === letter;
            const isCorrectOpt = letter === question.correctAnswer;

            return (
              <button
                key={letter}
                onClick={() => !confirmed && setSelected(letter)}
                disabled={confirmed}
                className={`
                  w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left text-sm
                  transition-all duration-150
                  ${!confirmed && !isSelected ? 'border-stone-200 hover:border-amber-300 hover:bg-amber-50/40' : ''}
                  ${!confirmed && isSelected ? 'border-amber-400 bg-amber-50' : ''}
                  ${confirmed && isCorrectOpt ? 'border-emerald-400 bg-emerald-50' : ''}
                  ${confirmed && isSelected && !isCorrectOpt ? 'border-rose-400 bg-rose-50' : ''}
                  ${confirmed && !isSelected && !isCorrectOpt ? 'border-stone-100 bg-stone-50 opacity-50' : ''}
                  ${confirmed ? 'cursor-default' : 'cursor-pointer'}
                `}
              >
                <span className={`font-bold text-xs w-5 shrink-0 ${
                  !confirmed ? 'text-stone-400'
                    : isCorrectOpt ? 'text-emerald-600'
                    : isSelected ? 'text-rose-500'
                    : 'text-stone-300'
                }`}>
                  {letter}
                </span>
                <span className="flex-1 font-medium text-stone-800">{opt}</span>
                {confirmed && isCorrectOpt && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                {confirmed && isSelected && !isCorrectOpt && <XCircle className="w-4 h-4 text-rose-500 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Confirmation feedback */}
        {confirmed && (
          <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
            correct ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                    : 'bg-rose-50 border border-rose-200 text-rose-700'
          }`}>
            {correct
              ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              : <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
            }
            <span>{correct ? 'Correct.' : `Incorrect. The answer is ${question.correctAnswer}.`}</span>
          </div>
        )}

        {/* Action */}
        {!confirmed ? (
          <button
            onClick={handleConfirm}
            disabled={!selected}
            className={`
              w-full py-3 rounded-xl font-semibold text-sm transition-all duration-150
              ${selected
                ? 'bg-stone-900 text-white hover:bg-stone-800'
                : 'bg-stone-100 text-stone-400 cursor-not-allowed'
              }
            `}
          >
            Confirm Answer
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm bg-amber-500 text-white hover:bg-amber-600 transition-colors"
          >
            {isLast ? 'See Results' : 'Next Question'}
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Need to review */}
      <button
        onClick={onReviewNeeded}
        className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs text-stone-400 hover:text-stone-600 transition-colors py-2"
      >
        <ArrowLeft className="w-3 h-3" />
        Back to seminars to review
      </button>
    </div>
  );
};
