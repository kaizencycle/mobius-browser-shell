/**
 * Mobius Systems - JWT Token Management
 * 
 * Constitutional Principle: Identity requires secure, verifiable tokens.
 * 
 * Provides:
 * - JWT creation with custom claims
 * - Token verification and decoding
 * - Refresh token management
 * - Session tracking
 */

import jwt from 'jsonwebtoken';
import { sha256 } from '../crypto/hash.js';

// ============================================
// Types
// ============================================

export interface TokenPayload {
  userId: string;
  handle: string;
  email: string;
  isFounder: boolean;
  trustLevel: number;
  walletPublicKey?: string;
}

export interface DecodedToken extends TokenPayload {
  iat: number;  // Issued at
  exp: number;  // Expires at
  jti: string;  // JWT ID (for revocation tracking)
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  expiresAt: Date;
}

// ============================================
// Configuration
// ============================================

const JWT_CONFIG = {
  accessTokenExpirySec: 15 * 60,        // 15 minutes in seconds
  refreshTokenExpirySec: 7 * 24 * 60 * 60, // 7 days in seconds
  magicLinkExpirySec: 15 * 60,          // 15 minutes in seconds
  issuer: 'mobius-systems',
  audience: 'mobius-api',
};

/**
 * Get JWT secret from environment
 * CRITICAL: This must be a strong, random secret in production
 */
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  
  if (secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }
  
  return secret;
}

/**
 * Get refresh token secret (different from access token)
 */
function getRefreshSecret(): string {
  const refreshSecret = process.env.JWT_REFRESH_SECRET;
  
  // Fall back to derived secret if not set
  if (!refreshSecret) {
    return sha256(getJwtSecret() + ':refresh');
  }
  
  return refreshSecret;
}

// ============================================
// Token Creation
// ============================================

/**
 * Generate a unique JWT ID
 */
function generateJti(): string {
  return sha256(Date.now().toString() + Math.random().toString()).slice(0, 16);
}

/**
 * Create an access token
 */
export function createAccessToken(payload: TokenPayload): string {
  const secret = getJwtSecret();
  const jti = generateJti();
  
  return jwt.sign(
    {
      ...payload,
      jti,
    },
    secret,
    {
      expiresIn: 15 * 60, // 15 minutes in seconds
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience,
    }
  );
}

/**
 * Create a refresh token (longer lived, used to get new access tokens)
 */
export function createRefreshToken(userId: string): string {
  const secret = getRefreshSecret();
  const jti = generateJti();
  
  return jwt.sign(
    {
      userId,
      type: 'refresh',
      jti,
    },
    secret,
    {
      expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
      issuer: JWT_CONFIG.issuer,
    }
  );
}

/**
 * Create a token pair (access + refresh)
 */
export function createTokenPair(payload: TokenPayload): TokenPair {
  const accessToken = createAccessToken(payload);
  const refreshToken = createRefreshToken(payload.userId);
  
  // Calculate expiry time
  const decoded = jwt.decode(accessToken) as { exp: number };
  const expiresAt = new Date(decoded.exp * 1000);
  const expiresIn = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
  
  return {
    accessToken,
    refreshToken,
    expiresIn,
    expiresAt,
  };
}

// ============================================
// Token Verification
// ============================================

/**
 * Verify and decode an access token
 */
export function verifyAccessToken(token: string): DecodedToken {
  const secret = getJwtSecret();
  
  try {
    const decoded = jwt.verify(token, secret, {
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience,
    });
    
    return decoded as DecodedToken;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

/**
 * Verify a refresh token
 */
export function verifyRefreshToken(token: string): { userId: string; jti: string } {
  const secret = getRefreshSecret();
  
  try {
    const decoded = jwt.verify(token, secret, {
      issuer: JWT_CONFIG.issuer,
    }) as { userId: string; type: string; jti: string };
    
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    
    return { userId: decoded.userId, jti: decoded.jti };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    }
    throw error;
  }
}

/**
 * Decode a token without verification (for debugging/logging)
 * WARNING: Do NOT use this for authentication
 */
export function decodeToken(token: string): DecodedToken | null {
  try {
    return jwt.decode(token) as DecodedToken;
  } catch {
    return null;
  }
}

// ============================================
// Token Utilities
// ============================================

/**
 * Extract token from Authorization header
 */
export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.slice(7);
}

/**
 * Create a hash of a token for storage (session tracking/revocation)
 */
export function hashToken(token: string): string {
  return sha256(token);
}

/**
 * Check if a token is expired
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  
  if (!decoded) {
    return true;
  }
  
  return decoded.exp * 1000 < Date.now();
}

/**
 * Get remaining time until token expires (in seconds)
 */
export function getTokenTTL(token: string): number {
  const decoded = decodeToken(token);
  
  if (!decoded) {
    return 0;
  }
  
  const ttl = Math.floor((decoded.exp * 1000 - Date.now()) / 1000);
  return Math.max(0, ttl);
}

// ============================================
// Magic Link Token
// ============================================

/**
 * Create a magic link token (short-lived, single-use)
 */
export function createMagicLinkToken(
  userId: string,
  type: 'login' | 'verify_email' | 'reset_password' = 'login'
): string {
  const secret = getJwtSecret();
  const jti = generateJti();
  
  return jwt.sign(
    {
      userId,
      type: 'magic_link',
      linkType: type,
      jti,
    },
    secret,
    {
      expiresIn: 15 * 60, // 15 minutes in seconds
      issuer: JWT_CONFIG.issuer,
    }
  );
}

/**
 * Verify a magic link token
 */
export function verifyMagicLinkToken(token: string): { userId: string; linkType: string; jti: string } {
  const secret = getJwtSecret();
  
  try {
    const decoded = jwt.verify(token, secret, {
      issuer: JWT_CONFIG.issuer,
    }) as { userId: string; type: string; linkType: string; jti: string };
    
    if (decoded.type !== 'magic_link') {
      throw new Error('Invalid token type');
    }
    
    return { 
      userId: decoded.userId, 
      linkType: decoded.linkType,
      jti: decoded.jti,
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Magic link expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid magic link');
    }
    throw error;
  }
}
