
[![Version](https://img.shields.io/badge/version-1.0.0-emerald)](https://github.com/kaizencycle/mobius-browser-shell/releases)
[![Release Stage](https://img.shields.io/badge/stage-Stable-brightgreen)](./CHANGELOG.md)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)
[![Sentinels](https://img.shields.io/badge/sentinels-ATLAS%20%7C%20AUREA%20%7C%20EVE%20%7C%20JADE-purple)](./.github/sentinels/)
[![MII](https://img.shields.io/badge/MII-0.95-brightgreen)](./docs/SENTINEL_GUIDE.md)

</div>

# 🌀 Mobius Browser Shell

> *"The nervous system of civilization infrastructure."*

## 🚀 Stable Release v1.0.0

**Release Date:** March 8, 2026
**Codename:** ATLAS
**Status:** Stable

The Mobius Browser Shell v1.0.0 — all core features complete, type-safe, and production verified.

The Mobius Browser Shell is the human-facing interface for Mobius Systems. It serves as a unified control room that embeds all Mobius Labs (OAA, Reflections, Citizen Shield, HIVE) and displays system integrity metrics (MIC, MII).

## Architecture

```
┌────────────────────┐
│  Mobius Browser    │  ← You are here (Shell / UI)
│  (Shell / UI)      │
└────────┬───────────┘
         │
┌───────────┴───────────┐
│     Mobius Systems     │  ← The Heart (canonical source of truth)
│      (HEART)           │
│  MIC • MII • Canon     │
└───────────┬───────────┘
      ┌─────┼─────────────────┐
      │     │                 │
┌─────┴────┐ ┌────┴─────┐ ┌───┴───────┐
│ OAA Hub  │ │Reflections│ │Cit. Shield│  ← Labs (sovereign organs)
│ (Lab 7)  │ │  (Lab 4)  │ │  (Lab 6)  │
└──────────┘ └──────────┘ └───────────┘
                  │
            ┌─────┴─────┐
            │   HIVE    │  ← Coming Soon
            │  (Game)   │
            └───────────┘
```

**Key Principle:** The shell displays state but doesn't decide economics. All tokenomics (MIC minting, MII thresholds, integrity rules) live in Mobius Systems, not here.

## Quick Start

### Prerequisites
- Node.js 18+
- npm or pnpm

### Run Locally (Demo Mode)

```bash
# Clone the repo
git clone https://github.com/kaizencycle/mobius-browser-shell.git
cd mobius-browser-shell

# Install dependencies
npm install

# Run in demo mode (shows mock UI)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the shell with demo components.

### Run with Live Labs (Production Mode)

```bash
# Copy the example env file
cp .env.local.example .env.local

# Edit .env.local with your real URLs:
# VITE_OAA_URL=https://oaa.onrender.com/hub/
# VITE_REFLECTIONS_URL=https://your-reflections-url.onrender.com/
# VITE_CITIZEN_SHIELD_URL=https://your-citizen-shield-url.onrender.com/
# VITE_USE_LIVE_LABS=true

# Run the app
npm run dev
```

Now tabs will embed your real deployed labs via iframes!

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_OAA_URL` | OAA Learning Hub URL | For live mode |
| `VITE_REFLECTIONS_URL` | Reflections app URL | For live mode |
| `VITE_CITIZEN_SHIELD_URL` | Citizen Shield URL | For live mode |
| `VITE_HIVE_URL` | HIVE game URL (optional) | No |
| `VITE_USE_LIVE_LABS` | `true` = iframe, `false` = demo UI | No (default: false) |
| `VITE_MIC_API_BASE` | MIC Indexer API base URL | No |
| `VITE_LEDGER_API` | Command Ledger API base URL | No |

## Deploy

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/kaizencycle/mobius-browser-shell)

1. Connect your GitHub repo
2. Add environment variables in Vercel dashboard
3. Deploy

### Netlify

1. Connect repo to Netlify
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add environment variables

### Render (Static Site)

1. Create new Static Site
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add environment variables

## iframe Security Notes

Some deployed apps may block iframe embedding via `X-Frame-Options` or `Content-Security-Policy` headers. If a lab shows blank:

1. Check browser console for CSP/X-Frame errors
2. Either:
   - Update the lab's server to allow framing from your shell domain
   - Use the "Open in New Tab" button as a fallback
   - Run in demo mode (`VITE_USE_LIVE_LABS=false`)

## Project Structure

```
mobius-browser-shell/
├── App.tsx                 # Main shell layout
├── config/
│   └── env.ts              # Environment configuration
├── components/
│   ├── Labs/
│   │   ├── OAALab.tsx      # OAA demo/iframe wrapper
│   │   ├── ReflectionsLab.tsx
│   │   ├── CitizenShieldLab.tsx
│   │   ├── HiveLab.tsx
│   │   └── WalletLab.tsx   # Always local (MIC/shards UI)
│   ├── LabFrame.tsx        # Shared iframe component
│   ├── Omnibar.tsx         # Search/command bar
│   ├── SentinelStatus.tsx  # Sentinel health indicators
│   └── TabNavigation.tsx   # Tab switching
├── constants.ts            # Lab definitions, mock data
├── types.ts                # TypeScript interfaces
└── .env.local.example      # Environment template
```

## MIC Wallet Integration

The Wallet tab fetches live data from `VITE_MIC_WALLET_API_BASE` using a Bearer JWT minted by the shell after WebAuthn authentication. Authentication (`JWT_SECRET`) must be set in the Vercel dashboard for the token to flow; without it the wallet silently shows no data.

```
Registration / Login
  → /api/auth/*/verify  (WebAuthn assertion)
  → shell mints HS256 JWT (24h, citizenId + handle)
  → WalletContext carries Bearer token
  → ${VITE_MIC_WALLET_API_BASE}/mic/wallet
```

The `HIVE → ledger → Chronicle` write-back loop (C-341) posts citizen attestations to `VITE_LEDGER_API/ledger/attest` on game events — no auth required on that path.

## Philosophy

> **The Browser Shell is optional. Mobius Systems is not.**

If every frontend died tomorrow, Mobius Systems (the heart) still exists. The shell is just the nervous system that makes the heart visible to humans.

- **Shell:** Shows state, routes attention, embeds labs
- **Heart:** Decides economics, enforces integrity, holds canon
- **Labs:** Produce proof of work/learning, emit events

This separation means:
- Forks of the shell are just UIs
- Forks of labs are just tools
- Without the heart, neither can mint legitimate MIC

*"We heal as we walk."* — Mobius Systems

---

## License

MIT - but remember: you can fork the shell, not the integrity.

---

## 📋 Beta Release Checklist

| Component | Status | Version |
|-----------|--------|---------|
| Browser Shell (UI) | ✅ Ready | 1.0.0-beta.1 |
| OAA Learning Hub | ✅ Ready | 1.0.0-beta.1 |
| Reflections Lab | ✅ Ready | 1.0.0-beta.1 |
| Citizen Shield | ✅ Ready | 1.0.0-beta.1 |
| HIVE Lab | ✅ Ready | 1.0.0-beta.1 |
| Wallet Lab | ✅ Ready | 1.0.0-beta.1 |
| JADE Lab | ✅ Ready | 1.0.0-beta.1 |
| Knowledge Graph | ✅ Ready | 1.0.0-beta.1 |
| Sentinel System | ✅ Active | 1.0.0 |
| Anti-Nuke Protection | ✅ Active | 1.0.0 |
| Authentication (WebAuthn + JWT) | ✅ Ready | 1.0.0-beta.2 |
| MIC Wallet (requires JWT_SECRET in Vercel) | ✅ Wired | 1.0.0-beta.2 |

## 🛡️ Sentinel Status

| Sentinel | Role | Status |
|----------|------|--------|
| ATLAS | Architectural Review | 🟢 Active |
| AUREA | Integrity Check | 🟢 Active |
| EVE | Deployment Verification | 🟢 Active |
| JADE | UX Validation | 🟢 Active |

---

## 📚 Documentation

- [CHANGELOG](./CHANGELOG.md) - Version history and release notes
- [ARCHITECTURE](./ARCHITECTURE.md) - System design and topology
- [SENTINEL GUIDE](./docs/SENTINEL_GUIDE.md) - Sentinel system documentation
- [ANTI-NUKE ARCHITECTURE](./docs/ANTI_NUKE_ARCHITECTURE.md) - Protection systems
- [RECOVERY](./docs/RECOVERY.md) - Disaster recovery procedures
- [HIVE LORE BIBLE](./docs/hive/LORE_BIBLE.md) - HIVE game lore and mechanics
