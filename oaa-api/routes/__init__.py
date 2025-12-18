# OAA API Routes
from .tutor import tutor_bp
from .civic_radar import civic_radar_bp
from .jade import jade_bp
from .learning import learning_bp
from .wallet import wallet_bp
from .inquiry import inquiry_bp

__all__ = ['tutor_bp', 'civic_radar_bp', 'jade_bp', 'learning_bp', 'wallet_bp', 'inquiry_bp']
