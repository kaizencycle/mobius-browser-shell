import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, XCircle, HelpCircle, ChevronRight, 
  Award, Sparkles, ArrowLeft, Flame, Target, Zap
} from 'lucide-react';
import { LearningModule, QuizQuestion } from '../../types';

interface QuizModuleProps {
  module: LearningModule;
  onComplete: (accuracy: number) => void;
  onCancel: () => void;
}

export const QuizModule: React.FC<QuizModuleProps> = ({ 
  module, 
  onComplete, 
  onCancel 
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(module.questions.length).fill(null));
  const [answerResults, setAnswerResults] = useState<(boolean | null)[]>(new Array(module.questions.length).fill(null));
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  const currentQuestion = module.questions[currentQuestionIndex];
  const isCorrectAnswer = selectedAnswer !== null && selectedAnswer === currentQuestion?.correctAnswer;

  // Calculate running stats
  const answeredCount = answerResults.filter(r => r !== null).length;
  const runningAccuracy = answeredCount > 0 
    ? Math.round((correctAnswers / answeredCount) * 100) 
    : 0;

  const handleAnswerSelect = (answerIndex: number) => {
    if (!showExplanation) {
      setSelectedAnswer(answerIndex);
    }
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

    // Update answers array
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = selectedAnswer;
    setAnswers(newAnswers);

    // Update answer results
    const newResults = [...answerResults];
    newResults[currentQuestionIndex] = isCorrect;
    setAnswerResults(newResults);

    // Update correct answers count and streak
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
      const newStreak = currentStreak + 1;
      setCurrentStreak(newStreak);
      if (newStreak > bestStreak) setBestStreak(newStreak);
    } else {
      setCurrentStreak(0);
    }

    // Show explanation
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < module.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      // Quiz completed
      setIsCompleted(true);
    }
  };

  const handleCompleteQuiz = () => {
    const accuracy = module.questions.length > 0 ? correctAnswers / module.questions.length : 0;
    onComplete(accuracy);
  };

  // Completion Screen
  if (isCompleted) {
    const accuracy = module.questions.length > 0 ? (correctAnswers / module.questions.length) * 100 : 0;
    const totalPoints = module.questions.reduce((sum, q) => sum + q.points, 0);
    const earnedPoints = module.questions.reduce((sum, q, idx) => {
      return sum + (answers[idx] === q.correctAnswer ? q.points : 0);
    }, 0);

    // Calculate MIC reward
    const accuracyMultiplier = Math.max(accuracy / 100, 0.70);
    const baseMic = Math.round(module.micReward * accuracyMultiplier);
    const perfectBonus = accuracy === 100 ? Math.round(module.micReward * 0.1) : 0;
    const streakBonus = bestStreak >= 3 ? Math.round(module.micReward * 0.05 * Math.min(bestStreak, 10)) : 0;
    const totalMic = baseMic + perfectBonus + streakBonus;

    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-6 sm:p-8 text-center">
          {/* Celebration Icon */}
          <div className="mb-4 text-6xl">
            {accuracy === 100 ? '🏆' : accuracy >= 80 ? '🎉' : accuracy >= 60 ? '💪' : '📖'}
          </div>

          {/* Results */}
          <h2 className="text-2xl font-bold text-stone-900 mb-1">
            {accuracy === 100 ? 'Perfect Score!' : accuracy >= 80 ? 'Outstanding!' : accuracy >= 60 ? 'Great Job!' : 'Keep Learning!'}
          </h2>
          
          <p className="text-stone-600 mb-6">
            You completed <span className="font-semibold">{module.title}</span>
          </p>

          {/* Score Display */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-white rounded-lg p-3 border border-stone-200">
              <div className="text-xs text-stone-500 mb-1">Accuracy</div>
              <div className="text-xl font-bold text-amber-500">
                {Math.round(accuracy)}%
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-stone-200">
              <div className="text-xs text-stone-500 mb-1">Correct</div>
              <div className="text-xl font-bold text-emerald-600">
                {correctAnswers}/{module.questions.length}
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-stone-200">
              <div className="text-xs text-stone-500 mb-1">Points</div>
              <div className="text-xl font-bold text-blue-600">
                {earnedPoints}/{totalPoints}
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-stone-200">
              <div className="text-xs text-stone-500 mb-1">Best Streak</div>
              <div className="text-xl font-bold text-orange-500 flex items-center justify-center gap-1">
                {bestStreak}
                {bestStreak >= 3 && <Flame className="w-4 h-4" />}
              </div>
            </div>
          </div>

          {/* MIC Reward */}
          <div className="bg-white rounded-xl p-5 border-2 border-amber-400 mb-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Award className="w-6 h-6 text-amber-500" />
              <h3 className="text-lg font-semibold text-stone-900">
                MIC Reward Earned
              </h3>
            </div>

            <div className="space-y-2 text-sm mb-3">
              <div className="flex justify-between text-stone-600">
                <span>Base ({Math.round(accuracy)}% of {module.micReward})</span>
                <span className="font-semibold text-stone-900">+{baseMic} MIC</span>
              </div>
              {streakBonus > 0 && (
                <div className="flex justify-between text-stone-600">
                  <span>Streak Bonus ({bestStreak}🔥)</span>
                  <span className="font-semibold text-orange-600">+{streakBonus} MIC</span>
                </div>
              )}
              {perfectBonus > 0 && (
                <div className="flex justify-between text-stone-600">
                  <span>Perfect Score 💎</span>
                  <span className="font-semibold text-violet-600">+{perfectBonus} MIC</span>
                </div>
              )}
              <div className="border-t border-stone-100 pt-2 flex justify-between">
                <span className="font-semibold text-stone-900">Total</span>
                <span className="font-bold text-lg text-amber-500">+{totalMic} MIC</span>
              </div>
            </div>

            {perfectBonus > 0 && (
              <p className="text-xs text-emerald-600 font-medium">
                🎯 Perfect Score Bonus unlocked!
              </p>
            )}
          </div>

          {/* Question Review */}
          <div className="bg-white rounded-xl border border-stone-200 p-4 mb-6 text-left">
            <h4 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">Question Review</h4>
            <div className="space-y-2">
              {module.questions.map((q, idx) => {
                const wasCorrect = answers[idx] === q.correctAnswer;
                return (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    {wasCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
                    )}
                    <span className={wasCorrect ? 'text-stone-700' : 'text-stone-500'}>
                      {q.question.length > 80 ? q.question.substring(0, 80) + '...' : q.question}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Testnet Badge */}
          <div className="bg-stone-50 rounded-lg p-3 mb-6 text-xs text-stone-500">
            🧪 Testnet Mode — MIC earned locally. On mainnet, MIC converts to real Mobius Integrity Credits.
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleCompleteQuiz}
              className="flex-1 px-6 py-3 bg-stone-900 text-white rounded-lg font-semibold hover:bg-stone-800 transition-colors flex items-center justify-center gap-2"
            >
              <Award className="w-4 h-4" />
              Claim Reward
            </button>
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3 bg-stone-200 text-stone-700 rounded-lg font-semibold hover:bg-stone-300 transition-colors"
            >
              Back to Modules
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Quiz Interface
  return (
    <div className="max-w-3xl mx-auto space-y-5 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Exit Quiz</span>
        </button>
        <h2 className="text-base sm:text-lg font-bold text-stone-900 text-right flex-1 ml-4 truncate">
          {module.title}
        </h2>
      </div>

      {/* Progress Dots */}
      <div className="flex gap-1.5">
        {module.questions.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i < currentQuestionIndex
                ? (answerResults[i] ? 'bg-emerald-400' : 'bg-rose-400')
                : i === currentQuestionIndex
                ? 'bg-violet-500'
                : 'bg-stone-200'
            }`}
          />
        ))}
      </div>

      {/* Stats Row */}
      <div className="flex items-center justify-between text-xs text-stone-500">
        <span className="font-medium">
          Question {currentQuestionIndex + 1} of {module.questions.length}
        </span>
        <div className="flex items-center gap-3">
          {currentStreak >= 2 && (
            <span className="flex items-center gap-1 text-orange-500 font-semibold">
              <Flame className="w-3.5 h-3.5" />
              {currentStreak} streak
            </span>
          )}
          {answeredCount > 0 && (
            <span className="flex items-center gap-1">
              <Target className="w-3.5 h-3.5" />
              {runningAccuracy}%
            </span>
          )}
          <span className="flex items-center gap-1 text-amber-500 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            {currentQuestion.points} pts
          </span>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 sm:p-6">
        {/* Difficulty Badge */}
        <div className="flex items-center gap-2 mb-4">
          <div className={`
            px-2.5 py-1 rounded-lg text-xs font-medium
            ${currentQuestion.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-700' : ''}
            ${currentQuestion.difficulty === 'medium' ? 'bg-blue-100 text-blue-700' : ''}
            ${currentQuestion.difficulty === 'hard' ? 'bg-purple-100 text-purple-700' : ''}
          `}>
            {currentQuestion.difficulty.charAt(0).toUpperCase() + currentQuestion.difficulty.slice(1)}
          </div>
        </div>

        {/* Question */}
        <h3 className="text-lg sm:text-xl font-semibold text-stone-900 mb-6 leading-relaxed">
          {currentQuestion.question}
        </h3>

        {/* Options */}
        <div className="space-y-2.5 mb-6">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === currentQuestion.correctAnswer;
            const showCorrectness = showExplanation;

            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={showExplanation}
                className={`
                  w-full p-3.5 rounded-xl border-2 text-left transition-all duration-200
                  ${!showExplanation && !isSelected ? 'border-stone-200 hover:border-amber-300 hover:bg-amber-50/50' : ''}
                  ${!showExplanation && isSelected ? 'border-violet-400 bg-violet-50' : ''}
                  ${showExplanation && isCorrect ? 'border-emerald-400 bg-emerald-50' : ''}
                  ${showExplanation && isSelected && !isCorrect ? 'border-red-400 bg-red-50' : ''}
                  ${showExplanation && !isSelected && !isCorrect ? 'border-stone-100 bg-stone-50 opacity-50' : ''}
                  ${showExplanation ? 'cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-2.5">
                    <span className="font-medium text-stone-400 text-sm mt-0.5">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <span className="font-medium text-stone-900 text-sm sm:text-base">{option}</span>
                  </div>
                  {showExplanation && isCorrect && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  )}
                  {showExplanation && isSelected && !isCorrect && (
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {showExplanation && (
          <div className={`
            p-4 rounded-xl border-2 mb-4
            ${isCorrectAnswer 
              ? 'bg-emerald-50 border-emerald-200' 
              : 'bg-amber-50 border-amber-200'
            }
          `}>
            <div className="flex items-start gap-3">
              {isCorrectAnswer ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
              ) : (
                <HelpCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <h4 className={`font-semibold mb-1 ${isCorrectAnswer ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {isCorrectAnswer 
                    ? (currentStreak >= 3 ? `🔥 Correct! ${currentStreak} in a row!` : '✓ Correct!')
                    : '✗ Not quite right'
                  }
                </h4>
                <p className="text-sm text-stone-700 leading-relaxed">
                  {currentQuestion.explanation}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!showExplanation ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={selectedAnswer === null}
              className={`
                flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-200
                ${selectedAnswer !== null
                  ? 'bg-violet-600 text-white hover:bg-violet-700'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                }
              `}
            >
              Confirm Answer
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              className="flex-1 px-6 py-3 bg-stone-900 text-white rounded-xl font-semibold hover:bg-stone-800 transition-all duration-200 flex items-center justify-center gap-2"
            >
              {currentQuestionIndex < module.questions.length - 1 ? (
                <>
                  Next Question
                  <ChevronRight className="w-5 h-5" />
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  See Results
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizModule;
