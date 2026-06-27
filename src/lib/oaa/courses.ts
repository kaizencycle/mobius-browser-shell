// src/lib/oaa/courses.ts — C-355 OAA Seminar Course Catalog

export type CourseSubject =
  | 'Civics'
  | 'AI'
  | 'Economics'
  | 'Game Theory'
  | 'Governance'
  | 'Philosophy'
  | 'Systems'
  | 'Tradecraft';

export type CourseDifficulty = 'intro' | 'intermediate' | 'advanced';

export type CourseProvider = 'youtube' | 'vimeo' | 'dailymotion';

export interface CourseVideo {
  id: string;
  title: string;
  provider: CourseProvider;
  embedUrl: string;
  subject: CourseSubject;
  category: string;
  difficulty: CourseDifficulty;
  durationSeconds: number;
  tags: string[];
  sourceCredit: string;
  professorName?: string;
  institution?: string;
  transcript?: string;
  quizId: string;
}

export interface QuizQuestion {
  id: string;
  text: string;
  type: 'multiple_choice' | 'short_answer';
  options?: string[];
  correctAnswer: string;
  weight: number;
}

export interface Quiz {
  id: string;
  courseId: string;
  passThreshold: number;
  questions: QuizQuestion[];
}

export const courses: CourseVideo[] = [
  // ── Economics / Game Theory ─────────────────────────────────────────────
  {
    id: 'econ-001',
    title: 'What Is Game Theory?',
    provider: 'youtube',
    embedUrl: 'https://www.youtube.com/embed/MHS-htjGgSY',
    subject: 'Game Theory',
    category: 'Game Theory',
    difficulty: 'intro',
    durationSeconds: 195,
    tags: ['game theory', 'incentives', 'strategy', 'economics', 'nash equilibrium'],
    sourceCredit: 'Yale Open Courses',
    professorName: 'Ben Polak',
    institution: 'Yale University',
    quizId: 'quiz-econ-001',
  },
  {
    id: 'econ-002',
    title: "Goodhart's Law & the Limits of Metrics",
    provider: 'youtube',
    embedUrl: 'https://www.youtube.com/embed/0ybNe1lPEMo',
    subject: 'Economics',
    category: 'Behavioral Economics',
    difficulty: 'intro',
    durationSeconds: 210,
    tags: ['goodhart', 'metrics', 'incentives', 'governance', 'optimization'],
    sourceCredit: 'Veritasium',
    professorName: 'Derek Muller',
    quizId: 'quiz-econ-002',
  },
  {
    id: 'econ-003',
    title: 'Public Goods & the Free-Rider Problem',
    provider: 'youtube',
    embedUrl: 'https://www.youtube.com/embed/BPZH9WC6bqw',
    subject: 'Economics',
    category: 'Public Economics',
    difficulty: 'intro',
    durationSeconds: 240,
    tags: ['public goods', 'free rider', 'collective action', 'governance', 'markets'],
    sourceCredit: 'Marginal Revolution University',
    professorName: 'Tyler Cowen',
    institution: 'George Mason University',
    quizId: 'quiz-econ-003',
  },
  // ── Civics / Governance ──────────────────────────────────────────────────
  {
    id: 'gov-001',
    title: 'How Democratic Institutions Erode',
    provider: 'youtube',
    embedUrl: 'https://www.youtube.com/embed/KCIxKbJDNmQ',
    subject: 'Civics',
    category: 'Democratic Theory',
    difficulty: 'intro',
    durationSeconds: 270,
    tags: ['democracy', 'institutions', 'governance', 'civic integrity', 'erosion'],
    sourceCredit: 'TED-Ed',
    quizId: 'quiz-gov-001',
  },
  {
    id: 'gov-002',
    title: 'The Prisoner\'s Dilemma & Cooperation',
    provider: 'youtube',
    embedUrl: 'https://www.youtube.com/embed/t9Lo2fgxWHw',
    subject: 'Game Theory',
    category: 'Cooperation Theory',
    difficulty: 'intro',
    durationSeconds: 200,
    tags: ["prisoner's dilemma", 'cooperation', 'game theory', 'incentives', 'trust'],
    sourceCredit: 'TED-Ed',
    quizId: 'quiz-gov-002',
  },
  {
    id: 'gov-003',
    title: 'Regulatory Capture Explained',
    provider: 'youtube',
    embedUrl: 'https://www.youtube.com/embed/M_OoboAkk88',
    subject: 'Governance',
    category: 'Political Economy',
    difficulty: 'intermediate',
    durationSeconds: 220,
    tags: ['regulatory capture', 'governance', 'markets', 'corruption', 'power'],
    sourceCredit: 'Economics Explained',
    quizId: 'quiz-gov-003',
  },
  // ── AI / Alignment ────────────────────────────────────────────────────────
  {
    id: 'ai-001',
    title: 'What Is AI Alignment?',
    provider: 'youtube',
    embedUrl: 'https://www.youtube.com/embed/pYXy-A4siMw',
    subject: 'AI',
    category: 'AI Safety',
    difficulty: 'intro',
    durationSeconds: 240,
    tags: ['ai alignment', 'safety', 'values', 'goals', 'constitutional ai'],
    sourceCredit: '80,000 Hours',
    quizId: 'quiz-ai-001',
  },
  {
    id: 'ai-002',
    title: 'How Large Language Models Work',
    provider: 'youtube',
    embedUrl: 'https://www.youtube.com/embed/zjkBMFhNj_g',
    subject: 'AI',
    category: 'Machine Learning',
    difficulty: 'intro',
    durationSeconds: 270,
    tags: ['llm', 'transformer', 'language model', 'ai', 'machine learning'],
    sourceCredit: 'Andrej Karpathy',
    professorName: 'Andrej Karpathy',
    quizId: 'quiz-ai-002',
  },
  {
    id: 'ai-003',
    title: 'Multi-Agent Systems & Emergent Behavior',
    provider: 'youtube',
    embedUrl: 'https://www.youtube.com/embed/Gg5GqB_xvFo',
    subject: 'AI',
    category: 'Multi-Agent AI',
    difficulty: 'intermediate',
    durationSeconds: 210,
    tags: ['multi-agent', 'emergence', 'coordination', 'ai', 'consensus'],
    sourceCredit: 'MIT OpenCourseWare',
    institution: 'MIT',
    quizId: 'quiz-ai-003',
  },
  // ── Systems / Philosophy ──────────────────────────────────────────────────
  {
    id: 'sys-001',
    title: 'Feedback Loops & Systems Thinking',
    provider: 'youtube',
    embedUrl: 'https://www.youtube.com/embed/TPWV6OaLNqM',
    subject: 'Systems',
    category: 'Systems Theory',
    difficulty: 'intro',
    durationSeconds: 200,
    tags: ['feedback loops', 'systems thinking', 'complexity', 'emergence', 'design'],
    sourceCredit: 'Systems Innovation',
    quizId: 'quiz-sys-001',
  },
  {
    id: 'sys-002',
    title: 'Power, Authority & Legitimate Governance',
    provider: 'youtube',
    embedUrl: 'https://www.youtube.com/embed/3TQ_Y2AWE8o',
    subject: 'Philosophy',
    category: 'Political Philosophy',
    difficulty: 'intro',
    durationSeconds: 230,
    tags: ['power', 'authority', 'governance', 'justice', 'philosophy'],
    sourceCredit: 'CrashCourse',
    professorName: 'Hank Green',
    quizId: 'quiz-sys-002',
  },
  {
    id: 'sys-003',
    title: 'Information Theory in 5 Minutes',
    provider: 'youtube',
    embedUrl: 'https://www.youtube.com/embed/2s3aJfRr9gE',
    subject: 'Systems',
    category: 'Information Theory',
    difficulty: 'intro',
    durationSeconds: 185,
    tags: ['information theory', 'entropy', 'shannon', 'data', 'complexity'],
    sourceCredit: 'Socratica',
    quizId: 'quiz-sys-003',
  },
  // ── Tradecraft ────────────────────────────────────────────────────────────
  {
    id: 'trade-001',
    title: 'How to Think Critically in the Age of AI',
    provider: 'youtube',
    embedUrl: 'https://www.youtube.com/embed/dItUGF8GdTw',
    subject: 'Tradecraft',
    category: 'Critical Thinking',
    difficulty: 'intro',
    durationSeconds: 220,
    tags: ['critical thinking', 'ai', 'reasoning', 'epistemology', 'cognition'],
    sourceCredit: 'TED',
    quizId: 'quiz-trade-001',
  },
  {
    id: 'trade-002',
    title: 'Network Effects & Platform Power',
    provider: 'youtube',
    embedUrl: 'https://www.youtube.com/embed/OVbRfG6DYZE',
    subject: 'Economics',
    category: 'Platform Economics',
    difficulty: 'intermediate',
    durationSeconds: 200,
    tags: ['network effects', 'platforms', 'economics', 'power', 'markets'],
    sourceCredit: 'a16z',
    quizId: 'quiz-trade-002',
  },
  {
    id: 'trade-003',
    title: 'Attention Economy & Cognitive Sovereignty',
    provider: 'youtube',
    embedUrl: 'https://www.youtube.com/embed/1PogM__b4oc',
    subject: 'Philosophy',
    category: 'Digital Philosophy',
    difficulty: 'intro',
    durationSeconds: 240,
    tags: ['attention economy', 'cognition', 'sovereignty', 'design', 'focus'],
    sourceCredit: 'Center for Humane Technology',
    quizId: 'quiz-trade-003',
  },
];

export const quizzes: Quiz[] = [
  {
    id: 'quiz-econ-001',
    courseId: 'econ-001',
    passThreshold: 0.8,
    questions: [
      {
        id: 'q1',
        text: 'A Nash Equilibrium is a state where:',
        type: 'multiple_choice',
        options: [
          'All players win the game',
          'No player can improve by unilaterally changing their strategy',
          'One player dominates all others',
          'The game ends in a draw',
        ],
        correctAnswer: 'B',
        weight: 1,
      },
      {
        id: 'q2',
        text: 'In Game Theory, a "dominant strategy" is one that:',
        type: 'multiple_choice',
        options: [
          'Guarantees the highest payoff regardless of what others do',
          'Always leads to cooperation',
          'Depends entirely on other players\' choices',
          'Only works in two-player games',
        ],
        correctAnswer: 'A',
        weight: 1,
      },
      {
        id: 'q3',
        text: 'What does Game Theory primarily study?',
        type: 'multiple_choice',
        options: [
          'How to win video games',
          'Strategic decision-making between rational agents',
          'The mathematics of random chance',
          'Economic market pricing',
        ],
        correctAnswer: 'B',
        weight: 1,
      },
    ],
  },
  {
    id: 'quiz-econ-002',
    courseId: 'econ-002',
    passThreshold: 0.8,
    questions: [
      {
        id: 'q1',
        text: "Goodhart's Law states that:",
        type: 'multiple_choice',
        options: [
          'Markets are always efficient',
          'When a measure becomes a target, it ceases to be a good measure',
          'Good intentions produce good outcomes',
          'Metrics always improve performance',
        ],
        correctAnswer: 'B',
        weight: 1,
      },
      {
        id: 'q2',
        text: 'Which is the best example of Goodhart\'s Law in practice?',
        type: 'multiple_choice',
        options: [
          'A student learning deeply to pass an exam',
          'A company optimizing for clicks instead of user satisfaction',
          'A government reducing actual crime rates',
          'A scientist publishing accurate research',
        ],
        correctAnswer: 'B',
        weight: 1,
      },
      {
        id: 'q3',
        text: 'The key danger of Goodhart\'s Law for AI systems is:',
        type: 'multiple_choice',
        options: [
          'AI cannot track metrics',
          'AI optimizes for measurable proxies instead of true intended goals',
          'AI moves too slowly',
          'Metrics require too much computing power',
        ],
        correctAnswer: 'B',
        weight: 1,
      },
    ],
  },
  {
    id: 'quiz-econ-003',
    courseId: 'econ-003',
    passThreshold: 0.8,
    questions: [
      {
        id: 'q1',
        text: 'A public good is characterized by being:',
        type: 'multiple_choice',
        options: [
          'Expensive and scarce',
          'Non-excludable and non-rivalrous',
          'Produced only by governments',
          'Available only to paying members',
        ],
        correctAnswer: 'B',
        weight: 1,
      },
      {
        id: 'q2',
        text: 'The free-rider problem occurs when:',
        type: 'multiple_choice',
        options: [
          'People pay too much for public goods',
          'People benefit from public goods without contributing to their cost',
          'Goods are distributed unfairly',
          'Markets produce too much of a good',
        ],
        correctAnswer: 'B',
        weight: 1,
      },
      {
        id: 'q3',
        text: 'Which mechanism can help solve the free-rider problem?',
        type: 'multiple_choice',
        options: [
          'Eliminating the public good',
          'Privatizing everything',
          'Creating systems that reward contribution and trace behavior',
          'Raising prices',
        ],
        correctAnswer: 'C',
        weight: 1,
      },
    ],
  },
  {
    id: 'quiz-gov-001',
    courseId: 'gov-001',
    passThreshold: 0.8,
    questions: [
      {
        id: 'q1',
        text: 'Which is an early warning sign of democratic erosion?',
        type: 'multiple_choice',
        options: [
          'Free and fair elections',
          'Independent judiciary being weakened',
          'Active civil society',
          'Free press',
        ],
        correctAnswer: 'B',
        weight: 1,
      },
      {
        id: 'q2',
        text: 'Democratic backsliding often happens:',
        type: 'multiple_choice',
        options: [
          'Only through military coups',
          'Gradually through legal but anti-democratic means',
          'Only in poor countries',
          'Overnight and suddenly',
        ],
        correctAnswer: 'B',
        weight: 1,
      },
      {
        id: 'q3',
        text: 'What best protects democratic institutions long-term?',
        type: 'multiple_choice',
        options: [
          'Strong individual leaders',
          'Distributed power with checks and balances',
          'Economic growth',
          'Military strength',
        ],
        correctAnswer: 'B',
        weight: 1,
      },
    ],
  },
  {
    id: 'quiz-gov-002',
    courseId: 'gov-002',
    passThreshold: 0.8,
    questions: [
      {
        id: 'q1',
        text: 'In the Prisoner\'s Dilemma, the dominant strategy for each player is to:',
        type: 'multiple_choice',
        options: ['Cooperate', 'Defect', 'Flip a coin', 'Follow the other player'],
        correctAnswer: 'B',
        weight: 1,
      },
      {
        id: 'q2',
        text: 'The Prisoner\'s Dilemma demonstrates that:',
        type: 'multiple_choice',
        options: [
          'Rational self-interest always produces good collective outcomes',
          'Rational self-interest can produce collectively bad outcomes',
          'Cooperation is always irrational',
          'Competition always wins',
        ],
        correctAnswer: 'B',
        weight: 1,
      },
      {
        id: 'q3',
        text: 'Repeated interactions (iterated Prisoner\'s Dilemma) tend to:',
        type: 'multiple_choice',
        options: [
          'Always produce defection',
          'Favor cooperation as reputation and trust develop',
          'Have no effect on outcomes',
          'Favor the stronger player',
        ],
        correctAnswer: 'B',
        weight: 1,
      },
    ],
  },
  {
    id: 'quiz-gov-003',
    courseId: 'gov-003',
    passThreshold: 0.8,
    questions: [
      {
        id: 'q1',
        text: 'Regulatory capture occurs when:',
        type: 'multiple_choice',
        options: [
          'The government regulates too many industries',
          'Regulated industries gain control over the agencies meant to oversee them',
          'Regulations are too strict',
          'Companies follow all regulations perfectly',
        ],
        correctAnswer: 'B',
        weight: 1,
      },
      {
        id: 'q2',
        text: 'Which industry is a classic example of regulatory capture?',
        type: 'multiple_choice',
        options: [
          'Education',
          'Financial services lobbying financial regulators',
          'Farming',
          'Healthcare',
        ],
        correctAnswer: 'B',
        weight: 1,
      },
      {
        id: 'q3',
        text: 'The best structural defense against regulatory capture is:',
        type: 'multiple_choice',
        options: [
          'Having no regulations',
          'Transparency, independence, and multi-stakeholder oversight',
          'Letting industries self-regulate',
          'Rotating all regulators annually',
        ],
        correctAnswer: 'B',
        weight: 1,
      },
    ],
  },
  {
    id: 'quiz-ai-001',
    courseId: 'ai-001',
    passThreshold: 0.8,
    questions: [
      {
        id: 'q1',
        text: 'AI alignment is primarily concerned with:',
        type: 'multiple_choice',
        options: [
          'Making AI faster',
          'Ensuring AI systems pursue goals that match human values and intentions',
          'Aligning AI code formatting',
          'Getting AI systems to agree with each other',
        ],
        correctAnswer: 'B',
        weight: 1,
      },
      {
        id: 'q2',
        text: 'The "specification problem" in AI alignment refers to:',
        type: 'multiple_choice',
        options: [
          'AI systems needing more memory',
          'The difficulty of fully specifying what we actually want from AI',
          'Writing better software documentation',
          'Making AI faster to train',
        ],
        correctAnswer: 'B',
        weight: 1,
      },
      {
        id: 'q3',
        text: 'Constitutional AI approaches alignment by:',
        type: 'multiple_choice',
        options: [
          'Letting AI do whatever users ask',
          'Embedding explicit principles that constrain AI reasoning and behavior',
          'Using only rule-based systems',
          'Removing AI agency entirely',
        ],
        correctAnswer: 'B',
        weight: 1,
      },
    ],
  },
  {
    id: 'quiz-ai-002',
    courseId: 'ai-002',
    passThreshold: 0.8,
    questions: [
      {
        id: 'q1',
        text: 'LLMs generate text by:',
        type: 'multiple_choice',
        options: [
          'Looking up answers in a database',
          'Predicting the next token based on patterns learned from training data',
          'Copying from the internet in real time',
          'Following hand-coded rules',
        ],
        correctAnswer: 'B',
        weight: 1,
      },
      {
        id: 'q2',
        text: 'The "transformer" architecture is notable for:',
        type: 'multiple_choice',
        options: [
          'Its small size',
          'Using self-attention to model relationships across entire sequences',
          'Requiring no training data',
          'Only working on images',
        ],
        correctAnswer: 'B',
        weight: 1,
      },
      {
        id: 'q3',
        text: 'A key limitation of current LLMs is:',
        type: 'multiple_choice',
        options: [
          'They can only speak one language',
          'They can produce confident-sounding but factually incorrect outputs',
          'They require physical hardware',
          'They only work offline',
        ],
        correctAnswer: 'B',
        weight: 1,
      },
    ],
  },
  {
    id: 'quiz-ai-003',
    courseId: 'ai-003',
    passThreshold: 0.8,
    questions: [
      {
        id: 'q1',
        text: 'In a multi-agent system, emergent behavior refers to:',
        type: 'multiple_choice',
        options: [
          'Behavior programmed directly into each agent',
          'Collective patterns that arise from individual interactions, not designed top-down',
          'One agent controlling all others',
          'Agents failing to coordinate',
        ],
        correctAnswer: 'B',
        weight: 1,
      },
      {
        id: 'q2',
        text: 'The main challenge of multi-agent coordination is:',
        type: 'multiple_choice',
        options: [
          'Agents run too fast',
          'Aligning individual incentives with collective goals',
          'Agents use too much memory',
          'Too few agents available',
        ],
        correctAnswer: 'B',
        weight: 1,
      },
      {
        id: 'q3',
        text: 'Democratic consensus in multi-agent systems prevents:',
        type: 'multiple_choice',
        options: [
          'High computational costs',
          'Single points of failure and unilateral control',
          'Network latency',
          'Memory overflow',
        ],
        correctAnswer: 'B',
        weight: 1,
      },
    ],
  },
  {
    id: 'quiz-sys-001',
    courseId: 'sys-001',
    passThreshold: 0.8,
    questions: [
      {
        id: 'q1',
        text: 'A reinforcing feedback loop:',
        type: 'multiple_choice',
        options: [
          'Always stabilizes a system',
          'Amplifies change, leading to exponential growth or collapse',
          'Has no net effect over time',
          'Only exists in physical systems',
        ],
        correctAnswer: 'B',
        weight: 1,
      },
      {
        id: 'q2',
        text: 'A leverage point in systems thinking is:',
        type: 'multiple_choice',
        options: [
          'The most expensive part of the system',
          'A place where small changes produce large system-wide effects',
          'The weakest point in the system',
          'The entry point for new users',
        ],
        correctAnswer: 'B',
        weight: 1,
      },
      {
        id: 'q3',
        text: 'Systems thinking differs from linear thinking by:',
        type: 'multiple_choice',
        options: [
          'Ignoring cause and effect',
          'Considering circular causality, feedback, and emergent properties',
          'Focusing only on individual components',
          'Being slower and less accurate',
        ],
        correctAnswer: 'B',
        weight: 1,
      },
    ],
  },
  {
    id: 'quiz-sys-002',
    courseId: 'sys-002',
    passThreshold: 0.8,
    questions: [
      {
        id: 'q1',
        text: 'Legitimate political authority is typically grounded in:',
        type: 'multiple_choice',
        options: [
          'Pure force and coercion',
          'Consent, rule of law, and accountability',
          'Economic wealth',
          'Military strength',
        ],
        correctAnswer: 'B',
        weight: 1,
      },
      {
        id: 'q2',
        text: 'The "social contract" theory argues that:',
        type: 'multiple_choice',
        options: [
          'Citizens have no rights against the state',
          'Political authority derives from agreement among free and equal individuals',
          'Only economic contracts matter',
          'Government authority is absolute',
        ],
        correctAnswer: 'B',
        weight: 1,
      },
      {
        id: 'q3',
        text: 'Separation of powers serves primarily to:',
        type: 'multiple_choice',
        options: [
          'Make government more efficient',
          'Prevent concentration of power and protect rights',
          'Speed up legislation',
          'Reduce government costs',
        ],
        correctAnswer: 'B',
        weight: 1,
      },
    ],
  },
  {
    id: 'quiz-sys-003',
    courseId: 'sys-003',
    passThreshold: 0.8,
    questions: [
      {
        id: 'q1',
        text: 'Shannon entropy measures:',
        type: 'multiple_choice',
        options: [
          'Physical heat in a system',
          'The average uncertainty or information content of a random variable',
          'The speed of data transmission',
          'The size of a file',
        ],
        correctAnswer: 'B',
        weight: 1,
      },
      {
        id: 'q2',
        text: 'Higher entropy in a message means:',
        type: 'multiple_choice',
        options: [
          'Less information content',
          'More uncertainty and therefore more information when revealed',
          'Easier to compress',
          'Faster to transmit',
        ],
        correctAnswer: 'B',
        weight: 1,
      },
      {
        id: 'q3',
        text: 'Information theory\'s key insight for AI is:',
        type: 'multiple_choice',
        options: [
          'AI requires physical storage',
          'Learning is the reduction of uncertainty; intelligence compresses information',
          'More data always means better performance',
          'Information cannot be measured',
        ],
        correctAnswer: 'B',
        weight: 1,
      },
    ],
  },
  {
    id: 'quiz-trade-001',
    courseId: 'trade-001',
    passThreshold: 0.8,
    questions: [
      {
        id: 'q1',
        text: 'A key critical thinking skill in the age of AI is:',
        type: 'multiple_choice',
        options: [
          'Trusting AI outputs completely',
          'Evaluating sources, checking reasoning, and identifying assumptions',
          'Avoiding AI tools entirely',
          'Relying on speed over accuracy',
        ],
        correctAnswer: 'B',
        weight: 1,
      },
      {
        id: 'q2',
        text: 'Confirmation bias is especially dangerous with AI because:',
        type: 'multiple_choice',
        options: [
          'AI is always unbiased',
          'AI can generate confident-sounding text that confirms whatever you already believe',
          'AI only works for experts',
          'Bias only affects human thinking',
        ],
        correctAnswer: 'B',
        weight: 1,
      },
      {
        id: 'q3',
        text: 'To think critically about an AI-generated claim, you should:',
        type: 'multiple_choice',
        options: [
          'Accept it if it sounds authoritative',
          'Ask: what evidence supports this? Who benefits? What\'s missing?',
          'Only trust peer-reviewed AI',
          'Never question AI outputs',
        ],
        correctAnswer: 'B',
        weight: 1,
      },
    ],
  },
  {
    id: 'quiz-trade-002',
    courseId: 'trade-002',
    passThreshold: 0.8,
    questions: [
      {
        id: 'q1',
        text: 'Network effects mean that a product becomes more valuable as:',
        type: 'multiple_choice',
        options: [
          'It becomes cheaper',
          'More people use it',
          'The company grows larger',
          'It adds more features',
        ],
        correctAnswer: 'B',
        weight: 1,
      },
      {
        id: 'q2',
        text: 'Platform power is difficult to contest because:',
        type: 'multiple_choice',
        options: [
          'Platforms are always higher quality',
          'Network effects create winner-take-all dynamics that reinforce incumbents',
          'Platforms spend the most on advertising',
          'Regulations protect them',
        ],
        correctAnswer: 'B',
        weight: 1,
      },
      {
        id: 'q3',
        text: 'An alternative to platform extraction is:',
        type: 'multiple_choice',
        options: [
          'Monopoly regulation',
          'Protocols and open networks where value accrues to participants, not the platform',
          'More advertising',
          'Vertical integration',
        ],
        correctAnswer: 'B',
        weight: 1,
      },
    ],
  },
  {
    id: 'quiz-trade-003',
    courseId: 'trade-003',
    passThreshold: 0.8,
    questions: [
      {
        id: 'q1',
        text: 'The attention economy treats human attention as:',
        type: 'multiple_choice',
        options: [
          'A renewable resource',
          'A scarce commodity to be monetized through advertising',
          'Irrelevant to business models',
          'A public good',
        ],
        correctAnswer: 'B',
        weight: 1,
      },
      {
        id: 'q2',
        text: 'Cognitive sovereignty refers to:',
        type: 'multiple_choice',
        options: [
          'Having the highest IQ',
          'The capacity to direct your own attention and thinking without manipulation',
          'Cognitive enhancement through technology',
          'Memorizing large amounts of information',
        ],
        correctAnswer: 'B',
        weight: 1,
      },
      {
        id: 'q3',
        text: 'An integrity-based alternative to the attention economy would reward:',
        type: 'multiple_choice',
        options: [
          'Time spent on a platform',
          'Demonstrated learning, contribution, and growth',
          'The most viral content',
          'Highest click-through rates',
        ],
        correctAnswer: 'B',
        weight: 1,
      },
    ],
  },
];

export const SUBJECT_GROUPS: { id: CourseSubject; label: string; emoji: string; color: string; bg: string; border: string }[] = [
  { id: 'Economics', label: 'Economics', emoji: '📈', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
  { id: 'Game Theory', label: 'Game Theory', emoji: '♟️', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  { id: 'Civics', label: 'Civics', emoji: '🏛️', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  { id: 'Governance', label: 'Governance', emoji: '⚖️', color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200' },
  { id: 'AI', label: 'AI', emoji: '🧠', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
  { id: 'Systems', label: 'Systems', emoji: '🔄', color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-200' },
  { id: 'Philosophy', label: 'Philosophy', emoji: '🔭', color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  { id: 'Tradecraft', label: 'Tradecraft', emoji: '🛠️', color: 'text-stone-700', bg: 'bg-stone-50', border: 'border-stone-200' },
];

export function getCoursesBySubject(subject: CourseSubject): CourseVideo[] {
  return courses.filter(c => c.subject === subject);
}

export function getCourseById(id: string): CourseVideo | undefined {
  return courses.find(c => c.id === id);
}

export function getQuizByCourseId(courseId: string): Quiz | undefined {
  return quizzes.find(q => q.courseId === courseId);
}

export function getAllSubjects(): CourseSubject[] {
  return [...new Set(courses.map(c => c.subject))];
}
