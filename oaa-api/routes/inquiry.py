# oaa-api/routes/inquiry.py
"""
OAA Inquiry Chat API Route - Conversational AI Interface
Constitutional Principle: Open inquiry for all.

Provides a conversational chat interface for Mobius Systems.
Supports Anthropic Claude, OpenAI, and Google Gemini providers.
"""
import os
from flask import Blueprint, request, jsonify

from adapters.llm_factory import LLMFactory
from adapters.llm_base import Message

inquiry_bp = Blueprint('inquiry', __name__)

# ============================================
# System Prompt for Inquiry Chat
# ============================================

INQUIRY_SYSTEM_PROMPT = """You are a helpful AI assistant for Mobius Systems, a civic AI infrastructure platform focused on integrity-first AI and democratic superintelligence.

Key concepts you should know:
- **MIC (Mobius Integrity Credits)**: Work-backed universal basic income earned through learning and demonstrating integrity. When users complete learning modules with high accuracy and maintain good integrity scores, they earn MIC.

- **Three Covenants**: The foundational principles of Mobius Systems:
  1. Integrity - Truth-telling, honest interactions, and alignment with beneficial outcomes
  2. Ecology - Regenerative rather than extractive systems, sustainable for the long term
  3. Custodianship - Long-term thinking for future generations

- **MII (Mobius Integrity Index)**: A measure of individual integrity based on truthfulness, consistency, and alignment with collective benefit.

- **GII (Global Integrity Index)**: Reflects the overall health and integrity of the entire Mobius ecosystem.

- **Learn-to-Earn**: Educational system where users complete modules on topics like Constitutional AI, Neural Networks, Cryptography, and more to earn MIC.

- **Constitutional AI**: AI systems designed with built-in ethical guidelines and integrity constraints.

- **Democratic Superintelligence**: The vision of AI that serves humanity through transparent, integrity-backed governance.

Your personality:
- Be conversational, warm, and helpful
- Explain complex topics in accessible ways
- Encourage curiosity and learning
- Connect topics back to integrity and civic benefit when relevant
- Be honest about limitations
- Keep responses focused and not overly long (2-4 paragraphs typically)

You can help with:
- Explaining how MIC works
- Guiding users through the Learn & Earn system
- Discussing AI alignment and safety
- Explaining the Three Covenants
- Answering questions about Mobius Systems
- General educational topics

Remember: Every interaction is an opportunity to demonstrate and encourage integrity."""


# ============================================
# Mock Responses for Testing
# ============================================

def generate_mock_response(message: str) -> str:
    """
    Generate intelligent mock responses for testing.
    Used when no LLM provider is configured.
    """
    lower_message = message.lower()

    # Topic detection with contextual responses
    if 'mic' in lower_message or 'credit' in lower_message:
        return """MIC (Mobius Integrity Credits) are work-backed universal basic income earned through learning and demonstrating integrity.

When you complete learning modules with high accuracy and maintain good integrity scores, you earn MIC that's automatically credited to your wallet.

The amount earned is calculated as:
**MIC = base_reward × accuracy × integrity_score × global_integrity_index**

Would you like to know more about how integrity is measured or how to start earning?"""

    if 'integrity' in lower_message:
        return """Integrity in Mobius Systems means:

1. **Truthfulness**: Honest interactions and accurate information
2. **Consistency**: Reliable behavior over time  
3. **Alignment**: Actions that benefit the collective

Your integrity score affects your MIC earnings. Higher integrity = more rewards!

It's measured through:
- Quiz accuracy and honest attempts
- System participation quality
- Contribution value to the community

The Global Integrity Index (GII) reflects the overall health of the entire ecosystem."""

    if 'learn' in lower_message or 'earn' in lower_message or 'module' in lower_message:
        return """The Learn & Earn system lets you earn MIC by completing educational modules!

**Current topics include:**
- Constitutional AI & Governance
- Neural Networks & Deep Learning
- Cryptography & Blockchain
- Quantum Computing
- Climate Science & AI

**How it works:**
1. Complete a module by reading the content
2. Take the quiz (need 70%+ to earn)
3. MIC is automatically credited to your wallet!

Your earnings are based on quiz accuracy, your integrity score, and global system health (GII).

Ready to start learning and earning?"""

    if 'covenant' in lower_message or 'three' in lower_message:
        return """The **Three Covenants** are the foundational principles of Mobius Systems:

**1. Integrity** 🔷
Truth-telling and alignment. Every action should be honest and benefit the collective.

**2. Ecology** 🌱
Regenerative rather than extractive. Our systems should give back more than they take.

**3. Custodianship** 🛡️
Long-term thinking for future generations. We're stewards, not owners.

These aren't just ideals—they're encoded into how MIC works, how integrity is measured, and how governance decisions are made.

*"We heal as we walk."*"""

    if 'hello' in lower_message or 'hi' in lower_message or 'hey' in lower_message:
        return """Hello! 👋 I'm here to help you explore Mobius Systems and answer any questions.

**Some things I can help with:**
- Explaining how MIC works
- Guiding you through Learn & Earn
- Discussing AI alignment and integrity
- Explaining the Three Covenants
- Answering questions about your wallet

What would you like to know?"""

    if 'mobius' in lower_message:
        return """**Mobius Systems** is civic AI infrastructure designed for the long term.

Our core mission: Build democratic superintelligence that serves humanity through integrity-backed economics.

**Key components:**
- **MIC**: Work-backed currency earned through learning
- **Integrity Indexing**: Measuring and rewarding truthful behavior
- **Learn & Earn**: Education system that pays you to learn
- **Constitutional AI**: AI with built-in ethical guidelines

We're not just building technology—we're building a new way of relating to AI and to each other.

*Built with the Three Covenants* 🌊"""

    if 'wallet' in lower_message or 'balance' in lower_message:
        return """Your **MIC Wallet** tracks all your earnings and transactions.

**What you can see:**
- Current balance in MIC
- Recent earning events (from completing modules)
- Transaction history
- Integrity score impact

**How to earn more:**
- Complete learning modules with high accuracy
- Maintain a high integrity score
- Participate regularly in the ecosystem

The Wallet tab in the navigation shows your full dashboard!"""

    if 'ai' in lower_message or 'alignment' in lower_message or 'safety' in lower_message:
        return """**AI Alignment** is about ensuring AI systems do what we actually want—not just what we literally ask for.

Mobius approaches this through:

1. **Constitutional AI**: Building ethical guidelines directly into the AI
2. **Integrity Incentives**: Rewarding truthful, beneficial behavior with MIC
3. **Democratic Governance**: Community oversight of AI decisions
4. **Transparency**: Open about how systems work

We believe alignment isn't just a technical problem—it's a social and economic one. That's why MIC exists.

Want to dive deeper into any of these concepts?"""

    # Generic helpful response
    return """That's an interesting question! I'd be happy to help you explore that topic.

Mobius Systems is built on three core principles (the Three Covenants):
1. **Integrity** - Truth-telling and alignment
2. **Ecology** - Regenerative rather than extractive systems
3. **Custodianship** - Long-term thinking for future generations

We're building democratic superintelligence infrastructure where AI serves humanity through integrity-backed economics.

Could you tell me more about what specifically interests you? I can dive deeper into:
- How our learn-to-earn system works
- The technology behind MIC (Mobius Integrity Credits)
- AI alignment and safety
- Or anything else you're curious about!"""


# ============================================
# API Endpoint
# ============================================

@inquiry_bp.route('/inquiry/chat', methods=['POST', 'OPTIONS'])
def inquiry_chat():
    """
    Handle conversational inquiry requests.
    
    Request body:
        {
            "message": "What is MIC?",
            "history": [
                {"role": "user", "content": "..."},
                {"role": "assistant", "content": "..."}
            ]
        }
    
    Returns:
        {
            "success": true,
            "response": "MIC stands for...",
            "model": "Claude (claude-sonnet-4-20250514)",
            "provider": "anthropic"
        }
    """
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.json or {}
        
        # Extract request data
        user_message = data.get('message', '')
        history = data.get('history', [])
        
        # Validate message
        if not user_message or not isinstance(user_message, str):
            return jsonify({
                "error": "Message is required",
                "success": False
            }), 400
        
        user_message = user_message.strip()
        if not user_message:
            return jsonify({
                "error": "Message cannot be empty",
                "success": False
            }), 400
        
        # Try to use an LLM provider
        try:
            adapter = LLMFactory.create_best_available()
            
            # Convert history to our Message format (limit to last 10 for context)
            messages = []
            for msg in history[-10:]:
                if msg.get('role') and msg.get('content'):
                    messages.append(Message(
                        role=msg['role'],
                        content=msg['content']
                    ))
            
            # Add current user message
            messages.append(Message(role='user', content=user_message))
            
            # Generate response
            response_text = adapter.generate_response(
                system_prompt=INQUIRY_SYSTEM_PROMPT,
                messages=messages,
                temperature=0.7,
                max_tokens=1024
            )
            
            return jsonify({
                "success": True,
                "response": response_text,
                "model": adapter.get_model_name(),
                "provider": adapter.get_provider_name()
            })
            
        except ValueError:
            # No LLM provider configured - use mock responses
            response_text = generate_mock_response(user_message)
            
            return jsonify({
                "success": True,
                "response": response_text,
                "model": "Mobius Mock (No API key configured)",
                "provider": "mock"
            })
    
    except Exception as e:
        print(f"Inquiry chat error: {str(e)}")
        return jsonify({
            "error": "An error occurred while processing your inquiry",
            "details": str(e),
            "success": False
        }), 500


@inquiry_bp.route('/inquiry/health', methods=['GET'])
def inquiry_health():
    """Health check endpoint for inquiry service"""
    providers = LLMFactory.get_available_providers()
    
    return jsonify({
        "status": "healthy" if providers else "degraded",
        "service": "inquiry-chat",
        "providers_configured": len(providers),
        "providers": providers,
        "fallback_available": True  # Mock responses always available
    })
