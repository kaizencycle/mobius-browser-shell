#!/usr/bin/env bash
# Fetches canonical HIVE world JSON from mobius-hive (raw GitHub) into public/world/
# for bundling in the browser shell. Used by .github/workflows/fetch-hive-world.yml
set -euo pipefail

REPO="${MOBIUS_HIVE_REPO:-kaizencycle/mobius-hive}"
BRANCH="${MOBIUS_HIVE_BRANCH:-main}"
BASE="https://raw.githubusercontent.com/${REPO}/${BRANCH}"

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

echo "Done. Current cycle references: event=${EVENT:-∅} quest=${QUEST:-∅} sentinel=${SENT:-∅}"
