"""
ATLAS-SHELL Consensus — Covenant scoring and peer protocol.
"""

from .covenant_score import compute_covenant_score
from .peer_protocol import notify_peer_sentinel

__all__ = [
    "compute_covenant_score",
    "notify_peer_sentinel",
]
