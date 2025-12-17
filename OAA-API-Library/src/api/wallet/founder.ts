/**
 * Mobius Systems - Founder Wallet API Endpoint
 * 
 * GET /api/wallet/founder
 * 
 * Returns information about the cryptographically sealed founder wallet
 * The founder wallet has 1M MIC allocated at genesis
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/auth/authService.js';
import { verifyFounderSeal } from '../../lib/crypto/hash.js';

const router = Router();

/**
 * GET /api/wallet/founder
 * 
 * Public endpoint - returns founder wallet info (no private key)
 * 
 * Response:
 * {
 *   "success": true,
 *   "founderWallet": {
 *     "publicKey": "base64-public-key",
 *     "address": "mob1...",
 *     "initialBalance": 1000000,
 *     "sealedAt": "2024-01-15T12:00:00Z",
 *     "sealHash": "sha256-hash",
 *     "verified": true
 *   }
 * }
 */
router.get('/founder', async (_req: Request, res: Response) => {
  try {
    // Get founder wallet from registry
    const founderWallet = await prisma.founderWallet.findFirst({
      where: { verified: true },
      orderBy: { sealedAt: 'asc' }, // Get the first (original) founder wallet
    });
    
    if (!founderWallet) {
      return res.status(200).json({
        success: true,
        founderWallet: null,
        message: 'No founder wallet has been sealed yet. Run the founder wallet generation script.',
      });
    }
    
    // Verify the seal
    const isValid = verifyFounderSeal(
      {
        publicKey: founderWallet.publicKey,
        initialBalance: founderWallet.initialBalance,
        timestamp: founderWallet.sealedAt,
      },
      founderWallet.sealHash
    );
    
    // Derive address from public key
    const truncated = founderWallet.publicKey.slice(0, 20).replace(/[+/=]/g, '');
    const address = `mob1${truncated}`;
    
    return res.status(200).json({
      success: true,
      founderWallet: {
        publicKey: founderWallet.publicKey,
        address,
        initialBalance: founderWallet.initialBalance,
        sealedAt: founderWallet.sealedAt.toISOString(),
        sealHash: founderWallet.sealHash,
        verified: isValid,
        note: 'Private key is NEVER stored. Only the founder can spend from this wallet.',
      },
    });
  } catch (error) {
    console.error('Founder wallet endpoint error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/wallet/founder/verify
 * 
 * Verify a signature from the founder wallet
 * Used to prove the founder controls the private key
 */
router.post('/founder/verify', async (req: Request, res: Response) => {
  try {
    const { message, signature, publicKey } = req.body;
    
    if (!message || !signature || !publicKey) {
      return res.status(400).json({
        success: false,
        error: 'Message, signature, and publicKey are required',
      });
    }
    
    // Get founder wallet to verify the public key matches
    const founderWallet = await prisma.founderWallet.findUnique({
      where: { publicKey },
    });
    
    if (!founderWallet) {
      return res.status(404).json({
        success: false,
        error: 'Public key does not match any founder wallet',
      });
    }
    
    // Import verification function
    const { verify } = await import('../../lib/crypto/ed25519.js');
    
    // Verify the signature
    const isValid = verify(message, signature, publicKey);
    
    return res.status(200).json({
      success: true,
      verified: isValid,
      message: isValid 
        ? 'Signature is valid. This proves control of the founder private key.'
        : 'Signature is invalid.',
    });
  } catch (error) {
    console.error('Founder verify endpoint error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/wallet/founder/stats
 * 
 * Get statistics about the founder wallet
 */
router.get('/founder/stats', async (_req: Request, res: Response) => {
  try {
    const founderWallet = await prisma.founderWallet.findFirst({
      where: { verified: true },
    });
    
    if (!founderWallet) {
      return res.status(200).json({
        success: true,
        stats: null,
        message: 'No founder wallet exists yet',
      });
    }
    
    // In a full implementation, we'd track founder wallet transactions
    // For now, return the sealed state
    const ageInDays = Math.floor(
      (Date.now() - founderWallet.sealedAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return res.status(200).json({
      success: true,
      stats: {
        publicKey: founderWallet.publicKey,
        initialBalance: founderWallet.initialBalance,
        currentBalance: founderWallet.initialBalance, // Until transactions are tracked
        sealedAt: founderWallet.sealedAt.toISOString(),
        ageInDays,
        transactionCount: 0, // Would be tracked in full implementation
        lastActivityAt: null,
      },
    });
  } catch (error) {
    console.error('Founder stats endpoint error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;
