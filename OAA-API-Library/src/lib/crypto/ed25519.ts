/**
 * Mobius Systems - Ed25519 Wallet Utilities
 * 
 * Constitutional Principle: Sovereignty requires self-custody capability.
 * 
 * Provides:
 * - Ed25519 keypair generation
 * - Message signing and verification
 * - Address derivation
 * 
 * SECURITY NOTE: Private keys should NEVER be stored server-side for self-custody wallets.
 * For custodial wallets, keys are managed by the server with appropriate HSM backing.
 */

import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';

// ============================================
// Types
// ============================================

export interface Keypair {
  publicKey: string;  // Base64 encoded
  secretKey: string;  // Base64 encoded (HANDLE WITH EXTREME CARE)
}

export interface KeypairBytes {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
}

export interface SignedMessage {
  message: string;
  signature: string;  // Base64 encoded
  publicKey: string;  // Base64 encoded
}

// ============================================
// Key Generation
// ============================================

/**
 * Generate a new Ed25519 keypair
 * 
 * WARNING: The secretKey MUST be handled with extreme care:
 * - For founder wallets: Display ONCE, never store
 * - For custodial wallets: Store in secure HSM/vault
 */
export function generateKeypair(): Keypair {
  const keypair = nacl.sign.keyPair();
  
  return {
    publicKey: naclUtil.encodeBase64(keypair.publicKey),
    secretKey: naclUtil.encodeBase64(keypair.secretKey),
  };
}

/**
 * Generate a keypair from a seed (deterministic)
 * Useful for deriving wallets from master seed
 */
export function generateKeypairFromSeed(seed: Uint8Array): Keypair {
  if (seed.length !== 32) {
    throw new Error('Seed must be exactly 32 bytes');
  }
  
  const keypair = nacl.sign.keyPair.fromSeed(seed);
  
  return {
    publicKey: naclUtil.encodeBase64(keypair.publicKey),
    secretKey: naclUtil.encodeBase64(keypair.secretKey),
  };
}

/**
 * Restore a keypair from a secret key
 */
export function keypairFromSecretKey(secretKeyBase64: string): Keypair {
  const secretKey = naclUtil.decodeBase64(secretKeyBase64);
  const keypair = nacl.sign.keyPair.fromSecretKey(secretKey);
  
  return {
    publicKey: naclUtil.encodeBase64(keypair.publicKey),
    secretKey: secretKeyBase64,
  };
}

// ============================================
// Message Signing
// ============================================

/**
 * Sign a message with a secret key
 */
export function signMessage(message: string, secretKeyBase64: string): SignedMessage {
  const secretKey = naclUtil.decodeBase64(secretKeyBase64);
  const messageBytes = naclUtil.decodeUTF8(message);
  
  // Sign the message
  const signatureBytes = nacl.sign.detached(messageBytes, secretKey);
  
  // Derive public key from secret key
  const keypair = nacl.sign.keyPair.fromSecretKey(secretKey);
  
  return {
    message,
    signature: naclUtil.encodeBase64(signatureBytes),
    publicKey: naclUtil.encodeBase64(keypair.publicKey),
  };
}

/**
 * Verify a signed message
 */
export function verifySignature(signedMessage: SignedMessage): boolean {
  try {
    const messageBytes = naclUtil.decodeUTF8(signedMessage.message);
    const signatureBytes = naclUtil.decodeBase64(signedMessage.signature);
    const publicKeyBytes = naclUtil.decodeBase64(signedMessage.publicKey);
    
    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
  } catch {
    return false;
  }
}

/**
 * Verify a signature with explicit parameters
 */
export function verify(
  message: string,
  signature: string,
  publicKey: string
): boolean {
  return verifySignature({ message, signature, publicKey });
}

// ============================================
// Address Derivation
// ============================================

/**
 * Derive a Mobius address from a public key
 * Format: mob1{base58check(publicKey)}
 * 
 * For simplicity, we use a truncated base64 format
 */
export function deriveAddress(publicKeyBase64: string): string {
  // Use first 20 chars of public key as address (truncated for readability)
  const truncated = publicKeyBase64.slice(0, 20).replace(/[+/=]/g, '');
  return `mob1${truncated}`;
}

/**
 * Validate a Mobius address format
 */
export function isValidAddress(address: string): boolean {
  return address.startsWith('mob1') && address.length >= 20;
}

// ============================================
// Utility Functions
// ============================================

/**
 * Convert public key to bytes
 */
export function publicKeyToBytes(publicKeyBase64: string): Uint8Array {
  return naclUtil.decodeBase64(publicKeyBase64);
}

/**
 * Convert bytes to public key string
 */
export function bytesToPublicKey(bytes: Uint8Array): string {
  return naclUtil.encodeBase64(bytes);
}

/**
 * Generate a secure random seed (32 bytes)
 */
export function generateSeed(): Uint8Array {
  return nacl.randomBytes(32);
}

/**
 * Encode seed to base64 for storage/display
 */
export function encodeSeed(seed: Uint8Array): string {
  return naclUtil.encodeBase64(seed);
}

/**
 * Decode seed from base64
 */
export function decodeSeed(seedBase64: string): Uint8Array {
  return naclUtil.decodeBase64(seedBase64);
}

// ============================================
// Founder Wallet Generation
// ============================================

export interface FounderWallet {
  publicKey: string;
  secretKey: string;
  address: string;
  initialBalance: number;
  sealTimestamp: Date;
}

/**
 * Generate a founder wallet with 1M MIC allocation
 * 
 * CRITICAL: This function should only be run ONCE per founder.
 * The secretKey is displayed and then MUST be:
 * 1. Written on paper (3 copies)
 * 2. Stored in secure locations
 * 3. DELETED from all digital storage
 * 
 * The secretKey is NEVER stored in the database.
 */
export function generateFounderWallet(): FounderWallet {
  const keypair = generateKeypair();
  const address = deriveAddress(keypair.publicKey);
  
  return {
    publicKey: keypair.publicKey,
    secretKey: keypair.secretKey,
    address,
    initialBalance: 1_000_000, // 1M MIC
    sealTimestamp: new Date(),
  };
}

/**
 * Create a transaction payload for signing
 */
export interface TransactionPayload {
  from: string;       // Public key
  to: string;         // Public key
  amount: number;
  nonce: number;
  timestamp: string;
}

/**
 * Create a signable transaction string
 */
export function createTransactionMessage(payload: TransactionPayload): string {
  return JSON.stringify({
    from: payload.from,
    to: payload.to,
    amount: payload.amount.toFixed(2),
    nonce: payload.nonce,
    timestamp: payload.timestamp,
  });
}

/**
 * Sign a transaction with the founder's secret key
 * This would be done client-side for self-custody
 */
export function signTransaction(
  payload: TransactionPayload,
  secretKeyBase64: string
): SignedMessage {
  const message = createTransactionMessage(payload);
  return signMessage(message, secretKeyBase64);
}

/**
 * Verify a signed transaction
 */
export function verifyTransaction(
  payload: TransactionPayload,
  signature: string,
  publicKey: string
): boolean {
  const message = createTransactionMessage(payload);
  return verify(message, signature, publicKey);
}
