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
  // ===================
  // CORE MOBIUS MODULES (5)
  // ===================
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
  },
  
  // ===================
  // STEM: MATHEMATICS (3)
  // ===================
  {
    id: 'calculus-fundamentals',
    title: 'Calculus I: Limits and Derivatives',
    description: 'Master the foundational concepts of calculus including limits, continuity, and differentiation. Learn how rates of change power modern AI and optimization.',
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
    description: 'Understand matrices, vectors, and transformations that power modern AI systems. Learn how neural networks use linear algebra at their core.',
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
      }
    ],
    completed: false,
    progress: 0
  },
  {
    id: 'probability-statistics-ai',
    title: 'Probability & Statistics for AI',
    description: "Master probability theory and statistical methods that underpin machine learning, from Bayes' theorem to confidence intervals.",
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
        explanation: "Bayes' theorem mathematically describes how to update probability estimates as new evidence becomes available - fundamental to AI reasoning.",
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
      }
    ],
    completed: false,
    progress: 0
  },
  
  // ===================
  // STEM: COMPUTER SCIENCE (3)
  // ===================
  {
    id: 'algorithms-complexity',
    title: 'Algorithms & Complexity Theory',
    description: 'Learn algorithmic thinking, Big O notation, and computational complexity. Understand why some problems are hard and how to design efficient solutions.',
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
      }
    ],
    completed: false,
    progress: 0
  },
  {
    id: 'data-structures-fundamentals',
    title: 'Data Structures Fundamentals',
    description: 'Master essential data structures: arrays, linked lists, trees, graphs, hash tables. Learn when and why to use each structure.',
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
        explanation: 'Hash tables provide O(1) average-case lookup, insertion, and deletion - making them ideal for caches, databases, and dictionaries.',
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
      }
    ],
    completed: false,
    progress: 0
  },
  {
    id: 'cryptography-blockchain',
    title: 'Cryptography & Blockchain Fundamentals',
    description: 'Understand cryptographic primitives, hash functions, public-key cryptography, and how blockchains ensure integrity and decentralization.',
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
        explanation: 'BFT systems can reach consensus even when up to 1/3 of nodes are malicious - this mathematical guarantee is crucial for integrity-backed currencies like MIC.',
        difficulty: 'hard',
        points: 30
      }
    ],
    completed: false,
    progress: 0
  },
  
  // ===================
  // STEM: ARTIFICIAL INTELLIGENCE (3)
  // ===================
  {
    id: 'neural-networks-intro',
    title: 'Introduction to Neural Networks',
    description: 'Understand how artificial neural networks learn from data. Master backpropagation, activation functions, and network architectures.',
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
        explanation: "Dropout randomly disables neurons during training, forcing the network to learn robust features that don't depend on any single neuron - reducing overfitting.",
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
    description: 'Learn the architecture behind GPT, BERT, and Claude. Understand self-attention, positional encoding, and why transformers revolutionized AI.',
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
      }
    ],
    completed: false,
    progress: 0
  },
  {
    id: 'reinforcement-learning',
    title: 'Reinforcement Learning Fundamentals',
    description: 'Master RL concepts: agents, environments, rewards, Q-learning, policy gradients. Learn how AI systems learn optimal behavior through trial and error.',
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
        explanation: 'In Mobius, MIC rewards create RL-like dynamics where agents (users, AI systems) learn behaviors that maintain system integrity through feedback loops.',
        difficulty: 'hard',
        points: 30
      }
    ],
    completed: false,
    progress: 0
  },
  
  // ===================
  // STEM: PHYSICS & ENGINEERING (3)
  // ===================
  {
    id: 'quantum-computing-intro',
    title: 'Quantum Computing Fundamentals',
    description: 'Introduction to qubits, superposition, entanglement, and quantum algorithms. Understand how quantum computers will impact AI and cryptography.',
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
      }
    ],
    completed: false,
    progress: 0
  },
  {
    id: 'network-theory-systems',
    title: 'Network Theory & Complex Systems',
    description: 'Study how networks behave, from social graphs to neural networks. Learn about emergence, scale-free networks, and system dynamics.',
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
        explanation: 'Scale-free networks have a few highly connected hubs and many nodes with few connections - seen in the web, social networks, and protein interactions.',
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
        explanation: 'In Mobius, integrity creates network effects: as more nodes maintain high integrity, the Global Integrity Index rises, rewarding everyone - a regenerative feedback loop.',
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
    description: 'Learn Shannon entropy, information content, compression, and how information theory connects to AI, cryptography, and thermodynamics.',
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
        explanation: 'Shannon entropy quantifies the average information content or uncertainty in a random variable - fundamental to compression, cryptography, and ML.',
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
        explanation: 'Cross-entropy loss measures how well predicted probabilities match true labels - a direct application of information theory to machine learning.',
        difficulty: 'hard',
        points: 25
      }
    ],
    completed: false,
    progress: 0
  },
  
  // ===================
  // STEM: SCIENCE (3)
  // ===================
  {
    id: 'molecular-biology-ai',
    title: 'Molecular Biology & AI Applications',
    description: 'Understand DNA, proteins, and cellular systems. Learn how AI is revolutionizing drug discovery, protein folding, and genomics.',
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
        explanation: 'AlphaFold solved the 50-year protein folding problem using AI, enabling researchers to predict protein structures that took decades to determine experimentally.',
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
        explanation: 'CRISPR enables precise, targeted gene editing using RNA-guided enzymes, opening possibilities for treating genetic diseases and advancing biotechnology.',
        difficulty: 'medium',
        points: 20
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
        explanation: 'AI/ML helps identify non-linear patterns in climate data, improve parameterization of physical models, and increase prediction accuracy for regional climate impacts.',
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
        explanation: 'The Ecology Covenant ensures Mobius systems are regenerative by design - creating positive environmental feedback loops rather than extractive ones.',
        difficulty: 'hard',
        points: 25
      }
    ],
    completed: false,
    progress: 0
  },
  {
    id: 'bioinformatics-genomics',
    title: 'Bioinformatics & Genomic Analysis',
    description: 'Explore computational approaches to biological data, genome sequencing, and how AI accelerates biomedical research.',
    difficulty: 'advanced',
    estimatedMinutes: 65,
    micReward: 115,
    topics: ['Bioinformatics', 'Genomics', 'AI', 'Data Science', 'Healthcare'],
    questions: [
      {
        id: 'q1',
        question: 'What is the primary goal of sequence alignment in bioinformatics?',
        options: [
          'To make DNA look nicer',
          'To identify similarities and evolutionary relationships between sequences',
          'To speed up gene sequencing',
          'To store genetic data efficiently'
        ],
        correctAnswer: 1,
        explanation: 'Sequence alignment identifies regions of similarity between DNA, RNA, or protein sequences, revealing functional, structural, or evolutionary relationships.',
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
        explanation: 'AI dramatically accelerates early-stage drug discovery by screening millions of compounds virtually, predicting protein interactions, and identifying promising candidates for synthesis.',
        difficulty: 'hard',
        points: 30
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

    // ============================================
    // 🔥 CRITICAL: Earn MIC and sync to wallet
    // This writes to the MIC ledger and refreshes wallet
    // ============================================
    if (user) {
      console.log('📝 Writing MIC to ledger:', {
        module: activeModule.id,
        mic_earned: totalMicEarned,
        accuracy
      });
      
      const success = await earnMIC('learning_module_completion', {
        module_id: activeModule.id,
        module_title: activeModule.title,
        accuracy: accuracy,
        mic_earned: totalMicEarned,
        perfect_score: accuracy === 1.0,
        difficulty: activeModule.difficulty,
        base_reward: activeModule.micReward,
        streak: userProgress.currentStreak
      });
      
      if (success) {
        console.log('✅ MIC earned successfully, wallet will refresh');
        // Wallet refresh is already triggered by earnMIC
      } else {
        console.warn('⚠️ MIC earning may have failed - wallet may not reflect new balance');
      }
    } else {
      console.log('ℹ️ User not logged in - MIC earned locally only (not persisted to ledger)');
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
