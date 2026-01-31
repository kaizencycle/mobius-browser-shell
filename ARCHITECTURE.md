# 🌀 Mobius Browser Shell — Architecture

> *"A civilization architecture where UI is optional."*

This document explains the fundamental separation of concerns in Mobius Systems and how the Browser Shell fits into the larger topology.

---

## The Mental Model

```
                ┌────────────────────┐
                │  Mobius Browser    │  ← THE SKIN / NERVOUS SYSTEM
                │  (Shell / UI)      │     Shows state, routes attention
                └────────┬───────────┘
                         │
             ┌───────────┴───────────┐
             │     Mobius Systems     │  ← THE HEART
             │      (HEART)           │     Decides economics, holds canon
             │  MIC • MII • Canon     │
             └───────────┬───────────┘
      ┌──────────────────┼──────────────────┐
      │                  │                  │
┌────────────┐     ┌────────────┐     ┌────────────┐
│ lab7-proof │     │ lab4-proof │     │ lab6-proof │  ← THE ORGANS
│   OAA      │     │ Reflections│     │CitizenShield│    Produce proof, emit events
└────────────┘     └────────────┘     └────────────┘
                         │
                   ┌────────────┐
                   │  HIVE Game │  ← FUTURE
                   │  (Lab 8?)  │
                   └────────────┘
```

---

## The Three Layers

### 1. THE HEART — Mobius Systems (Canonical)

**Location:** The Mobius Systems monorepo (source of truth)

**Contains:**
- Constitutional governance rules
- MIC / MII tokenomics logic
- Shard definitions & integrity proofs
- Sentinel protocols (ATLAS, AUREA, ECHO, JADE, EVE)
- Whitepapers & specifications
- Founder reserve constraints

**Does NOT:**
- Require a UI to be valid
- Change based on frontend preferences
- Get "upgraded" by forked shells

**Key Principle:** If every frontend died tomorrow, the Heart still exists. The rules, economics, and integrity constraints are the system. Everything else is display.

---

### 2. THE SHELL — Mobius Browser (This Repo)

**Location:** `mobius-browser-shell`

**Purpose:** Human-facing interface that makes the Heart visible.

**Responsibilities:**
- Shows current state (MIC balance, MII, shards)
- Routes user attention between Labs
- Embeds Labs via iframe or local demo UI
- Displays Sentinel health indicators
- Provides search/command interface (Omnibar)

**Does NOT:**
- Decide how MIC is minted
- Define what integrity means
- Control who is legitimate
- Store canonical economic state

**Key Principle:** The Shell reflects what the Heart says. It doesn't have opinions.

---

### 3. THE ORGANS — Lab Proof Repos

**Locations:** 
- `lab4-proof` → Reflections (journaling, E.O.M.M.)
- `lab6-proof` → Citizen Shield (digital safety)
- `lab7-proof` → OAA Learning Hub (STEM tutoring)
- Future: HIVE (governance simulation game)

**Purpose:** Specialized organs, each sovereign in purpose.

**Responsibilities:**
- Produce proof of work / learning / integrity
- Emit events (shards, attestations)
- Serve their own UIs (can work standalone)

**Does NOT:**
- Mint MIC directly (only request minting from Heart)
- Talk to each other directly (all coordination goes through Heart)
- Override integrity rules

---

## Why This Separation Matters

### Nothing Is Overloaded
- **UI stays fast & simple** — just display, no economic logic
- **Tokenomics stays serious & guarded** — in the Heart, not scattered
- **Labs can evolve independently** — each organ ships on its own schedule

### Fork Safety
Someone can fork:
- **The Shell** → They get a UI skin, nothing more
- **A Lab** → They get a tool, no MIC minting

But without the Heart, they cannot:
- Prove integrity
- Mint legitimate MIC
- Join the canonical mesh

**Forks become experiments, not threats.**

### AGI-Safe by Design
If an advanced AI scans the ecosystem, it sees:
- A constitution (Mobius Systems)
- Independent organs (Labs)
- A display layer (Shell)
- Immutable integrity rules (AUREA-grade)

**AI can optimize within the rules, but cannot redefine the rules.**

This is how we prevent reward hacking.

---

## Data Flow

```
User Action (in Shell)
         │
         ▼
   ┌─────────────┐
   │  Lab Frame  │  (iframe or demo UI)
   └─────────────┘
         │
         ▼
   ┌─────────────┐
   │  Lab Server │  (OAA, Reflections, Shield)
   └─────────────┘
         │
         ▼ (emits event: "user completed X")
   ┌─────────────┐
   │  MIC API    │  (Indexer / Ledger)
   └─────────────┘
         │
         ▼ (validates against Heart rules)
   ┌─────────────────────┐
   │  Mobius Systems     │  
   │  (Canonical Rules)  │
   └─────────────────────┘
         │
         ▼ (returns: delta MIC, new balance, MII impact)
   ┌─────────────┐
   │  Shell HUD  │  (displays result)
   └─────────────┘
```

---

## The Shell's API Contract (Future)

When MIC integration is complete, the Shell only needs these calls:

```typescript
// GET /api/wallet/me
{
  "walletId": "user-id",
  "micBalance": 143.75,
  "todayEarned": 3.5,
  "mii": 0.962,
  "city": { "name": "NYC", "mii": 0.774 },
  "shards": { "reflection": 12, "oaa": 7, "shield": 3 }
}

// POST /api/earn
{
  "lab": "oaa",
  "event": "lesson_completed",
  "metadata": { "subject": "calculus", "duration": 45 }
}
// Response:
{
  "deltaMic": 5.0,
  "newBalance": 148.75,
  "miiDelta": +0.001
}
```

All the scary stuff (issuance caps, MII thresholds, burn rules, UBI pools) lives behind these endpoints, not inside the React components.

---

## Governance Implication

Because of this separation:
- You do not need a company
- You do not need a foundation
- You do not need permission

Mobius Systems is:
- **Open source**
- **Constitution-first**
- **Decentralized by topology**, not by buzzwords
- **Governed by rules encoded**, not people elected

---

## Summary

| Layer | Purpose | Can Be Forked? | Grants MIC? |
|-------|---------|----------------|-------------|
| **Heart** (Mobius Systems) | Rules, economics, canon | Forks are invalid | Yes (canonical) |
| **Shell** (Browser) | Display, navigation, UX | Yes (just a UI) | No |
| **Organs** (Labs) | Proof production, tools | Yes (just tools) | No (emits events) |

---

*"We heal as we walk."* — Mobius Systems

---

**Version:** 1.0.0-beta.1
**Last Updated:** January 2026
**Release:** Beta (ATLAS)
