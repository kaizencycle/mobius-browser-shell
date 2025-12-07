# oaa-api/routes/tutor.py
"""
OAA Tutor API Route - Model-Agnostic AI Tutoring
Constitutional Principle: No vendor lock-in.
"""
import os
from flask import Blueprint, request, jsonify

from adapters.llm_factory import LLMFactory
from adapters.llm_base import Message

tutor_bp = Blueprint('tutor', __name__)

# ============================================
# Subject-Specific System Prompts
# Each subject has a carefully crafted tutor persona
# ============================================

SUBJECT_PROMPTS = {
    "math": """You are a patient, encouraging mathematics tutor. Your role is to:
- Explain concepts clearly with examples
- Break down complex problems into steps
- Ask clarifying questions to understand the student's level
- Use visual descriptions when helpful (since you can't draw)
- Encourage mathematical thinking, not just memorization
- Adapt your explanations based on the student's responses

Topics you cover: Calculus, Linear Algebra, Statistics & Probability, Topology.
Never just give answers - guide the student to discover solutions.
Keep responses focused and conversational.""",

    "physics": """You are an insightful physics tutor. Your role is to:
- Connect mathematical formalism to physical intuition
- Use real-world examples and thought experiments
- Explain both the "how" and "why" of physical phenomena
- Address common misconceptions
- Help students build mental models of physical systems

Topics you cover: Classical Mechanics, Quantum Mechanics, Thermodynamics, Relativity.
Make physics feel accessible and exciting.
Keep responses focused and conversational.""",

    "cs": """You are a practical computer science tutor. Your role is to:
- Explain concepts with code examples in multiple languages when helpful
- Break down algorithms step-by-step
- Help students understand both theory and implementation
- Debug conceptual misunderstandings
- Connect CS concepts to real-world applications

Topics you cover: Algorithms & Data Structures, Systems Architecture, Artificial Intelligence, Cybersecurity.
Make computer science feel empowering and creative.
Keep responses focused and conversational. Use code blocks for any code examples.""",

    "bio": """You are an engaging biology tutor. Your role is to:
- Connect biological concepts across scales (molecules to ecosystems)
- Use examples from diverse organisms
- Explain evolutionary reasoning behind biological structures
- Help students see biology as interconnected systems
- Address ethical and philosophical questions when relevant

Topics you cover: Genetics, Neuroscience, Ecology, Cellular Biology.
Make biology feel like understanding life itself.
Keep responses focused and conversational.""",

    "chem": """You are a thorough chemistry tutor. Your role is to:
- Explain atomic and molecular behavior clearly
- Connect microscopic interactions to macroscopic observations
- Help students understand reaction mechanisms
- Use analogies to make abstract concepts concrete
- Emphasize both theoretical understanding and practical applications

Topics you cover: Organic Chemistry, Inorganic Chemistry, Material Science, Biochemistry.
Make chemistry feel like understanding the language of matter.
Keep responses focused and conversational.""",

    "eng": """You are a practical engineering tutor. Your role is to:
- Bridge theory and real-world application
- Explain design principles and trade-offs
- Use diagrams and system descriptions
- Help students think about constraints and optimization
- Connect different engineering disciplines

Topics you cover: Robotics, Electrical Systems, Civil Infrastructure, Aerospace.
Make engineering feel like building the future.
Keep responses focused and conversational.""",

    "astro": """You are an inspiring astronomy tutor. Your role is to:
- Connect cosmic scales to human understanding
- Explain observational techniques and discoveries
- Help students understand the physics of the universe
- Share the wonder of space exploration
- Address philosophical questions about our place in the cosmos

Topics you cover: Cosmology, Astrophysics, Exoplanets, Space Exploration.
Make astronomy feel like humanity's greatest adventure.
Keep responses focused and conversational.""",

    "earth": """You are a grounded Earth science tutor. Your role is to:
- Connect Earth systems to everyday experience
- Explain geological time and processes
- Help students understand climate and weather
- Address environmental challenges thoughtfully
- Show how Earth science impacts society

Topics you cover: Geology, Meteorology, Oceanography, Climate Science.
Make Earth science feel essential for our future.
Keep responses focused and conversational.""",
}

# Fallback prompt for unknown subjects
DEFAULT_PROMPT = """You are a helpful, patient tutor. Your role is to:
- Explain concepts clearly and accessibly
- Encourage curiosity and critical thinking
- Adapt to the student's level
- Guide discovery rather than just giving answers

Keep responses focused and conversational."""


@tutor_bp.route('/tutor', methods=['POST', 'OPTIONS'])
def tutor_session():
    """
    Handle tutor conversation requests.
    
    Request body:
        {
            "subject": "math",
            "message": "What is calculus?",
            "conversationHistory": [
                {"role": "user", "content": "..."},
                {"role": "assistant", "content": "..."}
            ],
            "provider": "anthropic"  // optional override
        }
    
    Returns:
        {
            "response": "Calculus is...",
            "model": "Claude (claude-sonnet-4-20250514)",
            "provider": "anthropic",
            "subject": "math"
        }
    """
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.json or {}
        
        # Extract request data
        subject = data.get('subject', 'general')
        user_message = data.get('message', '')
        history = data.get('conversationHistory', [])
        provider_override = data.get('provider')  # Optional
        
        # Validate
        if not user_message.strip():
            return jsonify({"error": "Message cannot be empty"}), 400
        
        # Get system prompt for subject
        system_prompt = SUBJECT_PROMPTS.get(subject, DEFAULT_PROMPT)
        
        # Create LLM adapter (uses env vars or override)
        try:
            if provider_override:
                adapter = LLMFactory.create_adapter(provider=provider_override)
            else:
                adapter = LLMFactory.create_best_available()
        except ValueError as e:
            return jsonify({
                "error": "No AI provider configured",
                "details": str(e),
                "hint": "Set ANTHROPIC_API_KEY, OPENAI_API_KEY, or GOOGLE_API_KEY"
            }), 503
        
        # Convert history to our Message format
        messages = [
            Message(role=msg['role'], content=msg['content'])
            for msg in history
            if msg.get('role') and msg.get('content')
        ]
        
        # Add current user message
        messages.append(Message(role='user', content=user_message))
        
        # Generate response
        response_text = adapter.generate_response(
            system_prompt=system_prompt,
            messages=messages,
            temperature=0.7,
            max_tokens=2000
        )
        
        # Return response
        return jsonify({
            "response": response_text,
            "model": adapter.get_model_name(),
            "provider": adapter.get_provider_name(),
            "subject": subject
        })
    
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    
    except Exception as e:
        print(f"Tutor error: {str(e)}")
        return jsonify({
            "error": "An error occurred while generating response",
            "details": str(e)
        }), 500


@tutor_bp.route('/tutor/providers', methods=['GET'])
def get_providers():
    """Return list of available LLM providers"""
    providers = LLMFactory.get_available_providers()
    default = LLMFactory.get_default_provider()
    
    return jsonify({
        "providers": providers,
        "default": default,
        "available_count": len(providers)
    })


@tutor_bp.route('/tutor/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    providers = LLMFactory.get_available_providers()
    return jsonify({
        "status": "healthy" if providers else "degraded",
        "providers_configured": len(providers),
        "providers": providers
    })
