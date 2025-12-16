import React, { useState } from 'react';
import { 
  CheckCircle2, XCircle, HelpCircle, ChevronRight, 
  Award, Sparkles, ArrowLeft
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
  const [isCompleted, setIsCompleted] = useState(false);

  const currentQuestion = module.questions[currentQuestionIndex];
  const progress = module.questions.length > 0 ? ((currentQuestionIndex + 1) / module.questions.length) * 100 : 0;
  const isCorrectAnswer = selectedAnswer !== null && selectedAnswer === currentQuestion?.correctAnswer;

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

    // Update correct answers count
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
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
    const totalMic = baseMic + perfectBonus;

    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-6 sm:p-8 text-center">
          {/* Celebration Icon */}
          <div className="mb-6 text-6xl">
            {accuracy >= 90 ? '🏆' : accuracy >= 70 ? '🎉' : '📚'}
          </div>

          {/* Results */}
          <h2 className="text-2xl font-bold text-stone-900 mb-2">
            {accuracy >= 90 ? 'Outstanding!' : accuracy >= 70 ? 'Great Job!' : 'Keep Learning!'}
          </h2>
          
          <p className="text-stone-600 mb-6">
            You completed <span className="font-semibold">{module.title}</span>
          </p>

          {/* Score Display */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
            <div className="bg-white rounded-lg p-3 sm:p-4 border border-stone-200">
              <div className="text-xs sm:text-sm text-stone-600 mb-1">Accuracy</div>
              <div className="text-xl sm:text-2xl font-bold text-amber-500">
                {Math.round(accuracy)}%
              </div>
            </div>

            <div className="bg-white rounded-lg p-3 sm:p-4 border border-stone-200">
              <div className="text-xs sm:text-sm text-stone-600 mb-1">Correct</div>
              <div className="text-xl sm:text-2xl font-bold text-emerald-600">
                {correctAnswers}/{module.questions.length}
              </div>
            </div>

            <div className="bg-white rounded-lg p-3 sm:p-4 border border-stone-200">
              <div className="text-xs sm:text-sm text-stone-600 mb-1">Points</div>
              <div className="text-xl sm:text-2xl font-bold text-blue-600">
                {earnedPoints}/{totalPoints}
              </div>
            </div>
          </div>

          {/* MIC Reward */}
          <div className="bg-white rounded-xl p-6 border-2 border-amber-400 mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Award className="w-6 h-6 text-amber-500" />
              <h3 className="text-lg font-semibold text-stone-900">
                MIC Reward Earned
              </h3>
            </div>
            <div className="text-4xl font-bold text-amber-500 mb-2">
              {totalMic} MIC
            </div>
            {perfectBonus > 0 && (
              <p className="text-sm text-emerald-600 font-medium">
                +{perfectBonus} Perfect Score Bonus! 🎯
              </p>
            )}
            <p className="text-xs text-stone-500 mt-2">
              Based on {Math.round(accuracy)}% accuracy
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleCompleteQuiz}
              className="flex-1 px-6 py-3 bg-stone-900 text-white rounded-lg font-semibold hover:bg-stone-800 transition-colors"
            >
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
    <div className="max-w-3xl mx-auto space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Exit Quiz</span>
        </button>
        <h2 className="text-lg sm:text-xl font-bold text-stone-900 text-right flex-1 ml-4 truncate">
          {module.title}
        </h2>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex items-center justify-between text-xs sm:text-sm text-stone-600 mb-2">
          <span>Question {currentQuestionIndex + 1} of {module.questions.length}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <div className="w-full bg-stone-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-amber-400 to-yellow-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 sm:p-6">
        {/* Difficulty Badge */}
        <div className="flex items-center justify-between mb-4">
          <div className={`
            px-3 py-1 rounded-lg text-xs font-medium
            ${currentQuestion.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-700' : ''}
            ${currentQuestion.difficulty === 'medium' ? 'bg-blue-100 text-blue-700' : ''}
            ${currentQuestion.difficulty === 'hard' ? 'bg-purple-100 text-purple-700' : ''}
          `}>
            {currentQuestion.difficulty.charAt(0).toUpperCase() + currentQuestion.difficulty.slice(1)}
          </div>
          <div className="flex items-center gap-1.5 text-amber-500">
            <Sparkles className="w-4 h-4" />
            <span className="font-semibold text-sm">{currentQuestion.points} pts</span>
          </div>
        </div>

        {/* Question */}
        <h3 className="text-lg sm:text-xl font-semibold text-stone-900 mb-6">
          {currentQuestion.question}
        </h3>

        {/* Options */}
        <div className="space-y-3 mb-6">
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
                  w-full p-3 sm:p-4 rounded-lg border-2 text-left transition-all duration-200
                  ${!showExplanation && !isSelected ? 'border-stone-200 hover:border-amber-300 hover:bg-amber-50' : ''}
                  ${!showExplanation && isSelected ? 'border-amber-400 bg-amber-50' : ''}
                  ${showExplanation && isCorrect ? 'border-emerald-400 bg-emerald-50' : ''}
                  ${showExplanation && isSelected && !isCorrect ? 'border-red-400 bg-red-50' : ''}
                  ${showExplanation && !isSelected && !isCorrect ? 'border-stone-200 opacity-50' : ''}
                  ${showExplanation ? 'cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-stone-900 text-sm sm:text-base">{option}</span>
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
            p-4 rounded-lg border-2 animate-fadeIn
            ${isCorrectAnswer 
              ? 'bg-emerald-50 border-emerald-200' 
              : 'bg-blue-50 border-blue-200'
            }
          `}>
            <div className="flex items-start gap-3">
              {isCorrectAnswer ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
              ) : (
                <HelpCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <h4 className={`font-semibold mb-1 ${isCorrectAnswer ? 'text-emerald-700' : 'text-blue-700'}`}>
                  {isCorrectAnswer ? 'Correct!' : 'Not quite right'}
                </h4>
                <p className="text-sm text-stone-700 leading-relaxed">
                  {currentQuestion.explanation}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          {!showExplanation ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={selectedAnswer === null}
              className={`
                flex-1 px-6 py-3 rounded-lg font-semibold transition-all duration-200
                ${selectedAnswer !== null
                  ? 'bg-stone-900 text-white hover:bg-stone-800'
                  : 'bg-stone-200 text-stone-500 cursor-not-allowed'
                }
              `}
            >
              Submit Answer
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              className="flex-1 px-6 py-3 bg-stone-900 text-white rounded-lg font-semibold hover:bg-stone-800 transition-all duration-200 flex items-center justify-center gap-2"
            >
              {currentQuestionIndex < module.questions.length - 1 ? (
                <>
                  Next Question
                  <ChevronRight className="w-5 h-5" />
                </>
              ) : (
                'Complete Quiz'
              )}
            </button>
          )}
        </div>
      </div>

      {/* Score Tracker */}
      <div className="flex items-center justify-between p-4 bg-stone-100 rounded-lg text-sm">
        <div className="text-stone-600">
          Correct: <span className="font-semibold text-emerald-600">{correctAnswers}</span> / {currentQuestionIndex + (showExplanation ? 1 : 0)}
        </div>
        <div className="text-stone-600">
          Accuracy: <span className="font-semibold text-amber-500">
            {currentQuestionIndex > 0 || showExplanation 
              ? Math.round((correctAnswers / (currentQuestionIndex + (showExplanation ? 1 : 0))) * 100) 
              : 0}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default QuizModule;
