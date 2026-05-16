// components/Labs/OAAEnhancements.tsx
// 20 UI/UX enhancement components for the OAA Learn-to-Earn experience
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  CheckCircle,
  ChevronDown,
  Clock,
  Maximize2,
  Minimize2,
  Search,
  X,
  XCircle,
  Zap,
  BookOpen,
  TrendingUp,
  BarChart2,
  Brain,
} from 'lucide-react';
import {
  LearningDifficulty,
  LearningModule,
  LearningSession,
  ModuleCompletionResult,
  UserLearningProgress,
} from '../../types';

// ─────────────────────────────────────────────────────────────────────────────
// OAA-01: ProgressRing — SVG progress ring for module cards
// ─────────────────────────────────────────────────────────────────────────────

interface ProgressRingProps {
  progress: number; // 0-100
  micReward: number;
  size?: number;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  micReward,
  size = 48,
}) => {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  const isComplete = progress >= 100;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e7e5e4"
          strokeWidth={4}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isComplete ? '#10b981' : '#f59e0b'}
          strokeWidth={4}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[9px] font-bold text-amber-600 leading-none">{micReward}</span>
        <span className="text-[7px] text-stone-400 leading-none">MIC</span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// OAA-02: AnswerOption — answer button with state variants
// ─────────────────────────────────────────────────────────────────────────────

export type AnswerState = 'unanswered' | 'correct' | 'wrong' | 'revealed';

interface AnswerOptionProps {
  label: string;
  optionKey: string;
  state: AnswerState;
  disabled?: boolean;
  onClick?: () => void;
}

export const AnswerOption: React.FC<AnswerOptionProps> = ({
  label,
  optionKey,
  state,
  disabled,
  onClick,
}) => {
  const stateStyles: Record<AnswerState, string> = {
    unanswered:
      'border-stone-200 bg-white text-stone-800 hover:border-amber-400 hover:bg-amber-50',
    correct:
      'border-emerald-400 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-300',
    wrong:
      'border-red-400 bg-red-50 text-red-800 ring-1 ring-red-300 animate-pulse',
    revealed:
      'border-blue-300 bg-blue-50 text-blue-800',
  };

  const icon =
    state === 'correct' ? (
      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
    ) : state === 'wrong' ? (
      <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
    ) : null;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || state !== 'unanswered'}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${stateStyles[state]} disabled:cursor-not-allowed`}
    >
      <span className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold flex-shrink-0">
        {optionKey}
      </span>
      <span className="flex-1">{label}</span>
      {icon}
    </button>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// OAA-03: ExplanationPanel — slide-up explanation below wrong answers
// ─────────────────────────────────────────────────────────────────────────────

interface ExplanationPanelProps {
  explanation: string;
  isCorrect: boolean;
  visible: boolean;
}

export const ExplanationPanel: React.FC<ExplanationPanelProps> = ({
  explanation,
  isCorrect,
  visible,
}) => {
  if (!visible) return null;

  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm leading-relaxed animate-in slide-in-from-bottom-2 duration-300 ${
        isCorrect
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-amber-200 bg-amber-50 text-amber-800'
      }`}
    >
      <div className="flex items-start gap-2">
        {isCorrect ? (
          <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
        )}
        <div>
          <span className="font-semibold text-xs uppercase tracking-wider mr-2">
            {isCorrect ? 'Correct!' : 'Explanation'}
          </span>
          {explanation}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// OAA-04: MicEarnToast — fixed bottom-right notification on module completion
// ─────────────────────────────────────────────────────────────────────────────

interface MicEarnToastProps {
  result: ModuleCompletionResult | null;
  onDismiss: () => void;
}

export const MicEarnToast: React.FC<MicEarnToastProps> = ({ result, onDismiss }) => {
  useEffect(() => {
    if (!result) return;
    const timer = window.setTimeout(onDismiss, 5000);
    return () => window.clearTimeout(timer);
  }, [result, onDismiss]);

  if (!result) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-64 rounded-2xl bg-stone-900 text-white shadow-xl border border-stone-700 p-4 animate-in slide-in-from-right-4 duration-400">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" />
          <span className="font-bold text-sm">MIC Earned!</span>
        </div>
        <button onClick={onDismiss} className="text-stone-400 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="text-2xl font-bold text-amber-400 mb-2">
        +{result.micEarned.toFixed(2)} <span className="text-sm font-normal text-stone-300">MIC</span>
      </div>
      <div className="space-y-1 text-xs text-stone-300">
        <div className="flex justify-between">
          <span>Base reward</span>
          <span>+{result.baseMic.toFixed(2)}</span>
        </div>
        {result.streakBonus > 0 && (
          <div className="flex justify-between text-amber-300">
            <span>🔥 Streak bonus</span>
            <span>+{result.streakBonus.toFixed(2)}</span>
          </div>
        )}
        {result.perfectBonus > 0 && (
          <div className="flex justify-between text-emerald-300">
            <span>✦ Perfect bonus</span>
            <span>+{result.perfectBonus.toFixed(2)}</span>
          </div>
        )}
      </div>
      {result.leveledUp && result.newLevel != null && (
        <div className="mt-2 pt-2 border-t border-stone-700 text-xs text-emerald-400 font-semibold">
          ↑ Level Up! You're now Level {result.newLevel}
        </div>
      )}
      <div className="mt-2 h-1 rounded-full bg-stone-700 overflow-hidden">
        <div className="h-full bg-amber-400 animate-[shrink_5s_linear_forwards]" style={{ width: '100%' }} />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// OAA-05: TopicFilterPills — multi-select topic filter
// ─────────────────────────────────────────────────────────────────────────────

interface TopicFilterPillsProps {
  topics: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export const TopicFilterPills: React.FC<TopicFilterPillsProps> = ({
  topics,
  selected,
  onChange,
}) => {
  const toggle = useCallback(
    (topic: string) => {
      if (topic === 'All') {
        onChange([]);
        return;
      }
      const next = selected.includes(topic)
        ? selected.filter((t) => t !== topic)
        : [...selected, topic];
      onChange(next);
    },
    [selected, onChange]
  );

  const isAll = selected.length === 0;

  return (
    <div className="flex flex-wrap gap-2 items-center" role="group" aria-label="Filter by topic">
      <button
        type="button"
        onClick={() => toggle('All')}
        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
          isAll
            ? 'bg-stone-900 text-white border-stone-900'
            : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
        }`}
      >
        All
      </button>
      {topics.map((topic) => {
        const active = selected.includes(topic);
        return (
          <button
            key={topic}
            type="button"
            onClick={() => toggle(topic)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              active
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-white text-stone-600 border-stone-200 hover:border-amber-300'
            }`}
          >
            {topic}
          </button>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// OAA-06: StreakDisplay — flame animation with current/best streak
// ─────────────────────────────────────────────────────────────────────────────

interface StreakDisplayProps {
  currentStreak: number;
  bestStreak: number;
}

export const StreakDisplay: React.FC<StreakDisplayProps> = ({
  currentStreak,
  bestStreak,
}) => {
  const [flicker, setFlicker] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setFlicker((f) => !f);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200">
      <span
        className={`text-xl transition-transform duration-300 ${flicker ? 'scale-110' : 'scale-100'}`}
        aria-hidden="true"
      >
        🔥
      </span>
      <div>
        <div className="text-sm font-bold text-amber-800 leading-none">
          {currentStreak}-day streak
        </div>
        <div className="text-[10px] text-amber-600 mt-0.5">
          Best: {bestStreak} days
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// OAA-07: DifficultyBadge — color-coded difficulty indicator
// ─────────────────────────────────────────────────────────────────────────────

interface DifficultyBadgeProps {
  difficulty: LearningDifficulty;
}

export const DifficultyBadge: React.FC<DifficultyBadgeProps> = ({ difficulty }) => {
  const styles: Record<LearningDifficulty, { bg: string; text: string; label: string }> = {
    beginner: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Beginner' },
    intermediate: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Intermediate' },
    advanced: { bg: 'bg-red-100', text: 'text-red-700', label: 'Advanced' },
  };

  const s = styles[difficulty];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// OAA-08: ContinueResumeBar — quick resume for in-progress modules
// ─────────────────────────────────────────────────────────────────────────────

interface ContinueResumeBarProps {
  modules: LearningModule[];
  onResume: (module: LearningModule) => void;
}

export const ContinueResumeBar: React.FC<ContinueResumeBarProps> = ({
  modules,
  onResume,
}) => {
  const inProgress = useMemo(
    () => modules.filter((m) => m.progress > 0 && m.progress < 100),
    [modules]
  );

  if (inProgress.length === 0) return null;

  const top = inProgress[0]!;

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200">
      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
        <BookOpen className="w-4 h-4 text-blue-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-blue-800 truncate">Continue: {top.title}</div>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1.5 rounded-full bg-blue-200 overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${top.progress}%` }}
            />
          </div>
          <span className="text-[10px] text-blue-600 flex-shrink-0">{top.progress}%</span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onResume(top)}
        className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors flex-shrink-0"
      >
        Resume
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// OAA-09: LevelBar — MIC-based XP progression bar
// Level thresholds (MIC): [0, 5, 15, 30, 55, 90, 140, 210]
// ─────────────────────────────────────────────────────────────────────────────

const LEVEL_THRESHOLDS = [0, 5, 15, 30, 55, 90, 140, 210];

interface LevelBarProps {
  totalMicEarned: number;
  level: number;
}

export const LevelBar: React.FC<LevelBarProps> = ({ totalMicEarned, level }) => {
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]!;
  const isMaxLevel = level >= LEVEL_THRESHOLDS.length;

  const progress = isMaxLevel
    ? 100
    : Math.min(
        100,
        ((totalMicEarned - currentThreshold) / (nextThreshold - currentThreshold)) * 100
      );

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-500 text-white text-xs font-bold flex-shrink-0">
        {level}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-medium text-stone-600">Level {level}</span>
          {!isMaxLevel && (
            <span className="text-[10px] text-stone-400">
              {totalMicEarned.toFixed(0)} / {nextThreshold} MIC
            </span>
          )}
        </div>
        <div className="h-2 rounded-full bg-stone-200 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// OAA-10: FocusMode — fullscreen overlay with current question
// ─────────────────────────────────────────────────────────────────────────────

interface FocusModeProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const FocusMode: React.FC<FocusModeProps> = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/95 flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-10 right-0 text-stone-400 hover:text-white flex items-center gap-1.5 text-xs"
        >
          <Minimize2 className="w-4 h-4" />
          Exit focus mode (Esc)
        </button>
        {children}
      </div>
    </div>
  );
};

interface FocusModeButtonProps {
  onOpen: () => void;
}

export const FocusModeButton: React.FC<FocusModeButtonProps> = ({ onOpen }) => (
  <button
    type="button"
    onClick={onOpen}
    className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
    title="Enter focus mode"
    aria-label="Enter focus mode"
  >
    <Maximize2 className="w-4 h-4" />
  </button>
);

// ─────────────────────────────────────────────────────────────────────────────
// OAA-11: QuestionTimerBar + useQuestionTimer hook — 30s countdown
// ─────────────────────────────────────────────────────────────────────────────

export function useQuestionTimer(active: boolean, onExpire?: () => void) {
  const [timeLeft, setTimeLeft] = useState(30);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    setTimeLeft(30);
  }, [active]);

  useEffect(() => {
    if (!active) {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (intervalRef.current !== null) clearInterval(intervalRef.current);
          onExpire?.();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, [active, onExpire]);

  return timeLeft;
}

interface QuestionTimerBarProps {
  timeLeft: number;
  total?: number;
}

export const QuestionTimerBar: React.FC<QuestionTimerBarProps> = ({
  timeLeft,
  total = 30,
}) => {
  const pct = (timeLeft / total) * 100;
  const color =
    pct > 60
      ? 'bg-emerald-400'
      : pct > 30
      ? 'bg-amber-400'
      : 'bg-red-500';

  return (
    <div className="flex items-center gap-2">
      <Clock className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
      <div className="flex-1 h-2 rounded-full bg-stone-200 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-mono font-bold ${timeLeft <= 10 ? 'text-red-500' : 'text-stone-500'}`}>
        {timeLeft}s
      </span>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// OAA-12: SentinelTutorDisplay — sentinel-branded AI tutor subject mapping
// ATLAS=Physics, AUREA=Economics, EVE=Earth/Eco, JADE=CS/Civics
// ─────────────────────────────────────────────────────────────────────────────

type SentinelName = 'ATLAS' | 'AUREA' | 'EVE' | 'JADE';

const SENTINEL_SUBJECT_MAP: Record<string, SentinelName> = {
  physics: 'ATLAS',
  math: 'ATLAS',
  astro: 'ATLAS',
  economics: 'AUREA',
  chem: 'AUREA',
  earth: 'EVE',
  bio: 'EVE',
  eng: 'EVE',
  cs: 'JADE',
  civics: 'JADE',
};

const SENTINEL_COLORS: Record<SentinelName, { bg: string; text: string; dot: string }> = {
  ATLAS: { bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-500' },
  AUREA: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  EVE: { bg: 'bg-teal-50', text: 'text-teal-700', dot: 'bg-teal-500' },
  JADE: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
};

const SENTINEL_SUBJECTS: Record<SentinelName, string> = {
  ATLAS: 'Physics · Mathematics · Astronomy',
  AUREA: 'Economics · Chemistry',
  EVE: 'Earth Science · Biology · Engineering',
  JADE: 'Computer Science · Civics',
};

interface SentinelTutorDisplayProps {
  subjectId: string;
}

export const SentinelTutorDisplay: React.FC<SentinelTutorDisplayProps> = ({
  subjectId,
}) => {
  const sentinel = SENTINEL_SUBJECT_MAP[subjectId] ?? 'ATLAS';
  const colors = SENTINEL_COLORS[sentinel];

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${colors.bg}`}>
      <div className={`w-2 h-2 rounded-full ${colors.dot} animate-pulse`} />
      <span className={`text-xs font-bold ${colors.text}`}>{sentinel}</span>
      <span className={`text-[10px] ${colors.text} opacity-80`}>
        tutor · {SENTINEL_SUBJECTS[sentinel]}
      </span>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// OAA-13: KnowledgeGraphPushButton — post-completion KG navigation
// ─────────────────────────────────────────────────────────────────────────────

interface KnowledgeGraphPushButtonProps {
  topics: string[];
  onNavigate?: () => void;
  disabled?: boolean;
}

export const KnowledgeGraphPushButton: React.FC<KnowledgeGraphPushButtonProps> = ({
  topics,
  onNavigate,
  disabled,
}) => (
  <button
    type="button"
    onClick={onNavigate}
    disabled={disabled || !onNavigate}
    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-200 bg-white text-stone-700 text-xs font-medium hover:bg-stone-50 hover:border-stone-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    title={`Push topics to Knowledge Graph: ${topics.join(', ')}`}
  >
    <TrendingUp className="w-3.5 h-3.5" />
    Open in Knowledge Graph
    {topics.length > 0 && (
      <span className="px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[10px]">
        {topics.length} nodes
      </span>
    )}
  </button>
);

// ─────────────────────────────────────────────────────────────────────────────
// OAA-14: CompletionCelebration — module completion screen with breakdown
// ─────────────────────────────────────────────────────────────────────────────

interface CompletionCelebrationProps {
  result: ModuleCompletionResult;
  moduleName: string;
  onRetake?: () => void;
  onNavigateToKG?: () => void;
}

export const CompletionCelebration: React.FC<CompletionCelebrationProps> = ({
  result,
  moduleName,
  onRetake,
  onNavigateToKG,
}) => (
  <div className="flex flex-col items-center py-10 px-6 text-center space-y-6">
    <div className="text-5xl animate-bounce">🎉</div>
    <div>
      <h2 className="text-2xl font-bold text-stone-900">Module Complete!</h2>
      <p className="text-stone-500 text-sm mt-1">{moduleName}</p>
    </div>
    <div className="w-full max-w-sm bg-stone-900 rounded-2xl p-5 text-white space-y-3">
      <div className="text-3xl font-bold text-amber-400">
        +{result.micEarned.toFixed(2)} <span className="text-base font-normal text-stone-300">MIC</span>
      </div>
      <div className="text-sm text-stone-300">
        Accuracy: <span className="font-bold text-white">{Math.round(result.accuracy * 100)}%</span>
      </div>
      <div className="border-t border-stone-700 pt-3 space-y-1.5 text-xs">
        <div className="flex justify-between text-stone-400">
          <span>◎ Base reward</span>
          <span className="text-white">+{result.baseMic.toFixed(2)}</span>
        </div>
        {result.streakBonus > 0 && (
          <div className="flex justify-between text-amber-400">
            <span>🔥 Streak bonus</span>
            <span>+{result.streakBonus.toFixed(2)}</span>
          </div>
        )}
        {result.perfectBonus > 0 && (
          <div className="flex justify-between text-emerald-400">
            <span>✦ Perfect bonus</span>
            <span>+{result.perfectBonus.toFixed(2)}</span>
          </div>
        )}
      </div>
      {result.leveledUp && result.newLevel != null && (
        <div className="pt-2 border-t border-stone-700 text-emerald-400 font-bold text-sm">
          ↑ Level Up! Now Level {result.newLevel}
        </div>
      )}
    </div>
    <div className="flex flex-wrap justify-center gap-3">
      {onRetake && (
        <button
          type="button"
          onClick={onRetake}
          className="px-4 py-2 rounded-xl border border-stone-200 text-stone-700 text-sm font-medium hover:bg-stone-50 transition-colors"
        >
          Retake Module
        </button>
      )}
      {onNavigateToKG && (
        <button
          type="button"
          onClick={onNavigateToKG}
          className="px-4 py-2 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800 transition-colors flex items-center gap-2"
        >
          <TrendingUp className="w-4 h-4" />
          View Knowledge Graph
        </button>
      )}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// OAA-15: ActivityHeatmap — 30-day activity heatmap from LearningSession[]
// ─────────────────────────────────────────────────────────────────────────────

interface ActivityHeatmapProps {
  sessions: LearningSession[];
  days?: number;
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({
  sessions,
  days = 30,
}) => {
  const cells = useMemo(() => {
    const counts: Record<string, number> = {};
    sessions.forEach((s) => {
      const dateKey = new Date(s.startTime).toISOString().slice(0, 10);
      counts[dateKey] = (counts[dateKey] ?? 0) + 1;
    });

    const result: Array<{ date: string; count: number }> = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      result.push({ date: key, count: counts[key] ?? 0 });
    }
    return result;
  }, [sessions, days]);

  const maxCount = useMemo(() => Math.max(1, ...cells.map((c) => c.count)), [cells]);

  const cellColor = (count: number) => {
    if (count === 0) return 'bg-stone-100';
    const intensity = count / maxCount;
    if (intensity > 0.66) return 'bg-amber-500';
    if (intensity > 0.33) return 'bg-amber-300';
    return 'bg-amber-200';
  };

  return (
    <div>
      <div className="text-xs font-semibold text-stone-500 mb-2">30-day Activity</div>
      <div className="flex flex-wrap gap-1">
        {cells.map(({ date, count }) => (
          <div
            key={date}
            title={`${date}: ${count} session${count !== 1 ? 's' : ''}`}
            className={`w-4 h-4 rounded-sm ${cellColor(count)} transition-colors cursor-default`}
          />
        ))}
      </div>
      <div className="flex items-center gap-1 mt-2">
        <span className="text-[10px] text-stone-400">Less</span>
        {['bg-stone-100', 'bg-amber-200', 'bg-amber-300', 'bg-amber-500'].map((c) => (
          <div key={c} className={`w-3 h-3 rounded-sm ${c}`} />
        ))}
        <span className="text-[10px] text-stone-400">More</span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// OAA-16: JADELearningPathSidebar — next module recommendation
// ─────────────────────────────────────────────────────────────────────────────

interface JADELearningPathSidebarProps {
  modules: LearningModule[];
  onSelectModule: (module: LearningModule) => void;
}

export const JADELearningPathSidebar: React.FC<JADELearningPathSidebarProps> = ({
  modules,
  onSelectModule,
}) => {
  const recommended = useMemo(() => {
    const incomplete = modules.filter((m) => !m.completed);
    const inProgress = incomplete.filter((m) => m.progress > 0);
    const notStarted = incomplete.filter((m) => m.progress === 0);
    return [...inProgress, ...notStarted].slice(0, 3);
  }, [modules]);

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Brain className="w-4 h-4 text-emerald-600" />
        <span className="text-xs font-bold text-emerald-700">JADE Recommends</span>
      </div>
      {recommended.length === 0 ? (
        <p className="text-xs text-emerald-600">All modules completed! Impressive.</p>
      ) : (
        <div className="space-y-2">
          {recommended.map((module) => (
            <button
              key={module.id}
              type="button"
              onClick={() => onSelectModule(module)}
              className="w-full text-left px-3 py-2 rounded-lg bg-white border border-emerald-200 hover:border-emerald-400 transition-colors"
            >
              <div className="text-xs font-semibold text-stone-800 truncate">{module.title}</div>
              <div className="flex items-center gap-2 mt-1">
                <DifficultyBadge difficulty={module.difficulty} />
                <span className="text-[10px] text-stone-400">{module.estimatedMinutes}min · +{module.micReward} MIC</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// OAA-17: StatsRow — 4-stat progress header
// ─────────────────────────────────────────────────────────────────────────────

interface StatsRowProps {
  progress: UserLearningProgress;
}

export const StatsRow: React.FC<StatsRowProps> = ({ progress }) => {
  const accuracy =
    progress.totalQuestions > 0
      ? Math.round((progress.totalCorrect / progress.totalQuestions) * 100)
      : 0;

  const stats = [
    {
      label: 'Modules Done',
      value: progress.modulesCompleted,
      icon: <Award className="w-4 h-4 text-amber-500" />,
    },
    {
      label: 'Accuracy',
      value: `${accuracy}%`,
      icon: <CheckCircle className="w-4 h-4 text-emerald-500" />,
    },
    {
      label: 'Total MIC',
      value: progress.totalMicEarned.toFixed(1),
      icon: <Zap className="w-4 h-4 text-yellow-500" />,
    },
    {
      label: 'Learn Time',
      value: `${progress.totalLearningMinutes}m`,
      icon: <Clock className="w-4 h-4 text-blue-500" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-stone-200 shadow-sm"
        >
          {stat.icon}
          <div>
            <div className="text-sm font-bold text-stone-900 leading-none">{stat.value}</div>
            <div className="text-[10px] text-stone-400 mt-0.5">{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// OAA-18: QuestionNavDots — question progress indicator with result coloring
// ─────────────────────────────────────────────────────────────────────────────

type QuestionResult = 'pending' | 'correct' | 'wrong' | 'current';

interface QuestionNavDotsProps {
  total: number;
  current: number;
  results: QuestionResult[];
}

export const QuestionNavDots: React.FC<QuestionNavDotsProps> = ({
  total,
  current,
  results,
}) => {
  return (
    <div className="flex items-center gap-1.5" role="progressbar" aria-valuenow={current + 1} aria-valuemax={total}>
      {Array.from({ length: total }, (_, i) => {
        const result = results[i] ?? 'pending';
        const dotStyle: Record<QuestionResult, string> = {
          pending: 'bg-stone-200',
          current: 'bg-amber-400 scale-125 ring-2 ring-amber-200',
          correct: 'bg-emerald-500',
          wrong: 'bg-red-400',
        };
        return (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${dotStyle[result]}`}
            aria-label={`Question ${i + 1}: ${result}`}
          />
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// OAA-19: EmptyStateWithJADE — empty state for no modules matching filter
// ─────────────────────────────────────────────────────────────────────────────

interface EmptyStateWithJADEProps {
  query?: string;
  onClearFilter?: () => void;
}

export const EmptyStateWithJADE: React.FC<EmptyStateWithJADEProps> = ({
  query,
  onClearFilter,
}) => (
  <div className="flex flex-col items-center py-16 px-6 text-center space-y-4">
    <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
      <Search className="w-6 h-6 text-emerald-500" />
    </div>
    <div>
      <h3 className="text-sm font-bold text-stone-800">No modules found</h3>
      {query ? (
        <p className="text-xs text-stone-500 mt-1">
          No modules match <span className="font-medium">"{query}"</span>
        </p>
      ) : (
        <p className="text-xs text-stone-500 mt-1">
          No modules match the selected filters
        </p>
      )}
    </div>
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 max-w-xs">
      <p className="text-xs text-emerald-700">
        <span className="font-bold">JADE suggests:</span> Try browsing all topics
        or starting with beginner modules to build a foundation.
      </p>
    </div>
    {onClearFilter && (
      <button
        type="button"
        onClick={onClearFilter}
        className="px-4 py-2 rounded-lg bg-stone-900 text-white text-xs font-medium hover:bg-stone-800 transition-colors"
      >
        Clear filters
      </button>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// OAA-20: OAASkeleton — loading shimmer placeholder cards
// ─────────────────────────────────────────────────────────────────────────────

const ShimmerCard: React.FC = () => (
  <div className="rounded-2xl border border-stone-100 bg-white p-5 space-y-3 animate-pulse">
    <div className="flex items-start justify-between">
      <div className="w-10 h-10 rounded-xl bg-stone-200" />
      <div className="w-14 h-5 rounded-full bg-stone-100" />
    </div>
    <div className="space-y-2">
      <div className="h-4 bg-stone-200 rounded w-3/4" />
      <div className="h-3 bg-stone-100 rounded w-full" />
      <div className="h-3 bg-stone-100 rounded w-5/6" />
    </div>
    <div className="flex gap-2">
      <div className="h-5 w-16 rounded-full bg-stone-100" />
      <div className="h-5 w-12 rounded-full bg-stone-100" />
    </div>
    <div className="h-1.5 rounded-full bg-stone-100" />
  </div>
);

interface OAASkeletonProps {
  count?: number;
}

export const OAASkeleton: React.FC<OAASkeletonProps> = ({ count = 6 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: count }, (_, i) => (
      <ShimmerCard key={i} />
    ))}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Barrel re-exports — convenience for importers
// ─────────────────────────────────────────────────────────────────────────────

export { BarChart2 as StatsIcon };
