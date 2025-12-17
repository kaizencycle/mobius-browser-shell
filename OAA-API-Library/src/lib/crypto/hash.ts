/**
 * Mobius Systems - Cryptographic Hash Utilities
 * 
 * Constitutional Principle: Integrity requires cryptographic proof.
 * 
 * Provides:
 * - SHA256 hashing for integrity verification
 * - bcrypt for password hashing
 * - HMAC for message authentication
 */

import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// ============================================
// SHA256 Hashing
// ============================================

/**
 * Create SHA256 hash of input
 */
export function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Create SHA256 hash of multiple inputs (concatenated)
 */
export function sha256Multi(...inputs: string[]): string {
  return sha256(inputs.join(''));
}

/**
 * Create a deterministic hash for an object (sorted keys)
 */
export function hashObject(obj: Record<string, unknown>): string {
  const sorted = JSON.stringify(obj, Object.keys(obj).sort());
  return sha256(sorted);
}

// ============================================
// Password Hashing (bcrypt)
// ============================================

const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against its hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ============================================
// HMAC for Message Authentication
// ============================================

/**
 * Create HMAC-SHA256 signature
 */
export function hmacSign(message: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(message).digest('hex');
}

/**
 * Verify HMAC-SHA256 signature (timing-safe)
 */
export function hmacVerify(message: string, signature: string, secret: string): boolean {
  const expected = hmacSign(message, secret);
  
  // Timing-safe comparison to prevent timing attacks
  if (signature.length !== expected.length) {
    return false;
  }
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expected, 'hex')
  );
}

// ============================================
// Random Token Generation
// ============================================

/**
 * Generate a secure random token (URL-safe base64)
 */
export function generateToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString('base64url');
}

/**
 * Generate a secure random hex string
 */
export function generateHex(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

// ============================================
// Identity Event Hashing
// ============================================

export interface IdentityEventInput {
  userId: string;
  eventType: string;
  eventData: Record<string, unknown>;
  previousHash?: string;
  timestamp: Date;
}

/**
 * Create a hash for an identity event (for merkle chain)
 */
export function hashIdentityEvent(event: IdentityEventInput): string {
  const payload = {
    userId: event.userId,
    eventType: event.eventType,
    eventData: event.eventData,
    previousHash: event.previousHash || 'genesis',
    timestamp: event.timestamp.toISOString(),
  };
  
  return hashObject(payload);
}

// ============================================
// MIC Transaction Hashing
// ============================================

export interface MICTransactionInput {
  walletId: string;
  amount: number;
  reason: string;
  source: string;
  integrityScore: number;
  gii: number;
  meta: Record<string, unknown>;
  timestamp: Date;
}

/**
 * Create a hash for a MIC ledger entry (for merkle anchoring)
 */
export function hashMICTransaction(tx: MICTransactionInput): string {
  const payload = {
    walletId: tx.walletId,
    amount: tx.amount.toFixed(2),
    reason: tx.reason,
    source: tx.source,
    integrityScore: tx.integrityScore.toFixed(4),
    gii: tx.gii.toFixed(4),
    meta: tx.meta,
    timestamp: tx.timestamp.toISOString(),
  };
  
  return hashObject(payload);
}

// ============================================
// Founder Wallet Seal
// ============================================

export interface FounderSealInput {
  publicKey: string;
  initialBalance: number;
  timestamp: Date;
}

/**
 * Create the cryptographic seal for a founder wallet
 * This proves the founder wallet was created at a specific time with a specific balance
 */
export function createFounderSeal(input: FounderSealInput): string {
  const payload = {
    publicKey: input.publicKey,
    initialBalance: input.initialBalance.toFixed(2),
    timestamp: input.timestamp.toISOString(),
    type: 'MOBIUS_FOUNDER_SEAL_V1',
  };
  
  return hashObject(payload);
}

/**
 * Verify a founder seal
 */
export function verifyFounderSeal(
  input: FounderSealInput,
  expectedSeal: string
): boolean {
  const calculatedSeal = createFounderSeal(input);
  return calculatedSeal === expectedSeal;
}
