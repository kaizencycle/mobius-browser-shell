# oaa-api/app.py
"""
OAA API - Model-Agnostic AI Tutoring System
Mobius Systems - Constitutional AI Architecture

Start with: python app.py
Or with gunicorn: gunicorn app:app
"""
import os
from flask import Flask, jsonify
from flask_cors import CORS

from routes.tutor import tutor_bp

# Create Flask app
app = Flask(__name__)

# Enable CORS for all routes (frontend can call from any origin)
CORS(app, resources={
    r"/api/*": {
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Register blueprints
app.register_blueprint(tutor_bp, url_prefix='/api')


# ============================================
# Root Routes
# ============================================

@app.route('/')
def index():
    """API root - returns basic info"""
    return jsonify({
        "name": "OAA API",
        "version": "1.0.0",
        "description": "Model-Agnostic AI Tutoring System",
        "endpoints": {
            "tutor": "/api/tutor",
            "providers": "/api/tutor/providers",
            "health": "/api/tutor/health"
        },
        "docs": "POST /api/tutor with {subject, message, conversationHistory}"
    })


@app.route('/health')
def health():
    """Simple health check"""
    return jsonify({"status": "ok"})


# ============================================
# Error Handlers
# ============================================

@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Not found"}), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error"}), 500


# ============================================
# Main Entry Point
# ============================================

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    
    print(f"""
╔══════════════════════════════════════════════════════════════╗
║                    OAA API Server                             ║
║              Model-Agnostic AI Tutoring                       ║
╠══════════════════════════════════════════════════════════════╣
║  Port: {port}                                                   ║
║  Debug: {debug}                                                 ║
║                                                              ║
║  Endpoints:                                                  ║
║    POST /api/tutor          - Chat with AI tutor             ║
║    GET  /api/tutor/providers - List available providers      ║
║    GET  /api/tutor/health   - Health check                   ║
║                                                              ║
║  Environment Variables:                                      ║
║    LLM_PROVIDER     - Default provider (anthropic/openai/google)║
║    ANTHROPIC_API_KEY - For Claude                            ║
║    OPENAI_API_KEY    - For GPT                               ║
║    GOOGLE_API_KEY    - For Gemini                            ║
╚══════════════════════════════════════════════════════════════╝
    """)
    
    # Check configured providers
    from adapters.llm_factory import LLMFactory
    providers = LLMFactory.get_available_providers()
    
    if providers:
        print(f"✅ Configured providers: {', '.join(providers)}")
        print(f"✅ Default provider: {LLMFactory.get_default_provider()}")
    else:
        print("⚠️  No LLM providers configured!")
        print("   Set at least one API key environment variable.")
    
    print()
    
    app.run(host='0.0.0.0', port=port, debug=debug)
