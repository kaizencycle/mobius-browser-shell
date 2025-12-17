# 🚀 OAA API Library - Quick Installation Guide

> **Mobius Systems Auth + Wallet System**
> Built with the Three Covenants: Integrity, Ecology, Custodianship

---

## 📦 Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or pnpm

---

## ⚡ Quick Start (5 Minutes)

### 1. Install Dependencies

```bash
cd OAA-API-Library

# Install all dependencies
npm install
```

### 2. Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Generate secure secrets
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

echo "JWT_SECRET=$JWT_SECRET"
echo "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET"
```

Edit `.env` with your values:
- `DATABASE_URL` - Your PostgreSQL connection string
- `JWT_SECRET` - Generated secret (paste from above)
- `JWT_REFRESH_SECRET` - Generated secret (paste from above)

### 3. Initialize Database

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# (Optional) Open Prisma Studio to view data
npx prisma studio
```

### 4. Start the Server

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm run build && npm start
```

Server will start at `http://localhost:3000`

---

## 🔐 Test the API

### Health Check
```bash
curl http://localhost:3000/health
```

### Register a User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "handle": "kaizen",
    "email": "kaizen@example.com",
    "password": "secure-password-123"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "handle": "kaizen",
    "password": "secure-password-123"
  }'
```

### Get Wallet Balance (use token from login)
```bash
curl http://localhost:3000/api/wallet/balance \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Request Magic Link
```bash
curl -X POST http://localhost:3000/api/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{"email": "kaizen@example.com"}'
```

---

## 💰 Generate Founder Wallet

**⚠️ ONE TIME ONLY - Run this carefully!**

The founder wallet gives you 1,000,000 MIC. The private key is displayed once and never stored.

```bash
# Make sure database is set up first
npm run founder:generate
```

**IMPORTANT:**
1. Have paper and pen ready
2. Write down the private key (3 copies)
3. Store copies in 3 separate secure locations
4. Clear terminal: `history -c && clear`
5. Never digitize the private key

---

## 🏗️ Project Structure

```
OAA-API-Library/
├── prisma/
│   └── schema.prisma        # Database schema
├── src/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── register.ts  # POST /api/auth/register
│   │   │   ├── login.ts     # POST /api/auth/login
│   │   │   ├── magic-link.ts# POST /api/auth/magic-link
│   │   │   ├── verify.ts    # POST /api/auth/verify
│   │   │   └── index.ts
│   │   └── wallet/
│   │       ├── balance.ts   # GET /api/wallet/balance
│   │       ├── founder.ts   # GET /api/wallet/founder
│   │       └── index.ts
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── jwt.ts       # JWT token management
│   │   │   ├── authService.ts # Auth business logic
│   │   │   └── index.ts
│   │   └── crypto/
│   │       ├── hash.ts      # SHA256, bcrypt, HMAC
│   │       ├── ed25519.ts   # Wallet keypair generation
│   │       └── index.ts
│   ├── middleware/
│   │   └── auth.ts          # Auth middleware
│   └── index.ts             # Express server
├── scripts/
│   └── generate-founder-wallet.ts
├── .env.example
├── package.json
└── tsconfig.json
```

---

## 📋 API Reference

### Auth Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Create new account | No |
| POST | `/api/auth/login` | Password login | No |
| POST | `/api/auth/logout` | End session | Yes |
| POST | `/api/auth/magic-link` | Send login link | No |
| POST | `/api/auth/verify` | Verify magic link | No |

### Wallet Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/wallet/balance` | Get MIC balance | Yes |
| GET | `/api/wallet/history` | Get ledger history | Yes |
| POST | `/api/wallet/earn` | Record earning | Yes |
| GET | `/api/wallet/founder` | View founder wallet | No |
| POST | `/api/wallet/founder/verify` | Verify founder signature | No |

---

## 🔧 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Secret for access tokens (min 32 chars) |
| `JWT_REFRESH_SECRET` | ❌ | Secret for refresh tokens |
| `PORT` | ❌ | Server port (default: 3000) |
| `NODE_ENV` | ❌ | `development` or `production` |
| `CORS_ORIGIN` | ❌ | Allowed origins (default: `*`) |
| `FRONTEND_URL` | ❌ | Frontend URL for redirects |
| `CHECK_SESSION_VALIDITY` | ❌ | Enable session checking |

---

## 🚀 Deploy to Render

### 1. Create a new Web Service

Connect your GitHub repo to Render.

### 2. Configure Build & Start

- **Build Command:** `npm install && npx prisma generate && npm run build`
- **Start Command:** `npm start`

### 3. Set Environment Variables

In Render dashboard, add:
- `DATABASE_URL` - Use your Render PostgreSQL URL
- `JWT_SECRET` - Generate a new one
- `NODE_ENV` - `production`
- `CORS_ORIGIN` - Your frontend URL

### 4. Deploy!

Push to main branch and Render will auto-deploy.

---

## 🔒 Security Checklist

### Development
- [x] Use `.env` for secrets
- [x] Never commit `.env`
- [x] Use test database

### Production
- [ ] Generate new JWT secrets
- [ ] Enable HTTPS
- [ ] Set proper CORS origins
- [ ] Enable session validation
- [ ] Use production database with SSL
- [ ] Set up email for magic links
- [ ] Monitor for suspicious activity

---

## 🎯 Frontend Integration

```typescript
// Login
const login = async (handle: string, password: string) => {
  const response = await fetch('https://your-api.onrender.com/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ handle, password }),
  });
  
  const { success, user, tokens, error } = await response.json();
  
  if (success) {
    localStorage.setItem('token', tokens.accessToken);
    return user;
  }
  
  throw new Error(error);
};

// Authenticated Request
const getBalance = async () => {
  const token = localStorage.getItem('token');
  
  const response = await fetch('https://your-api.onrender.com/api/wallet/balance', {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  
  return response.json();
};

// Magic Link Request
const requestMagicLink = async (email: string) => {
  const response = await fetch('https://your-api.onrender.com/api/auth/magic-link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  
  return response.json();
};
```

---

## 🌊 What's Included

### ✅ Complete Auth System
- Password-based login
- Magic link (passwordless) login
- JWT access + refresh tokens
- Session management
- User registration with validation

### ✅ MIC Wallet System
- Auto-created custodial wallets
- Append-only ledger (auditable)
- Balance derived from ledger
- Founder wallet with 1M MIC
- Transaction history

### ✅ Cryptographic Security
- Ed25519 keypair generation
- SHA256 hashing
- bcrypt password hashing
- HMAC message authentication
- JWT token signing

### ✅ Identity Events
- Append-only event log
- Hash chain for integrity
- Ready for Merkle anchoring

---

## 💎 Constitutional Principles

This system is built on the **Three Covenants**:

1. **Integrity** - All transactions are cryptographically verified
2. **Ecology** - Append-only ledger ensures sustainability
3. **Custodianship** - Users own their identity and assets

---

## 🆘 Troubleshooting

### "Prisma client not found"
```bash
npx prisma generate
```

### "Database connection failed"
- Check `DATABASE_URL` format
- Ensure PostgreSQL is running
- Check firewall/network settings

### "JWT verification failed"
- Ensure `JWT_SECRET` matches between restarts
- Check token hasn't expired
- Verify Authorization header format: `Bearer <token>`

### "CORS error in browser"
- Add your frontend origin to `CORS_ORIGIN`
- For development, use `CORS_ORIGIN=*`

---

## 📞 Support

- **Docs:** This file + code comments
- **Issues:** Create a GitHub issue
- **Security:** Report vulnerabilities responsibly

---

**Built with love for Mobius Systems** 🌊

*"We heal as we walk."*
