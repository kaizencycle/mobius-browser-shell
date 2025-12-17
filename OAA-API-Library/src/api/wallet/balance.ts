/**
 * Mobius Systems - Wallet Balance API Endpoint
 * 
 * GET /api/wallet/balance
 * 
 * Returns the user's MIC wallet balance (derived from ledger)
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/auth/authService.js';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth.js';

const router = Router();

/**
 * GET /api/wallet/balance
 * 
 * Requires: Authorization: Bearer <token>
 * 
 * Response:
 * {
 *   "success": true,
 *   "wallet": {
 *     "publicKey": "base64-public-key",
 *     "address": "mob1...",
 *     "balance": 1234.56,
 *     "totalEarned": 2000.00,
 *     "totalSpent": 765.44,
 *     "eventCount": 42,
 *     "lastUpdated": "2024-01-15T12:00:00Z"
 *   }
 * }
 */
router.get('/balance', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.userId;
    
    // Get wallet with ledger entries
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: {
        ledgerEntries: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    
    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found',
      });
    }
    
    // Calculate derived values from ledger
    const totalEarned = wallet.ledgerEntries
      .filter(e => e.amount > 0)
      .reduce((sum, e) => sum + e.amount, 0);
    
    const totalSpent = wallet.ledgerEntries
      .filter(e => e.amount < 0)
      .reduce((sum, e) => sum + Math.abs(e.amount), 0);
    
    const balance = totalEarned - totalSpent;
    
    // Derive address from public key
    const truncated = wallet.publicKey.slice(0, 20).replace(/[+/=]/g, '');
    const address = `mob1${truncated}`;
    
    // Get last update time
    const lastEntry = wallet.ledgerEntries[0];
    const lastUpdated = lastEntry?.createdAt || wallet.createdAt;
    
    // Update cached balance (for performance in future queries)
    if (wallet.cachedBalance !== balance) {
      await prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          cachedBalance: balance,
          lastBalanceSync: new Date(),
        },
      });
    }
    
    return res.status(200).json({
      success: true,
      wallet: {
        publicKey: wallet.publicKey,
        address,
        balance: Math.round(balance * 100) / 100,
        totalEarned: Math.round(totalEarned * 100) / 100,
        totalSpent: Math.round(totalSpent * 100) / 100,
        eventCount: wallet.ledgerEntries.length,
        lastUpdated: lastUpdated.toISOString(),
        isFounderWallet: wallet.isFounderWallet,
      },
    });
  } catch (error) {
    console.error('Wallet balance endpoint error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/wallet/history
 * 
 * Returns paginated ledger history
 * 
 * Query params:
 *   limit: number (default: 20, max: 100)
 *   offset: number (default: 0)
 */
router.get('/history', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.userId;
    
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    
    // Get wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    });
    
    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found',
      });
    }
    
    // Get ledger entries with pagination
    const [entries, total] = await Promise.all([
      prisma.mICLedger.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.mICLedger.count({
        where: { walletId: wallet.id },
      }),
    ]);
    
    return res.status(200).json({
      success: true,
      history: {
        entries: entries.map(e => ({
          id: e.id,
          amount: e.amount,
          reason: e.reason,
          source: e.source,
          meta: e.meta,
          integrityScore: e.integrityScore,
          gii: e.gii,
          txHash: e.txHash,
          anchoredAt: e.anchoredAt,
          createdAt: e.createdAt.toISOString(),
        })),
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
    });
  } catch (error) {
    console.error('Wallet history endpoint error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/wallet/earn
 * 
 * Record a MIC earning event
 * Used by frontend to record completed actions
 */
router.post('/earn', authMiddleware, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.userId;
    
    const { source, amount, meta } = req.body;
    
    if (!source) {
      return res.status(400).json({
        success: false,
        error: 'Source is required',
      });
    }
    
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be a positive number',
      });
    }
    
    // Get wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    });
    
    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found',
      });
    }
    
    // Determine reason from source
    let reason = 'EARN';
    if (source.startsWith('learning') || source.startsWith('oaa')) {
      reason = 'LEARN';
    } else if (source.startsWith('reflection')) {
      reason = 'REFLECTION';
    } else if (source.startsWith('civic') || source.startsWith('shield')) {
      reason = 'CIVIC';
    }
    
    // Create ledger entry
    const entry = await prisma.mICLedger.create({
      data: {
        walletId: wallet.id,
        amount,
        reason,
        source,
        meta: meta || {},
        integrityScore: 1.0,
        gii: 0.95, // Would come from real GII in production
      },
    });
    
    // Update cached balance
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        cachedBalance: { increment: amount },
        lastBalanceSync: new Date(),
      },
    });
    
    return res.status(201).json({
      success: true,
      entry: {
        id: entry.id,
        amount: entry.amount,
        reason: entry.reason,
        source: entry.source,
        createdAt: entry.createdAt.toISOString(),
      },
      newBalance: wallet.cachedBalance + amount,
    });
  } catch (error) {
    console.error('Wallet earn endpoint error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;
