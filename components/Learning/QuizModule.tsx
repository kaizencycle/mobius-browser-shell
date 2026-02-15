import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, XCircle, HelpCircle, ChevronRight, 
  Award, Sparkles, ArrowLeft, Flame, Target, Zap
} from 'lucide-react';
import { LearningModule, QuizQuestion } from '../../types';

// ═══ MIC Reward Constants (must match LearningProgressTracker) ═══
const MIN_ACCURACY_THRESHOLD = 0.50;
const STREAK_BONUS_RATE = 0.05;
const PERFECT_BONUS_RATE = 0.15;

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

  // Per-question MIC value (proportional share of module reward)
  const totalPoints = module.questions.reduce((s, q) => s + q.points, 0);
  const questionMicValue = (q: QuizQuestion) => 
    Math.round((q.points / totalPoints) * module.micReward);

  // Running MIC earned so far
  const runningMicEarned = useMemo(() => {
    let mic = 0;
    module.questions.forEach((q, idx) => {
      if (answerResults[idx] === true) {
        mic += questionMicValue(q);
      }
    });
    return mic;
  }, [answerResults]);

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

  // ═══════════════════════════════════════════
  // COMPLETION SCREEN — MIC is the hero
  // ═══════════════════════════════════════════
  if (isCompleted) {
    const accuracy = module.questions.length > 0 ? (correctAnswers / module.questions.length) * 100 : 0;

    // Mirror the reward calculation from LearningProgressTracker
    const accuracyMultiplier = Math.max(accuracy / 100, MIN_ACCURACY_THRESHOLD);
    const baseMic = Math.round(module.micReward * accuracyMultiplier);
    const streakBonus = bestStreak >= 3 
      ? Math.round(module.micReward * STREAK_BONUS_RATE * Math.min(bestStreak, 10)) 
      : 0;
    const perfectBonus = accuracy === 100 
      ? Math.round(module.micReward * PERFECT_BONUS_RATE) 
      : 0;
    const totalMic = baseMic + streakBonus + perfectBonus;

    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-6 sm:p-8 text-center">
          {/* Celebration Icon */}
          <div className="mb-3 text-6xl">
            {accuracy === 100 ? '🏆' : accuracy >= 80 ? '🎉' : accuracy >= 60 ? '💪' : '📖'}
          </div>

          {/* Results */}
          <h2 className="text-2xl font-bold text-stone-900 mb-1">
            {accuracy === 100 ? 'Perfect Score!' : accuracy >= 80 ? 'Outstanding!' : accuracy >= 60 ? 'Great Job!' : 'Keep Learning!'}
          </h2>
          
          <p className="text-stone-500 text-sm mb-6">
            {module.title} — {correctAnswers}/{module.questions.length} correct ({Math.round(accuracy)}%)
          </p>

          {/* ═══ MIC Reward — THE hero section ═══ */}
          <div className="bg-white rounded-2xl p-6 border-2 border-amber-400 mb-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400" />
            
            <div className="flex items-center justify-center gap-2 mb-2">
              <Award className="w-7 h-7 text-amber-500" />
              <h3 className="text-xl font-bold text-stone-900">
                MIC Earned
              </h3>
            </div>

            <div className="text-5xl font-black text-amber-500 mb-4 tracking-tight">
              +{totalMic}
            </div>

            {/* Reward Breakdown */}
            <div className="space-y-2 text-sm text-left max-w-xs mx-auto">
              <div className="flex justify-between text-stone-600">
                <span>Base ({Math.round(accuracy)}% accuracy)</span>
                <span className="font-semibold text-stone-900">+{baseMic} MIC</span>
              </div>
              {streakBonus > 0 && (
                <div className="flex justify-between text-stone-600">
                  <span className="flex items-center gap-1">
                    Streak Bonus
                    <Flame className="w-3.5 h-3.5 text-orange-500" />
                    <span className="text-orange-500 font-medium">{bestStreak}x</span>
                  </span>
                  <span className="font-semibold text-orange-600">+{streakBonus} MIC</span>
                </div>
              )}
              {perfectBonus > 0 && (
                <div className="flex justify-between text-stone-600">
                  <span>Perfect Score Bonus 💎</span>
                  <span className="font-semibold text-violet-600">+{perfectBonus} MIC</span>
                </div>
              )}
            </div>
          </div>

          {/* Score Cards */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white rounded-lg p-3 border border-stone-200">
              <div className="text-xs text-stone-500 mb-1">Accuracy</div>
              <div className="text-lg font-bold text-stone-900">
                {Math.round(accuracy)}%
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-stone-200">
              <div className="text-xs text-stone-500 mb-1">Best Streak</div>
              <div className="text-lg font-bold text-orange-500 flex items-center justify-center gap-1">
                {bestStreak}
                {bestStreak >= 3 && <Flame className="w-4 h-4" />}
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-stone-200">
              <div className="text-xs text-stone-500 mb-1">Questions</div>
              <div className="text-lg font-bold text-emerald-600">
                {correctAnswers}/{module.questions.length}
              </div>
            </div>
          </div>

          {/* Question Review */}
          <div className="bg-white rounded-xl border border-stone-200 p-4 mb-6 text-left">
            <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">Question Review</h4>
            <div className="space-y-2">
              {module.questions.map((q, idx) => {
                const wasCorrect = answers[idx] === q.correctAnswer;
                const micVal = questionMicValue(q);
                return (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    {wasCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
                    )}
                    <span className={`flex-1 ${wasCorrect ? 'text-stone-700' : 'text-stone-400'}`}>
                      {q.question.length > 70 ? q.question.substring(0, 70) + '...' : q.question}
                    </span>
                    <span className={`text-xs font-medium flex-shrink-0 ${wasCorrect ? 'text-amber-500' : 'text-stone-300'}`}>
                      {wasCorrect ? `+${micVal}` : '0'} MIC
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Testnet Badge */}
          <div className="bg-stone-50 rounded-lg p-3 mb-6 text-xs text-stone-500">
            🧪 Testnet — MIC stored locally. On mainnet, MIC backs your reputation and unlocks features.
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleCompleteQuiz}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-xl font-bold hover:from-amber-600 hover:to-yellow-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-200"
            >
              <Award className="w-5 h-5" />
              Claim {totalMic} MIC
            </button>
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3 bg-stone-200 text-stone-700 rounded-xl font-semibold hover:bg-stone-300 transition-colors"
            >
              Back to Modules
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // QUIZ INTERFACE — MIC is the active reward
  // ═══════════════════════════════════════════
  const currentQMic = questionMicValue(currentQuestion);

  return (
    <div className="max-w-3xl mx-auto space-y-5 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Exit</span>
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
                ? 'bg-amber-500'
                : 'bg-stone-200'
            }`}
          />
        ))}
      </div>

      {/* Stats Row — MIC focused */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <span className="font-medium text-stone-500">
            Q{currentQuestionIndex + 1}/{module.questions.length}
          </span>
          {currentStreak >= 2 && (
            <span className="flex items-center gap-1 text-orange-500 font-semibold">
              <Flame className="w-3.5 h-3.5" />
              {currentStreak}x
            </span>
          )}
          {answeredCount > 0 && (
            <span className="flex items-center gap-1 text-stone-400">
              <Target className="w-3.5 h-3.5" />
              {runningAccuracy}%
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Running MIC earned */}
          {runningMicEarned > 0 && (
            <span className="flex items-center gap-1 text-amber-500 font-bold">
              <Award className="w-3.5 h-3.5" />
              {runningMicEarned} MIC
            </span>
          )}
          {/* This question's MIC value */}
          <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200 rounded-full text-amber-600 font-semibold">
            +{currentQMic} MIC
          </span>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 sm:p-6">
        {/* Difficulty Badge + MIC Value */}
        <div className="flex items-center justify-between mb-4">
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

            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={showExplanation}
                className={`
                  w-full p-3.5 rounded-xl border-2 text-left transition-all duration-200
                  ${!showExplanation && !isSelected ? 'border-stone-200 hover:border-amber-300 hover:bg-amber-50/50' : ''}
                  ${!showExplanation && isSelected ? 'border-amber-400 bg-amber-50' : ''}
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
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-xs font-semibold text-amber-500">+{currentQMic} MIC</span>
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    </div>
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
                    ? (currentStreak >= 3 
                        ? `🔥 Correct! ${currentStreak} in a row! +${currentQMic} MIC` 
                        : `✓ Correct! +${currentQMic} MIC`)
                    : '✗ Not quite — no MIC for this one'
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
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white hover:from-amber-600 hover:to-yellow-600 shadow-md shadow-amber-200'
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
                  <Award className="w-4 h-4" />
                  See MIC Earned
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
