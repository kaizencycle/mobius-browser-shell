/**
 * Mobius Systems - Magic Link API Endpoint
 * 
 * POST /api/auth/magic-link
 * 
 * Sends a passwordless login link to the user's email
 */

import { Router, Request, Response } from 'express';
import { sendMagicLink } from '../../lib/auth/authService.js';

const router = Router();

interface MagicLinkBody {
  email: string;
  type?: 'login' | 'verify_email' | 'reset_password';
}

/**
 * POST /api/auth/magic-link
 * 
 * Request:
 * {
 *   "email": "kaizen@example.com",
 *   "type": "login"  // Optional: "login" | "verify_email" | "reset_password"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Magic link sent! Check your email."
 * }
 * 
 * Note: Response is always "success" to prevent user enumeration
 */
router.post('/magic-link', async (req: Request<object, object, MagicLinkBody>, res: Response) => {
  try {
    const { email, type = 'login' } = req.body;
    
    // Validate email
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
      });
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
      });
    }
    
    // Validate type
    const validTypes = ['login', 'verify_email', 'reset_password'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid magic link type',
      });
    }
    
    // Send magic link
    const result = await sendMagicLink(email, type);
    
    // Always return 200 to prevent user enumeration
    // (don't reveal whether email exists)
    return res.status(200).json(result);
  } catch (error) {
    console.error('Magic link endpoint error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;
