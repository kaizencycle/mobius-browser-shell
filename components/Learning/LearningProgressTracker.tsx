import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, Award, TrendingUp, CheckCircle2, 
  Trophy, Sparkles, Target, Clock, Brain, Flame,
  Filter, Search, ChevronDown, Star, Zap, Lock
} from 'lucide-react';
import { useWallet } from '../../contexts/WalletContext';
import { useAuth } from '../../contexts/AuthContext';
import { useKnowledgeGraph } from '../../contexts/KnowledgeGraphContext';
import { 
  LearningModule, 
  UserLearningProgress, 
  LearningSession,
  QuizQuestion
} from '../../types';
import { QuizModule } from './QuizModule';

// ═══════════════════════════════════════════════════
// LEARNING MODULES — Comprehensive Curriculum
// ═══════════════════════════════════════════════════

const LEARNING_MODULES: LearningModule[] = [
  // ═══════════════════════════════════════════
  // CORE MOBIUS MODULES (6)
  // ═══════════════════════════════════════════
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
      },
      {
        id: 'q4',
        question: 'In the Mobius framework, what does "integrity drift" refer to?',
        options: [
          'Hardware degradation over time',
          'The gradual divergence between stated values and actual system behavior',
          'Network latency increases',
          'User interface changes over versions'
        ],
        correctAnswer: 1,
        explanation: 'Integrity drift occurs when the gap between what a system claims to value and how it actually behaves widens over time — often due to optimization pressure or institutional incentives.',
        difficulty: 'medium',
        points: 15
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
      },
      {
        id: 'q4',
        question: 'What distinguishes "negentropic economics" from traditional economics?',
        options: [
          'It uses blockchain exclusively',
          'It rewards actions that increase system order and coherence rather than extraction',
          'It eliminates all market mechanisms',
          'It requires government oversight'
        ],
        correctAnswer: 1,
        explanation: 'Negentropic economics draws from thermodynamics: it rewards contributions that increase systemic order (negentropy) rather than rewarding extraction that increases disorder (entropy).',
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
      },
      {
        id: 'q4',
        question: 'Why is intent documentation (like EPICON) critical for drift prevention?',
        options: [
          'It satisfies regulatory requirements',
          'It creates an auditable record of WHY decisions were made, not just what changed',
          'It slows down development appropriately',
          'It replaces the need for automated testing'
        ],
        correctAnswer: 1,
        explanation: 'Intent documentation creates accountability by recording the reasoning behind decisions, enabling future auditors to evaluate whether actions matched stated goals.',
        difficulty: 'hard',
        points: 20
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
    description: 'Integrity, Ecology, Custodianship — the philosophical foundation of Mobius Substrate.',
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
        explanation: 'The Covenant of Integrity requires honest, transparent, and accountable operations — the foundation of trust in any system.',
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
        explanation: 'Kintsugi philosophy, like the Three Covenants, honors the process of repair and growth — acknowledging that healing creates something stronger and more beautiful.',
        difficulty: 'medium',
        points: 15
      }
    ],
    completed: false,
    progress: 0
  },
  {
    id: 'sentinel-architecture',
    title: 'Sentinel Architecture Deep Dive',
    description: 'Understand how ATLAS, AUREA, ECHO, JADE, and EVE form the constitutional immune system of Mobius.',
    difficulty: 'advanced',
    estimatedMinutes: 50,
    micReward: 110,
    topics: ['Sentinels', 'System Architecture', 'Constitutional Immunity'],
    questions: [
      {
        id: 'q1',
        question: 'What is AUREA\'s primary responsibility in the sentinel constellation?',
        options: [
          'Code review and deployment',
          'Integrity custodianship and ethical oversight',
          'User interface testing',
          'Database management'
        ],
        correctAnswer: 1,
        explanation: 'AUREA serves as the integrity custodian, ensuring all system operations maintain ethical alignment and constitutional fidelity.',
        difficulty: 'medium',
        points: 15
      },
      {
        id: 'q2',
        question: 'How does ECHO contribute to temporal coherence?',
        options: [
          'By backing up data regularly',
          'By synchronizing clocks across servers',
          'By ensuring decisions remain consistent with historical commitments over time',
          'By speeding up system responses'
        ],
        correctAnswer: 2,
        explanation: 'ECHO maintains temporal coherence by verifying that current decisions remain consistent with past commitments and constitutional principles across time.',
        difficulty: 'hard',
        points: 20
      },
      {
        id: 'q3',
        question: 'Why does the sentinel system use multiple agents instead of one omniscient overseer?',
        options: [
          'Cost efficiency',
          'Separation of concerns prevents any single point of constitutional capture',
          'Technical limitation',
          'Marketing purposes'
        ],
        correctAnswer: 1,
        explanation: 'Multiple sentinels create checks and balances — no single agent can be captured or corrupted without others detecting the drift, similar to separation of powers in governance.',
        difficulty: 'hard',
        points: 25
      }
    ],
    completed: false,
    progress: 0
  },

  // ═══════════════════════════════════════════
  // STEM: MATHEMATICS (4)
  // ═══════════════════════════════════════════
  {
    id: 'calculus-fundamentals',
    title: 'Calculus I: Limits and Derivatives',
    description: 'Master the foundational concepts of calculus including limits, continuity, and differentiation.',
    difficulty: 'intermediate',
    estimatedMinutes: 60,
    micReward: 100,
    topics: ['Calculus', 'Derivatives', 'Limits', 'Mathematics'],
    questions: [
      {
        id: 'q1',
        question: 'What is the derivative of f(x) = x²?',
        options: ['x', '2x', 'x²/2', '2'],
        correctAnswer: 1,
        explanation: 'Using the power rule, d/dx(x²) = 2x¹ = 2x. This represents the instantaneous rate of change of the function.',
        difficulty: 'easy',
        points: 15
      },
      {
        id: 'q2',
        question: 'The limit of (sin x)/x as x approaches 0 equals:',
        options: ['0', '1', '∞', 'undefined'],
        correctAnswer: 1,
        explanation: 'This is a fundamental limit in calculus: lim(x→0) sin(x)/x = 1. This limit is crucial for deriving the derivative of sine.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 'q3',
        question: 'In gradient descent optimization (used in AI), why do we need derivatives?',
        options: [
          'To calculate final values',
          'To find the direction of steepest descent',
          'To measure computation time',
          'To store model weights'
        ],
        correctAnswer: 1,
        explanation: 'Derivatives tell us the direction of steepest descent, allowing AI models to minimize loss functions efficiently during training.',
        difficulty: 'hard',
        points: 25
      }
    ],
    completed: false,
    progress: 0
  },
  {
    id: 'linear-algebra-ml',
    title: 'Linear Algebra for Machine Learning',
    description: 'Understand matrices, vectors, and transformations that power modern AI systems.',
    difficulty: 'intermediate',
    estimatedMinutes: 50,
    micReward: 90,
    topics: ['Linear Algebra', 'Machine Learning', 'Mathematics', 'AI'],
    questions: [
      {
        id: 'q1',
        question: "What is a matrix multiplication's primary use in neural networks?",
        options: [
          'Storing data',
          'Computing weighted sums of inputs',
          'Displaying results',
          'Saving models'
        ],
        correctAnswer: 1,
        explanation: 'Matrix multiplication computes weighted sums efficiently, which is the core operation in every layer of a neural network.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 'q2',
        question: 'An eigenvector represents:',
        options: [
          "A direction that doesn't change under transformation",
          'The largest value in a matrix',
          'The sum of matrix elements',
          'A random vector'
        ],
        correctAnswer: 0,
        explanation: "Eigenvectors are special vectors that only get scaled (not rotated) when a linear transformation is applied. They're crucial for PCA and understanding data structure.",
        difficulty: 'hard',
        points: 25
      },
      {
        id: 'q3',
        question: 'What does the determinant of a matrix tell us geometrically?',
        options: [
          'The sum of all elements',
          'How much the transformation scales area (or volume)',
          'The number of rows and columns',
          'The trace of the matrix'
        ],
        correctAnswer: 1,
        explanation: 'The determinant measures the factor by which a linear transformation changes area (2D) or volume (3D). A determinant of 0 means the transformation collapses a dimension.',
        difficulty: 'hard',
        points: 25
      }
    ],
    completed: false,
    progress: 0
  },
  {
    id: 'probability-statistics-ai',
    title: 'Probability & Statistics for AI',
    description: "Master probability theory and statistical methods that underpin machine learning.",
    difficulty: 'intermediate',
    estimatedMinutes: 55,
    micReward: 85,
    topics: ['Probability', 'Statistics', 'Machine Learning', 'Data Science'],
    questions: [
      {
        id: 'q1',
        question: "Bayes' theorem allows us to:",
        options: [
          'Add probabilities',
          'Update beliefs based on new evidence',
          'Calculate averages',
          'Multiply matrices'
        ],
        correctAnswer: 1,
        explanation: "Bayes' theorem mathematically describes how to update probability estimates as new evidence becomes available — fundamental to AI reasoning.",
        difficulty: 'medium',
        points: 20
      },
      {
        id: 'q2',
        question: 'Why is the Central Limit Theorem important for AI?',
        options: [
          'It makes code run faster',
          'It explains why many distributions become normal with large samples',
          'It reduces memory usage',
          'It improves accuracy automatically'
        ],
        correctAnswer: 1,
        explanation: 'The CLT explains why normal distributions appear everywhere in nature and AI, enabling many statistical methods and inference techniques.',
        difficulty: 'hard',
        points: 25
      },
      {
        id: 'q3',
        question: 'What does a p-value of 0.03 mean in hypothesis testing?',
        options: [
          'There is a 3% chance the hypothesis is true',
          'There is a 3% chance of seeing this data (or more extreme) if the null hypothesis were true',
          'The result is 97% accurate',
          'The experiment failed 3% of the time'
        ],
        correctAnswer: 1,
        explanation: 'A p-value measures the probability of observing the data (or something more extreme) assuming the null hypothesis is true — it is NOT the probability that the hypothesis is correct.',
        difficulty: 'hard',
        points: 25
      }
    ],
    completed: false,
    progress: 0
  },
  {
    id: 'discrete-mathematics',
    title: 'Discrete Mathematics & Logic',
    description: 'Learn the mathematical foundations of computer science: logic, sets, combinatorics, and graph theory.',
    difficulty: 'intermediate',
    estimatedMinutes: 55,
    micReward: 90,
    topics: ['Discrete Math', 'Logic', 'Combinatorics', 'Graph Theory'],
    questions: [
      {
        id: 'q1',
        question: 'What is the contrapositive of "If it rains, then the ground is wet"?',
        options: [
          'If the ground is wet, then it rains',
          'If the ground is not wet, then it did not rain',
          'If it does not rain, the ground is not wet',
          'The ground is wet if and only if it rains'
        ],
        correctAnswer: 1,
        explanation: 'The contrapositive of "If P then Q" is "If not Q then not P" — and it is always logically equivalent to the original statement.',
        difficulty: 'easy',
        points: 15
      },
      {
        id: 'q2',
        question: 'How many ways can you arrange 5 books on a shelf?',
        options: ['5', '25', '120', '3125'],
        correctAnswer: 2,
        explanation: '5! (5 factorial) = 5 × 4 × 3 × 2 × 1 = 120. This is a permutation — the order matters.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 'q3',
        question: 'In graph theory, what is the minimum number of colors needed to color a planar graph?',
        options: ['2', '3', '4', '5'],
        correctAnswer: 2,
        explanation: 'The Four Color Theorem states that any planar graph can be colored with at most 4 colors such that no two adjacent vertices share a color.',
        difficulty: 'hard',
        points: 25
      }
    ],
    completed: false,
    progress: 0
  },

  // ═══════════════════════════════════════════
  // STEM: COMPUTER SCIENCE (4)
  // ═══════════════════════════════════════════
  {
    id: 'algorithms-complexity',
    title: 'Algorithms & Complexity Theory',
    description: 'Learn algorithmic thinking, Big O notation, and computational complexity.',
    difficulty: 'intermediate',
    estimatedMinutes: 65,
    micReward: 95,
    topics: ['Algorithms', 'Computer Science', 'Complexity', 'Optimization'],
    questions: [
      {
        id: 'q1',
        question: 'What is the time complexity of binary search?',
        options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
        correctAnswer: 1,
        explanation: "Binary search halves the search space each step, giving O(log n) complexity. This is why it's much faster than linear search for sorted data.",
        difficulty: 'easy',
        points: 15
      },
      {
        id: 'q2',
        question: "Why can't NP-complete problems be solved efficiently?",
        options: [
          'They require too much memory',
          'No polynomial-time algorithm is known to exist',
          'They are impossible to solve',
          'They require quantum computers'
        ],
        correctAnswer: 1,
        explanation: "NP-complete problems have no known polynomial-time solutions. Finding one would prove P=NP, one of computer science's biggest open questions.",
        difficulty: 'hard',
        points: 30
      },
      {
        id: 'q3',
        question: 'What is the key insight behind dynamic programming?',
        options: [
          'Using faster hardware',
          'Breaking problems into overlapping subproblems and caching results',
          'Running computations in parallel',
          'Using more memory for bigger data structures'
        ],
        correctAnswer: 1,
        explanation: 'Dynamic programming avoids redundant computation by solving each subproblem once and storing the result — turning exponential algorithms into polynomial ones.',
        difficulty: 'medium',
        points: 20
      }
    ],
    completed: false,
    progress: 0
  },
  {
    id: 'data-structures-fundamentals',
    title: 'Data Structures Fundamentals',
    description: 'Master essential data structures: arrays, linked lists, trees, graphs, hash tables.',
    difficulty: 'beginner',
    estimatedMinutes: 45,
    micReward: 70,
    topics: ['Data Structures', 'Computer Science', 'Programming'],
    questions: [
      {
        id: 'q1',
        question: "What's the main advantage of a hash table?",
        options: [
          'Uses less memory',
          'O(1) average lookup time',
          'Maintains sorted order',
          'Thread-safe by default'
        ],
        correctAnswer: 1,
        explanation: 'Hash tables provide O(1) average-case lookup, insertion, and deletion — making them ideal for caches, databases, and dictionaries.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 'q2',
        question: 'When would you choose a tree over an array?',
        options: [
          'When you need random access',
          'When you need hierarchical relationships',
          'When memory is limited',
          'When you need to append data'
        ],
        correctAnswer: 1,
        explanation: 'Trees excel at representing hierarchical data (file systems, DOM, decision trees) and maintaining sorted order with efficient operations.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 'q3',
        question: 'What is the worst-case time complexity of inserting into a balanced BST?',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
        correctAnswer: 1,
        explanation: 'A balanced binary search tree guarantees O(log n) height, so insertion requires at most O(log n) comparisons to find the correct position.',
        difficulty: 'medium',
        points: 20
      }
    ],
    completed: false,
    progress: 0
  },
  {
    id: 'cryptography-blockchain',
    title: 'Cryptography & Blockchain Fundamentals',
    description: 'Understand cryptographic primitives, hash functions, and how blockchains ensure integrity.',
    difficulty: 'advanced',
    estimatedMinutes: 70,
    micReward: 120,
    topics: ['Cryptography', 'Blockchain', 'Security', 'Distributed Systems'],
    questions: [
      {
        id: 'q1',
        question: 'What property makes SHA-256 suitable for blockchain?',
        options: [
          "It's fast to compute",
          "It's collision-resistant and deterministic",
          'It produces short hashes',
          "It's reversible"
        ],
        correctAnswer: 1,
        explanation: 'SHA-256 is collision-resistant (hard to find two inputs with same output) and deterministic (same input always gives same output), making it perfect for ensuring data integrity.',
        difficulty: 'medium',
        points: 25
      },
      {
        id: 'q2',
        question: 'How do Byzantine Fault Tolerant systems relate to integrity economics?',
        options: [
          'They prevent all attacks',
          'They tolerate up to 33% malicious nodes while maintaining consensus',
          'They eliminate the need for incentives',
          'They require trusted leaders'
        ],
        correctAnswer: 1,
        explanation: 'BFT systems can reach consensus even when up to 1/3 of nodes are malicious — this mathematical guarantee is crucial for integrity-backed currencies like MIC.',
        difficulty: 'hard',
        points: 30
      },
      {
        id: 'q3',
        question: 'How does a Merkle tree enable efficient verification of large datasets?',
        options: [
          'It stores all data in a single hash',
          'It allows verifying any single piece by checking only log(n) hashes up to the root',
          'It compresses data to save space',
          'It encrypts data for privacy'
        ],
        correctAnswer: 1,
        explanation: 'Merkle trees organize hashes in a binary tree so you only need to verify a logarithmic number of hashes (leaf to root) instead of rehashing everything.',
        difficulty: 'hard',
        points: 30
      }
    ],
    completed: false,
    progress: 0
  },
  {
    id: 'distributed-systems',
    title: 'Distributed Systems & Consensus',
    description: 'Learn how distributed systems achieve consistency, availability, and partition tolerance.',
    difficulty: 'advanced',
    estimatedMinutes: 65,
    micReward: 115,
    topics: ['Distributed Systems', 'CAP Theorem', 'Consensus', 'Fault Tolerance'],
    questions: [
      {
        id: 'q1',
        question: 'What does the CAP theorem state?',
        options: [
          'Distributed systems can achieve all three: Consistency, Availability, Partition tolerance',
          'A distributed system can guarantee at most two of: Consistency, Availability, Partition tolerance',
          'CAP stands for Compute, Access, Performance',
          'All distributed databases are eventually consistent'
        ],
        correctAnswer: 1,
        explanation: 'The CAP theorem (Brewer\'s theorem) proves that in the presence of network partitions, a distributed system must choose between consistency and availability.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 'q2',
        question: 'What is the Raft consensus algorithm designed for?',
        options: [
          'Maximizing throughput',
          'Achieving distributed consensus in an understandable way',
          'Encrypting network traffic',
          'Load balancing requests'
        ],
        correctAnswer: 1,
        explanation: 'Raft was designed as an understandable alternative to Paxos for achieving replicated state machine consensus, using leader election and log replication.',
        difficulty: 'hard',
        points: 25
      },
      {
        id: 'q3',
        question: 'What is eventual consistency?',
        options: [
          'All nodes always have the same data',
          'Given enough time without new writes, all replicas will converge to the same state',
          'Data is never consistent',
          'Consistency that depends on network speed'
        ],
        correctAnswer: 1,
        explanation: 'Eventual consistency guarantees that if no new updates are made, all nodes will eventually converge to the same value — a tradeoff for higher availability.',
        difficulty: 'medium',
        points: 20
      }
    ],
    completed: false,
    progress: 0
  },

  // ═══════════════════════════════════════════
  // STEM: ARTIFICIAL INTELLIGENCE (5)
  // ═══════════════════════════════════════════
  {
    id: 'neural-networks-intro',
    title: 'Introduction to Neural Networks',
    description: 'Understand how artificial neural networks learn from data through backpropagation.',
    difficulty: 'intermediate',
    estimatedMinutes: 60,
    micReward: 100,
    topics: ['Neural Networks', 'Deep Learning', 'AI', 'Machine Learning'],
    questions: [
      {
        id: 'q1',
        question: 'What is the purpose of an activation function?',
        options: [
          'To speed up training',
          'To introduce non-linearity',
          'To reduce overfitting',
          'To initialize weights'
        ],
        correctAnswer: 1,
        explanation: 'Activation functions introduce non-linearity, allowing neural networks to learn complex patterns. Without them, any neural network would be equivalent to linear regression.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 'q2',
        question: 'Backpropagation uses which calculus concept?',
        options: [
          'Integration',
          'Chain rule for derivatives',
          'Limit theorems',
          'Differential equations'
        ],
        correctAnswer: 1,
        explanation: 'Backpropagation applies the chain rule to efficiently compute gradients layer by layer, allowing networks to learn from errors.',
        difficulty: 'hard',
        points: 25
      },
      {
        id: 'q3',
        question: 'How does dropout prevent overfitting?',
        options: [
          'By removing neurons permanently',
          'By randomly disabling neurons during training',
          'By reducing learning rate',
          'By adding more data'
        ],
        correctAnswer: 1,
        explanation: "Dropout randomly disables neurons during training, forcing the network to learn robust features that don't depend on any single neuron.",
        difficulty: 'hard',
        points: 25
      }
    ],
    completed: false,
    progress: 0
  },
  {
    id: 'transformers-attention',
    title: 'Transformers & Attention Mechanisms',
    description: 'Learn the architecture behind GPT, BERT, and Claude. Understand self-attention and positional encoding.',
    difficulty: 'advanced',
    estimatedMinutes: 75,
    micReward: 130,
    topics: ['Transformers', 'Attention', 'NLP', 'Deep Learning'],
    questions: [
      {
        id: 'q1',
        question: 'What problem do attention mechanisms solve?',
        options: [
          'Memory limitations',
          'Long-range dependencies in sequences',
          'Training speed',
          'Model size'
        ],
        correctAnswer: 1,
        explanation: 'Attention allows models to focus on relevant parts of input regardless of distance, solving the long-range dependency problem that plagued RNNs.',
        difficulty: 'medium',
        points: 25
      },
      {
        id: 'q2',
        question: 'Why do transformers need positional encoding?',
        options: [
          'To reduce computation',
          'Because attention has no inherent sense of position',
          'To prevent overfitting',
          'To initialize weights'
        ],
        correctAnswer: 1,
        explanation: 'Unlike RNNs, attention operations are permutation-invariant. Positional encodings inject information about token order into the model.',
        difficulty: 'hard',
        points: 30
      },
      {
        id: 'q3',
        question: 'What are the three matrices (Q, K, V) in self-attention?',
        options: [
          'Quality, Knowledge, Value',
          'Query, Key, Value — analogous to a database lookup',
          'Quantize, Kernel, Vector',
          'Quick, Key, Verify'
        ],
        correctAnswer: 1,
        explanation: 'Query (what am I looking for?), Key (what do I contain?), Value (what information do I provide?) — together they compute weighted attention scores.',
        difficulty: 'hard',
        points: 30
      }
    ],
    completed: false,
    progress: 0
  },
  {
    id: 'reinforcement-learning',
    title: 'Reinforcement Learning Fundamentals',
    description: 'Master RL concepts: agents, environments, rewards, Q-learning, policy gradients.',
    difficulty: 'advanced',
    estimatedMinutes: 65,
    micReward: 110,
    topics: ['Reinforcement Learning', 'AI', 'Optimization', 'Game Theory'],
    questions: [
      {
        id: 'q1',
        question: 'What is the exploration-exploitation tradeoff?',
        options: [
          'Balancing model size and speed',
          'Balancing trying new actions vs. using known good actions',
          'Balancing training and inference time',
          'Balancing accuracy and interpretability'
        ],
        correctAnswer: 1,
        explanation: 'Agents must balance exploring new actions (to discover better strategies) with exploiting known good actions (to maximize immediate reward).',
        difficulty: 'medium',
        points: 25
      },
      {
        id: 'q2',
        question: "How does RL relate to integrity economics in Mobius?",
        options: [
          "It doesn't relate",
          'Agents learn optimal behavior through reward signals tied to integrity',
          'It only applies to games',
          'It replaces human decision-making'
        ],
        correctAnswer: 1,
        explanation: 'In Mobius, MIC rewards create RL-like dynamics where agents learn behaviors that maintain system integrity through feedback loops.',
        difficulty: 'hard',
        points: 30
      },
      {
        id: 'q3',
        question: 'Why is reward shaping dangerous in RL?',
        options: [
          'It makes training too fast',
          'Poorly designed rewards cause agents to find unintended shortcuts (Goodhart\'s Law)',
          'It requires too much compute',
          'It only works for simple problems'
        ],
        correctAnswer: 1,
        explanation: 'Reward hacking (Goodhart\'s Law) is a core AI safety concern: agents optimize for the reward signal, not the designer\'s intent.',
        difficulty: 'hard',
        points: 30
      }
    ],
    completed: false,
    progress: 0
  },
  {
    id: 'natural-language-processing',
    title: 'Natural Language Processing',
    description: 'Explore how machines understand and generate human language, from tokenization to generation.',
    difficulty: 'intermediate',
    estimatedMinutes: 55,
    micReward: 95,
    topics: ['NLP', 'Language Models', 'AI', 'Linguistics'],
    questions: [
      {
        id: 'q1',
        question: 'What is tokenization in NLP?',
        options: [
          'Encrypting text for security',
          'Breaking text into smaller units (tokens) for model processing',
          'Converting text to audio',
          'Translating between languages'
        ],
        correctAnswer: 1,
        explanation: 'Tokenization splits text into tokens (words, subwords, or characters) that can be converted to numerical representations for model input.',
        difficulty: 'easy',
        points: 15
      },
      {
        id: 'q2',
        question: 'What is a word embedding?',
        options: [
          'A word hidden in a sentence',
          'A dense vector representation that captures semantic meaning',
          'A compressed text file',
          'A type of font'
        ],
        correctAnswer: 1,
        explanation: 'Word embeddings map words to dense vectors where semantically similar words are close together — "king" - "man" + "woman" ≈ "queen".',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 'q3',
        question: 'How does RLHF (Reinforcement Learning from Human Feedback) work?',
        options: [
          'Humans write the code for the AI',
          'Human preferences train a reward model that guides RL fine-tuning',
          'Humans manually correct every output',
          'It replaces neural networks with rules'
        ],
        correctAnswer: 1,
        explanation: 'RLHF trains a reward model on human preference data, then uses that model as the reward signal for RL fine-tuning — the technique behind ChatGPT and Claude.',
        difficulty: 'hard',
        points: 25
      }
    ],
    completed: false,
    progress: 0
  },
  {
    id: 'computer-vision',
    title: 'Computer Vision Fundamentals',
    description: 'Learn how AI systems see and interpret visual information, from CNNs to vision transformers.',
    difficulty: 'intermediate',
    estimatedMinutes: 50,
    micReward: 90,
    topics: ['Computer Vision', 'CNNs', 'Deep Learning', 'Image Processing'],
    questions: [
      {
        id: 'q1',
        question: 'What is a convolutional layer doing?',
        options: [
          'Storing pixel values',
          'Sliding learned filters across the image to detect features',
          'Compressing the image file',
          'Converting color to grayscale'
        ],
        correctAnswer: 1,
        explanation: 'Convolutional layers apply learned filters that slide across the input, detecting features like edges, textures, and patterns at different scales.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 'q2',
        question: 'Why do pooling layers help in CNNs?',
        options: [
          'They increase resolution',
          'They reduce spatial dimensions while retaining important features',
          'They add more parameters',
          'They color-correct images'
        ],
        correctAnswer: 1,
        explanation: 'Pooling reduces spatial dimensions (downsampling), making the network more computationally efficient and providing translation invariance.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 'q3',
        question: 'How do Vision Transformers (ViT) differ from CNNs?',
        options: [
          'They are faster',
          'They treat image patches as tokens and use self-attention instead of convolutions',
          'They only work on small images',
          'They require less training data'
        ],
        correctAnswer: 1,
        explanation: 'ViT splits images into patches, projects them into embeddings, and processes them with transformer attention — showing that convolutions are not necessary for vision.',
        difficulty: 'hard',
        points: 25
      }
    ],
    completed: false,
    progress: 0
  },

  // ═══════════════════════════════════════════
  // STEM: PHYSICS & ENGINEERING (4)
  // ═══════════════════════════════════════════
  {
    id: 'quantum-computing-intro',
    title: 'Quantum Computing Fundamentals',
    description: 'Introduction to qubits, superposition, entanglement, and quantum algorithms.',
    difficulty: 'advanced',
    estimatedMinutes: 70,
    micReward: 125,
    topics: ['Quantum Computing', 'Physics', 'Computer Science'],
    questions: [
      {
        id: 'q1',
        question: 'What is quantum superposition?',
        options: [
          'Adding quantum states together',
          'A qubit existing in multiple states simultaneously',
          'Quantum computers being faster',
          'A type of quantum algorithm'
        ],
        correctAnswer: 1,
        explanation: 'Superposition allows qubits to exist in multiple states (0 and 1) simultaneously until measured, enabling quantum parallelism.',
        difficulty: 'medium',
        points: 25
      },
      {
        id: 'q2',
        question: 'Why are quantum computers a threat to current cryptography?',
        options: [
          "They're just faster",
          "Shor's algorithm can factor large numbers efficiently",
          'They can brute force any password',
          'They can break any encryption instantly'
        ],
        correctAnswer: 1,
        explanation: "Shor's algorithm can factor large numbers in polynomial time on quantum computers, breaking RSA encryption which relies on factoring difficulty.",
        difficulty: 'hard',
        points: 30
      },
      {
        id: 'q3',
        question: 'What is quantum entanglement?',
        options: [
          'Qubits getting stuck together',
          'A correlation between qubits where measuring one instantly determines the other',
          'A way to send information faster than light',
          'A type of quantum error'
        ],
        correctAnswer: 1,
        explanation: 'Entanglement creates correlated pairs where measuring one qubit instantly determines the state of the other, regardless of distance — key to quantum computing and communication.',
        difficulty: 'hard',
        points: 30
      }
    ],
    completed: false,
    progress: 0
  },
  {
    id: 'network-theory-systems',
    title: 'Network Theory & Complex Systems',
    description: 'Study how networks behave, from social graphs to neural networks and emergent phenomena.',
    difficulty: 'intermediate',
    estimatedMinutes: 55,
    micReward: 90,
    topics: ['Network Theory', 'Complex Systems', 'Graph Theory', 'Systems Science'],
    questions: [
      {
        id: 'q1',
        question: 'What is a scale-free network?',
        options: [
          'A network with no size limit',
          'A network where degree distribution follows a power law',
          'A network without hierarchy',
          'A network that scales linearly'
        ],
        correctAnswer: 1,
        explanation: 'Scale-free networks have a few highly connected hubs and many nodes with few connections — seen in the web, social networks, and protein interactions.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 'q2',
        question: "How do network effects relate to Mobius' integrity systems?",
        options: [
          "They don't relate",
          'Integrity spreads through networks, creating positive feedback loops',
          'Networks always reduce integrity',
          'Only centralized networks matter'
        ],
        correctAnswer: 1,
        explanation: 'In Mobius, integrity creates network effects: as more nodes maintain high integrity, the Global Integrity Index rises, rewarding everyone — a regenerative feedback loop.',
        difficulty: 'hard',
        points: 25
      },
      {
        id: 'q3',
        question: 'What is emergence in complex systems?',
        options: [
          'When new components are added',
          'When collective behavior arises that cannot be predicted from individual components',
          'When systems become more complex',
          'When networks grow larger'
        ],
        correctAnswer: 1,
        explanation: 'Emergence occurs when simple rules at the individual level produce complex, unpredictable behavior at the collective level — like consciousness from neurons or markets from traders.',
        difficulty: 'hard',
        points: 25
      }
    ],
    completed: false,
    progress: 0
  },
  {
    id: 'information-theory',
    title: 'Information Theory & Entropy',
    description: 'Learn Shannon entropy, information content, and how information theory connects to AI and cryptography.',
    difficulty: 'advanced',
    estimatedMinutes: 60,
    micReward: 105,
    topics: ['Information Theory', 'Entropy', 'Computer Science', 'Physics'],
    questions: [
      {
        id: 'q1',
        question: 'What does Shannon entropy measure?',
        options: [
          'Temperature of information',
          'Average information content or uncertainty',
          'Speed of data transfer',
          'Computational complexity'
        ],
        correctAnswer: 1,
        explanation: 'Shannon entropy quantifies the average information content or uncertainty in a random variable — fundamental to compression, cryptography, and ML.',
        difficulty: 'medium',
        points: 25
      },
      {
        id: 'q2',
        question: 'Why is cross-entropy loss used in classification?',
        options: [
          "It's easier to compute",
          'It measures the difference between predicted and true probability distributions',
          "It's always positive",
          "It's differentiable"
        ],
        correctAnswer: 1,
        explanation: 'Cross-entropy loss measures how well predicted probabilities match true labels — a direct application of information theory to machine learning.',
        difficulty: 'hard',
        points: 25
      },
      {
        id: 'q3',
        question: 'What is the relationship between entropy and data compression?',
        options: [
          'Higher entropy means better compression',
          'Entropy sets the theoretical minimum number of bits needed to encode a message',
          'Compression eliminates entropy',
          'They are unrelated'
        ],
        correctAnswer: 1,
        explanation: 'Shannon\'s source coding theorem proves that entropy is the fundamental limit of lossless compression — you cannot compress below the entropy rate.',
        difficulty: 'hard',
        points: 30
      }
    ],
    completed: false,
    progress: 0
  },
  {
    id: 'systems-thinking',
    title: 'Systems Thinking & Feedback Loops',
    description: 'Learn to think in systems: feedback loops, leverage points, stock-and-flow dynamics, and emergent behavior.',
    difficulty: 'intermediate',
    estimatedMinutes: 45,
    micReward: 80,
    topics: ['Systems Thinking', 'Feedback Loops', 'Complexity', 'Design'],
    questions: [
      {
        id: 'q1',
        question: 'What is a reinforcing feedback loop?',
        options: [
          'A loop that always stabilizes',
          'A loop where the output amplifies the input, creating exponential growth or decline',
          'A loop that runs faster each time',
          'A loop with positive outcomes only'
        ],
        correctAnswer: 1,
        explanation: 'Reinforcing (positive) feedback loops amplify change — compound interest, viral growth, and bank runs are all reinforcing loops. They can be constructive or destructive.',
        difficulty: 'easy',
        points: 15
      },
      {
        id: 'q2',
        question: 'What is a "leverage point" in systems thinking?',
        options: [
          'The most expensive part of the system',
          'A place where a small change produces large system-wide effects',
          'The weakest point in the system',
          'The most visible component'
        ],
        correctAnswer: 1,
        explanation: 'Leverage points (Donella Meadows) are places in a system where a small shift can produce big changes — like changing the goal of a system or its rules.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 'q3',
        question: 'How does Mobius apply systems thinking to AI governance?',
        options: [
          'It ignores system dynamics',
          'It designs integrity feedback loops where aligned behavior strengthens the system',
          'It uses purely linear models',
          'It focuses only on individual agents'
        ],
        correctAnswer: 1,
        explanation: 'Mobius creates regenerative feedback loops: maintaining integrity earns MIC, which incentivizes more integrity, which raises the GII — a virtuous cycle by design.',
        difficulty: 'medium',
        points: 20
      }
    ],
    completed: false,
    progress: 0
  },

  // ═══════════════════════════════════════════
  // STEM: LIFE SCIENCES (3)
  // ═══════════════════════════════════════════
  {
    id: 'molecular-biology-ai',
    title: 'Molecular Biology & AI Applications',
    description: 'Understand DNA, proteins, and how AI is revolutionizing drug discovery and genomics.',
    difficulty: 'intermediate',
    estimatedMinutes: 50,
    micReward: 85,
    topics: ['Biology', 'Bioinformatics', 'AI Applications', 'Healthcare'],
    questions: [
      {
        id: 'q1',
        question: 'How did AlphaFold revolutionize biology?',
        options: [
          'It sequenced genomes faster',
          'It predicted 3D protein structure from amino acid sequences',
          'It created new proteins',
          'It cured diseases'
        ],
        correctAnswer: 1,
        explanation: 'AlphaFold solved the 50-year protein folding problem, enabling researchers to predict structures that took decades to determine experimentally.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 'q2',
        question: 'Why is CRISPR gene editing revolutionary?',
        options: [
          "It's cheaper than other methods",
          'It allows precise, targeted DNA editing',
          'It works on all organisms',
          "It's completely safe"
        ],
        correctAnswer: 1,
        explanation: 'CRISPR enables precise, targeted gene editing using RNA-guided enzymes, opening possibilities for treating genetic diseases.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 'q3',
        question: 'What is the "central dogma" of molecular biology?',
        options: [
          'Survival of the fittest',
          'DNA → RNA → Protein: the flow of genetic information',
          'All cells come from other cells',
          'Evolution is always progressive'
        ],
        correctAnswer: 1,
        explanation: 'The central dogma describes how genetic information flows: DNA is transcribed to RNA, which is translated into proteins — the fundamental process of gene expression.',
        difficulty: 'easy',
        points: 15
      }
    ],
    completed: false,
    progress: 0
  },
  {
    id: 'climate-science-ai',
    title: 'Climate Science & AI Modeling',
    description: 'Learn climate system dynamics, carbon cycles, and how AI helps model and mitigate climate change.',
    difficulty: 'intermediate',
    estimatedMinutes: 55,
    micReward: 90,
    topics: ['Climate Science', 'Environmental Science', 'AI Applications', 'Ecology'],
    questions: [
      {
        id: 'q1',
        question: 'How does AI improve climate modeling?',
        options: [
          'It eliminates uncertainty',
          'It identifies patterns in complex datasets and improves prediction accuracy',
          'It replaces physical models entirely',
          'It controls the weather'
        ],
        correctAnswer: 1,
        explanation: 'AI/ML helps identify non-linear patterns in climate data, improve parameterization, and increase prediction accuracy for regional impacts.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 'q2',
        question: 'How does the Ecology Covenant relate to climate science?',
        options: [
          "It doesn't relate",
          'It mandates regenerative systems that restore rather than extract',
          'It only applies to software',
          'It requires carbon credits'
        ],
        correctAnswer: 1,
        explanation: 'The Ecology Covenant ensures Mobius systems are regenerative by design — creating positive environmental feedback loops rather than extractive ones.',
        difficulty: 'hard',
        points: 25
      },
      {
        id: 'q3',
        question: 'What is a climate tipping point?',
        options: [
          'When weather becomes unpredictable',
          'A threshold beyond which changes become self-reinforcing and irreversible',
          'The coldest day of the year',
          'When carbon levels return to normal'
        ],
        correctAnswer: 1,
        explanation: 'Climate tipping points are thresholds that, once crossed, trigger self-reinforcing changes — like ice sheet collapse or permafrost thaw releasing methane.',
        difficulty: 'medium',
        points: 20
      }
    ],
    completed: false,
    progress: 0
  },
  {
    id: 'bioinformatics-genomics',
    title: 'Bioinformatics & Genomic Analysis',
    description: 'Explore computational approaches to biological data and how AI accelerates biomedical research.',
    difficulty: 'advanced',
    estimatedMinutes: 65,
    micReward: 115,
    topics: ['Bioinformatics', 'Genomics', 'AI', 'Data Science', 'Healthcare'],
    questions: [
      {
        id: 'q1',
        question: 'What is the primary goal of sequence alignment?',
        options: [
          'To make DNA look nicer',
          'To identify similarities and evolutionary relationships between sequences',
          'To speed up gene sequencing',
          'To store genetic data efficiently'
        ],
        correctAnswer: 1,
        explanation: 'Sequence alignment identifies regions of similarity revealing functional, structural, or evolutionary relationships between DNA, RNA, or protein sequences.',
        difficulty: 'medium',
        points: 25
      },
      {
        id: 'q2',
        question: 'How has AI transformed drug discovery?',
        options: [
          'It has eliminated the need for clinical trials',
          'It accelerates molecule screening and predicts drug-target interactions',
          'It replaces all human researchers',
          'It only works for simple drugs'
        ],
        correctAnswer: 1,
        explanation: 'AI dramatically accelerates early-stage drug discovery by screening millions of compounds virtually and identifying promising candidates for synthesis.',
        difficulty: 'hard',
        points: 30
      },
      {
        id: 'q3',
        question: 'What is a genome-wide association study (GWAS)?',
        options: [
          'A study of one specific gene',
          'A scan of the entire genome to find genetic variants associated with diseases or traits',
          'A study of gene editing techniques',
          'A study comparing genomes across species'
        ],
        correctAnswer: 1,
        explanation: 'GWAS scans hundreds of thousands of genetic markers across many individuals to find variants statistically associated with diseases or traits.',
        difficulty: 'hard',
        points: 30
      }
    ],
    completed: false,
    progress: 0
  },

  // ═══════════════════════════════════════════
  // ETHICS, PHILOSOPHY & SOCIAL SCIENCE (4)
  // ═══════════════════════════════════════════
  {
    id: 'ethics-of-ai',
    title: 'Ethics of Artificial Intelligence',
    description: 'Explore the moral landscape of AI: bias, fairness, transparency, accountability, and the alignment problem.',
    difficulty: 'beginner',
    estimatedMinutes: 40,
    micReward: 60,
    topics: ['AI Ethics', 'Fairness', 'Transparency', 'Philosophy'],
    questions: [
      {
        id: 'q1',
        question: 'What is algorithmic bias?',
        options: [
          'When an algorithm runs too slowly',
          'When AI systems produce systematically unfair outcomes for certain groups',
          'When programmers prefer certain languages',
          'When algorithms use too much data'
        ],
        correctAnswer: 1,
        explanation: 'Algorithmic bias occurs when AI systems produce systematically unfair results, often because training data reflects historical inequities or because design choices embed assumptions.',
        difficulty: 'easy',
        points: 10
      },
      {
        id: 'q2',
        question: 'Why is the "black box" problem concerning in AI?',
        options: [
          'Because AI systems are physically dark',
          'Because we often cannot explain why an AI made a specific decision',
          'Because AI code is proprietary',
          'Because AI servers are hidden'
        ],
        correctAnswer: 1,
        explanation: 'The black box problem means AI decisions are often unexplainable — critical in healthcare, criminal justice, and finance where explanations are morally and legally required.',
        difficulty: 'medium',
        points: 15
      },
      {
        id: 'q3',
        question: 'What is the alignment problem in AI?',
        options: [
          'Getting AI to run on different hardware',
          'Ensuring AI systems pursue goals that match human values and intentions',
          'Aligning code formatting',
          'Making AI systems agree with each other'
        ],
        correctAnswer: 1,
        explanation: 'The alignment problem is ensuring AI systems actually pursue the goals we intend — a profound challenge as AI becomes more capable.',
        difficulty: 'medium',
        points: 15
      }
    ],
    completed: false,
    progress: 0
  },
  {
    id: 'game-theory',
    title: 'Game Theory & Strategic Thinking',
    description: 'Learn how rational agents make decisions in strategic situations, from Nash equilibria to mechanism design.',
    difficulty: 'intermediate',
    estimatedMinutes: 55,
    micReward: 90,
    topics: ['Game Theory', 'Economics', 'Strategy', 'Decision Making'],
    questions: [
      {
        id: 'q1',
        question: 'What is a Nash Equilibrium?',
        options: [
          'When all players win',
          'A state where no player can improve their outcome by unilaterally changing strategy',
          'When the game ends in a tie',
          'The optimal strategy for the first player'
        ],
        correctAnswer: 1,
        explanation: 'A Nash Equilibrium is a set of strategies where no player can benefit by changing only their own strategy — everyone is playing their best response to others.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 'q2',
        question: 'What does the Prisoner\'s Dilemma teach us about cooperation?',
        options: [
          'Cooperation is always the best strategy',
          'Individual rationality can lead to collectively worse outcomes',
          'Betrayal is always optimal',
          'Communication solves all problems'
        ],
        correctAnswer: 1,
        explanation: 'The Prisoner\'s Dilemma shows that rational self-interest can produce outcomes worse for everyone — explaining why cooperation mechanisms (like MIC) are valuable.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 'q3',
        question: 'What is mechanism design?',
        options: [
          'Engineering physical mechanisms',
          'Designing rules and incentives so that self-interested agents produce desired outcomes',
          'Creating game graphics',
          'Building robots'
        ],
        correctAnswer: 1,
        explanation: 'Mechanism design is "reverse game theory" — designing systems where rational, self-interested behavior leads to good outcomes. MIC\'s incentive structure is mechanism design.',
        difficulty: 'hard',
        points: 25
      }
    ],
    completed: false,
    progress: 0
  },
  {
    id: 'cognitive-science',
    title: 'Cognitive Science & Decision Making',
    description: 'Understand how humans think, decide, and how cognitive biases affect our interaction with AI.',
    difficulty: 'intermediate',
    estimatedMinutes: 45,
    micReward: 75,
    topics: ['Cognitive Science', 'Psychology', 'Decision Making', 'Biases'],
    questions: [
      {
        id: 'q1',
        question: 'What is confirmation bias?',
        options: [
          'Confirming your email address',
          'The tendency to search for and favor information that confirms existing beliefs',
          'A type of memory error',
          'A statistical method'
        ],
        correctAnswer: 1,
        explanation: 'Confirmation bias leads us to seek, remember, and interpret information that confirms what we already believe — a critical consideration in AI-assisted decision making.',
        difficulty: 'easy',
        points: 15
      },
      {
        id: 'q2',
        question: 'What is the Dunning-Kruger effect?',
        options: [
          'A medical condition',
          'The tendency for unskilled individuals to overestimate their ability',
          'A statistical anomaly',
          'A type of learning disability'
        ],
        correctAnswer: 1,
        explanation: 'The Dunning-Kruger effect shows that people with limited knowledge tend to overestimate their competence, while experts tend to underestimate theirs.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 'q3',
        question: 'Why should AI systems account for cognitive biases in users?',
        options: [
          'To manipulate users more effectively',
          'To present information in ways that support better decision-making',
          'To replace human thinking entirely',
          'It does not need to'
        ],
        correctAnswer: 1,
        explanation: 'Constitutional AI should help counteract human cognitive biases — not exploit them. Presenting balanced information supports autonomous decision-making.',
        difficulty: 'medium',
        points: 20
      }
    ],
    completed: false,
    progress: 0
  },
  {
    id: 'zero-knowledge-proofs',
    title: 'Zero-Knowledge Proofs & Privacy',
    description: 'Learn how to prove you know something without revealing what you know — the foundation of privacy-preserving systems.',
    difficulty: 'advanced',
    estimatedMinutes: 60,
    micReward: 120,
    topics: ['Zero-Knowledge Proofs', 'Privacy', 'Cryptography', 'Verification'],
    questions: [
      {
        id: 'q1',
        question: 'What is a zero-knowledge proof?',
        options: [
          'A proof that requires no knowledge to verify',
          'A method to prove a statement is true without revealing any information beyond its truth',
          'An empty mathematical proof',
          'A proof that something is impossible'
        ],
        correctAnswer: 1,
        explanation: 'ZK proofs let you prove you know a secret (like a password or solution) without revealing the secret itself — enabling privacy-preserving verification.',
        difficulty: 'medium',
        points: 25
      },
      {
        id: 'q2',
        question: 'How could ZK proofs benefit Mobius integrity verification?',
        options: [
          'They cannot benefit it',
          'They allow proving integrity compliance without exposing sensitive operational data',
          'They make the system faster',
          'They replace all other security measures'
        ],
        correctAnswer: 1,
        explanation: 'ZK proofs could let Mobius verify integrity compliance (e.g., "this agent followed constitutional rules") without revealing proprietary reasoning or user data.',
        difficulty: 'hard',
        points: 30
      },
      {
        id: 'q3',
        question: 'What are the three properties a zero-knowledge proof must satisfy?',
        options: [
          'Fast, cheap, secure',
          'Completeness, soundness, zero-knowledge',
          'Encryption, decryption, hashing',
          'Privacy, speed, accuracy'
        ],
        correctAnswer: 1,
        explanation: 'A ZK proof must be complete (true statements can be proven), sound (false statements cannot be proven), and zero-knowledge (reveals nothing beyond the statement\'s truth).',
        difficulty: 'hard',
        points: 30
      }
    ],
    completed: false,
    progress: 0
  },

  // ═══════════════════════════════════════════
  // APPLIED TECHNOLOGY (3)
  // ═══════════════════════════════════════════
  {
    id: 'cybersecurity-fundamentals',
    title: 'Cybersecurity Fundamentals',
    description: 'Learn threat modeling, attack surfaces, defense in depth, and how to think like a security engineer.',
    difficulty: 'intermediate',
    estimatedMinutes: 50,
    micReward: 85,
    topics: ['Cybersecurity', 'Threat Modeling', 'Defense', 'Risk Assessment'],
    questions: [
      {
        id: 'q1',
        question: 'What is "defense in depth"?',
        options: [
          'Having the deepest firewall',
          'Multiple layers of security so that if one fails, others still protect the system',
          'Only using one very strong defense',
          'Defending the deepest parts of the network first'
        ],
        correctAnswer: 1,
        explanation: 'Defense in depth uses multiple overlapping security layers — like castle walls, moats, and guards — so no single failure compromises the entire system.',
        difficulty: 'easy',
        points: 15
      },
      {
        id: 'q2',
        question: 'What is a zero-day vulnerability?',
        options: [
          'A vulnerability that was fixed in zero days',
          'A security flaw that is unknown to the vendor and has no patch available',
          'The first day a system is deployed',
          'A vulnerability that affects zero systems'
        ],
        correctAnswer: 1,
        explanation: 'Zero-day vulnerabilities are unknown to the vendor, giving them "zero days" to fix it. These are the most dangerous because no patches exist.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 'q3',
        question: 'How does threat modeling help in system design?',
        options: [
          'It makes systems look more secure',
          'It systematically identifies potential threats, attack vectors, and mitigations before deployment',
          'It automatically fixes vulnerabilities',
          'It replaces the need for testing'
        ],
        correctAnswer: 1,
        explanation: 'Threat modeling proactively identifies what can go wrong, who might attack, and how to mitigate — shifting security left in the development process.',
        difficulty: 'medium',
        points: 20
      }
    ],
    completed: false,
    progress: 0
  },
  {
    id: 'economics-of-attention',
    title: 'The Economics of Attention',
    description: 'Understand how attention economies work, why they matter for AI ethics, and how integrity-based systems offer an alternative.',
    difficulty: 'beginner',
    estimatedMinutes: 35,
    micReward: 55,
    topics: ['Attention Economy', 'AI Ethics', 'Design', 'Digital Wellness'],
    questions: [
      {
        id: 'q1',
        question: 'What is the "attention economy"?',
        options: [
          'An economy focused on education',
          'A system where human attention is the scarce commodity being monetized',
          'Paying attention to economics',
          'A new stock market'
        ],
        correctAnswer: 1,
        explanation: 'In the attention economy, companies compete for your limited attention because it can be converted to ad revenue — making YOU the product.',
        difficulty: 'easy',
        points: 10
      },
      {
        id: 'q2',
        question: 'How do recommendation algorithms exploit attention?',
        options: [
          'They show you what you need',
          'They optimize for engagement (time on platform) rather than user wellbeing',
          'They always show balanced content',
          'They are designed to educate'
        ],
        correctAnswer: 1,
        explanation: 'Most recommendation algorithms optimize for engagement metrics, which often means showing provocative or addictive content — misaligned with user wellbeing.',
        difficulty: 'medium',
        points: 15
      },
      {
        id: 'q3',
        question: 'How does Mobius offer an alternative to the attention economy?',
        options: [
          'It blocks all advertising',
          'It aligns incentives with learning and integrity rather than engagement extraction',
          'It limits screen time',
          'It removes all recommendations'
        ],
        correctAnswer: 1,
        explanation: 'MIC rewards learning and integrity-building actions instead of passive engagement — creating an economy where the incentive is genuine growth, not attention extraction.',
        difficulty: 'medium',
        points: 15
      }
    ],
    completed: false,
    progress: 0
  },
  {
    id: 'web3-decentralization',
    title: 'Web3 & Decentralization Principles',
    description: 'Understand decentralized architectures, DAOs, smart contracts, and how they relate to constitutional governance.',
    difficulty: 'intermediate',
    estimatedMinutes: 50,
    micReward: 85,
    topics: ['Web3', 'Decentralization', 'DAOs', 'Smart Contracts'],
    questions: [
      {
        id: 'q1',
        question: 'What is a DAO (Decentralized Autonomous Organization)?',
        options: [
          'A traditional company registered online',
          'An organization governed by smart contracts and token-holder voting instead of centralized management',
          'A type of AI',
          'A government agency'
        ],
        correctAnswer: 1,
        explanation: 'DAOs encode governance rules in smart contracts, enabling decentralized decision-making where participants vote on proposals — removing the need for centralized management.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 'q2',
        question: 'What makes smart contracts "smart"?',
        options: [
          'They use artificial intelligence',
          'They self-execute when predefined conditions are met, without intermediaries',
          'They are written by smart people',
          'They learn from experience'
        ],
        correctAnswer: 1,
        explanation: 'Smart contracts automatically execute agreed-upon terms when conditions are met — "code is law" — removing the need for trusted intermediaries.',
        difficulty: 'medium',
        points: 20
      },
      {
        id: 'q3',
        question: 'How does Mobius governance differ from typical Web3 projects?',
        options: [
          'It uses the same token-voting model',
          'It combines constitutional constraints with multi-agent sentinel oversight',
          'It avoids all decentralization',
          'It uses only human governance'
        ],
        correctAnswer: 1,
        explanation: 'Mobius goes beyond token-weighted voting by adding constitutional constraints and sentinel oversight — preventing plutocratic capture common in pure token-voting systems.',
        difficulty: 'hard',
        points: 25
      }
    ],
    completed: false,
    progress: 0
  }
];

// ═══════════════════════════════════════════════════
// MODULE CATEGORIES for filtering
// ═══════════════════════════════════════════════════

type ModuleCategory = 'all' | 'mobius' | 'mathematics' | 'cs' | 'ai' | 'physics' | 'science' | 'ethics' | 'applied';

const MODULE_CATEGORIES: { id: ModuleCategory; label: string; emoji: string }[] = [
  { id: 'all', label: 'All', emoji: '📚' },
  { id: 'mobius', label: 'Mobius Core', emoji: '🌀' },
  { id: 'mathematics', label: 'Mathematics', emoji: '📐' },
  { id: 'cs', label: 'Computer Science', emoji: '💻' },
  { id: 'ai', label: 'AI & ML', emoji: '🧠' },
  { id: 'physics', label: 'Physics & Systems', emoji: '⚛️' },
  { id: 'science', label: 'Life Sciences', emoji: '🧬' },
  { id: 'ethics', label: 'Ethics & Society', emoji: '⚖️' },
  { id: 'applied', label: 'Applied Tech', emoji: '🔧' },
];

function getModuleCategory(id: string): ModuleCategory {
  const categoryMap: Record<string, ModuleCategory> = {
    'constitutional-ai-101': 'mobius',
    'integrity-economics': 'mobius',
    'drift-suppression': 'mobius',
    'multi-agent-consensus': 'mobius',
    'three-covenants': 'mobius',
    'sentinel-architecture': 'mobius',
    'calculus-fundamentals': 'mathematics',
    'linear-algebra-ml': 'mathematics',
    'probability-statistics-ai': 'mathematics',
    'discrete-mathematics': 'mathematics',
    'algorithms-complexity': 'cs',
    'data-structures-fundamentals': 'cs',
    'cryptography-blockchain': 'cs',
    'distributed-systems': 'cs',
    'neural-networks-intro': 'ai',
    'transformers-attention': 'ai',
    'reinforcement-learning': 'ai',
    'natural-language-processing': 'ai',
    'computer-vision': 'ai',
    'quantum-computing-intro': 'physics',
    'network-theory-systems': 'physics',
    'information-theory': 'physics',
    'systems-thinking': 'physics',
    'molecular-biology-ai': 'science',
    'climate-science-ai': 'science',
    'bioinformatics-genomics': 'science',
    'ethics-of-ai': 'ethics',
    'game-theory': 'ethics',
    'cognitive-science': 'ethics',
    'zero-knowledge-proofs': 'ethics',
    'cybersecurity-fundamentals': 'applied',
    'economics-of-attention': 'applied',
    'web3-decentralization': 'applied',
  };
  return categoryMap[id] || 'all';
}

// ═══════════════════════════════════════════════════
// MIC LEVELING CONFIG — MIC is the sole reward/XP currency
// ═══════════════════════════════════════════════════

const MIC_PER_LEVEL = 200;          // MIC needed per level
const STREAK_BONUS_RATE = 0.05;     // 5% of base per streak step (capped at 10)
const PERFECT_BONUS_RATE = 0.15;    // 15% bonus for 100% accuracy
const MIN_ACCURACY_THRESHOLD = 0.50; // Minimum 50% to earn MIC

function micToLevel(totalMic: number): number {
  return Math.floor(totalMic / MIC_PER_LEVEL) + 1;
}

function micInCurrentLevel(totalMic: number): number {
  return totalMic % MIC_PER_LEVEL;
}

function micToNextLevel(totalMic: number): number {
  return MIC_PER_LEVEL - micInCurrentLevel(totalMic);
}

// Initial user progress state
const INITIAL_PROGRESS: UserLearningProgress = {
  totalMicEarned: 0,
  modulesCompleted: 0,
  currentStreak: 0,
  bestStreak: 0,
  totalLearningMinutes: 0,
  totalCorrect: 0,
  totalQuestions: 0,
  level: 1,
};

// ═══════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════

export const LearningProgressTracker: React.FC = () => {
  const { user } = useAuth();
  const { earnMIC, refreshWallet } = useWallet();
  const { addNode, addEdge, extractAndAddConcepts } = useKnowledgeGraph();
  
  const [modules, setModules] = useState<LearningModule[]>(LEARNING_MODULES);
  const [userProgress, setUserProgress] = useState<UserLearningProgress>(INITIAL_PROGRESS);
  const [activeModule, setActiveModule] = useState<LearningModule | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ModuleCategory>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

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

  // Filtered modules
  const filteredModules = useMemo(() => {
    return modules.filter(m => {
      // Category filter
      if (selectedCategory !== 'all' && getModuleCategory(m.id) !== selectedCategory) return false;
      // Difficulty filter
      if (selectedDifficulty !== 'all' && m.difficulty !== selectedDifficulty) return false;
      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          m.title.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          m.topics.some(t => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [modules, selectedCategory, selectedDifficulty, searchQuery]);

  // Stats
  const totalModules = modules.length;
  const completedCount = modules.filter(m => m.completed).length;
  const totalAvailableMIC = modules.reduce((sum, m) => sum + m.micReward, 0);
  const completionPct = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;

  const startModule = (module: LearningModule) => {
    setActiveModule(module);
    setShowQuiz(true);
  };

  const handleQuizComplete = async (accuracy: number, atlasAssistBonus: number = 0) => {
    if (!activeModule) return;

    // ═══ MIC Reward Calculation ═══
    // MIC is the SOLE reward currency — no separate XP
    const correctCount = Math.round(accuracy * activeModule.questions.length);
    const accuracyMultiplier = Math.max(accuracy, MIN_ACCURACY_THRESHOLD);
    const baseMic = Math.round(activeModule.micReward * accuracyMultiplier);

    // Streak bonus: 5% per consecutive correct (capped at 10)
    const streakForBonus = Math.min(userProgress.currentStreak + 1, 10);
    const streakBonus = streakForBonus >= 2
      ? Math.round(activeModule.micReward * STREAK_BONUS_RATE * (streakForBonus - 1))
      : 0;

    // Perfect score bonus: 15% extra
    const perfectBonus = accuracy === 1.0 ? Math.round(activeModule.micReward * PERFECT_BONUS_RATE) : 0;

    // ATLAS Assist bonus: earned by getting questions right after ATLAS reframe
    const atlasBonus = atlasAssistBonus;

    const totalMicEarned = baseMic + streakBonus + perfectBonus + atlasBonus;

    // Update module status
    const alreadyCompleted = modules.find(m => m.id === activeModule.id)?.completed ?? false;
    const updatedModules = modules.map(m => 
      m.id === activeModule.id 
        ? { ...m, completed: true, progress: 100, completedAt: new Date().toISOString() }
        : m
    );
    setModules(updatedModules);

    // ═══ Level is derived from cumulative MIC ═══
    const newTotalMic = userProgress.totalMicEarned + totalMicEarned;
    const previousLevel = userProgress.level;
    const newLevel = micToLevel(newTotalMic);
    const leveledUp = newLevel > previousLevel;

    const newStreak = userProgress.currentStreak + 1;
    const newBestStreak = Math.max(userProgress.bestStreak, newStreak);

    // Update user progress — MIC drives everything
    const newProgress: UserLearningProgress = {
      totalMicEarned: newTotalMic,
      modulesCompleted: userProgress.modulesCompleted + (alreadyCompleted ? 0 : 1),
      currentStreak: newStreak,
      bestStreak: newBestStreak,
      totalLearningMinutes: userProgress.totalLearningMinutes + activeModule.estimatedMinutes,
      totalCorrect: userProgress.totalCorrect + correctCount,
      totalQuestions: userProgress.totalQuestions + activeModule.questions.length,
      level: newLevel,
      lastActivityDate: new Date().toISOString()
    };
    setUserProgress(newProgress);

    // Save to localStorage
    saveProgress(newProgress, updatedModules);

    // Knowledge Graph Integration
    try {
      activeModule.topics.forEach(topic => {
        addNode({
          label: topic,
          type: 'concept',
          domain: 'learning',
        }, `learning-${activeModule.id}`);
      });

      for (let i = 0; i < activeModule.topics.length; i++) {
        for (let j = i + 1; j < activeModule.topics.length; j++) {
          const sourceId = activeModule.topics[i].toLowerCase().replace(/[^a-z0-9]+/g, '-');
          const targetId = activeModule.topics[j].toLowerCase().replace(/[^a-z0-9]+/g, '-');
          addEdge(sourceId, targetId, 'co-occurs', `learning-${activeModule.id}`);
        }
      }

      extractAndAddConcepts(
        `${activeModule.title} ${activeModule.description}`,
        'learning',
        `learning-${activeModule.id}`
      );
    } catch (graphError) {
      console.warn('Failed to update knowledge graph:', graphError);
    }

    // Earn MIC and sync to wallet
    if (user) {
      const success = await earnMIC('learning_module_completion', {
        module_id: activeModule.id,
        module_title: activeModule.title,
        accuracy,
        mic_earned: totalMicEarned,
        base_mic: baseMic,
        streak_bonus: streakBonus,
        perfect_bonus: perfectBonus,
        atlas_assist_bonus: atlasBonus,
        perfect_score: accuracy === 1.0,
        difficulty: activeModule.difficulty,
        base_reward: activeModule.micReward,
        streak: newStreak,
        level: newLevel,
        leveled_up: leveledUp,
      });
      
      if (success) {
        console.log('MIC earned successfully:', totalMicEarned, leveledUp ? `(LEVEL UP to ${newLevel}!)` : '');
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
      {/* ═══ User Progress Dashboard ═══ */}
      <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
            Your Learning Journey
          </h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-400 rounded-lg">
              <Sparkles className="w-4 h-4 text-stone-900" />
              <span className="font-bold text-stone-900">
                Level {userProgress.level}
              </span>
            </div>
            <span className="text-xs px-2 py-1 bg-yellow-300/60 text-yellow-800 rounded-full font-medium">
              TESTNET
            </span>
          </div>
        </div>

        {/* MIC Hero Stat */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border-2 border-amber-300 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-stone-500 uppercase tracking-wide font-medium mb-1">Total MIC Earned</div>
              <div className="text-3xl sm:text-4xl font-bold text-amber-500 flex items-center gap-2">
                <Award className="w-7 h-7 sm:w-8 sm:h-8" />
                {userProgress.totalMicEarned.toLocaleString()}
              </div>
              <div className="text-xs text-stone-400 mt-1">
                Mobius Integrity Credits — your learning drives your value
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-xs text-stone-400 mb-0.5">Accuracy</div>
              <div className="text-lg font-bold text-stone-700">
                {userProgress.totalQuestions > 0
                  ? `${Math.round((userProgress.totalCorrect / userProgress.totalQuestions) * 100)}%`
                  : '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg p-3 border border-stone-200">
            <div className="text-xs text-stone-500 mb-1">Modules</div>
            <div className="text-lg sm:text-xl font-bold text-emerald-600">
              {completedCount}/{totalModules}
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-stone-200">
            <div className="text-xs text-stone-500 mb-1">Streak</div>
            <div className="text-lg sm:text-xl font-bold text-orange-500 flex items-center gap-1">
              {userProgress.currentStreak}
              {userProgress.currentStreak > 0 && <Flame className="w-4 h-4" />}
              {userProgress.bestStreak > userProgress.currentStreak && (
                <span className="text-xs font-normal text-stone-400 ml-1">best: {userProgress.bestStreak}</span>
              )}
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-stone-200">
            <div className="text-xs text-stone-500 mb-1">Learning Time</div>
            <div className="text-lg sm:text-xl font-bold text-blue-600">
              {userProgress.totalLearningMinutes >= 60
                ? `${Math.floor(userProgress.totalLearningMinutes / 60)}h ${userProgress.totalLearningMinutes % 60}m`
                : `${userProgress.totalLearningMinutes}m`
              }
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-stone-200">
            <div className="text-xs text-stone-500 mb-1">Completion</div>
            <div className="text-lg sm:text-xl font-bold text-violet-600">
              {completionPct}%
            </div>
          </div>
        </div>

        {/* MIC Level Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs sm:text-sm text-stone-600 mb-2">
            <span className="flex items-center gap-1.5 font-medium">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              Level {userProgress.level}
            </span>
            <span className="text-stone-400">
              {micInCurrentLevel(userProgress.totalMicEarned)}/{MIC_PER_LEVEL} MIC to Level {userProgress.level + 1}
            </span>
          </div>
          <div className="w-full bg-stone-200 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 rounded-full transition-all duration-700 ease-out relative"
              style={{ width: `${(micInCurrentLevel(userProgress.totalMicEarned) / MIC_PER_LEVEL) * 100}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>
          </div>
          <div className="text-xs text-stone-400 mt-1 text-center">
            {micToNextLevel(userProgress.totalMicEarned)} MIC until next level
          </div>
        </div>
      </div>

      {/* ═══ Filters & Search ═══ */}
      <div className="space-y-3">
        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {MODULE_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all
                ${selectedCategory === cat.id
                  ? 'bg-stone-900 text-white'
                  : 'bg-white border border-stone-200 text-stone-600 hover:border-stone-300'
                }
              `}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Search + Difficulty Filter Row */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search modules, topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-200"
            />
          </div>
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-3 py-2 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-amber-300 text-stone-700"
          >
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      {/* ═══ Learning Modules Grid ═══ */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-500" />
            {selectedCategory === 'all' ? 'All Modules' : MODULE_CATEGORIES.find(c => c.id === selectedCategory)?.label}
            <span className="text-sm font-normal text-stone-400">
              ({filteredModules.length})
            </span>
          </h3>
        </div>

        {filteredModules.length === 0 ? (
          <div className="text-center py-12 text-stone-400">
            <Search className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No modules match your search.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredModules.map((module) => (
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
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
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
                  <div className="flex items-center gap-1.5 text-amber-500 font-medium">
                    <Award className="w-4 h-4" />
                    <span>up to {Math.round(module.micReward * (1 + PERFECT_BONUS_RATE))} MIC</span>
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
                    <div className="flex items-center gap-2">
                      {module.completedAt && (
                        <div className="text-xs text-stone-500">
                          {new Date(module.completedAt).toLocaleDateString()}
                        </div>
                      )}
                      <button
                        onClick={() => startModule(module)}
                        className="text-xs px-2 py-1 bg-white border border-stone-200 rounded text-stone-600 hover:bg-stone-50 transition-colors"
                      >
                        Retake
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ Footer Info ═══ */}
      <div className="space-y-3">
        {/* Login prompt */}
        {!user && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
            <p className="text-blue-800 text-sm">
              <strong>Note:</strong> Log in to earn real MIC rewards for completing modules!
            </p>
          </div>
        )}

        {/* Testnet info */}
        <div className="text-center text-xs text-stone-400 space-y-1">
          <p>🧪 Testnet Mode — MIC earned locally. Each correct answer earns real Mobius Integrity Credits.</p>
          <p>On mainnet, MIC backs your reputation, unlocks features, and reflects verified learning.</p>
          <p className="text-stone-300 mt-2">
            {totalModules} modules • {modules.reduce((s, m) => s + m.questions.length, 0)} questions • {totalAvailableMIC}+ MIC available
          </p>
        </div>
      </div>
    </div>
  );
};

export default LearningProgressTracker;
