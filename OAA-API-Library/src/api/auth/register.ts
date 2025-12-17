/**
 * Mobius Systems - Register API Endpoint
 * 
 * POST /api/auth/register
 * 
 * Creates a new user account with:
 * - Unique handle and email
 * - Optional password (for password login)
 * - Auto-generated custodial wallet
 * - Identity event logged
 */

import { Router, Request, Response } from 'express';
import { register } from '../../lib/auth/authService.js';

const router = Router();

interface RegisterBody {
  handle: string;
  email: string;
  password?: string;
  displayName?: string;
}

/**
 * POST /api/auth/register
 * 
 * Request:
 * {
 *   "handle": "kaizen",
 *   "email": "kaizen@example.com",
 *   "password": "optional-secure-password",
 *   "displayName": "Kaizen (Optional)"
 * }
 * 
 * Response (success):
 * {
 *   "success": true,
 *   "user": { id, handle, email, displayName, walletPublicKey, walletAddress },
 *   "tokens": { accessToken, refreshToken, expiresIn, expiresAt }
 * }
 * 
 * Response (error):
 * {
 *   "success": false,
 *   "error": "Error message"
 * }
 */
router.post('/register', async (req: Request<object, object, RegisterBody>, res: Response) => {
  try {
    const { handle, email, password, displayName } = req.body;
    
    // Validate required fields
    if (!handle) {
      return res.status(400).json({
        success: false,
        error: 'Handle is required',
      });
    }
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
      });
    }
    
    // Validate handle format
    if (!/^[a-zA-Z0-9_-]{3,30}$/.test(handle)) {
      return res.status(400).json({
        success: false,
        error: 'Handle must be 3-30 characters, alphanumeric with _ and - allowed',
      });
    }
    
    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
      });
    }
    
    // Validate password if provided
    if (password && password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters',
      });
    }
    
    // Register user
    const result = await register({
      handle,
      email,
      password,
      displayName,
    });
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    // Set refresh token as HTTP-only cookie (optional, more secure)
    if (result.tokens) {
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
    }
    
    return res.status(201).json(result);
  } catch (error) {
    console.error('Register endpoint error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;
