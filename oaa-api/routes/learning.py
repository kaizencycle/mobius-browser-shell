# oaa-api/routes/learning.py
"""
OAA Learning Hub API Route
Learn-to-earn system with MIC rewards
Constitutional Principle: Democratic access to knowledge.
"""
import os
import json
from datetime import datetime
from flask import Blueprint, request, jsonify

learning_bp = Blueprint('learning', __name__)

# ============================================
# Learning Module Definitions
# These can be moved to a database in production
# ============================================

LEARNING_MODULES = [
    # ===================
    # CORE MOBIUS MODULES (5)
    # ===================
    {
        "id": "constitutional-ai-101",
        "title": "Constitutional AI Fundamentals",
        "description": "Learn how AI systems can be constrained by constitutional principles to serve humanity.",
        "difficulty": "beginner",
        "estimatedMinutes": 30,
        "micReward": 50,
        "topics": ["AI Alignment", "Constitutional Constraints", "Three Covenants"],
        "questionCount": 3
    },
    {
        "id": "integrity-economics",
        "title": "Integrity Economics & MIC",
        "description": "Understanding how integrity-backed currency creates sustainable economic systems.",
        "difficulty": "intermediate",
        "estimatedMinutes": 45,
        "micReward": 75,
        "topics": ["MIC Tokenomics", "Circuit Breakers", "Time Security"],
        "questionCount": 3
    },
    {
        "id": "drift-suppression",
        "title": "Drift Suppression Mechanisms",
        "description": "Deep dive into how Mobius prevents AI systems from drifting away from constitutional alignment.",
        "difficulty": "advanced",
        "estimatedMinutes": 60,
        "micReward": 100,
        "topics": ["Kaizen Turing Test", "Pattern Recognition", "Integrity Scoring"],
        "questionCount": 3
    },
    {
        "id": "multi-agent-consensus",
        "title": "Multi-Agent Democratic Systems",
        "description": "How ATLAS, AUREA, and ECHO collaborate through democratic consensus mechanisms.",
        "difficulty": "intermediate",
        "estimatedMinutes": 40,
        "micReward": 65,
        "topics": ["Agent Orchestration", "Consensus Protocols", "DVA Flows"],
        "questionCount": 3
    },
    {
        "id": "three-covenants",
        "title": "The Three Covenants in Practice",
        "description": "Integrity, Ecology, Custodianship - the philosophical foundation of Mobius Systems.",
        "difficulty": "beginner",
        "estimatedMinutes": 25,
        "micReward": 40,
        "topics": ["Integrity", "Ecology", "Custodianship", "Kintsugi Philosophy"],
        "questionCount": 3
    },
    
    # ===================
    # STEM: MATHEMATICS (3)
    # ===================
    {
        "id": "calculus-fundamentals",
        "title": "Calculus I: Limits and Derivatives",
        "description": "Master the foundational concepts of calculus including limits, continuity, and differentiation. Learn how rates of change power modern AI and optimization.",
        "difficulty": "intermediate",
        "estimatedMinutes": 60,
        "micReward": 100,
        "topics": ["Calculus", "Derivatives", "Limits", "Mathematics"],
        "questionCount": 3
    },
    {
        "id": "linear-algebra-ml",
        "title": "Linear Algebra for Machine Learning",
        "description": "Understand matrices, vectors, and transformations that power modern AI systems. Learn how neural networks use linear algebra at their core.",
        "difficulty": "intermediate",
        "estimatedMinutes": 50,
        "micReward": 90,
        "topics": ["Linear Algebra", "Machine Learning", "Mathematics", "AI"],
        "questionCount": 2
    },
    {
        "id": "probability-statistics-ai",
        "title": "Probability & Statistics for AI",
        "description": "Master probability theory and statistical methods that underpin machine learning, from Bayes' theorem to confidence intervals.",
        "difficulty": "intermediate",
        "estimatedMinutes": 55,
        "micReward": 85,
        "topics": ["Probability", "Statistics", "Machine Learning", "Data Science"],
        "questionCount": 2
    },
    
    # ===================
    # STEM: COMPUTER SCIENCE (3)
    # ===================
    {
        "id": "algorithms-complexity",
        "title": "Algorithms & Complexity Theory",
        "description": "Learn algorithmic thinking, Big O notation, and computational complexity. Understand why some problems are hard and how to design efficient solutions.",
        "difficulty": "intermediate",
        "estimatedMinutes": 65,
        "micReward": 95,
        "topics": ["Algorithms", "Computer Science", "Complexity", "Optimization"],
        "questionCount": 2
    },
    {
        "id": "data-structures-fundamentals",
        "title": "Data Structures Fundamentals",
        "description": "Master essential data structures: arrays, linked lists, trees, graphs, hash tables. Learn when and why to use each structure.",
        "difficulty": "beginner",
        "estimatedMinutes": 45,
        "micReward": 70,
        "topics": ["Data Structures", "Computer Science", "Programming"],
        "questionCount": 2
    },
    {
        "id": "cryptography-blockchain",
        "title": "Cryptography & Blockchain Fundamentals",
        "description": "Understand cryptographic primitives, hash functions, public-key cryptography, and how blockchains ensure integrity and decentralization.",
        "difficulty": "advanced",
        "estimatedMinutes": 70,
        "micReward": 120,
        "topics": ["Cryptography", "Blockchain", "Security", "Distributed Systems"],
        "questionCount": 2
    },
    
    # ===================
    # STEM: ARTIFICIAL INTELLIGENCE (3)
    # ===================
    {
        "id": "neural-networks-intro",
        "title": "Introduction to Neural Networks",
        "description": "Understand how artificial neural networks learn from data. Master backpropagation, activation functions, and network architectures.",
        "difficulty": "intermediate",
        "estimatedMinutes": 60,
        "micReward": 100,
        "topics": ["Neural Networks", "Deep Learning", "AI", "Machine Learning"],
        "questionCount": 3
    },
    {
        "id": "transformers-attention",
        "title": "Transformers & Attention Mechanisms",
        "description": "Learn the architecture behind GPT, BERT, and Claude. Understand self-attention, positional encoding, and why transformers revolutionized AI.",
        "difficulty": "advanced",
        "estimatedMinutes": 75,
        "micReward": 130,
        "topics": ["Transformers", "Attention", "NLP", "Deep Learning"],
        "questionCount": 2
    },
    {
        "id": "reinforcement-learning",
        "title": "Reinforcement Learning Fundamentals",
        "description": "Master RL concepts: agents, environments, rewards, Q-learning, policy gradients. Learn how AI systems learn optimal behavior through trial and error.",
        "difficulty": "advanced",
        "estimatedMinutes": 65,
        "micReward": 110,
        "topics": ["Reinforcement Learning", "AI", "Optimization", "Game Theory"],
        "questionCount": 2
    },
    
    # ===================
    # STEM: PHYSICS & ENGINEERING (3)
    # ===================
    {
        "id": "quantum-computing-intro",
        "title": "Quantum Computing Fundamentals",
        "description": "Introduction to qubits, superposition, entanglement, and quantum algorithms. Understand how quantum computers will impact AI and cryptography.",
        "difficulty": "advanced",
        "estimatedMinutes": 70,
        "micReward": 125,
        "topics": ["Quantum Computing", "Physics", "Computer Science"],
        "questionCount": 2
    },
    {
        "id": "network-theory-systems",
        "title": "Network Theory & Complex Systems",
        "description": "Study how networks behave, from social graphs to neural networks. Learn about emergence, scale-free networks, and system dynamics.",
        "difficulty": "intermediate",
        "estimatedMinutes": 55,
        "micReward": 90,
        "topics": ["Network Theory", "Complex Systems", "Graph Theory", "Systems Science"],
        "questionCount": 2
    },
    {
        "id": "information-theory",
        "title": "Information Theory & Entropy",
        "description": "Learn Shannon entropy, information content, compression, and how information theory connects to AI, cryptography, and thermodynamics.",
        "difficulty": "advanced",
        "estimatedMinutes": 60,
        "micReward": 105,
        "topics": ["Information Theory", "Entropy", "Computer Science", "Physics"],
        "questionCount": 2
    },
    
    # ===================
    # STEM: SCIENCE (3)
    # ===================
    {
        "id": "molecular-biology-ai",
        "title": "Molecular Biology & AI Applications",
        "description": "Understand DNA, proteins, and cellular systems. Learn how AI is revolutionizing drug discovery, protein folding, and genomics.",
        "difficulty": "intermediate",
        "estimatedMinutes": 50,
        "micReward": 85,
        "topics": ["Biology", "Bioinformatics", "AI Applications", "Healthcare"],
        "questionCount": 2
    },
    {
        "id": "climate-science-ai",
        "title": "Climate Science & AI Modeling",
        "description": "Learn climate system dynamics, carbon cycles, and how AI helps model and mitigate climate change.",
        "difficulty": "intermediate",
        "estimatedMinutes": 55,
        "micReward": 90,
        "topics": ["Climate Science", "Environmental Science", "AI Applications", "Ecology"],
        "questionCount": 2
    },
    {
        "id": "bioinformatics-genomics",
        "title": "Bioinformatics & Genomic Analysis",
        "description": "Explore computational approaches to biological data, genome sequencing, and how AI accelerates biomedical research.",
        "difficulty": "advanced",
        "estimatedMinutes": 65,
        "micReward": 115,
        "topics": ["Bioinformatics", "Genomics", "AI", "Data Science", "Healthcare"],
        "questionCount": 2
    }
]

# MIC reward configuration
MIC_CONFIG = {
    "minimum_accuracy": 0.70,  # 70% minimum accuracy to earn any MIC
    "perfect_score_bonus": 0.10,  # 10% bonus for 100% accuracy
    "streak_bonuses": {
        3: 0.05,   # 5% bonus for 3-day streak
        7: 0.10,   # 10% bonus for 7-day streak
        30: 0.25   # 25% bonus for 30-day streak
    },
    "difficulty_multipliers": {
        "beginner": 1.0,
        "intermediate": 1.2,
        "advanced": 1.5
    },
    # Circuit breaker thresholds (would connect to real MII in production)
    "gii_thresholds": {
        "healthy": 0.90,    # Full rewards
        "warning": 0.75,    # 80% rewards
        "critical": 0.60,   # 50% rewards
        "halt": 0.50        # No rewards - circuit breaker active
    }
}


def calculate_mic_reward(base_reward: int, accuracy: float, difficulty: str, 
                         streak: int = 0, gii: float = 0.95) -> dict:
    """
    Calculate MIC reward based on performance metrics.
    
    Formula: MIC = baseReward × accuracy × difficultyMultiplier × giiMultiplier + bonuses
    
    Args:
        base_reward: Base MIC reward for the module
        accuracy: Quiz accuracy (0.0 - 1.0)
        difficulty: Module difficulty level
        streak: Current learning streak in days
        gii: Global Integrity Index (simulated, would come from real MII)
    
    Returns:
        dict with reward breakdown
    """
    # Check circuit breaker
    if gii < MIC_CONFIG["gii_thresholds"]["halt"]:
        return {
            "mic_earned": 0,
            "circuit_breaker_active": True,
            "message": "MIC minting paused - system integrity below safe threshold"
        }
    
    # Apply minimum accuracy threshold
    effective_accuracy = max(accuracy, MIC_CONFIG["minimum_accuracy"]) if accuracy >= MIC_CONFIG["minimum_accuracy"] else 0
    
    if effective_accuracy == 0:
        return {
            "mic_earned": 0,
            "accuracy_too_low": True,
            "minimum_required": MIC_CONFIG["minimum_accuracy"],
            "message": f"Accuracy below {MIC_CONFIG['minimum_accuracy']*100}% minimum threshold"
        }
    
    # Get difficulty multiplier
    difficulty_mult = MIC_CONFIG["difficulty_multipliers"].get(difficulty, 1.0)
    
    # Calculate GII multiplier
    if gii >= MIC_CONFIG["gii_thresholds"]["healthy"]:
        gii_mult = 1.0
    elif gii >= MIC_CONFIG["gii_thresholds"]["warning"]:
        gii_mult = 0.8
    elif gii >= MIC_CONFIG["gii_thresholds"]["critical"]:
        gii_mult = 0.5
    else:
        gii_mult = 0
    
    # Base calculation
    base_mic = base_reward * accuracy * difficulty_mult * gii_mult
    
    # Perfect score bonus
    perfect_bonus = 0
    if accuracy == 1.0:
        perfect_bonus = base_reward * MIC_CONFIG["perfect_score_bonus"]
    
    # Streak bonus
    streak_bonus = 0
    for days, bonus_pct in sorted(MIC_CONFIG["streak_bonuses"].items(), reverse=True):
        if streak >= days:
            streak_bonus = base_reward * bonus_pct
            break
    
    # Calculate total
    total_mic = round(base_mic + perfect_bonus + streak_bonus)
    
    return {
        "mic_earned": total_mic,
        "breakdown": {
            "base": round(base_mic),
            "perfect_bonus": round(perfect_bonus),
            "streak_bonus": round(streak_bonus)
        },
        "multipliers": {
            "accuracy": accuracy,
            "difficulty": difficulty_mult,
            "gii": gii_mult
        },
        "streak": streak,
        "circuit_breaker_active": False
    }


# ============================================
# API Routes
# ============================================

@learning_bp.route('/learning/modules', methods=['GET'])
def get_modules():
    """
    Get all available learning modules.
    
    Query params:
        difficulty: Filter by difficulty (beginner/intermediate/advanced)
    
    Returns:
        List of available modules
    """
    difficulty_filter = request.args.get('difficulty')
    
    modules = LEARNING_MODULES
    if difficulty_filter:
        modules = [m for m in modules if m['difficulty'] == difficulty_filter]
    
    return jsonify({
        "modules": modules,
        "total": len(modules),
        "reward_config": {
            "minimum_accuracy": MIC_CONFIG["minimum_accuracy"],
            "perfect_score_bonus": MIC_CONFIG["perfect_score_bonus"]
        }
    })


@learning_bp.route('/learning/modules/<module_id>', methods=['GET'])
def get_module(module_id):
    """
    Get a specific module by ID.
    """
    module = next((m for m in LEARNING_MODULES if m['id'] == module_id), None)
    
    if not module:
        return jsonify({"error": "Module not found"}), 404
    
    return jsonify(module)


@learning_bp.route('/learning/calculate-reward', methods=['POST'])
def calculate_reward():
    """
    Calculate MIC reward for a module completion.
    
    Request body:
        {
            "module_id": "constitutional-ai-101",
            "accuracy": 0.85,
            "streak": 5
        }
    
    Returns:
        Reward calculation with breakdown
    """
    data = request.json or {}
    
    module_id = data.get('module_id')
    accuracy = data.get('accuracy', 0)
    streak = data.get('streak', 0)
    
    # Find module
    module = next((m for m in LEARNING_MODULES if m['id'] == module_id), None)
    if not module:
        return jsonify({"error": "Module not found"}), 404
    
    # Validate accuracy
    if not isinstance(accuracy, (int, float)) or accuracy < 0 or accuracy > 1:
        return jsonify({"error": "Accuracy must be between 0 and 1"}), 400
    
    # Simulate GII (in production, this would come from actual integrity metrics)
    gii = 0.95
    
    # Calculate reward
    reward = calculate_mic_reward(
        base_reward=module['micReward'],
        accuracy=accuracy,
        difficulty=module['difficulty'],
        streak=streak,
        gii=gii
    )
    
    return jsonify({
        "module_id": module_id,
        "module_title": module['title'],
        **reward
    })


@learning_bp.route('/learning/complete', methods=['POST'])
def complete_module():
    """
    Record module completion and calculate rewards.
    
    Request body:
        {
            "module_id": "constitutional-ai-101",
            "accuracy": 0.85,
            "questions_answered": 3,
            "correct_answers": 2,
            "time_spent_seconds": 1200,
            "streak": 5
        }
    
    Returns:
        Completion result with MIC reward
    """
    data = request.json or {}
    
    module_id = data.get('module_id')
    accuracy = data.get('accuracy', 0)
    questions_answered = data.get('questions_answered', 0)
    correct_answers = data.get('correct_answers', 0)
    time_spent = data.get('time_spent_seconds', 0)
    streak = data.get('streak', 0)
    
    # Find module
    module = next((m for m in LEARNING_MODULES if m['id'] == module_id), None)
    if not module:
        return jsonify({"error": "Module not found"}), 404
    
    # Validate
    if not isinstance(accuracy, (int, float)) or accuracy < 0 or accuracy > 1:
        return jsonify({"error": "Accuracy must be between 0 and 1"}), 400
    
    # Simulate GII
    gii = 0.95
    
    # Calculate reward
    reward = calculate_mic_reward(
        base_reward=module['micReward'],
        accuracy=accuracy,
        difficulty=module['difficulty'],
        streak=streak,
        gii=gii
    )
    
    # Calculate XP (2 XP per MIC earned)
    xp_earned = reward.get('mic_earned', 0) * 2
    
    # In production, this would:
    # 1. Verify the completion via session tracking
    # 2. Call the MIC wallet API to mint rewards
    # 3. Update user progress in database
    # 4. Check for badge achievements
    
    return jsonify({
        "status": "completed",
        "module_id": module_id,
        "module_title": module['title'],
        "timestamp": datetime.utcnow().isoformat(),
        "results": {
            "accuracy": accuracy,
            "questions_answered": questions_answered,
            "correct_answers": correct_answers,
            "time_spent_seconds": time_spent
        },
        "rewards": {
            **reward,
            "xp_earned": xp_earned
        },
        "new_streak": streak + 1 if reward.get('mic_earned', 0) > 0 else 0
    })


@learning_bp.route('/learning/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    # Simulated GII - in production would come from MII service
    simulated_gii = 0.95
    
    return jsonify({
        "status": "healthy",
        "modules_available": len(LEARNING_MODULES),
        "gii": simulated_gii,
        "circuit_breaker_active": simulated_gii < MIC_CONFIG["gii_thresholds"]["halt"],
        "reward_config": {
            "minimum_accuracy": MIC_CONFIG["minimum_accuracy"],
            "difficulty_multipliers": MIC_CONFIG["difficulty_multipliers"]
        }
    })
