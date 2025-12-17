#!/usr/bin/env npx tsx
/**
 * Mobius Systems - Founder Wallet Generation Script
 *
 * ╔═══════════════════════════════════════════════════════════════════╗
 * ║                    ⚠️  CRITICAL SECURITY  ⚠️                       ║
 * ╠═══════════════════════════════════════════════════════════════════╣
 * ║  This script generates a cryptographically sealed founder wallet  ║
 * ║  with 1,000,000 MIC (Mobius Integrity Credits).                  ║
 * ║                                                                   ║
 * ║  THE PRIVATE KEY IS DISPLAYED ONCE AND NEVER STORED.             ║
 * ║                                                                   ║
 * ║  You MUST:                                                        ║
 * ║  1. Write the private key on paper (3 copies)                    ║
 * ║  2. Store copies in 3 separate secure locations                  ║
 * ║  3. DELETE this output from all digital storage                  ║
 * ║  4. Clear terminal history: history -c                           ║
 * ║                                                                   ║
 * ║  If you lose the private key, NO ONE can recover it.             ║
 * ║  This is not a bug - it's the core security feature.             ║
 * ╚═══════════════════════════════════════════════════════════════════╝
 *
 * Usage:
 *   npx tsx scripts/generate-founder-wallet.ts
 *
 * Or via npm:
 *   npm run founder:generate
 */
import { PrismaClient } from '@prisma/client';
import { generateFounderWallet, deriveAddress } from '../src/lib/crypto/ed25519.js';
import { createFounderSeal } from '../src/lib/crypto/hash.js';
import * as readline from 'readline';
const prisma = new PrismaClient();
// ANSI colors for terminal output
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
};
function printBanner() {
    console.log(`
${colors.cyan}${colors.bold}
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║   ███╗   ███╗ ██████╗ ██████╗ ██╗██╗   ██╗███████╗                       ║
║   ████╗ ████║██╔═══██╗██╔══██╗██║██║   ██║██╔════╝                       ║
║   ██╔████╔██║██║   ██║██████╔╝██║██║   ██║███████╗                       ║
║   ██║╚██╔╝██║██║   ██║██╔══██╗██║██║   ██║╚════██║                       ║
║   ██║ ╚═╝ ██║╚██████╔╝██████╔╝██║╚██████╔╝███████║                       ║
║   ╚═╝     ╚═╝ ╚═════╝ ╚═════╝ ╚═╝ ╚═════╝ ╚══════╝                       ║
║                                                                           ║
║              FOUNDER WALLET GENERATION CEREMONY                           ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
${colors.reset}`);
}
function printWarning() {
    console.log(`
${colors.red}${colors.bold}
┌───────────────────────────────────────────────────────────────────────────┐
│                        ⚠️  CRITICAL SECURITY WARNING  ⚠️                   │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  This script will generate your FOUNDER WALLET with 1,000,000 MIC.       │
│                                                                           │
│  The PRIVATE KEY will be displayed ONCE and NEVER stored in any          │
│  database or file.                                                        │
│                                                                           │
│  BEFORE PROCEEDING, prepare:                                              │
│    ✓ Paper and pen (not digital notes!)                                  │
│    ✓ A secure, private environment                                       │
│    ✓ Time to carefully write down the key                                │
│                                                                           │
│  AFTER GENERATION:                                                        │
│    1. Write the private key on paper (3 copies)                          │
│    2. Store in 3 separate secure locations (safe, bank, trusted person)  │
│    3. Clear your terminal: history -c && clear                           │
│    4. Never photograph or digitize the key                               │
│                                                                           │
│  IF YOU LOSE THE PRIVATE KEY:                                            │
│    → Your 1M MIC is PERMANENTLY INACCESSIBLE                             │
│    → No one (not even Mobius developers) can recover it                  │
│    → This is BY DESIGN for maximum security                              │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
${colors.reset}`);
}
async function promptConfirmation(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise((resolve) => {
        rl.question(`${colors.yellow}${question}${colors.reset} `, (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === 'yes');
        });
    });
}
async function checkExistingFounderWallet() {
    const existing = await prisma.founderWallet.findFirst({
        where: { verified: true },
    });
    if (existing) {
        console.log(`
${colors.yellow}
┌───────────────────────────────────────────────────────────────────────────┐
│                     FOUNDER WALLET ALREADY EXISTS                         │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  A founder wallet has already been sealed:                               │
│                                                                           │
│  Public Key: ${existing.publicKey.slice(0, 32)}...
│  Sealed At:  ${existing.sealedAt.toISOString()}
│  Balance:    ${existing.initialBalance.toLocaleString()} MIC
│                                                                           │
│  Only ONE founder wallet can exist. This is by design.                   │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
${colors.reset}`);
        return true;
    }
    return false;
}
async function main() {
    printBanner();
    printWarning();
    // Check if founder wallet already exists
    const exists = await checkExistingFounderWallet();
    if (exists) {
        await prisma.$disconnect();
        process.exit(0);
    }
    // First confirmation
    const confirm1 = await promptConfirmation('I understand the risks and have prepared paper and pen. Type "yes" to continue: ');
    if (!confirm1) {
        console.log(`${colors.cyan}Generation cancelled. Come back when you're ready.${colors.reset}`);
        await prisma.$disconnect();
        process.exit(0);
    }
    // Second confirmation
    const confirm2 = await promptConfirmation('I confirm that I am in a private, secure environment. Type "yes" to generate: ');
    if (!confirm2) {
        console.log(`${colors.cyan}Generation cancelled.${colors.reset}`);
        await prisma.$disconnect();
        process.exit(0);
    }
    console.log(`\n${colors.cyan}Generating founder wallet...${colors.reset}\n`);
    // Generate the founder wallet
    const wallet = generateFounderWallet();
    const address = deriveAddress(wallet.publicKey);
    // Create the cryptographic seal
    const sealHash = createFounderSeal({
        publicKey: wallet.publicKey,
        initialBalance: wallet.initialBalance,
        timestamp: wallet.sealTimestamp,
    });
    // Store in database (PUBLIC KEY ONLY - never the private key!)
    await prisma.founderWallet.create({
        data: {
            publicKey: wallet.publicKey,
            initialBalance: wallet.initialBalance,
            sealedAt: wallet.sealTimestamp,
            sealHash: sealHash,
            verified: true,
        },
    });
    // Display the wallet information
    console.log(`
${colors.green}${colors.bold}
╔═══════════════════════════════════════════════════════════════════════════╗
║                    🎉 FOUNDER WALLET GENERATED 🎉                         ║
╠═══════════════════════════════════════════════════════════════════════════╣
${colors.reset}
${colors.cyan}PUBLIC KEY (safe to share):${colors.reset}
${colors.white}${wallet.publicKey}${colors.reset}

${colors.cyan}WALLET ADDRESS:${colors.reset}
${colors.white}${address}${colors.reset}

${colors.cyan}INITIAL BALANCE:${colors.reset}
${colors.green}${wallet.initialBalance.toLocaleString()} MIC${colors.reset}

${colors.cyan}SEAL HASH:${colors.reset}
${colors.dim}${sealHash}${colors.reset}

${colors.cyan}SEALED AT:${colors.reset}
${colors.white}${wallet.sealTimestamp.toISOString()}${colors.reset}

${colors.red}${colors.bold}
╔═══════════════════════════════════════════════════════════════════════════╗
║                    🔐 PRIVATE KEY - WRITE THIS DOWN 🔐                    ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  This is your ONLY chance to save your private key!                      ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
${colors.reset}

${colors.magenta}${colors.bold}PRIVATE KEY:${colors.reset}
${colors.yellow}${wallet.secretKey}${colors.reset}

${colors.red}${colors.bold}
┌───────────────────────────────────────────────────────────────────────────┐
│                          IMMEDIATE ACTIONS REQUIRED                       │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  1. ✏️  WRITE the private key on paper NOW (3 copies)                     │
│  2. 🔒 STORE each copy in a different secure location                    │
│  3. 🧹 CLEAR terminal: history -c && clear                               │
│  4. ❌ NEVER digitize or photograph the private key                      │
│                                                                           │
│  Your 1,000,000 MIC is now cryptographically sealed.                     │
│  Only the holder of the private key can spend it.                        │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
${colors.reset}`);
    // Final confirmation that they wrote it down
    const savedKey = await promptConfirmation('Have you written down the private key on paper? Type "yes" to confirm: ');
    if (savedKey) {
        console.log(`
${colors.green}${colors.bold}
✅ Founder wallet ceremony complete!

Your 1,000,000 MIC is now sealed and ready.

Remember:
- Only YOU control this wallet
- The private key is the ONLY way to access it
- Store your paper backups safely

Welcome to Mobius, Founder. 🌊
${colors.reset}`);
    }
    else {
        console.log(`
${colors.red}${colors.bold}
⚠️  WARNING: You indicated you haven't saved the private key!

The private key shown above is the ONLY copy in existence.
Once this terminal is closed, it's gone forever.

SCROLL UP AND WRITE IT DOWN NOW!
${colors.reset}`);
    }
    await prisma.$disconnect();
}
// Run the script
main().catch(async (error) => {
    console.error('Error generating founder wallet:', error);
    await prisma.$disconnect();
    process.exit(1);
});
//# sourceMappingURL=generate-founder-wallet.js.map