/**
 * Mobius Systems - Authentication Middleware
 * 
 * Validates JWT tokens and adds user to request
 */

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, extractBearerToken, hashToken, DecodedToken } from '../lib/auth/jwt.js';
import { isSessionValid } from '../lib/auth/authService.js';

// Extend Express Request to include user
export interface AuthenticatedRequest extends Request {
  user: DecodedToken;
  token: string;
}

/**
 * Middleware that requires authentication
 * Validates JWT and optionally checks session validity
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from header
    const token = extractBearerToken(req.headers.authorization);
    
    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Please provide a valid Bearer token in the Authorization header',
      });
      return;
    }
    
    // Verify token
    let decoded: DecodedToken;
    try {
      decoded = verifyAccessToken(token);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid token';
      res.status(401).json({
        success: false,
        error: 'Invalid token',
        message,
      });
      return;
    }
    
    // Optionally check session validity (for revocation support)
    const checkSession = process.env.CHECK_SESSION_VALIDITY === 'true';
    if (checkSession) {
      const tokenHash = hashToken(token);
      const valid = await isSessionValid(tokenHash);
      
      if (!valid) {
        res.status(401).json({
          success: false,
          error: 'Session invalid',
          message: 'Your session has been revoked. Please log in again.',
        });
        return;
      }
    }
    
    // Add user to request
    (req as AuthenticatedRequest).user = decoded;
    (req as AuthenticatedRequest).token = token;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}

/**
 * Optional auth middleware
 * Adds user to request if token is valid, but doesn't require it
 */
export async function optionalAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractBearerToken(req.headers.authorization);
    
    if (token) {
      try {
        const decoded = verifyAccessToken(token);
        (req as AuthenticatedRequest).user = decoded;
        (req as AuthenticatedRequest).token = token;
      } catch {
        // Token invalid, continue without user
      }
    }
    
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
}

/**
 * Middleware that requires founder status
 */
export async function founderMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  
  if (!authReq.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }
  
  if (!authReq.user.isFounder) {
    res.status(403).json({
      success: false,
      error: 'Founder access required',
      message: 'This action requires founder privileges',
    });
    return;
  }
  
  next();
}

/**
 * Middleware that requires a minimum trust level
 */
export function trustLevelMiddleware(minLevel: number) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    
    if (!authReq.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }
    
    if (authReq.user.trustLevel < minLevel) {
      res.status(403).json({
        success: false,
        error: 'Insufficient trust level',
        message: `This action requires trust level ${minLevel} or higher`,
        currentLevel: authReq.user.trustLevel,
      });
      return;
    }
    
    next();
  };
}
