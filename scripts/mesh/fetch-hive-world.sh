#!/usr/bin/env bash
# Fetches canonical HIVE world JSON from mobius-hive (raw GitHub) into public/world/
# for bundling in the browser shell. Used by .github/workflows/fetch-hive-world.yml
set -euo pipefail

REPO="${MOBIUS_HIVE_REPO:-kaizencycle/mobius-hive}"
BRANCH="${MOBIUS_HIVE_BRANCH:-main}"
BASE="https://raw.githubusercontent.com/${REPO}/${BRANCH}"
TERMINAL_SNAPSHOT_URL="${TERMINAL_SNAPSHOT_URL:-https://mobius-civic-ai-terminal.vercel.app/api/terminal/snapshot-lite}"

mkdir -p public/world/events public/world/quests public/world/sentinels

echo "Fetching world snapshot from ${BASE}/world/ ..."
curl -fsSL "${BASE}/world/current-cycle.json" -o public/world/current-cycle.json

EVENT="$(python3 -c "import json; print(json.load(open('public/world/current-cycle.json')).get('active_event_id') or '')")"
QUEST="$(python3 -c "import json; print(json.load(open('public/world/current-cycle.json')).get('active_quest_id') or '')")"
SENT="$(python3 -c "import json; print(json.load(open('public/world/current-cycle.json')).get('assigned_sentinel_id') or '')")"

if [[ -n "${EVENT}" ]]; then
  curl -fsSL "${BASE}/world/events/${EVENT}.json" -o "public/world/events/${EVENT}.json"
fi
if [[ -n "${QUEST}" ]]; then
  curl -fsSL "${BASE}/world/quests/${QUEST}.json" -o "public/world/quests/${QUEST}.json"
fi
if [[ -n "${SENT}" ]]; then
  curl -fsSL "${BASE}/world/sentinels/${SENT}.json" -o "public/world/sentinels/${SENT}.json"
fi

python3 << 'PY'
import hashlib
import json
import os
import urllib.request
from datetime import datetime, timezone

terminal_url = os.environ.get("TERMINAL_SNAPSHOT_URL", "https://mobius-civic-ai-terminal.vercel.app/api/terminal/snapshot-lite")

def read_json(path):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None

def fetch_json(url):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "mobius-browser-shell-world-pulse/1.0"})
        with urllib.request.urlopen(req, timeout=15) as res:
            return json.loads(res.read().decode("utf-8")), None
    except Exception as exc:
        return None, str(exc)

current = read_json("public/world/current-cycle.json") or {}
event_id = current.get("active_event_id") or ""
quest_id = current.get("active_quest_id") or ""
sentinel_id = current.get("assigned_sentinel_id") or ""
event = read_json(f"public/world/events/{event_id}.json") if event_id else None
quest = read_json(f"public/world/quests/{quest_id}.json") if quest_id else None
sentinel = read_json(f"public/world/sentinels/{sentinel_id}.json") if sentinel_id else None
terminal, terminal_error = fetch_json(terminal_url)
cycle = (terminal or {}).get("cycle") or current.get("cycle") or "C-—"

pulse = {
    "schema": "HIVE_WORLD_PULSE_V1",
    "node_id": "mobius-browser-shell",
    "generated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    "cycle": cycle,
    "terminal_gi": (terminal or {}).get("gi"),
    "terminal_snapshot_available": terminal is not None,
    "terminal_snapshot_error": terminal_error,
    "world": {
        "repo": os.environ.get("MOBIUS_HIVE_REPO", "kaizencycle/mobius-hive"),
        "branch": os.environ.get("MOBIUS_HIVE_BRANCH", "main"),
        "current_cycle": current,
        "event": event,
        "quest": quest,
        "sentinel": sentinel,
    },
    "world_refs": {
        "active_event_id": event_id or None,
        "active_quest_id": quest_id or None,
        "assigned_sentinel_id": sentinel_id or None,
    },
    "agent_routing": {
        "ECHO": "ingest world signal",
        "HERMES": "route world packet",
        "ATLAS": "surface world status",
        "JADE": "gate canon world changes",
        "ZEUS": "verify pulse integrity",
    },
    "canon_rule": "Browser Shell shows world state; it does not canonize world state.",
}
encoded = json.dumps(pulse, sort_keys=True).encode("utf-8")
pulse["source_hash"] = hashlib.sha256(encoded).hexdigest()
pulse["idempotency_key"] = f"mobius-browser-shell:HIVE_WORLD_PULSE_V1:{cycle}:{pulse['source_hash'][:16]}:fetch-hive-world"
with open("public/world/hive-world-pulse.json", "w", encoding="utf-8") as f:
    json.dump(pulse, f, indent=2, sort_keys=True)
    f.write("\n")
PY

echo "Done. Current cycle references: event=${EVENT:-∅} quest=${QUEST:-∅} sentinel=${SENT:-∅}"
