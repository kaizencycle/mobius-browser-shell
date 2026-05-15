# C-312 — Browser Shell Citizen Onboarding Roadmap

## Intent

Transform the Mobius Browser Shell from a static iframe launcher into a living citizen interface connected to the Mobius Civic AI Terminal.

This roadmap intentionally stages rollout to avoid repeating prior hallway regressions.

---

## Phase 0 — Foundation (safe additive)

Status: in progress

### Goals

- Introduce reusable Terminal data infrastructure.
- Avoid touching hallway layout or navigation logic.
- Keep all changes additive.

### Included

- `services/terminalBridge.ts`
- `hooks/useTerminalData.ts`
- Vault/MobiusWallet bridge integration
- Read-only terminal polling

### Not touching

- Hallway scroll behavior
- Core App.tsx routing
- Existing chamber mounting
- Existing iframe behaviors

---

## Phase 1 — Citizen Identity Layer

### SHELL-01
Citizen onboarding wizard.

### SHELL-02
Live system bar.

### SHELL-17
Persistent citizen profile.

### SHELL-16
Cycle timeline.

### Rules

- All onboarding state local-only.
- No backend writes.
- No auth coupling.
- No blocking network requirements.

---

## Phase 2 — Live Civic Surfaces

### SHELL-03
8-sentinel roster.

### SHELL-05
EPICON feed.

### SHELL-09
GI gauge.

### SHELL-14
Civic alert banner.

### Rules

- Terminal data read-only.
- Graceful fallback states mandatory.
- No hard dependency on Terminal uptime.

---

## Phase 3 — Navigation + Routing

### SHELL-08
Omnibar activation.

### SHELL-11
Hash routing.

### SHELL-18
Terminal as first-class lab.

### Rules

- Preserve current chamber behavior.
- Never break direct room entry.
- Keep routes additive.

---

## Phase 4 — Platform Hardening

### SHELL-10
LabFrame fallback.

### SHELL-12
PWA manifest.

### SHELL-13
SEO/GEO metadata.

### SHELL-19
Robots + proxy hardening.

### Rules

- No destructive rewrites.
- Preserve Vercel deploy stability.
- Validate all iframe fallback behavior.

---

## Phase 5 — Citizen Home Surface

### SHELL-20
Return citizen dashboard.

### Goal

Replace cold iframe-first experience with a living civic dashboard showing:

- GI
- EPICON activity
- Sentinel state
- Cycle context
- Lab launcher grid

---

## Architectural Principle

Terminal = heartbeat.
Shell = hallway.
Substrate = meaning.
Ledger = memory.

Truth flow:

Canon → Ledger → Terminal → Shell.

The shell witnesses truth.
It does not invent truth.
