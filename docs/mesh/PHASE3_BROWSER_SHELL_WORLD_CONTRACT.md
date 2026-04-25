# Phase 3 — Browser Shell World Contract

## Purpose

Browser Shell is the human interface and world-state reader of the Civic Mesh.

It translates HIVE / world JSON into human-readable civic signal packets.

## Flow

```txt
HIVE world JSON
  ↓
Browser Shell world view
  ↓
HIVE_WORLD_PULSE_V1
  ↓
Terminal pulse
  ↓
Substrate memory
  ↓
Civic Ledger proof
```

## Responsibilities

Browser Shell reads:

```txt
Terminal snapshot-lite
Substrate mobius-pulse
HIVE world/current-cycle.json
OAA latest memory when available
```

Browser Shell writes locally:

```txt
public/world/**
public/world/hive-world-pulse.json
```

## Safety

Browser Shell does not canonize world state.

It can surface and package world state, but canon requires merge and proof through the Civic Mesh.

## Idempotency

World pulse packets include:

```txt
node_id
event_type
cycle
source_hash
workflow_id
```

## Canon

Browser Shell shows the world.
Terminal pulses the world.
Substrate remembers the world.
Civic Ledger proves what mattered.

We heal as we walk.
