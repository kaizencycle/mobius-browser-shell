/**
 * Mobius Systems - Authentication Service
 * 
 * Constitutional Principle: Democratic access with cryptographic integrity.
 * 
 * Provides:
 * - User registration
 * - Password authentication
 * - Magic link authentication
 * - Wallet auto-creation
 * - Identity event logging
 */

import { PrismaClient } from '@prisma/client';
import {
  hashPassword,
  verifyPassword,
  sha256,
  generateToken,
  hashIdentityEvent,
} from '../crypto/hash.js';
import { generateKeypair, deriveAddress } from '../crypto/ed25519.js';
import {
  createTokenPair,
  createMagicLinkToken,
  verifyMagicLinkToken,
  hashToken,
  type TokenPayload,
  type TokenPair,
} from './jwt.js';

// ============================================
// Initialize Prisma Client
// ============================================

const prisma = new PrismaClient();

// ============================================
// Types
// ============================================

export interface RegisterInput {
  handle: string;
  email: string;
  password?: string;  // Optional for magic-link only users
  displayName?: string;
}

export interface LoginInput {
  handle?: string;
  email?: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  user?: {
    id: string;
    handle: string;
    email: string;
    displayName: string | null;
    isFounder: boolean;
    trustLevel: number;
    walletPublicKey: string | null;
    walletAddress: string | null;
  };
  tokens?: TokenPair;
  error?: string;
}

export interface MagicLinkResult {
  success: boolean;
  message?: string;
  error?: string;
  // Debug only (not in production)
  debugToken?: string;
}

// ============================================
// Registration
// ============================================

/**
 * Register a new user
 * - Creates user record
 * - Creates custodial wallet
 * - Logs identity event
 */
export async function register(input: RegisterInput): Promise<AuthResult> {
  const { handle, email, password, displayName } = input;
  
  // Validate input
  if (!handle || handle.length < 3) {
    return { success: false, error: 'Handle must be at least 3 characters' };
  }
  
  if (!email || !email.includes('@')) {
    return { success: false, error: 'Valid email is required' };
  }
  
  // Normalize
  const normalizedHandle = handle.toLowerCase().trim();
  const normalizedEmail = email.toLowerCase().trim();
  
  // Check if user exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { handle: normalizedHandle },
        { email: normalizedEmail },
      ],
    },
  });
  
  if (existingUser) {
    if (existingUser.handle === normalizedHandle) {
      return { success: false, error: 'Handle already taken' };
    }
    return { success: false, error: 'Email already registered' };
  }
  
  // Hash password if provided
  const passwordHash = password ? await hashPassword(password) : null;
  
  // Generate custodial wallet keypair
  const keypair = generateKeypair();
  const walletAddress = deriveAddress(keypair.publicKey);
  
  try {
    // Create user and wallet in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          handle: normalizedHandle,
          email: normalizedEmail,
          passwordHash,
          displayName: displayName || normalizedHandle,
        },
      });
      
      // Create wallet
      const wallet = await tx.wallet.create({
        data: {
          userId: user.id,
          publicKey: keypair.publicKey,
          cachedBalance: 0,
        },
      });
      
      // Log identity event
      const previousEvent = await tx.identityEvent.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      });
      
      const eventHash = hashIdentityEvent({
        userId: user.id,
        eventType: 'USER_CREATED',
        eventData: {
          handle: normalizedHandle,
          email: normalizedEmail,
          walletCreated: true,
        },
        previousHash: previousEvent?.eventHash,
        timestamp: new Date(),
      });
      
      await tx.identityEvent.create({
        data: {
          userId: user.id,
          eventType: 'USER_CREATED',
          eventData: {
            handle: normalizedHandle,
            walletPublicKey: keypair.publicKey,
          },
          eventHash,
          previousHash: previousEvent?.eventHash,
        },
      });
      
      return { user, wallet };
    });
    
    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: result.user.id,
      handle: result.user.handle,
      email: result.user.email,
      isFounder: result.user.isFounder,
      trustLevel: result.user.trustLevel,
      walletPublicKey: result.wallet.publicKey,
    };
    
    const tokens = createTokenPair(tokenPayload);
    
    // Store session
    await prisma.session.create({
      data: {
        userId: result.user.id,
        tokenHash: hashToken(tokens.accessToken),
        expiresAt: tokens.expiresAt,
      },
    });
    
    return {
      success: true,
      user: {
        id: result.user.id,
        handle: result.user.handle,
        email: result.user.email,
        displayName: result.user.displayName,
        isFounder: result.user.isFounder,
        trustLevel: result.user.trustLevel,
        walletPublicKey: result.wallet.publicKey,
        walletAddress,
      },
      tokens,
    };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: 'Registration failed' };
  }
}

// ============================================
// Password Login
// ============================================

/**
 * Authenticate with password
 */
export async function login(input: LoginInput): Promise<AuthResult> {
  const { handle, email, password } = input;
  
  if (!password) {
    return { success: false, error: 'Password is required' };
  }
  
  if (!handle && !email) {
    return { success: false, error: 'Handle or email is required' };
  }
  
  // Find user
  const user = await prisma.user.findFirst({
    where: handle 
      ? { handle: handle.toLowerCase().trim() }
      : { email: email!.toLowerCase().trim() },
    include: {
      wallet: true,
    },
  });
  
  if (!user) {
    // Use consistent error message to prevent user enumeration
    return { success: false, error: 'Invalid credentials' };
  }
  
  if (!user.passwordHash) {
    return { success: false, error: 'Password login not enabled. Use magic link.' };
  }
  
  // Verify password
  const isValid = await verifyPassword(password, user.passwordHash);
  
  if (!isValid) {
    return { success: false, error: 'Invalid credentials' };
  }
  
  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  
  // Log identity event
  const previousEvent = await prisma.identityEvent.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });
  
  const eventHash = hashIdentityEvent({
    userId: user.id,
    eventType: 'LOGIN',
    eventData: { method: 'password' },
    previousHash: previousEvent?.eventHash,
    timestamp: new Date(),
  });
  
  await prisma.identityEvent.create({
    data: {
      userId: user.id,
      eventType: 'LOGIN',
      eventData: { method: 'password' },
      eventHash,
      previousHash: previousEvent?.eventHash,
    },
  });
  
  // Generate tokens
  const tokenPayload: TokenPayload = {
    userId: user.id,
    handle: user.handle,
    email: user.email,
    isFounder: user.isFounder,
    trustLevel: user.trustLevel,
    walletPublicKey: user.wallet?.publicKey,
  };
  
  const tokens = createTokenPair(tokenPayload);
  
  // Store session
  await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(tokens.accessToken),
      expiresAt: tokens.expiresAt,
    },
  });
  
  const walletAddress = user.wallet ? deriveAddress(user.wallet.publicKey) : null;
  
  return {
    success: true,
    user: {
      id: user.id,
      handle: user.handle,
      email: user.email,
      displayName: user.displayName,
      isFounder: user.isFounder,
      trustLevel: user.trustLevel,
      walletPublicKey: user.wallet?.publicKey || null,
      walletAddress,
    },
    tokens,
  };
}

// ============================================
// Magic Link
// ============================================

/**
 * Send a magic link for passwordless login
 */
export async function sendMagicLink(
  email: string,
  type: 'login' | 'verify_email' | 'reset_password' = 'login'
): Promise<MagicLinkResult> {
  const normalizedEmail = email.toLowerCase().trim();
  
  // Find user
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  
  if (!user) {
    // Don't reveal if user exists
    return {
      success: true,
      message: 'If an account exists, a magic link has been sent.',
    };
  }
  
  // Generate token
  const token = createMagicLinkToken(user.id, type);
  const tokenHash = sha256(token);
  
  // Store magic link
  await prisma.magicLink.create({
    data: {
      userId: user.id,
      tokenHash,
      type,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    },
  });
  
  // In production, send email here
  // For now, we'll just return success
  // await sendEmail(user.email, { token, type });
  
  const baseUrl = process.env.APP_URL || 'http://localhost:3000';
  const magicLinkUrl = `${baseUrl}/auth/verify?token=${token}`;
  
  console.log(`[DEV] Magic link for ${user.email}: ${magicLinkUrl}`);
  
  return {
    success: true,
    message: 'Magic link sent! Check your email.',
    // Only include in development
    debugToken: process.env.NODE_ENV === 'development' ? token : undefined,
  };
}

/**
 * Verify a magic link token and log the user in
 */
export async function verifyMagicLink(token: string): Promise<AuthResult> {
  try {
    // Verify JWT
    const { userId, linkType } = verifyMagicLinkToken(token);
    
    // Check if token was already used
    const tokenHash = sha256(token);
    const magicLink = await prisma.magicLink.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    
    if (!magicLink) {
      return { success: false, error: 'Invalid or expired magic link' };
    }
    
    // Mark as used
    await prisma.magicLink.update({
      where: { id: magicLink.id },
      data: { usedAt: new Date() },
    });
    
    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    // Handle different link types
    if (linkType === 'verify_email' && !user.emailVerified) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          verifiedAt: new Date(),
        },
      });
    }
    
    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    
    // Log identity event
    const previousEvent = await prisma.identityEvent.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    
    const eventHash = hashIdentityEvent({
      userId: user.id,
      eventType: 'LOGIN',
      eventData: { method: 'magic_link', linkType },
      previousHash: previousEvent?.eventHash,
      timestamp: new Date(),
    });
    
    await prisma.identityEvent.create({
      data: {
        userId: user.id,
        eventType: 'LOGIN',
        eventData: { method: 'magic_link', linkType },
        eventHash,
        previousHash: previousEvent?.eventHash,
      },
    });
    
    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      handle: user.handle,
      email: user.email,
      isFounder: user.isFounder,
      trustLevel: user.trustLevel,
      walletPublicKey: user.wallet?.publicKey,
    };
    
    const tokens = createTokenPair(tokenPayload);
    
    // Store session
    await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(tokens.accessToken),
        expiresAt: tokens.expiresAt,
      },
    });
    
    const walletAddress = user.wallet ? deriveAddress(user.wallet.publicKey) : null;
    
    return {
      success: true,
      user: {
        id: user.id,
        handle: user.handle,
        email: user.email,
        displayName: user.displayName,
        isFounder: user.isFounder,
        trustLevel: user.trustLevel,
        walletPublicKey: user.wallet?.publicKey || null,
        walletAddress,
      },
      tokens,
    };
  } catch (error) {
    console.error('Magic link verification error:', error);
    const message = error instanceof Error ? error.message : 'Verification failed';
    return { success: false, error: message };
  }
}

// ============================================
// Session Management
// ============================================

/**
 * Get user by ID (for middleware)
 */
export async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { wallet: true },
  });
}

/**
 * Revoke a session
 */
export async function revokeSession(tokenHash: string): Promise<boolean> {
  try {
    await prisma.session.update({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a session is valid
 */
export async function isSessionValid(tokenHash: string): Promise<boolean> {
  const session = await prisma.session.findUnique({
    where: { tokenHash },
  });
  
  if (!session) return false;
  if (session.revokedAt) return false;
  if (session.expiresAt < new Date()) return false;
  
  return true;
}

/**
 * Logout - revoke the current session
 */
export async function logout(accessToken: string): Promise<boolean> {
  const tokenHash = hashToken(accessToken);
  return revokeSession(tokenHash);
}

// ============================================
// Export Prisma client for use in routes
// ============================================

export { prisma };
