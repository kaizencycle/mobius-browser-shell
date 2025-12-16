"""
Add STEM Learning Modules

This migration adds 15 comprehensive STEM modules to the learning system:
- 3 Mathematics modules (Calculus, Linear Algebra, Statistics)
- 3 Computer Science modules (Algorithms, Data Structures, Cryptography)
- 3 AI modules (Neural Networks, Transformers, Reinforcement Learning)
- 3 Physics/Engineering modules (Quantum Computing, Network Theory, Information Theory)
- 3 Science modules (Molecular Biology, Climate Science, Bioinformatics)

Total potential earnings: 1,510 MIC across all STEM modules

Revision ID: 002_stem_modules
Revises: 001_learning_tables
Create Date: 2025-12-16
"""

from alembic import op
import sqlalchemy as sa
import json


# revision identifiers
revision = '002_stem_modules'
down_revision = '001_learning_tables'
branch_labels = None
depends_on = None


# ===================
# STEM Module Data
# ===================

STEM_MODULES = [
    # ===================
    # MATHEMATICS (3 modules • 275 MIC)
    # ===================
    {
        "id": "calculus-fundamentals",
        "title": "Calculus I: Limits and Derivatives",
        "description": "Master the foundational concepts of calculus including limits, continuity, and differentiation. Learn how rates of change power modern AI and optimization.",
        "difficulty": "intermediate",
        "estimated_minutes": 60,
        "mic_reward": 100,
        "topics": ["Calculus", "Derivatives", "Limits", "Mathematics"],
        "prerequisites": [],
        "questions": [
            {
                "id": "q1",
                "question": "What is the derivative of f(x) = x²?",
                "options": ["x", "2x", "x²/2", "2"],
                "correct_answer": 1,
                "explanation": "Using the power rule, d/dx(x²) = 2x¹ = 2x. This represents the instantaneous rate of change of the function.",
                "difficulty": "easy",
                "points": 15
            },
            {
                "id": "q2",
                "question": "The limit of (sin x)/x as x approaches 0 equals:",
                "options": ["0", "1", "∞", "undefined"],
                "correct_answer": 1,
                "explanation": "This is a fundamental limit in calculus: lim(x→0) sin(x)/x = 1. This limit is crucial for deriving the derivative of sine.",
                "difficulty": "medium",
                "points": 20
            },
            {
                "id": "q3",
                "question": "In gradient descent optimization (used in AI), why do we need derivatives?",
                "options": [
                    "To calculate final values",
                    "To find the direction of steepest descent",
                    "To measure computation time",
                    "To store model weights"
                ],
                "correct_answer": 1,
                "explanation": "Derivatives tell us the direction of steepest descent, allowing AI models to minimize loss functions efficiently during training.",
                "difficulty": "hard",
                "points": 25
            }
        ],
        "order": 10
    },
    {
        "id": "linear-algebra-ml",
        "title": "Linear Algebra for Machine Learning",
        "description": "Understand matrices, vectors, and transformations that power modern AI systems. Learn how neural networks use linear algebra at their core.",
        "difficulty": "intermediate",
        "estimated_minutes": 50,
        "mic_reward": 90,
        "topics": ["Linear Algebra", "Machine Learning", "Mathematics", "AI"],
        "prerequisites": [],
        "questions": [
            {
                "id": "q1",
                "question": "What is a matrix multiplication's primary use in neural networks?",
                "options": [
                    "Storing data",
                    "Computing weighted sums of inputs",
                    "Displaying results",
                    "Saving models"
                ],
                "correct_answer": 1,
                "explanation": "Matrix multiplication computes weighted sums efficiently, which is the core operation in every layer of a neural network.",
                "difficulty": "medium",
                "points": 20
            },
            {
                "id": "q2",
                "question": "An eigenvector represents:",
                "options": [
                    "A direction that doesn't change under transformation",
                    "The largest value in a matrix",
                    "The sum of matrix elements",
                    "A random vector"
                ],
                "correct_answer": 0,
                "explanation": "Eigenvectors are special vectors that only get scaled (not rotated) when a linear transformation is applied. They're crucial for PCA and understanding data structure.",
                "difficulty": "hard",
                "points": 25
            }
        ],
        "order": 11
    },
    {
        "id": "probability-statistics-ai",
        "title": "Probability & Statistics for AI",
        "description": "Master probability theory and statistical methods that underpin machine learning, from Bayes' theorem to confidence intervals.",
        "difficulty": "intermediate",
        "estimated_minutes": 55,
        "mic_reward": 85,
        "topics": ["Probability", "Statistics", "Machine Learning", "Data Science"],
        "prerequisites": [],
        "questions": [
            {
                "id": "q1",
                "question": "Bayes' theorem allows us to:",
                "options": [
                    "Add probabilities",
                    "Update beliefs based on new evidence",
                    "Calculate averages",
                    "Multiply matrices"
                ],
                "correct_answer": 1,
                "explanation": "Bayes' theorem mathematically describes how to update probability estimates as new evidence becomes available - fundamental to AI reasoning.",
                "difficulty": "medium",
                "points": 20
            },
            {
                "id": "q2",
                "question": "Why is the Central Limit Theorem important for AI?",
                "options": [
                    "It makes code run faster",
                    "It explains why many distributions become normal with large samples",
                    "It reduces memory usage",
                    "It improves accuracy automatically"
                ],
                "correct_answer": 1,
                "explanation": "The CLT explains why normal distributions appear everywhere in nature and AI, enabling many statistical methods and inference techniques.",
                "difficulty": "hard",
                "points": 25
            }
        ],
        "order": 12
    },

    # ===================
    # COMPUTER SCIENCE (3 modules • 285 MIC)
    # ===================
    {
        "id": "algorithms-complexity",
        "title": "Algorithms & Complexity Theory",
        "description": "Learn algorithmic thinking, Big O notation, and computational complexity. Understand why some problems are hard and how to design efficient solutions.",
        "difficulty": "intermediate",
        "estimated_minutes": 65,
        "mic_reward": 95,
        "topics": ["Algorithms", "Computer Science", "Complexity", "Optimization"],
        "prerequisites": [],
        "questions": [
            {
                "id": "q1",
                "question": "What is the time complexity of binary search?",
                "options": ["O(n)", "O(log n)", "O(n²)", "O(1)"],
                "correct_answer": 1,
                "explanation": "Binary search halves the search space each step, giving O(log n) complexity. This is why it's much faster than linear search for sorted data.",
                "difficulty": "easy",
                "points": 15
            },
            {
                "id": "q2",
                "question": "Why can't NP-complete problems be solved efficiently?",
                "options": [
                    "They require too much memory",
                    "No polynomial-time algorithm is known to exist",
                    "They are impossible to solve",
                    "They require quantum computers"
                ],
                "correct_answer": 1,
                "explanation": "NP-complete problems have no known polynomial-time solutions. Finding one would prove P=NP, one of computer science's biggest open questions.",
                "difficulty": "hard",
                "points": 30
            }
        ],
        "order": 20
    },
    {
        "id": "data-structures-fundamentals",
        "title": "Data Structures Fundamentals",
        "description": "Master essential data structures: arrays, linked lists, trees, graphs, hash tables. Learn when and why to use each structure.",
        "difficulty": "beginner",
        "estimated_minutes": 45,
        "mic_reward": 70,
        "topics": ["Data Structures", "Computer Science", "Programming"],
        "prerequisites": [],
        "questions": [
            {
                "id": "q1",
                "question": "What's the main advantage of a hash table?",
                "options": [
                    "Uses less memory",
                    "O(1) average lookup time",
                    "Maintains sorted order",
                    "Thread-safe by default"
                ],
                "correct_answer": 1,
                "explanation": "Hash tables provide O(1) average-case lookup, insertion, and deletion - making them ideal for caches, databases, and dictionaries.",
                "difficulty": "medium",
                "points": 20
            },
            {
                "id": "q2",
                "question": "When would you choose a tree over an array?",
                "options": [
                    "When you need random access",
                    "When you need hierarchical relationships",
                    "When memory is limited",
                    "When you need to append data"
                ],
                "correct_answer": 1,
                "explanation": "Trees excel at representing hierarchical data (file systems, DOM, decision trees) and maintaining sorted order with efficient operations.",
                "difficulty": "medium",
                "points": 20
            }
        ],
        "order": 21
    },
    {
        "id": "cryptography-blockchain",
        "title": "Cryptography & Blockchain Fundamentals",
        "description": "Understand cryptographic primitives, hash functions, public-key cryptography, and how blockchains ensure integrity and decentralization.",
        "difficulty": "advanced",
        "estimated_minutes": 70,
        "mic_reward": 120,
        "topics": ["Cryptography", "Blockchain", "Security", "Distributed Systems"],
        "prerequisites": ["algorithms-complexity"],
        "questions": [
            {
                "id": "q1",
                "question": "What property makes SHA-256 suitable for blockchain?",
                "options": [
                    "It's fast to compute",
                    "It's collision-resistant and deterministic",
                    "It produces short hashes",
                    "It's reversible"
                ],
                "correct_answer": 1,
                "explanation": "SHA-256 is collision-resistant (hard to find two inputs with same output) and deterministic (same input always gives same output), making it perfect for ensuring data integrity.",
                "difficulty": "medium",
                "points": 25
            },
            {
                "id": "q2",
                "question": "How do Byzantine Fault Tolerant systems relate to integrity economics?",
                "options": [
                    "They prevent all attacks",
                    "They tolerate up to 33% malicious nodes while maintaining consensus",
                    "They eliminate the need for incentives",
                    "They require trusted leaders"
                ],
                "correct_answer": 1,
                "explanation": "BFT systems can reach consensus even when up to 1/3 of nodes are malicious - this mathematical guarantee is crucial for integrity-backed currencies like MIC.",
                "difficulty": "hard",
                "points": 30
            }
        ],
        "order": 22
    },

    # ===================
    # ARTIFICIAL INTELLIGENCE (3 modules • 340 MIC)
    # ===================
    {
        "id": "neural-networks-intro",
        "title": "Introduction to Neural Networks",
        "description": "Understand how artificial neural networks learn from data. Master backpropagation, activation functions, and network architectures.",
        "difficulty": "intermediate",
        "estimated_minutes": 60,
        "mic_reward": 100,
        "topics": ["Neural Networks", "Deep Learning", "AI", "Machine Learning"],
        "prerequisites": ["linear-algebra-ml", "calculus-fundamentals"],
        "questions": [
            {
                "id": "q1",
                "question": "What is the purpose of an activation function?",
                "options": [
                    "To speed up training",
                    "To introduce non-linearity",
                    "To reduce overfitting",
                    "To initialize weights"
                ],
                "correct_answer": 1,
                "explanation": "Activation functions introduce non-linearity, allowing neural networks to learn complex patterns. Without them, any neural network would be equivalent to linear regression.",
                "difficulty": "medium",
                "points": 20
            },
            {
                "id": "q2",
                "question": "Backpropagation uses which calculus concept?",
                "options": [
                    "Integration",
                    "Chain rule for derivatives",
                    "Limit theorems",
                    "Differential equations"
                ],
                "correct_answer": 1,
                "explanation": "Backpropagation applies the chain rule to efficiently compute gradients layer by layer, allowing networks to learn from errors.",
                "difficulty": "hard",
                "points": 25
            },
            {
                "id": "q3",
                "question": "How does dropout prevent overfitting?",
                "options": [
                    "By removing neurons permanently",
                    "By randomly disabling neurons during training",
                    "By reducing learning rate",
                    "By adding more data"
                ],
                "correct_answer": 1,
                "explanation": "Dropout randomly disables neurons during training, forcing the network to learn robust features that don't depend on any single neuron - reducing overfitting.",
                "difficulty": "hard",
                "points": 25
            }
        ],
        "order": 30
    },
    {
        "id": "transformers-attention",
        "title": "Transformers & Attention Mechanisms",
        "description": "Learn the architecture behind GPT, BERT, and Claude. Understand self-attention, positional encoding, and why transformers revolutionized AI.",
        "difficulty": "advanced",
        "estimated_minutes": 75,
        "mic_reward": 130,
        "topics": ["Transformers", "Attention", "NLP", "Deep Learning"],
        "prerequisites": ["neural-networks-intro"],
        "questions": [
            {
                "id": "q1",
                "question": "What problem do attention mechanisms solve?",
                "options": [
                    "Memory limitations",
                    "Long-range dependencies in sequences",
                    "Training speed",
                    "Model size"
                ],
                "correct_answer": 1,
                "explanation": "Attention allows models to focus on relevant parts of input regardless of distance, solving the long-range dependency problem that plagued RNNs.",
                "difficulty": "medium",
                "points": 25
            },
            {
                "id": "q2",
                "question": "Why do transformers need positional encoding?",
                "options": [
                    "To reduce computation",
                    "Because attention has no inherent sense of position",
                    "To prevent overfitting",
                    "To initialize weights"
                ],
                "correct_answer": 1,
                "explanation": "Unlike RNNs, attention operations are permutation-invariant. Positional encodings inject information about token order into the model.",
                "difficulty": "hard",
                "points": 30
            }
        ],
        "order": 31
    },
    {
        "id": "reinforcement-learning",
        "title": "Reinforcement Learning Fundamentals",
        "description": "Master RL concepts: agents, environments, rewards, Q-learning, policy gradients. Learn how AI systems learn optimal behavior through trial and error.",
        "difficulty": "advanced",
        "estimated_minutes": 65,
        "mic_reward": 110,
        "topics": ["Reinforcement Learning", "AI", "Optimization", "Game Theory"],
        "prerequisites": ["probability-statistics-ai"],
        "questions": [
            {
                "id": "q1",
                "question": "What is the exploration-exploitation tradeoff?",
                "options": [
                    "Balancing model size and speed",
                    "Balancing trying new actions vs. using known good actions",
                    "Balancing training and inference time",
                    "Balancing accuracy and interpretability"
                ],
                "correct_answer": 1,
                "explanation": "Agents must balance exploring new actions (to discover better strategies) with exploiting known good actions (to maximize immediate reward).",
                "difficulty": "medium",
                "points": 25
            },
            {
                "id": "q2",
                "question": "How does RL relate to integrity economics in Mobius?",
                "options": [
                    "It doesn't relate",
                    "Agents learn optimal behavior through reward signals tied to integrity",
                    "It only applies to games",
                    "It replaces human decision-making"
                ],
                "correct_answer": 1,
                "explanation": "In Mobius, MIC rewards create RL-like dynamics where agents (users, AI systems) learn behaviors that maintain system integrity through feedback loops.",
                "difficulty": "hard",
                "points": 30
            }
        ],
        "order": 32
    },

    # ===================
    # PHYSICS & ENGINEERING (3 modules • 320 MIC)
    # ===================
    {
        "id": "quantum-computing-intro",
        "title": "Quantum Computing Fundamentals",
        "description": "Introduction to qubits, superposition, entanglement, and quantum algorithms. Understand how quantum computers will impact AI and cryptography.",
        "difficulty": "advanced",
        "estimated_minutes": 70,
        "mic_reward": 125,
        "topics": ["Quantum Computing", "Physics", "Computer Science"],
        "prerequisites": ["linear-algebra-ml"],
        "questions": [
            {
                "id": "q1",
                "question": "What is quantum superposition?",
                "options": [
                    "Adding quantum states together",
                    "A qubit existing in multiple states simultaneously",
                    "Quantum computers being faster",
                    "A type of quantum algorithm"
                ],
                "correct_answer": 1,
                "explanation": "Superposition allows qubits to exist in multiple states (0 and 1) simultaneously until measured, enabling quantum parallelism.",
                "difficulty": "medium",
                "points": 25
            },
            {
                "id": "q2",
                "question": "Why are quantum computers a threat to current cryptography?",
                "options": [
                    "They're just faster",
                    "Shor's algorithm can factor large numbers efficiently",
                    "They can brute force any password",
                    "They can break any encryption instantly"
                ],
                "correct_answer": 1,
                "explanation": "Shor's algorithm can factor large numbers in polynomial time on quantum computers, breaking RSA encryption which relies on factoring difficulty.",
                "difficulty": "hard",
                "points": 30
            }
        ],
        "order": 40
    },
    {
        "id": "network-theory-systems",
        "title": "Network Theory & Complex Systems",
        "description": "Study how networks behave, from social graphs to neural networks. Learn about emergence, scale-free networks, and system dynamics.",
        "difficulty": "intermediate",
        "estimated_minutes": 55,
        "mic_reward": 90,
        "topics": ["Network Theory", "Complex Systems", "Graph Theory", "Systems Science"],
        "prerequisites": [],
        "questions": [
            {
                "id": "q1",
                "question": "What is a scale-free network?",
                "options": [
                    "A network with no size limit",
                    "A network where degree distribution follows a power law",
                    "A network without hierarchy",
                    "A network that scales linearly"
                ],
                "correct_answer": 1,
                "explanation": "Scale-free networks have a few highly connected hubs and many nodes with few connections - seen in the web, social networks, and protein interactions.",
                "difficulty": "medium",
                "points": 20
            },
            {
                "id": "q2",
                "question": "How do network effects relate to Mobius' integrity systems?",
                "options": [
                    "They don't relate",
                    "Integrity spreads through networks, creating positive feedback loops",
                    "Networks always reduce integrity",
                    "Only centralized networks matter"
                ],
                "correct_answer": 1,
                "explanation": "In Mobius, integrity creates network effects: as more nodes maintain high integrity, the Global Integrity Index rises, rewarding everyone - a regenerative feedback loop.",
                "difficulty": "hard",
                "points": 25
            }
        ],
        "order": 41
    },
    {
        "id": "information-theory",
        "title": "Information Theory & Entropy",
        "description": "Learn Shannon entropy, information content, compression, and how information theory connects to AI, cryptography, and thermodynamics.",
        "difficulty": "advanced",
        "estimated_minutes": 60,
        "mic_reward": 105,
        "topics": ["Information Theory", "Entropy", "Computer Science", "Physics"],
        "prerequisites": ["probability-statistics-ai"],
        "questions": [
            {
                "id": "q1",
                "question": "What does Shannon entropy measure?",
                "options": [
                    "Temperature of information",
                    "Average information content or uncertainty",
                    "Speed of data transfer",
                    "Computational complexity"
                ],
                "correct_answer": 1,
                "explanation": "Shannon entropy quantifies the average information content or uncertainty in a random variable - fundamental to compression, cryptography, and ML.",
                "difficulty": "medium",
                "points": 25
            },
            {
                "id": "q2",
                "question": "Why is cross-entropy loss used in classification?",
                "options": [
                    "It's easier to compute",
                    "It measures the difference between predicted and true probability distributions",
                    "It's always positive",
                    "It's differentiable"
                ],
                "correct_answer": 1,
                "explanation": "Cross-entropy loss measures how well predicted probabilities match true labels - a direct application of information theory to machine learning.",
                "difficulty": "hard",
                "points": 25
            }
        ],
        "order": 42
    },

    # ===================
    # SCIENCE (3 modules • 290 MIC)
    # ===================
    {
        "id": "molecular-biology-ai",
        "title": "Molecular Biology & AI Applications",
        "description": "Understand DNA, proteins, and cellular systems. Learn how AI is revolutionizing drug discovery, protein folding, and genomics.",
        "difficulty": "intermediate",
        "estimated_minutes": 50,
        "mic_reward": 85,
        "topics": ["Biology", "Bioinformatics", "AI Applications", "Healthcare"],
        "prerequisites": [],
        "questions": [
            {
                "id": "q1",
                "question": "How did AlphaFold revolutionize biology?",
                "options": [
                    "It sequenced genomes faster",
                    "It predicted 3D protein structure from amino acid sequences",
                    "It created new proteins",
                    "It cured diseases"
                ],
                "correct_answer": 1,
                "explanation": "AlphaFold solved the 50-year protein folding problem using AI, enabling researchers to predict protein structures that took decades to determine experimentally.",
                "difficulty": "medium",
                "points": 20
            },
            {
                "id": "q2",
                "question": "Why is CRISPR gene editing revolutionary?",
                "options": [
                    "It's cheaper than other methods",
                    "It allows precise, targeted DNA editing",
                    "It works on all organisms",
                    "It's completely safe"
                ],
                "correct_answer": 1,
                "explanation": "CRISPR enables precise, targeted gene editing using RNA-guided enzymes, opening possibilities for treating genetic diseases and advancing biotechnology.",
                "difficulty": "medium",
                "points": 20
            }
        ],
        "order": 50
    },
    {
        "id": "climate-science-ai",
        "title": "Climate Science & AI Modeling",
        "description": "Learn climate system dynamics, carbon cycles, and how AI helps model and mitigate climate change.",
        "difficulty": "intermediate",
        "estimated_minutes": 55,
        "mic_reward": 90,
        "topics": ["Climate Science", "Environmental Science", "AI Applications", "Ecology"],
        "prerequisites": [],
        "questions": [
            {
                "id": "q1",
                "question": "How does AI improve climate modeling?",
                "options": [
                    "It eliminates uncertainty",
                    "It identifies patterns in complex datasets and improves prediction accuracy",
                    "It replaces physical models entirely",
                    "It controls the weather"
                ],
                "correct_answer": 1,
                "explanation": "AI/ML helps identify non-linear patterns in climate data, improve parameterization of physical models, and increase prediction accuracy for regional climate impacts.",
                "difficulty": "medium",
                "points": 20
            },
            {
                "id": "q2",
                "question": "How does the Ecology Covenant relate to climate science?",
                "options": [
                    "It doesn't relate",
                    "It mandates regenerative systems that restore rather than extract",
                    "It only applies to software",
                    "It requires carbon credits"
                ],
                "correct_answer": 1,
                "explanation": "The Ecology Covenant ensures Mobius systems are regenerative by design - creating positive environmental feedback loops rather than extractive ones.",
                "difficulty": "hard",
                "points": 25
            }
        ],
        "order": 51
    },
    {
        "id": "bioinformatics-genomics",
        "title": "Bioinformatics & Genomic Analysis",
        "description": "Explore computational approaches to biological data, genome sequencing, and how AI accelerates biomedical research.",
        "difficulty": "advanced",
        "estimated_minutes": 65,
        "mic_reward": 115,
        "topics": ["Bioinformatics", "Genomics", "AI", "Data Science", "Healthcare"],
        "prerequisites": [],
        "questions": [
            {
                "id": "q1",
                "question": "What is the primary goal of sequence alignment in bioinformatics?",
                "options": [
                    "To make DNA look nicer",
                    "To identify similarities and evolutionary relationships between sequences",
                    "To speed up gene sequencing",
                    "To store genetic data efficiently"
                ],
                "correct_answer": 1,
                "explanation": "Sequence alignment identifies regions of similarity between DNA, RNA, or protein sequences, revealing functional, structural, or evolutionary relationships.",
                "difficulty": "medium",
                "points": 25
            },
            {
                "id": "q2",
                "question": "How has AI transformed drug discovery?",
                "options": [
                    "It has eliminated the need for clinical trials",
                    "It accelerates molecule screening and predicts drug-target interactions",
                    "It replaces all human researchers",
                    "It only works for simple drugs"
                ],
                "correct_answer": 1,
                "explanation": "AI dramatically accelerates early-stage drug discovery by screening millions of compounds virtually, predicting protein interactions, and identifying promising candidates for synthesis.",
                "difficulty": "hard",
                "points": 30
            }
        ],
        "order": 52
    }
]


# ===================
# STEM Badges
# ===================

STEM_BADGES = [
    {
        "id": "math-master",
        "name": "Math Master",
        "description": "Complete all Mathematics modules",
        "icon": "📐",
        "rarity": "rare",
        "requirement": {"type": "category_complete", "category": "Mathematics", "count": 3}
    },
    {
        "id": "algorithm-ace",
        "name": "Algorithm Ace",
        "description": "Complete CS modules with 90%+ accuracy",
        "icon": "⚡",
        "rarity": "epic",
        "requirement": {"type": "accuracy_threshold", "modules": ["algorithms-complexity", "data-structures-fundamentals", "cryptography-blockchain"], "threshold": 0.90}
    },
    {
        "id": "ai-architect",
        "name": "AI Architect",
        "description": "Complete all AI modules",
        "icon": "🤖",
        "rarity": "epic",
        "requirement": {"type": "category_complete", "category": "AI", "count": 3}
    },
    {
        "id": "quantum-pioneer",
        "name": "Quantum Pioneer",
        "description": "90%+ on Quantum Computing",
        "icon": "⚛️",
        "rarity": "legendary",
        "requirement": {"type": "accuracy_threshold", "modules": ["quantum-computing-intro"], "threshold": 0.90}
    },
    {
        "id": "crypto-guardian",
        "name": "Crypto Guardian",
        "description": "90%+ on Cryptography & Blockchain",
        "icon": "🔐",
        "rarity": "epic",
        "requirement": {"type": "accuracy_threshold", "modules": ["cryptography-blockchain"], "threshold": 0.90}
    },
    {
        "id": "bio-innovator",
        "name": "Bio Innovator",
        "description": "Complete all Science modules",
        "icon": "🧬",
        "rarity": "rare",
        "requirement": {"type": "category_complete", "category": "Science", "count": 3}
    },
    {
        "id": "climate-champion",
        "name": "Climate Champion",
        "description": "90%+ on Climate Science module",
        "icon": "🌍",
        "rarity": "rare",
        "requirement": {"type": "accuracy_threshold", "modules": ["climate-science-ai"], "threshold": 0.90}
    },
    {
        "id": "stem-scholar",
        "name": "STEM Scholar",
        "description": "Complete all 15 STEM modules",
        "icon": "🧪",
        "rarity": "legendary",
        "requirement": {"type": "modules_complete", "count": 15}
    },
    {
        "id": "neural-navigator",
        "name": "Neural Navigator",
        "description": "Perfect score on Neural Networks",
        "icon": "🧠",
        "rarity": "legendary",
        "requirement": {"type": "accuracy_threshold", "modules": ["neural-networks-intro"], "threshold": 1.0}
    },
    {
        "id": "transformer-titan",
        "name": "Transformer Titan",
        "description": "90%+ on Transformers & Attention",
        "icon": "🤖",
        "rarity": "legendary",
        "requirement": {"type": "accuracy_threshold", "modules": ["transformers-attention"], "threshold": 0.90}
    },
    {
        "id": "data-detective",
        "name": "Data Detective",
        "description": "Complete Data Structures + Algorithms",
        "icon": "🔍",
        "rarity": "rare",
        "requirement": {"type": "modules_complete", "modules": ["data-structures-fundamentals", "algorithms-complexity"]}
    },
    {
        "id": "mic-millionaire",
        "name": "MIC Millionaire",
        "description": "Earn 1000+ MIC from learning",
        "icon": "💎",
        "rarity": "legendary",
        "requirement": {"type": "mic_earned", "threshold": 1000}
    },
    {
        "id": "information-theorist",
        "name": "Information Theorist",
        "description": "90%+ on Information Theory & Entropy",
        "icon": "📡",
        "rarity": "epic",
        "requirement": {"type": "accuracy_threshold", "modules": ["information-theory"], "threshold": 0.90}
    }
]


def upgrade():
    """Add STEM learning modules and badges to database"""
    
    # Insert STEM modules
    for module in STEM_MODULES:
        op.execute(f"""
            INSERT INTO learning_modules (
                id, title, description, difficulty, estimated_minutes, 
                mic_reward, topics, questions, "order"
            ) VALUES (
                '{module["id"]}',
                '{module["title"].replace("'", "''")}',
                '{module["description"].replace("'", "''")}',
                '{module["difficulty"]}',
                {module["estimated_minutes"]},
                {module["mic_reward"]},
                ARRAY{module["topics"]}::text[],
                '{json.dumps(module["questions"]).replace("'", "''")}'::jsonb,
                {module["order"]}
            )
            ON CONFLICT (id) DO UPDATE SET
                title = EXCLUDED.title,
                description = EXCLUDED.description,
                difficulty = EXCLUDED.difficulty,
                estimated_minutes = EXCLUDED.estimated_minutes,
                mic_reward = EXCLUDED.mic_reward,
                topics = EXCLUDED.topics,
                questions = EXCLUDED.questions,
                "order" = EXCLUDED."order"
        """)
    
    # Insert STEM badges
    for badge in STEM_BADGES:
        op.execute(f"""
            INSERT INTO learning_badges (
                id, name, description, icon, rarity, requirement
            ) VALUES (
                '{badge["id"]}',
                '{badge["name"].replace("'", "''")}',
                '{badge["description"].replace("'", "''")}',
                '{badge["icon"]}',
                '{badge["rarity"]}',
                '{json.dumps(badge["requirement"]).replace("'", "''")}'::jsonb
            )
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                description = EXCLUDED.description,
                icon = EXCLUDED.icon,
                rarity = EXCLUDED.rarity,
                requirement = EXCLUDED.requirement
        """)


def downgrade():
    """Remove STEM learning modules and badges"""
    
    # Remove STEM modules
    stem_module_ids = [m["id"] for m in STEM_MODULES]
    ids_str = ", ".join([f"'{id}'" for id in stem_module_ids])
    op.execute(f"DELETE FROM learning_modules WHERE id IN ({ids_str})")
    
    # Remove STEM badges
    stem_badge_ids = [b["id"] for b in STEM_BADGES]
    badge_ids_str = ", ".join([f"'{id}'" for id in stem_badge_ids])
    op.execute(f"DELETE FROM learning_badges WHERE id IN ({badge_ids_str})")


# ===================
# Summary Statistics
# ===================
# Total STEM modules: 15
# Total potential MIC: 1,510 MIC
# Total learning time: ~900 minutes (~15 hours)
# 
# Difficulty breakdown:
# - Beginner: 1 module (Data Structures - 70 MIC)
# - Intermediate: 9 modules (~785 MIC)
# - Advanced: 5 modules (~655 MIC)
#
# Category breakdown:
# - Mathematics: 3 modules (275 MIC)
# - Computer Science: 3 modules (285 MIC)
# - AI: 3 modules (340 MIC)
# - Physics/Engineering: 3 modules (320 MIC)
# - Science: 3 modules (290 MIC)
#
# Total badges: 13 new STEM badges
