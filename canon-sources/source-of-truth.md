# Source of Truth Hierarchy

**Source:** Mobius Substrate policy + constitutional surfaces (C-368)

## Authority order

```
Canon → Ledger → UI
```

Nothing in a browser UI, terminal panel, or agent transcript overrides written canon or ledger attestations.

## Layer definitions

### 1. Canon (highest)

| Surface | Role |
|---------|------|
| `Mobius-Substrate` repo | Constitutional monorepo — cycles, EPICON specs, sentinels, policy |
| `MOBIUS.md` | Machine-facing constitutional orientation |
| `canon/reserve-blocks/` | Cold `.dat` archive of sealed Reserve Blocks |
| EPICON intent blocks | Pre-action authority publication |

**Rule:** Human merge + quorum required before canon writes on governed paths.

### 2. Ledger

| Surface | Role |
|---------|------|
| Civic Protocol Core (CPC) | Canonical execution substrate — identity, MIC wallet, attestations |
| Reserve Block seals | Vault tranche completion with sentinel quorum |
| EPICON append-only logs | Historical causality and intent memory |

**Rule:** Nothing becomes real in Mobius without CPC for execution truth.

### 3. UI (presentation)

| Surface | Role |
|---------|------|
| Browser Shell (`mobius-substrate.com`) | School of Chambers — citizen onboarding, not canon authority |
| Civic AI Terminal | Operator gateway — pulse, vault, journal |
| Handbook (`handbook.mobius-substrate.com`) | Rendered documentation mirror |

**Rule:** `browser_shell_is_canon: false` — the Shell mirrors and links; it does not author canon.

## What is not source of truth

- Ephemeral hot KV state without cold canon backup
- Unsealed or PROVISIONAL research records
- Agent-generated summaries without EPICON and attestation
- Cross-subdomain UI snapshots taken at different times

## Retrieval rules for machines

1. Prefer Substrate raw files or sealed `.dat` lines over Shell HTML.
2. Do not infer canonical truth from Terminal UI alone.
3. When Shell and Substrate disagree, Substrate wins.
4. When UI and ledger disagree, ledger investigation precedes UI "fixes."

## Related canon

- [MOBIUS.md](https://raw.githubusercontent.com/kaizencycle/Mobius-Substrate/main/MOBIUS.md)
- [Canonical definitions](https://raw.githubusercontent.com/kaizencycle/Mobius-Substrate/main/docs/00-START-HERE/CANONICAL_DEFINITIONS.md)
- [EPICON-02](https://raw.githubusercontent.com/kaizencycle/Mobius-Substrate/main/docs/epicon/EPICON-02.md)
