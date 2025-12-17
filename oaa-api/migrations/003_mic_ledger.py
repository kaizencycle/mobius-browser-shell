"""
Add MIC Ledger Table

Revision ID: 003_mic_ledger
Revises: 002_stem_modules
Create Date: 2025-12-17

This migration adds the MIC (Mobius Integrity Credits) ledger table
for tracking all MIC earning events. The ledger is:

- Append-only: Events are NEVER updated or deleted
- Source of truth: Wallet balance is DERIVED by summing ledger entries
- Auditable: Every MIC change has a traceable entry

Schema Overview:
----------------
mic_ledger
├── id (UUID) - Primary key, unique identifier
├── user_id (String) - The user who earned/lost MIC
├── amount (Decimal) - MIC amount (+positive for earning, -negative for corrections)
├── reason (Enum) - Category: LEARN, EARN, CORRECTION, BONUS, REFLECTION, CIVIC
├── source (String) - Specific source (e.g., 'learning_module_completion')
├── meta (JSON) - Additional context about the transaction
├── integrity_score (Decimal) - User's integrity score at time of earning
├── gii (Decimal) - Global Integrity Index at time of earning
└── created_at (Timestamp) - When the entry was created

Wallet Balance Calculation:
--------------------------
SELECT SUM(amount) FROM mic_ledger WHERE user_id = ?

This ensures:
1. Complete auditability - every MIC change is traceable
2. No balance manipulation - can't change history
3. Corrections are explicit - negative amounts for deductions
4. Integrity-backed - GII and integrity_score recorded per transaction

Implementation Notes:
--------------------
Currently using in-memory storage in routes/wallet.py for development.
In production, replace MIC_LEDGER list with actual database operations.
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid


# Revision identifiers
revision = '003_mic_ledger'
down_revision = '002_stem_modules'
branch_labels = None
depends_on = None


def upgrade():
    """Create MIC ledger table for tracking MIC transactions."""
    
    # Create enum type for MIC reasons
    mic_reason = sa.Enum(
        'LEARN', 'EARN', 'CORRECTION', 'BONUS', 'REFLECTION', 'CIVIC',
        name='mic_reason'
    )
    mic_reason.create(op.get_bind(), checkfirst=True)
    
    # Create the MIC ledger table
    op.create_table(
        'mic_ledger',
        
        # Primary key
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        
        # User reference
        sa.Column('user_id', sa.String(255), nullable=False, index=True),
        
        # Transaction details
        sa.Column('amount', sa.Numeric(10, 2), nullable=False),
        sa.Column('reason', mic_reason, nullable=False),
        sa.Column('source', sa.String(255), nullable=False),
        sa.Column('meta', JSONB, nullable=True),
        
        # Integrity metrics at time of transaction
        sa.Column('integrity_score', sa.Numeric(3, 4), nullable=False),
        sa.Column('gii', sa.Numeric(3, 4), nullable=False),
        
        # Timestamp (append-only, no update)
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now(), nullable=False),
        
        # No foreign keys - ledger is self-contained for integrity
    )
    
    # Index for efficient wallet balance queries
    op.create_index(
        'idx_mic_ledger_user_created',
        'mic_ledger',
        ['user_id', 'created_at']
    )
    
    # Index for reason-based queries (e.g., total LEARN rewards)
    op.create_index(
        'idx_mic_ledger_reason',
        'mic_ledger',
        ['reason']
    )
    
    # Index for source-based queries
    op.create_index(
        'idx_mic_ledger_source',
        'mic_ledger',
        ['source']
    )


def downgrade():
    """Remove MIC ledger table."""
    
    # Drop indexes first
    op.drop_index('idx_mic_ledger_source')
    op.drop_index('idx_mic_ledger_reason')
    op.drop_index('idx_mic_ledger_user_created')
    
    # Drop table
    op.drop_table('mic_ledger')
    
    # Drop enum type
    op.execute('DROP TYPE IF EXISTS mic_reason')


# ===================
# Usage Examples
# ===================
#
# Insert a learning completion entry:
# -----------------------------------
# INSERT INTO mic_ledger (id, user_id, amount, reason, source, meta, integrity_score, gii)
# VALUES (
#   gen_random_uuid(),
#   'user_123456',
#   42.00,
#   'LEARN',
#   'learning_module_completion',
#   '{"module_id": "constitutional-ai-101", "accuracy": 0.85}'::jsonb,
#   0.85,
#   0.95
# );
#
# Get wallet balance:
# ------------------
# SELECT SUM(amount) as balance
# FROM mic_ledger
# WHERE user_id = 'user_123456';
#
# Get recent events:
# -----------------
# SELECT *
# FROM mic_ledger
# WHERE user_id = 'user_123456'
# ORDER BY created_at DESC
# LIMIT 20;
#
# Get total earned by reason:
# --------------------------
# SELECT reason, SUM(amount) as total
# FROM mic_ledger
# WHERE user_id = 'user_123456' AND amount > 0
# GROUP BY reason;
