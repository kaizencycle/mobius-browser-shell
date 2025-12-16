import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Award, TrendingUp, CheckCircle2, 
  Trophy, Sparkles, Target, Clock, Brain, Flame
} from 'lucide-react';
import { useWallet } from '../../contexts/WalletContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LearningModule, 
  UserLearningProgress, 
  LearningSession,
  QuizQuestion
} from '../../types';
import { QuizModule } from './QuizModule';

// Sample learning modules - In production, fetch from backend
const LEARNING_MODULES: LearningModule[] = [
  {
    id: 'constitutional-ai-101',
    title: 'Constitutional AI Fundamentals',
    description: 'Learn how AI systems can be constrained by constitutional principles to serve humanity.',
    difficulty: 'beginner',
    estimatedMinutes: 30,
    micReward: 50,
    topics: ['AI Alignment', 'Constitutional Constraints', 'Three Covenants'],
    questions: [
      {
        id: 'q1',
        question: 'What is the primary purpose of Constitutional AI?',
        options: [
          'To make AI systems faster',
          'To constrain AI behavior with explicit principles and values',
          'To make AI systems cheaper to run',
          'To replace human decision-making'
        ],
        correctAnswer: 1,
        explanation: 'Constitutional AI constrains AI systems with explicit constitutional principles, ensuring they operate within defined ethical boundaries and serve human values.',
        difficulty: 'easy',
        points: 10
      },
      {
        id: 'q2',
        question: 'Which of the Three Covenants emphasizes long-term responsibility over short-term gains?',
        options: ['Integrity', 'Ecology', 'Custodianship', 'All of the above'],
        correctAnswer: 2,
        explanation: 'Custodianship emphasizes intergenerational responsibility and long-term stewardship over short-term extraction.',
        difficulty: 'medium',
        points: 15
      },
      {
        id: 'q3',
        question: 'How does Constitutional AI differ from traditional AI alignment approaches?',
        options: [
          'It uses more training data',
          'It embeds constraints at the reasoning substrate level',
          'It requires less compute power',
          'It works without human oversight'
        ],
        correctAnswer: 1,
        explanation: 'Constitutional AI embeds constraints at the substrate level of AI reasoning, making constitutional principles fundamental to how the AI thinks, not just what it outputs.',
        difficulty: 'hard',
        points: 20
      }
    ],
    completed: false,
    progress: 0
  },
  {
    id: 'integrity-economics',
    title: 'Integrity Economics & MIC',
    description: 'Understanding how integrity-backed currency creates sustainable economic systems.',
    difficulty: 'intermediate',
    estimatedMinutes: 45,
    micReward: 75,
    topics: ['MIC Tokenomics', 'Circuit Breakers', 'Time Security'],
    questions: [
      {
        id: 'q1',
        question: 'What backs the value of MIC (Mobius Integrity Credits)?',
        options: [
          'Gold reserves',
          'System integrity and trust metrics',
          'Government bonds',
          'Computing power'
        ],
        correctAnswer: 1,
        explanation: 'MIC is backed by measurable system integrity rather than scarce resources, creating an economy based on trust and alignment.',
        difficulty: 'easy',
        points: 10
      },
      {
        id: 'q2',
        question: 'What happens when Global Integrity Index (GII) falls below circuit breaker thresholds?',
        options: [
          'MIC minting stops temporarily',
          'System shuts down completely',
          'MIC value increases',
          'Nothing changes'
        ],
        correctAnswer: 0,
        explanation: 'Circuit breakers halt new MIC minting when integrity metrics drop below safe thresholds, preventing currency debasement during drift events.',
        difficulty: 'medium',
        points: 15
      },
      {
        id: 'q3',
        question: 'How does Time Security relate to integrity economics?',
        options: [
          'It measures how long the system has been running',
          'It quantifies temporal stability of integrity commitments',
          'It tracks user login times',
          'It schedules system maintenance'
        ],
        correctAnswer: 1,
        explanation: 'Time Security quantifies the temporal stability and reliability of integrity commitments, making long-term trustworthiness a measurable economic asset.',
        difficulty: 'hard',
        points: 20
      }
    ],
    completed: false,
    progress: 0
  },
  {
    id: 'drift-suppression',
    title: 'Drift Suppression Mechanisms',
    description: 'Deep dive into how Mobius prevents AI systems from drifting away from constitutional alignment.',
    difficulty: 'advanced',
    estimatedMinutes: 60,
    micReward: 100,
    topics: ['Kaizen Turing Test', 'Pattern Recognition', 'Integrity Scoring'],
    questions: [
      {
        id: 'q1',
        question: 'What is the "Kaizen Turing Test"?',
        options: [
          'A test to see if AI can fool humans',
          'A continuous improvement metric for AI constitutional alignment',
          'A one-time certification exam',
          'A hardware stress test'
        ],
        correctAnswer: 1,
        explanation: 'The Kaizen Turing Test is a continuous improvement framework that measures ongoing constitutional alignment, not just a pass/fail certification.',
        difficulty: 'medium',
        points: 15
      },
      {
        id: 'q2',
        question: 'How do Sentinel agents contribute to drift suppression?',
        options: [
          'They only monitor for security breaches',
          'They continuously verify constitutional alignment across system operations',
          'They replace human oversight entirely',
          'They optimize system performance'
        ],
        correctAnswer: 1,
        explanation: 'Sentinel agents like ATLAS, AUREA, and EVE continuously verify that system operations remain aligned with constitutional principles.',
        difficulty: 'hard',
        points: 20
      },
      {
        id: 'q3',
        question: 'What role does the Mobius Integrity Index (MII) play in drift detection?',
        options: [
          'It measures financial performance',
          'It provides real-time health metrics for constitutional alignment',
          'It tracks user engagement',
          'It counts API requests'
        ],
        correctAnswer: 1,
        explanation: 'MII provides real-time metrics on system constitutional health, enabling early detection of drift before it becomes critical.',
        difficulty: 'medium',
        points: 15
      }
    ],
    completed: false,
    progress: 0
  },
  {
    id: 'multi-agent-consensus',
    title: 'Multi-Agent Democratic Systems',
    description: 'How ATLAS, AUREA, and ECHO collaborate through democratic consensus mechanisms.',
    difficulty: 'intermediate',
    estimatedMinutes: 40,
    micReward: 65,
    topics: ['Agent Orchestration', 'Consensus Protocols', 'DVA Flows'],
    questions: [
      {
        id: 'q1',
        question: 'What is the primary function of ATLAS in the Mobius system?',
        options: [
          'User interface design',
          'Code review and technical oversight',
          'Financial auditing',
          'Marketing automation'
        ],
        correctAnswer: 1,
        explanation: 'ATLAS serves as the technical sentinel, performing code review and ensuring technical implementations align with constitutional principles.',
        difficulty: 'easy',
        points: 10
      },
      {
        id: 'q2',
        question: 'How do multi-agent systems prevent single points of failure in governance?',
        options: [
          'By having one agent make all decisions',
          'Through consensus mechanisms requiring agreement from multiple agents',
          'By eliminating human oversight',
          'Through random decision-making'
        ],
        correctAnswer: 1,
        explanation: 'Multi-agent consensus ensures no single agent can unilaterally make critical decisions, requiring democratic agreement among sentinels.',
        difficulty: 'medium',
        points: 15
      },
      {
        id: 'q3',
        question: 'What is a DVA (Distributed Verification Architecture) flow?',
        options: [
          'A data backup process',
          'A pattern for distributed verification of system integrity across agents',
          'A user authentication method',
          'A file transfer protocol'
        ],
        correctAnswer: 1,
        explanation: 'DVA flows coordinate verification tasks across multiple sentinel agents, ensuring comprehensive integrity checking without central bottlenecks.',
        difficulty: 'hard',
        points: 20
      }
    ],
    completed: false,
    progress: 0
  },
  {
    id: 'three-covenants',
    title: 'The Three Covenants in Practice',
    description: 'Integrity, Ecology, Custodianship - the philosophical foundation of Mobius Systems.',
    difficulty: 'beginner',
    estimatedMinutes: 25,
    micReward: 40,
    topics: ['Integrity', 'Ecology', 'Custodianship', 'Kintsugi Philosophy'],
    questions: [
      {
        id: 'q1',
        question: 'What does the Covenant of Integrity require?',
        options: [
          'Making as much profit as possible',
          'Honest, transparent, and accountable operations',
          'Keeping all code secret',
          'Maximizing user engagement at any cost'
        ],
        correctAnswer: 1,
        explanation: 'The Covenant of Integrity requires honest, transparent, and accountable operations - the foundation of trust in any system.',
        difficulty: 'easy',
        points: 10
      },
      {
        id: 'q2',
        question: 'How does the Covenant of Ecology inform system design?',
        options: [
          'By focusing only on environmental sustainability',
          'By considering systemic impacts and regenerative patterns',
          'By minimizing all system changes',
          'By prioritizing speed over all else'
        ],
        correctAnswer: 1,
        explanation: 'The Covenant of Ecology requires considering systemic impacts and designing for regenerative rather than extractive patterns.',
        difficulty: 'medium',
        points: 15
      },
      {
        id: 'q3',
        question: 'What is the connection between Kintsugi philosophy and the Three Covenants?',
        options: [
          'There is no connection',
          'Both emphasize hiding flaws',
          'Both honor repair and growth through challenges',
          'Both prioritize perfection'
        ],
        correctAnswer: 2,
        explanation: 'Kintsugi philosophy, like the Three Covenants, honors the process of repair and growth - acknowledging that healing creates something stronger and more beautiful.',
        difficulty: 'medium',
        points: 15
      }
    ],
    completed: false,
    progress: 0
  }
];

// Initial user progress state
const INITIAL_PROGRESS: UserLearningProgress = {
  totalMicEarned: 0,
  modulesCompleted: 0,
  currentStreak: 0,
  totalLearningMinutes: 0,
  level: 1,
  experiencePoints: 0
};

export const LearningProgressTracker: React.FC = () => {
  const { user } = useAuth();
  const { earnMIC, refreshWallet } = useWallet();
  
  const [modules, setModules] = useState<LearningModule[]>(LEARNING_MODULES);
  const [userProgress, setUserProgress] = useState<UserLearningProgress>(INITIAL_PROGRESS);
  const [activeModule, setActiveModule] = useState<LearningModule | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);

  // Load saved progress from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem('oaa_learning_progress');
    const savedModules = localStorage.getItem('oaa_learning_modules');
    
    if (savedProgress) {
      try {
        setUserProgress(JSON.parse(savedProgress));
      } catch (e) {
        console.error('Failed to parse saved progress:', e);
      }
    }
    
    if (savedModules) {
      try {
        const parsed = JSON.parse(savedModules);
        // Merge saved completion status with module definitions
        setModules(LEARNING_MODULES.map(m => {
          const saved = parsed.find((s: any) => s.id === m.id);
          return saved ? { ...m, completed: saved.completed, progress: saved.progress, completedAt: saved.completedAt } : m;
        }));
      } catch (e) {
        console.error('Failed to parse saved modules:', e);
      }
    }
  }, []);

  // Save progress to localStorage
  const saveProgress = (newProgress: UserLearningProgress, newModules: LearningModule[]) => {
    localStorage.setItem('oaa_learning_progress', JSON.stringify(newProgress));
    localStorage.setItem('oaa_learning_modules', JSON.stringify(
      newModules.map(m => ({ id: m.id, completed: m.completed, progress: m.progress, completedAt: m.completedAt }))
    ));
  };

  const startModule = (module: LearningModule) => {
    setActiveModule(module);
    setShowQuiz(true);
  };

  const handleQuizComplete = async (accuracy: number) => {
    if (!activeModule) return;

    // Calculate rewards based on accuracy
    const accuracyMultiplier = Math.max(accuracy, 0.70); // Minimum 70% threshold
    const micEarned = Math.round(activeModule.micReward * accuracyMultiplier);
    const xpEarned = micEarned * 2;

    // Check for perfect score bonus
    const perfectBonus = accuracy === 1.0 ? Math.round(activeModule.micReward * 0.1) : 0;
    const totalMicEarned = micEarned + perfectBonus;

    // Update module status
    const updatedModules = modules.map(m => 
      m.id === activeModule.id 
        ? { ...m, completed: true, progress: 100, completedAt: new Date().toISOString() }
        : m
    );
    setModules(updatedModules);

    // Calculate new level
    const newXP = userProgress.experiencePoints + xpEarned;
    const newLevel = Math.floor(newXP / 100) + 1;

    // Update user progress
    const newProgress: UserLearningProgress = {
      totalMicEarned: userProgress.totalMicEarned + totalMicEarned,
      modulesCompleted: userProgress.modulesCompleted + 1,
      currentStreak: userProgress.currentStreak + 1,
      totalLearningMinutes: userProgress.totalLearningMinutes + activeModule.estimatedMinutes,
      experiencePoints: newXP,
      level: newLevel,
      lastActivityDate: new Date().toISOString()
    };
    setUserProgress(newProgress);

    // Save to localStorage
    saveProgress(newProgress, updatedModules);

    // Earn MIC if user is logged in
    if (user) {
      const success = await earnMIC('learning_module_completion', {
        module_id: activeModule.id,
        module_title: activeModule.title,
        accuracy: accuracy,
        mic_earned: totalMicEarned,
        perfect_score: accuracy === 1.0
      });
      
      if (success) {
        await refreshWallet();
      }
    }

    // Close quiz
    setShowQuiz(false);
    setActiveModule(null);
  };

  const handleQuizCancel = () => {
    setShowQuiz(false);
    setActiveModule(null);
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'beginner': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'intermediate': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'advanced': return 'text-purple-600 bg-purple-50 border-purple-200';
      default: return 'text-stone-600 bg-stone-50 border-stone-200';
    }
  };

  // Show quiz if active
  if (showQuiz && activeModule) {
    return (
      <QuizModule
        module={activeModule}
        onComplete={handleQuizComplete}
        onCancel={handleQuizCancel}
      />
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* User Progress Dashboard */}
      <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
            Your Learning Journey
          </h2>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-400 rounded-lg">
            <Sparkles className="w-4 h-4 text-stone-900" />
            <span className="font-bold text-stone-900">
              Level {userProgress.level}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-lg p-3 sm:p-4 border border-stone-200">
            <div className="text-xs sm:text-sm text-stone-600 mb-1">Total MIC Earned</div>
            <div className="text-xl sm:text-2xl font-bold text-amber-500">
              {userProgress.totalMicEarned}
            </div>
          </div>

          <div className="bg-white rounded-lg p-3 sm:p-4 border border-stone-200">
            <div className="text-xs sm:text-sm text-stone-600 mb-1">Modules Completed</div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600">
              {userProgress.modulesCompleted}
            </div>
          </div>

          <div className="bg-white rounded-lg p-3 sm:p-4 border border-stone-200">
            <div className="text-xs sm:text-sm text-stone-600 mb-1">Current Streak</div>
            <div className="text-xl sm:text-2xl font-bold text-orange-500 flex items-center gap-1">
              {userProgress.currentStreak}
              {userProgress.currentStreak > 0 && <Flame className="w-5 h-5" />}
            </div>
          </div>

          <div className="bg-white rounded-lg p-3 sm:p-4 border border-stone-200">
            <div className="text-xs sm:text-sm text-stone-600 mb-1">Learning Time</div>
            <div className="text-xl sm:text-2xl font-bold text-blue-600">
              {userProgress.totalLearningMinutes}m
            </div>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs sm:text-sm text-stone-600 mb-2">
            <span>Experience Points</span>
            <span>{userProgress.experiencePoints % 100}/100 to Level {userProgress.level + 1}</span>
          </div>
          <div className="w-full bg-stone-200 rounded-full h-2.5 sm:h-3">
            <div
              className="bg-gradient-to-r from-amber-400 to-yellow-500 h-2.5 sm:h-3 rounded-full transition-all duration-500"
              style={{ width: `${(userProgress.experiencePoints % 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Learning Modules Grid */}
      <div>
        <h3 className="text-lg sm:text-xl font-semibold text-stone-900 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-500" />
          Available Modules
        </h3>

        <div className="grid gap-4">
          {modules.map((module) => (
            <div
              key={module.id}
              className={`
                bg-white border rounded-xl p-4 sm:p-5 transition-all duration-200
                ${module.completed 
                  ? 'border-emerald-300 bg-emerald-50/30' 
                  : 'border-stone-200 hover:border-amber-200 hover:shadow-lg'
                }
              `}
            >
              {/* Module Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-stone-900 text-base sm:text-lg">
                      {module.title}
                    </h4>
                    {module.completed && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                    {module.description}
                  </p>
                </div>

                <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span className="text-xs sm:text-sm font-semibold text-amber-600">
                      {module.micReward} MIC
                    </span>
                  </div>

                  <div className={`px-2.5 py-1 border rounded text-xs font-medium ${getDifficultyColor(module.difficulty)}`}>
                    {module.difficulty}
                  </div>
                </div>
              </div>

              {/* Module Details */}
              <div className="flex items-center gap-4 text-xs sm:text-sm text-stone-500 mb-3">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>{module.estimatedMinutes} min</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Brain className="w-4 h-4" />
                  <span>{module.questions.length} questions</span>
                </div>
              </div>

              {/* Topics Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {module.topics.map((topic) => (
                  <span
                    key={topic}
                    className="px-2 py-1 bg-stone-100 text-stone-700 rounded text-xs"
                  >
                    {topic}
                  </span>
                ))}
              </div>

              {/* Action Button */}
              {!module.completed ? (
                <button
                  onClick={() => startModule(module)}
                  disabled={activeModule !== null}
                  className={`
                    w-full px-4 py-2.5 rounded-lg font-medium transition-all duration-200
                    ${activeModule === null
                      ? 'bg-stone-900 text-white hover:bg-stone-800'
                      : 'bg-stone-200 text-stone-500 cursor-not-allowed'
                    }
                  `}
                >
                  Start Learning
                </button>
              ) : (
                <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" />
                    Completed
                  </div>
                  {module.completedAt && (
                    <div className="text-xs text-stone-500">
                      {new Date(module.completedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Login prompt for non-authenticated users */}
      {!user && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <p className="text-blue-800 text-sm">
            <strong>Note:</strong> Log in to earn real MIC rewards for completing modules!
          </p>
        </div>
      )}
    </div>
  );
};

export default LearningProgressTracker;
