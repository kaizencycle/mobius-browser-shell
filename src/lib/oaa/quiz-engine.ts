// src/lib/oaa/quiz-engine.ts — C-355 Quiz Scoring + LIP Computation

import { Quiz, QuizQuestion } from './courses';
import {
  computeLIP,
  computeSwipeVelocity,
  computeQuizVariance,
  computeRetentionDecay,
  LIPResult,
} from './lip';

export interface QuizSession {
  userId: string;
  quizId: string;
  courseId: string;
  startTime: number;
  answers: Record<string, string>; // questionId → selected option letter
  swipeTimestamps: number[];        // timestamps of each seminar swipe
  seminarDurationSeconds: number;
}

export interface QuizResult {
  score: number;        // [0, 1]
  passed: boolean;
  correctCount: number;
  totalQuestions: number;
  timeToAnswer: number; // ms
  lip: LIPResult;
  wrongQuestions: string[];
}

export function scoreQuiz(session: QuizSession, quiz: Quiz): QuizResult {
  let weightedCorrect = 0;
  let totalWeight = 0;
  const wrongQuestions: string[] = [];

  for (const q of quiz.questions) {
    totalWeight += q.weight;
    if (session.answers[q.id] === q.correctAnswer) {
      weightedCorrect += q.weight;
    } else {
      wrongQuestions.push(q.id);
    }
  }

  const score = totalWeight > 0 ? weightedCorrect / totalWeight : 0;
  const passed = score >= quiz.passThreshold;
  const timeToAnswer = Date.now() - session.startTime;

  const swipe_velocity = computeSwipeVelocity(
    session.swipeTimestamps,
    session.seminarDurationSeconds * 5 // total expected for 5 seminars
  );

  const lip = computeLIP({
    swipe_velocity,
    quiz_variance: computeQuizVariance(score, score === 1),
    retention_decay: computeRetentionDecay(session.userId, session.courseId),
    reflection_quality: 0.5, // unknown until reflection submitted — neutral
  });

  return {
    score,
    passed,
    correctCount: Math.round(weightedCorrect),
    totalQuestions: quiz.questions.length,
    timeToAnswer,
    lip,
    wrongQuestions,
  };
}

export function getQuestionByIndex(quiz: Quiz, index: number): QuizQuestion | undefined {
  return quiz.questions[index];
}

export const PASS_THRESHOLD = 0.8;
export const MIN_VIEW_SECONDS = 30; // minimum seconds per seminar card before swipe allowed
export const SEMINAR_STACK_SIZE = 5;
