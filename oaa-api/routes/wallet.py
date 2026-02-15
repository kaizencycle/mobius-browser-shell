# oaa-api/routes/wallet.py
"""
MIC Wallet & Ledger API
Append-only ledger for MIC (Mobius Integrity Credits) with derived wallet balances.

Constitutional Principle: Integrity-backed currency requires transparent, auditable records.

Architecture:
- MIC Ledger: Append-only source of truth (never update, only append)
- Wallet Balance: DERIVED from ledger (sum of events), never stored directly
- This ensures complete auditability and prevents balance manipulation
"""
import os
import uuid
from datetime import datetime
from typing import Dict, List, Optional
from flask import Blueprint, request, jsonify
from functools import wraps

wallet_bp = Blueprint('wallet', __name__)

# ============================================
# MIC Ledger - In-Memory Store
# In production, this would be a database table
# ============================================

# Append-only ledger entries
# Format: { id, user_id, amount, reason, source, meta, integrity_score, gii, created_at }
MIC_LEDGER: List[Dict] = []

# Reason types for ledger entries
class MICReason:
    LEARN = "LEARN"           # Learning module completion
    EARN = "EARN"             # Generic earning event
    CORRECTION = "CORRECTION"  # Manual correction (can be positive or negative)
    BONUS = "BONUS"           # Bonus rewards (streaks, perfect scores, etc.)
    REFLECTION = "REFLECTION"  # Reflection completion
    CIVIC = "CIVIC"           # Civic engagement rewards

# MIC minting configuration
MIC_CONFIG = {
    "gii_threshold_healthy": 0.90,    # Full rewards
    "gii_threshold_warning": 0.75,    # 80% rewards
    "gii_threshold_critical": 0.60,   # 50% rewards
    "gii_threshold_halt": 0.50,       # No rewards - circuit breaker
    
    # Source-specific base rewards
    "source_rewards": {
        "oaa_tutor_question": 2,
        "oaa_tutor_session_complete": 5,
        "reflection_entry_created": 3,
        "reflection_phase_complete": 5,
        "reflection_entry_complete": 10,
        "reflection_spark": 4,
        "reflection_geist_mode": 7,
        "reflection_epiphany": 12,
        "shield_module_complete": 15,
        "shield_checklist_item": 2,
        "civic_radar_action_taken": 5,
        "learning_module_completion": 0,  # Dynamic, calculated from module
    }
}

# Simulated GII (Global Integrity Index)
# In production, this would come from real integrity metrics
SIMULATED_GII = 0.95


def get_current_gii() -> float:
    """Get current Global Integrity Index."""
    return SIMULATED_GII


def check_circuit_breaker() -> tuple[bool, str]:
    """
    Check if MIC minting circuit breaker is active.
    Returns (is_active, message)
    """
    gii = get_current_gii()
    
    if gii < MIC_CONFIG["gii_threshold_halt"]:
        return True, f"MIC minting halted - GII ({gii:.3f}) below safe threshold ({MIC_CONFIG['gii_threshold_halt']})"
    
    return False, ""


def calculate_gii_multiplier(gii: float) -> float:
    """Calculate reward multiplier based on current GII."""
    if gii >= MIC_CONFIG["gii_threshold_healthy"]:
        return 1.0
    elif gii >= MIC_CONFIG["gii_threshold_warning"]:
        return 0.8
    elif gii >= MIC_CONFIG["gii_threshold_critical"]:
        return 0.5
    else:
        return 0


def get_user_id_from_token() -> Optional[str]:
    """
    Extract user ID from Authorization header.
    In production, this would validate JWT and extract user_id.
    For now, we use a simplified approach.
    """
    auth_header = request.headers.get('Authorization', '')
    
    if auth_header.startswith('Bearer '):
        token = auth_header[7:]
        # For testing: if token looks like a user ID, use it directly
        # In production: decode JWT and validate
        if token and len(token) > 10:
            # Use a hash of the token as user_id for consistency
            return f"user_{hash(token) % 1000000:06d}"
    
    # For demo/testing without auth, generate consistent user ID from request
    # This allows testing without full auth setup
    return None


def require_auth(f):
    """Decorator to require authentication."""
    @wraps(f)
    def decorated(*args, **kwargs):
        user_id = get_user_id_from_token()
        if not user_id:
            return jsonify({
                "error": "Authentication required",
                "message": "Please provide a valid Bearer token in the Authorization header"
            }), 401
        
        # Add user_id to request context
        request.user_id = user_id
        return f(*args, **kwargs)
    return decorated


# ============================================
# Ledger Write Functions
# ============================================

def write_to_ledger(
    user_id: str,
    amount: float,
    reason: str,
    source: str,
    meta: Optional[Dict] = None,
    integrity_score: float = 1.0
) -> Dict:
    """
    Write a new entry to the MIC ledger.
    This is the ONLY way MIC balances change.
    
    Args:
        user_id: The user's identifier
        amount: Amount of MIC (positive for earning, negative for corrections)
        reason: Category of the transaction (LEARN, EARN, CORRECTION, etc.)
        source: Specific source of the earning (learning_module_completion, etc.)
        meta: Additional metadata about the transaction
        integrity_score: User's integrity score at time of earning (0-1)
    
    Returns:
        The created ledger entry
    """
    # Check circuit breaker
    is_halted, halt_message = check_circuit_breaker()
    if is_halted and amount > 0:  # Only block positive minting
        raise ValueError(halt_message)
    
    gii = get_current_gii()
    
    entry = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "amount": round(amount, 2),
        "reason": reason,
        "source": source,
        "meta": meta or {},
        "integrity_score": round(integrity_score, 4),
        "gii": round(gii, 4),
        "created_at": datetime.utcnow().isoformat() + "Z"
    }
    
    # Append to ledger (NEVER update existing entries)
    MIC_LEDGER.append(entry)
    
    return entry


def get_user_balance(user_id: str) -> float:
    """
    Calculate user's MIC balance from ledger.
    Balance is DERIVED, never stored directly.
    """
    return sum(
        entry["amount"] 
        for entry in MIC_LEDGER 
        if entry["user_id"] == user_id
    )


def get_user_events(user_id: str, limit: int = 20, offset: int = 0) -> List[Dict]:
    """Get user's recent ledger events."""
    user_events = [
        entry for entry in MIC_LEDGER 
        if entry["user_id"] == user_id
    ]
    # Sort by created_at descending (most recent first)
    user_events.sort(key=lambda x: x["created_at"], reverse=True)
    
    return user_events[offset:offset + limit]


def get_user_total_earned(user_id: str) -> float:
    """Calculate total MIC earned (only positive amounts)."""
    return sum(
        entry["amount"] 
        for entry in MIC_LEDGER 
        if entry["user_id"] == user_id and entry["amount"] > 0
    )


# ============================================
# API Routes
# ============================================

@wallet_bp.route('/mic/wallet', methods=['GET'])
@require_auth
def get_wallet():
    """
    Get user's MIC wallet balance and summary.
    
    Balance is DERIVED from ledger, never stored directly.
    This ensures complete auditability.
    
    Returns:
        {
            user_id: string,
            balance: number,
            total_earned: number,
            event_count: number,
            last_updated: string
        }
    """
    user_id = request.user_id
    
    # Get all user events
    user_events = [
        entry for entry in MIC_LEDGER 
        if entry["user_id"] == user_id
    ]
    
    # Calculate derived balance
    balance = sum(entry["amount"] for entry in user_events)
    total_earned = sum(entry["amount"] for entry in user_events if entry["amount"] > 0)
    
    # Get most recent event timestamp
    last_updated = None
    if user_events:
        sorted_events = sorted(user_events, key=lambda x: x["created_at"], reverse=True)
        last_updated = sorted_events[0]["created_at"]
    
    return jsonify({
        "user_id": user_id,
        "balance": round(balance, 2),
        "total_earned": round(total_earned, 2),
        "event_count": len(user_events),
        "last_updated": last_updated,
        "gii": get_current_gii(),
        "circuit_breaker_active": check_circuit_breaker()[0]
    })


@wallet_bp.route('/mic/events', methods=['GET'])
@require_auth
def get_events():
    """
    Get user's recent MIC events (ledger entries).
    
    Query params:
        limit: Maximum number of events to return (default: 20, max: 100)
        offset: Number of events to skip (default: 0)
    
    Returns:
        Array of MIC events
    """
    user_id = request.user_id
    
    limit = min(int(request.args.get('limit', 20)), 100)
    offset = int(request.args.get('offset', 0))
    
    events = get_user_events(user_id, limit, offset)
    
    return jsonify(events)


@wallet_bp.route('/mic/earn', methods=['POST'])
@require_auth
def earn_mic():
    """
    Earn MIC for a completed action.
    
    This is the primary endpoint for the frontend to call when
    a user completes an earning action.
    
    Request body:
        {
            "source": "learning_module_completion",
            "meta": {
                "module_id": "constitutional-ai-101",
                "accuracy": 0.85,
                "mic_earned": 42
            }
        }
    
    Returns:
        The created ledger entry with ledger proof
    """
    user_id = request.user_id
    data = request.json or {}
    
    source = data.get('source')
    meta = data.get('meta', {})
    
    if not source:
        return jsonify({"error": "source is required"}), 400
    
    # Check circuit breaker
    is_halted, halt_message = check_circuit_breaker()
    if is_halted:
        return jsonify({
            "error": "Circuit breaker active",
            "message": halt_message,
            "gii": get_current_gii()
        }), 503
    
    # Calculate MIC amount based on source
    gii = get_current_gii()
    gii_multiplier = calculate_gii_multiplier(gii)
    
    # Get base reward for source
    base_reward = MIC_CONFIG["source_rewards"].get(source, 5)
    
    # For learning completions, use the mic_earned from meta
    if source == "learning_module_completion" and "mic_earned" in meta:
        amount = meta["mic_earned"]
    else:
        # Apply GII multiplier
        amount = round(base_reward * gii_multiplier, 2)
    
    # Determine reason category
    if source.startswith("learning") or source.startswith("oaa"):
        reason = MICReason.LEARN
    elif source.startswith("reflection"):
        reason = MICReason.REFLECTION
    elif source.startswith("civic") or source.startswith("shield"):
        reason = MICReason.CIVIC
    else:
        reason = MICReason.EARN
    
    # Get integrity score from meta or use default
    integrity_score = meta.get('integrity_score', 1.0)
    
    try:
        # Write to ledger
        entry = write_to_ledger(
            user_id=user_id,
            amount=amount,
            reason=reason,
            source=source,
            meta=meta,
            integrity_score=integrity_score
        )
        
        # Add ledger proof to response
        entry_response = {
            **entry,
            "ledger_proof": f"ledger:{entry['id']}",
            "new_balance": round(get_user_balance(user_id), 2)
        }
        
        return jsonify(entry_response), 201
        
    except ValueError as e:
        return jsonify({
            "error": "Minting failed",
            "message": str(e)
        }), 503


@wallet_bp.route('/mic/ledger', methods=['GET'])
@require_auth
def get_ledger():
    """
    Get full ledger history for user (paginated).
    
    Query params:
        limit: Maximum entries (default: 50, max: 200)
        offset: Number to skip (default: 0)
    
    Returns:
        Paginated ledger entries with totals
    """
    user_id = request.user_id
    
    limit = min(int(request.args.get('limit', 50)), 200)
    offset = int(request.args.get('offset', 0))
    
    # Get all user entries
    user_entries = [
        entry for entry in MIC_LEDGER 
        if entry["user_id"] == user_id
    ]
    
    # Sort by created_at descending
    user_entries.sort(key=lambda x: x["created_at"], reverse=True)
    
    total_entries = len(user_entries)
    paginated_entries = user_entries[offset:offset + limit]
    
    return jsonify({
        "total_entries": total_entries,
        "offset": offset,
        "limit": limit,
        "has_more": offset + limit < total_entries,
        "entries": paginated_entries,
        "summary": {
            "balance": round(get_user_balance(user_id), 2),
            "total_earned": round(get_user_total_earned(user_id), 2)
        }
    })


@wallet_bp.route('/mic/health', methods=['GET'])
def mic_health():
    """Health check for MIC/Wallet system."""
    gii = get_current_gii()
    is_halted, halt_message = check_circuit_breaker()
    
    return jsonify({
        "status": "healthy" if not is_halted else "degraded",
        "gii": gii,
        "gii_multiplier": calculate_gii_multiplier(gii),
        "circuit_breaker_active": is_halted,
        "circuit_breaker_message": halt_message if is_halted else None,
        "total_ledger_entries": len(MIC_LEDGER),
        "config": {
            "thresholds": {
                "healthy": MIC_CONFIG["gii_threshold_healthy"],
                "warning": MIC_CONFIG["gii_threshold_warning"],
                "critical": MIC_CONFIG["gii_threshold_critical"],
                "halt": MIC_CONFIG["gii_threshold_halt"]
            }
        }
    })


# ============================================
# Admin/Debug Endpoints (would be protected in production)
# ============================================

@wallet_bp.route('/mic/admin/ledger-stats', methods=['GET'])
def admin_ledger_stats():
    """
    Get aggregate ledger statistics.
    In production, this would require admin authentication.
    """
    if not MIC_LEDGER:
        return jsonify({
            "total_entries": 0,
            "total_minted": 0,
            "unique_users": 0,
            "entries_by_reason": {},
            "entries_by_source": {}
        })
    
    total_minted = sum(e["amount"] for e in MIC_LEDGER if e["amount"] > 0)
    unique_users = len(set(e["user_id"] for e in MIC_LEDGER))
    
    # Count by reason
    entries_by_reason = {}
    for entry in MIC_LEDGER:
        reason = entry["reason"]
        entries_by_reason[reason] = entries_by_reason.get(reason, 0) + 1
    
    # Count by source
    entries_by_source = {}
    for entry in MIC_LEDGER:
        source = entry["source"]
        entries_by_source[source] = entries_by_source.get(source, 0) + 1
    
    return jsonify({
        "total_entries": len(MIC_LEDGER),
        "total_minted": round(total_minted, 2),
        "unique_users": unique_users,
        "entries_by_reason": entries_by_reason,
        "entries_by_source": entries_by_source,
        "gii": get_current_gii()
    })
