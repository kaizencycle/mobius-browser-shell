/**
 * Mobius Systems - Magic Link Verification API Endpoint
 * 
 * POST /api/auth/verify
 * GET /api/auth/verify?token=xxx (for email link clicks)
 * 
 * Verifies a magic link token and logs the user in
 */

import { Router, Request, Response } from 'express';
import { verifyMagicLink } from '../../lib/auth/authService.js';

const router = Router();

interface VerifyBody {
  token: string;
}

interface VerifyQuery {
  token?: string;
}

/**
 * POST /api/auth/verify
 * 
 * Request:
 * {
 *   "token": "jwt-magic-link-token"
 * }
 * 
 * Response (success):
 * {
 *   "success": true,
 *   "user": { id, handle, email, displayName, walletPublicKey, walletAddress },
 *   "tokens": { accessToken, refreshToken, expiresIn, expiresAt }
 * }
 */
router.post('/verify', async (req: Request<object, object, VerifyBody>, res: Response) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required',
      });
    }
    
    const result = await verifyMagicLink(token);
    
    if (!result.success) {
      return res.status(401).json(result);
    }
    
    // Set refresh token as HTTP-only cookie
    if (result.tokens) {
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
    }
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Verify endpoint error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/auth/verify?token=xxx
 * 
 * Alternative endpoint for direct link clicks from email
 * Redirects to frontend with session established
 */
router.get('/verify', async (req: Request<object, object, object, VerifyQuery>, res: Response) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      // Redirect to frontend with error
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/auth/error?message=Missing+token`);
    }
    
    const result = await verifyMagicLink(token);
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    if (!result.success) {
      // Redirect to frontend with error
      const errorMessage = encodeURIComponent(result.error || 'Verification failed');
      return res.redirect(`${frontendUrl}/auth/error?message=${errorMessage}`);
    }
    
    // Set refresh token as HTTP-only cookie
    if (result.tokens) {
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
    }
    
    // Redirect to frontend with access token in URL fragment
    // Frontend will capture this and store it
    const accessToken = result.tokens?.accessToken || '';
    return res.redirect(`${frontendUrl}/auth/callback#token=${accessToken}`);
  } catch (error) {
    console.error('Verify GET endpoint error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/auth/error?message=Internal+error`);
  }
});

export default router;
