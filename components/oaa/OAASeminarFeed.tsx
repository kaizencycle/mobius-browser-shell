// components/oaa/OAASeminarFeed.tsx — C-355 OAA Learn-to-Earn orchestrator

import React, { useState, useCallback, useEffect } from 'react';
import { ArrowLeft, BookOpen } from 'lucide-react';

import {
  CourseSubject,
  CourseVideo,
  getCoursesBySubject,
  getQuizByCourseId,
  SUBJECT_GROUPS,
} from '../../src/lib/oaa/courses';
import { QuizResult, SEMINAR_STACK_SIZE } from '../../src/lib/oaa/quiz-engine';
import { computeMICReward, buildAttestation } from '../../src/lib/oaa/mic';
import { routeNextSeminar, JadeOutput, scoreSemanticDepth } from '../../src/lib/oaa/jade-routing';
import {
  loadGraph,
  saveGraph,
  updateGraph,
} from '../../src/lib/oaa/knowledge-graph';
import { computeReflectionComponent } from '../../src/lib/oaa/lip';

import { SubjectSelector } from './SubjectSelector';
import { SwipeStack } from './SwipeStack';
import { QuizGate } from './QuizGate';
import { SecondaryGate } from './SecondaryGate';
import { JadePrompt } from './JadePrompt';
import { JadeResponse } from './JadeResponse';
import { MicRewardToast } from './MicRewardToast';

import { useWallet } from '../../contexts/WalletContext';
import { useAuth } from '../../contexts/AuthContext';

type FeedScreen =
  | 'subject-select'
  | 'swipe-stack'
  | 'quiz-gate'
  | 'secondary-gate'
  | 'jade-prompt'
  | 'jade-response'
  | 'review';

interface OAASeminarFeedProps {
  className?: string;
}

export const OAASeminarFeed: React.FC<OAASeminarFeedProps> = ({ className = '' }) => {
  const { citizen } = useAuth();
  const { earnMIC } = useWallet();

  // ── Navigation state ────────────────────────────────────────────────────
  const [screen, setScreen] = useState<FeedScreen>('subject-select');
  const [selectedSubject, setSelectedSubject] = useState<CourseSubject | null>(null);
  const [seminarStack, setSeminarStack] = useState<CourseVideo[]>([]);
  const [currentCourse, setCurrentCourse] = useState<CourseVideo | null>(null);

  // ── Quiz state ───────────────────────────────────────────────────────────
  const [swipeTimestamps, setSwipeTimestamps] = useState<number[]>([]);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  // ── JADE state ───────────────────────────────────────────────────────────
  const [jadeOutput, setJadeOutput] = useState<JadeOutput | null>(null);

  // ── MIC toast ───────────────────────────────────────────────────────────
  const [pendingToast, setPendingToast] = useState<ReturnType<typeof computeMICReward> | null>(null);
  const [showToast, setShowToast] = useState(false);

  // ── Knowledge graph ──────────────────────────────────────────────────────
  const userId = citizen?.citizenId ?? 'guest';
  const [graph, setGraph] = useState(() => loadGraph(userId));

  // ── Subject selection ────────────────────────────────────────────────────
  const handleSelectSubject = useCallback((subject: CourseSubject) => {
    const available = getCoursesBySubject(subject);
    if (available.length === 0) return;

    // Pick up to SEMINAR_STACK_SIZE from the available list
    const stack = available.slice(0, SEMINAR_STACK_SIZE);
    setSelectedSubject(subject);
    setSeminarStack(stack);
    setCurrentCourse(stack[0] ?? null);
    setScreen('swipe-stack');
  }, []);

  // ── Swipe stack complete ─────────────────────────────────────────────────
  const handleSwipeComplete = useCallback((timestamps: number[]) => {
    setSwipeTimestamps(timestamps);
    setScreen('quiz-gate');
  }, []);

  // ── Quiz pass ────────────────────────────────────────────────────────────
  const handleQuizPass = useCallback((result: QuizResult) => {
    setQuizResult(result);
    if (result.lip.requires_secondary_gate) {
      setScreen('secondary-gate');
    } else {
      setScreen('jade-prompt');
    }
  }, []);

  // ── Secondary gate pass ───────────────────────────────────────────────────
  const handleSecondaryPass = useCallback(() => {
    setScreen('jade-prompt');
  }, []);

  // ── JADE question submitted ───────────────────────────────────────────────
  const handleJadeQuestion = useCallback(async (question: string) => {
    if (!currentCourse || !quizResult) return;

    const depth = scoreSemanticDepth(question);
    const reflComp = computeReflectionComponent(depth);

    // Build JADE output
    const output = routeNextSeminar({
      userId,
      completedCourseId: currentCourse.id,
      userQuestion: question,
      quizScore: quizResult.score,
      knowledgeGraph: graph,
    });

    // Update knowledge graph
    const updatedGraph = updateGraph(graph, output.newGraphEdges);
    setGraph(updatedGraph);
    saveGraph(userId, updatedGraph);

    // Compute MIC
    const breakdown = computeMICReward(quizResult.score, true, depth);
    // Bonus from JADE routing
    if (output.micBonus > 0) breakdown.jadeDepthBonus += output.micBonus;
    breakdown.total = breakdown.base + breakdown.highRetentionBonus + breakdown.reflectionBonus + breakdown.jadeDepthBonus;

    // Mint MIC via WalletContext
    if (breakdown.total > 0) {
      const attestation = buildAttestation(
        userId,
        currentCourse.id,
        quizResult.score,
        quizResult.lip.score,
        question,
        breakdown.total
      );
      await earnMIC('oaa_learning', {
        ...attestation,
        subject: currentCourse.subject,
        category: currentCourse.category,
      });
      setPendingToast(breakdown);
      setShowToast(true);
    }

    setJadeOutput(output);
    setScreen('jade-response');
  }, [currentCourse, quizResult, graph, userId, earnMIC]);

  // ── JADE skipped (no reflection) ─────────────────────────────────────────
  const handleJadeSkip = useCallback(async () => {
    if (!currentCourse || !quizResult) return;

    const breakdown = computeMICReward(quizResult.score, false);
    if (breakdown.total > 0) {
      const attestation = buildAttestation(
        userId,
        currentCourse.id,
        quizResult.score,
        quizResult.lip.score,
        '',
        breakdown.total
      );
      await earnMIC('oaa_learning', { ...attestation, subject: currentCourse.subject });
      setPendingToast(breakdown);
      setShowToast(true);
    }

    // Route without question
    const output = routeNextSeminar({
      userId,
      completedCourseId: currentCourse.id,
      userQuestion: '',
      quizScore: quizResult.score,
      knowledgeGraph: graph,
    });
    setJadeOutput(output);
    setScreen('jade-response');
  }, [currentCourse, quizResult, graph, userId, earnMIC]);

  // ── Start next seminar ────────────────────────────────────────────────────
  const handleStartNext = useCallback((courseId: string) => {
    const course = seminarStack.find(c => c.id === courseId) ??
      getCoursesBySubject(selectedSubject ?? 'AI').find(c => c.id === courseId);
    if (!course) {
      setScreen('subject-select');
      return;
    }
    setCurrentCourse(course);
    setQuizResult(null);
    setJadeOutput(null);
    setSeminarStack([course]);
    setScreen('swipe-stack');
  }, [seminarStack, selectedSubject]);

  // ── Review (fail path) ────────────────────────────────────────────────────
  const handleReviewNeeded = useCallback(() => {
    setScreen('review');
  }, []);

  const handleRetryFromReview = useCallback(() => {
    setQuizResult(null);
    setSwipeTimestamps([]);
    setScreen('swipe-stack');
  }, []);

  const subjectMeta = SUBJECT_GROUPS.find(s => s.id === selectedSubject);

  const renderScreen = () => {
    switch (screen) {
      case 'subject-select':
        return <SubjectSelector onSelect={handleSelectSubject} />;

      case 'swipe-stack':
        return (
          <div>
            {selectedSubject && (
              <div className="flex items-center gap-2 px-4 mb-4">
                <button
                  onClick={() => setScreen('subject-select')}
                  className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-700 transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Subjects
                </button>
                <span className="text-stone-200">·</span>
                <span className="text-xs font-semibold text-stone-700">
                  {subjectMeta?.emoji} {selectedSubject}
                </span>
              </div>
            )}
            <SwipeStack
              courses={seminarStack}
              onComplete={handleSwipeComplete}
            />
          </div>
        );

      case 'quiz-gate': {
        const quiz = currentCourse ? getQuizByCourseId(currentCourse.id) : null;
        if (!quiz || !currentCourse) return <div className="p-4 text-sm text-stone-500">Quiz unavailable.</div>;
        return (
          <QuizGate
            quiz={quiz}
            courseId={currentCourse.id}
            userId={userId}
            swipeTimestamps={swipeTimestamps}
            seminarDurationSeconds={currentCourse.durationSeconds}
            onPass={handleQuizPass}
            onReviewNeeded={handleReviewNeeded}
          />
        );
      }

      case 'secondary-gate':
        if (!currentCourse || !quizResult) return null;
        return (
          <SecondaryGate
            course={currentCourse}
            lipScore={quizResult.lip.score}
            onPass={handleSecondaryPass}
            onFail={handleReviewNeeded}
          />
        );

      case 'jade-prompt':
        return (
          <JadePrompt
            courseName={currentCourse?.title ?? ''}
            onSubmit={handleJadeQuestion}
            onSkip={handleJadeSkip}
          />
        );

      case 'jade-response':
        if (!jadeOutput) return null;
        return (
          <JadeResponse
            output={jadeOutput}
            onStartNext={handleStartNext}
            onChooseNew={() => setScreen('subject-select')}
          />
        );

      case 'review':
        return (
          <div className="max-w-md mx-auto px-4 text-center space-y-4">
            <div className="text-4xl">📖</div>
            <h3 className="font-bold text-stone-900 text-lg">Let's Review</h3>
            <p className="text-sm text-stone-500">
              Score below 80%. No MIC awarded yet. Rewatch the seminars and try again.
            </p>
            <button
              onClick={handleRetryFromReview}
              className="w-full py-3 bg-stone-900 text-white rounded-xl font-semibold text-sm hover:bg-stone-800 transition-colors"
            >
              Back to Seminars
            </button>
            <button
              onClick={() => setScreen('subject-select')}
              className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
            >
              Choose a different subject
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`pb-8 ${className}`}>
      {renderScreen()}

      {showToast && pendingToast && (
        <MicRewardToast
          breakdown={pendingToast}
          onDismiss={() => {
            setShowToast(false);
            setPendingToast(null);
          }}
        />
      )}
    </div>
  );
};
