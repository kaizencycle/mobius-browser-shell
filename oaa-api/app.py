# oaa-api/app.py
"""
OAA API - Model-Agnostic AI Tutoring System
Mobius Systems - Constitutional AI Architecture

Start with: python app.py
Or with gunicorn: gunicorn app:app
"""
import os
from flask import Flask, jsonify, request
from flask_cors import CORS

from routes.tutor import tutor_bp
from routes.civic_radar import civic_radar_bp
from routes.jade import jade_bp
from routes.learning import learning_bp
from routes.wallet import wallet_bp

# Create Flask app
app = Flask(__name__)

# Enable CORS for all routes with explicit configuration
# This handles preflight (OPTIONS) requests properly
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
        "expose_headers": ["Content-Type", "Authorization"],
        "supports_credentials": False,
        "max_age": 86400  # Cache preflight for 24 hours
    }
})


@app.after_request
def add_cors_headers(response):
    """
    Ensure CORS headers are always present on all responses.
    This is a fallback to guarantee preflight requests work.
    """
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Accept, Origin, X-Requested-With'
    response.headers['Access-Control-Max-Age'] = '86400'
    return response


@app.before_request
def handle_preflight():
    """
    Handle preflight OPTIONS requests explicitly.
    This ensures CORS preflight requests always succeed.
    """
    if request.method == 'OPTIONS':
        response = app.make_default_options_response()
        return response

# Register blueprints
app.register_blueprint(tutor_bp, url_prefix='/api')
app.register_blueprint(civic_radar_bp, url_prefix='/api')
app.register_blueprint(jade_bp, url_prefix='/api')
app.register_blueprint(learning_bp, url_prefix='/api')
app.register_blueprint(wallet_bp, url_prefix='/api')  # MIC Wallet & Ledger


# ============================================
# Root Routes
# ============================================

@app.route('/')
def index():
    """API root - returns basic info"""
    return jsonify({
        "name": "OAA API",
        "version": "1.4.0",
        "description": "Model-Agnostic AI Tutoring System + Civic Intelligence + Pattern Oracle + Learning Hub + MIC Wallet",
        "endpoints": {
            "tutor": "/api/tutor",
            "providers": "/api/tutor/providers",
            "health": "/api/tutor/health",
            "civic_radar": "/api/civic-radar",
            "civic_radar_categories": "/api/civic-radar/categories",
            "civic_radar_health": "/api/civic-radar/health",
            "jade": "/api/jade",
            "jade_health": "/api/jade/health",
            "learning_modules": "/api/learning/modules",
            "learning_complete": "/api/learning/complete",
            "learning_health": "/api/learning/health",
            "mic_wallet": "/api/mic/wallet",
            "mic_events": "/api/mic/events",
            "mic_earn": "/api/mic/earn",
            "mic_ledger": "/api/mic/ledger",
            "mic_health": "/api/mic/health"
        },
        "docs": {
            "tutor": "POST /api/tutor with {subject, message, conversationHistory}",
            "civic_radar": "GET /api/civic-radar?limit=5&min_severity=medium&categories=security,breach",
            "jade": "POST /api/jade with {message, history[], reflections_context[]}",
            "learning": "GET /api/learning/modules, POST /api/learning/complete with {module_id, accuracy, streak}",
            "mic_wallet": "GET /api/mic/wallet (requires Bearer token) - Get wallet balance",
            "mic_earn": "POST /api/mic/earn with {source, meta} - Earn MIC for completed actions"
        }
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
║                    OAA API Server v1.4.0                      ║
║    Model-Agnostic AI + Civic Intelligence + MIC Wallet        ║
╠══════════════════════════════════════════════════════════════╣
║  Port: {port}                                                   ║
║  Debug: {debug}                                                 ║
║                                                              ║
║  Tutor Endpoints:                                            ║
║    POST /api/tutor          - Chat with AI tutor             ║
║    GET  /api/tutor/providers - List available providers      ║
║                                                              ║
║  Learning Endpoints:                                         ║
║    GET  /api/learning/modules - List learning modules        ║
║    POST /api/learning/complete - Complete module + earn MIC  ║
║                                                              ║
║  MIC Wallet Endpoints (NEW):                                 ║
║    GET  /api/mic/wallet     - Get wallet balance (auth req)  ║
║    GET  /api/mic/events     - Get recent earnings            ║
║    POST /api/mic/earn       - Earn MIC for actions           ║
║    GET  /api/mic/ledger     - Full ledger history            ║
║    GET  /api/mic/health     - Wallet system health           ║
║                                                              ║
║  Civic Radar / JADE:                                         ║
║    GET /api/civic-radar     - Security intelligence feed     ║
║    POST /api/jade           - Speak with Jade                ║
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
