/**
 * Mobius Systems - OAA API Library
 * Complete Auth + Wallet System
 * 
 * Constitutional AI Architecture
 * "Integrity, Ecology, Custodianship"
 */

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRoutes from './api/auth/index.js';
import walletRoutes from './api/wallet/index.js';

// Create Express app
const app = express();

// ============================================
// Middleware
// ============================================

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400, // Cache preflight for 24 hours
}));

// Parse JSON bodies
app.use(express.json());

// Parse cookies
app.use(cookieParser());

// Request logging (development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
}

// ============================================
// Routes
// ============================================

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API info
app.get('/', (_req, res) => {
  res.json({
    name: 'OAA API Library',
    version: '1.0.0',
    description: 'Mobius Systems - Complete Auth + Wallet System',
    endpoints: {
      // Auth endpoints
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      logout: 'POST /api/auth/logout',
      magicLink: 'POST /api/auth/magic-link',
      verify: 'POST /api/auth/verify',
      
      // Wallet endpoints
      balance: 'GET /api/wallet/balance',
      history: 'GET /api/wallet/history',
      earn: 'POST /api/wallet/earn',
      founder: 'GET /api/wallet/founder',
      founderVerify: 'POST /api/wallet/founder/verify',
      founderStats: 'GET /api/wallet/founder/stats',
      
      // Health
      health: 'GET /health',
    },
    docs: {
      register: 'Create new account with handle, email, optional password',
      login: 'Authenticate with handle/email and password',
      magicLink: 'Send passwordless login link to email',
      verify: 'Verify magic link token',
      balance: 'Get wallet balance (requires auth)',
      earn: 'Record MIC earning event (requires auth)',
      founder: 'View founder wallet info (public)',
    },
    constitutional: {
      principles: ['Integrity', 'Ecology', 'Custodianship'],
      version: 'Three Covenants v1.0',
    },
  });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);

// ============================================
// Error Handlers
// ============================================

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: 'The requested endpoint does not exist',
  });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ============================================
// Start Server
// ============================================

const PORT = parseInt(process.env.PORT || '3000', 10);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║              OAA API Library v1.0.0                          ║
║         Mobius Systems - Auth + Wallet System                ║
╠══════════════════════════════════════════════════════════════╣
║  Port: ${PORT}                                                   ║
║                                                              ║
║  Auth Endpoints:                                             ║
║    POST /api/auth/register     - Create account              ║
║    POST /api/auth/login        - Password login              ║
║    POST /api/auth/logout       - End session                 ║
║    POST /api/auth/magic-link   - Send magic link             ║
║    POST /api/auth/verify       - Verify magic link           ║
║                                                              ║
║  Wallet Endpoints:                                           ║
║    GET  /api/wallet/balance    - Get MIC balance             ║
║    GET  /api/wallet/history    - Get ledger history          ║
║    POST /api/wallet/earn       - Record earning              ║
║    GET  /api/wallet/founder    - View founder wallet         ║
║                                                              ║
║  Constitutional: "Integrity, Ecology, Custodianship"         ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

export default app;
