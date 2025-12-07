#!/bin/bash
# Quick verification that anti-nuke protections are active

echo "🛡️ Verifying Anti-Nuke Protections"
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

check() {
    local result=$1
    local message=$2
    
    if [ "$result" = "pass" ]; then
        echo -e "${GREEN}✅${NC} $message"
        ((CHECKS_PASSED++))
    elif [ "$result" = "warn" ]; then
        echo -e "${YELLOW}⚠️${NC}  $message"
        ((CHECKS_WARNING++))
    else
        echo -e "${RED}❌${NC} $message"
        ((CHECKS_FAILED++))
    fi
}

# Check workflows
echo -e "${BLUE}Checking Workflows...${NC}"

if [ -f .github/workflows/anti-nuke-sentinel.yml ]; then
    check "pass" "Sentinel workflow present"
else
    check "fail" "Sentinel workflow missing"
fi

if [ -f .github/workflows/anti-nuke-mirror.yml ]; then
    check "pass" "Mirror workflow present"
else
    check "fail" "Mirror workflow missing"
fi

if [ -f .github/workflows/sentinel-validation.yml ]; then
    check "pass" "Sentinel validation workflow present"
else
    check "warn" "Sentinel validation workflow missing (optional)"
fi

if [ -f .github/workflows/nuclear-failsafe.yml ]; then
    check "pass" "Nuclear failsafe workflow present"
else
    check "warn" "Nuclear failsafe workflow missing (optional)"
fi

echo ""

# Check sentinel scripts
echo -e "${BLUE}Checking Sentinel Scripts...${NC}"

SENTINEL_DIRS=("atlas" "aurea" "eve" "jade" "shared")
for dir in "${SENTINEL_DIRS[@]}"; do
    if [ -d ".github/sentinels/$dir" ]; then
        check "pass" "Sentinel directory: $dir"
    else
        check "fail" "Sentinel directory missing: $dir"
    fi
done

echo ""

# Check constitution
echo -e "${BLUE}Checking Constitution...${NC}"

if [ -f .mobius-constitution ]; then
    check "pass" "Constitution file present"
    
    # Check size
    SIZE=$(wc -c < .mobius-constitution)
    if [ "$SIZE" -gt 100 ]; then
        check "pass" "Constitution file has content ($SIZE bytes)"
    else
        check "warn" "Constitution file may be incomplete"
    fi
else
    check "warn" "Constitution file not found (non-critical)"
fi

echo ""

# Check critical files
echo -e "${BLUE}Checking Critical Files...${NC}"

CRITICAL_FILES=(
    "package.json"
    "README.md"
    "App.tsx"
    "index.tsx"
    "index.html"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        check "pass" "$file present"
    else
        check "fail" "$file missing"
    fi
done

echo ""

# Check git status
echo -e "${BLUE}Checking Git Status...${NC}"

BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
if [ "$BRANCH" = "main" ]; then
    check "pass" "On main branch"
elif [ -n "$BRANCH" ]; then
    check "warn" "On branch: $BRANCH (not main)"
else
    check "fail" "Could not determine branch"
fi

# Git integrity
if git fsck --quiet 2>/dev/null; then
    check "pass" "Git repository integrity verified"
else
    check "warn" "Git integrity check reported issues"
fi

echo ""

# Check for backup logs
echo -e "${BLUE}Checking Backup Status...${NC}"

if [ -f .ipfs-archive-log.txt ]; then
    LAST_BACKUP=$(tail -1 .ipfs-archive-log.txt 2>/dev/null | cut -d' ' -f2)
    if [ -n "$LAST_BACKUP" ]; then
        check "pass" "IPFS archive log present (last: $LAST_BACKUP)"
    else
        check "pass" "IPFS archive log present"
    fi
else
    check "warn" "No IPFS archive log found (backups may not have run yet)"
fi

if [ -f .arweave-archive-log.txt ]; then
    check "pass" "Arweave archive log present"
else
    check "warn" "No Arweave archive log found (nuclear failsafe may not have run)"
fi

echo ""

# Check documentation
echo -e "${BLUE}Checking Documentation...${NC}"

if [ -f docs/RECOVERY.md ]; then
    check "pass" "Recovery documentation present"
else
    check "warn" "Recovery documentation missing"
fi

if [ -f docs/ANTI_NUKE_ARCHITECTURE.md ]; then
    check "pass" "Architecture documentation present"
else
    check "warn" "Architecture documentation missing"
fi

echo ""

# Summary
echo "=============================="
echo "Verification Summary"
echo "=============================="
echo -e "Passed:   ${GREEN}${CHECKS_PASSED}${NC}"
echo -e "Warnings: ${YELLOW}${CHECKS_WARNING}${NC}"
echo -e "Failed:   ${RED}${CHECKS_FAILED}${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    if [ $CHECKS_WARNING -eq 0 ]; then
        echo -e "${GREEN}🛡️ Anti-Nuke protections fully verified!${NC}"
    else
        echo -e "${GREEN}🛡️ Anti-Nuke protections verified (with warnings)${NC}"
    fi
    exit 0
else
    echo -e "${RED}⚠️ Some protections missing - review above${NC}"
    exit 1
fi
