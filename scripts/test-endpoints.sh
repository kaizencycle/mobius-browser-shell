#!/bin/bash

# ============================================
# Mobius Systems - Test All Endpoints
# ============================================
# Verifies all services are reachable
# 
# Usage: ./scripts/test-endpoints.sh

echo "🌀 Testing Mobius Endpoints..."
echo "=============================="
echo ""

# Define endpoints - Frontend Labs
declare -A LABS=(
  ["OAA Learning Hub"]="https://lab7-proof.onrender.com"
  ["Reflections"]="https://hive-api-2le8.onrender.com"
  ["Citizen Shield"]="https://lab6-proof-api.onrender.com"
)

# Define endpoints - Backend APIs
declare -A APIS=(
  ["OAA API"]="https://oaa-api-library.onrender.com"
  ["Ledger API"]="https://civic-protocol-core-ledger.onrender.com"
  ["MIC Indexer API"]="https://gic-indexer.onrender.com"
  ["Thought Broker API"]="https://mobius-systems.onrender.com"
)

# Test function
test_endpoint() {
  local name=$1
  local url=$2
  
  echo -n "Testing $name... "
  
  response=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --max-time 30 "$url" 2>/dev/null)
  
  case "$response" in
    200|301|302|307|308)
      echo "✅ OK ($response)"
      return 0
      ;;
    000)
      echo "❌ TIMEOUT - Service may be asleep (Render free tier)"
      return 1
      ;;
    404)
      echo "⚠️  404 - Endpoint exists but route not found"
      return 0
      ;;
    500|502|503)
      echo "⚠️  $response - Service error or starting up"
      return 1
      ;;
    *)
      echo "⚠️  HTTP $response"
      return 1
      ;;
  esac
}

# Track results
total=0
passed=0

echo "Frontend Labs:"
echo "--------------"
for name in "${!LABS[@]}"; do
  if test_endpoint "$name" "${LABS[$name]}"; then
    ((passed++))
  fi
  ((total++))
done

echo ""
echo "Backend APIs:"
echo "-------------"
for name in "${!APIS[@]}"; do
  if test_endpoint "$name" "${APIS[$name]}"; then
    ((passed++))
  fi
  ((total++))
done

echo ""
echo "=============================="
echo "Results: $passed/$total endpoints responding"
echo ""

if [ $passed -lt $total ]; then
  echo "⚠️  Some services may be asleep (Render free tier)."
  echo "   Run: ./scripts/wake-labs.sh to wake them up"
  echo ""
fi

echo "Note: Render free tier services sleep after 15 min inactivity."
echo "      First request wakes them (30-60 second delay)."
