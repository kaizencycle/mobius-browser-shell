/**
 * Mobius Systems - Login API Endpoint
 * 
 * POST /api/auth/login
 * 
 * Authenticates user with password and returns JWT tokens
 */

import { Router, Request, Response } from 'express';
import { login, logout } from '../../lib/auth/authService.js';
import { extractBearerToken } from '../../lib/auth/jwt.js';

const router = Router();

interface LoginBody {
  handle?: string;
  email?: string;
  password: string;
}

/**
 * POST /api/auth/login
 * 
 * Request:
 * {
 *   "handle": "kaizen",   // OR "email": "kaizen@example.com"
 *   "password": "your-password"
 * }
 * 
 * Response (success):
 * {
 *   "success": true,
 *   "user": { id, handle, email, displayName, walletPublicKey, walletAddress },
 *   "tokens": { accessToken, refreshToken, expiresIn, expiresAt }
 * }
 */
router.post('/login', async (req: Request<object, object, LoginBody>, res: Response) => {
  try {
    const { handle, email, password } = req.body;
    
    // Validate required fields
    if (!handle && !email) {
      return res.status(400).json({
        success: false,
        error: 'Handle or email is required',
      });
    }
    
    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password is required',
      });
    }
    
    // Attempt login
    const result = await login({ handle, email, password });
    
    if (!result.success) {
      // Use 401 for authentication failures
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
    console.error('Login endpoint error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/auth/logout
 * 
 * Revokes the current session
 * Requires: Authorization: Bearer <token>
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const token = extractBearerToken(req.headers.authorization);
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'No token provided',
      });
    }
    
    await logout(token);
    
    // Clear refresh token cookie
    res.clearCookie('refreshToken');
    
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout endpoint error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;
