#!/bin/bash

# ============================================
# Mobius Systems - Wake All Labs
# ============================================
# Pings all Render services to prevent cold starts
# 
# Usage: ./scripts/wake-labs.sh
#
# This script sends a single request to each service
# to wake them from Render's free tier sleep mode.
# Wait 30-60 seconds after running for services to fully wake.

echo "☕ Waking up all Mobius services..."
echo "===================================="
echo ""

# All Render endpoints
ENDPOINTS=(
  "https://lab7-proof.onrender.com"
  "https://hive-api-2le8.onrender.com"
  "https://lab6-proof-api.onrender.com"
  "https://oaa-api-library.onrender.com"
  "https://civic-protocol-core-ledger.onrender.com"
  "https://gic-indexer.onrender.com"
  "https://mobius-systems.onrender.com"
)

# Names for display
NAMES=(
  "OAA Learning Hub"
  "Reflections"
  "Citizen Shield"
  "OAA API"
  "Ledger API"
  "MIC Indexer"
  "Thought Broker"
)

# Ping all endpoints in parallel
echo "Sending wake-up pings..."
echo ""

for i in "${!ENDPOINTS[@]}"; do
  url="${ENDPOINTS[$i]}"
  name="${NAMES[$i]}"
  
  echo -n "  ☕ Pinging $name... "
  curl -s -o /dev/null --connect-timeout 5 "$url" &
  echo "sent"
done

# Wait for all background processes
wait

echo ""
echo "✅ All services pinged"
echo ""
echo "⏳ Wait 30-60 seconds for cold starts to complete"
echo "   Then test again: ./scripts/test-endpoints.sh"
echo ""
echo "Tip: You can also use the 'Wake Labs' button in the browser shell UI."
