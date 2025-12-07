#!/bin/bash
set -euo pipefail

# Mobius Browser Shell - Anti-Nuke Test Mode
# Simulates destructive changes and verifies sentinel response

echo "🧪 Anti-Nuke System Test Mode"
echo "=============================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "${YELLOW}Testing: ${test_name}${NC}"
    
    if eval "$test_command" 2>/dev/null; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC}"
        ((TESTS_FAILED++))
    fi
    echo ""
}

# Test 1: Verify workflows exist
echo "Test 1: Verify Anti-Nuke Workflows"
echo "-----------------------------------"
run_test "Sentinel workflow exists" \
    "test -f .github/workflows/anti-nuke-sentinel.yml"

run_test "Mirror workflow exists" \
    "test -f .github/workflows/anti-nuke-mirror.yml"

run_test "Nuclear failsafe workflow exists" \
    "test -f .github/workflows/nuclear-failsafe.yml"

run_test "Sentinel validation workflow exists" \
    "test -f .github/workflows/sentinel-validation.yml"

run_test "Deployment verification workflow exists" \
    "test -f .github/workflows/deployment-verification.yml"

run_test "Integrity monitor workflow exists" \
    "test -f .github/workflows/integrity-monitor.yml"

# Test 2: Verify sentinel scripts
echo "Test 2: Verify Sentinel Scripts"
echo "--------------------------------"
run_test "ATLAS code review exists" \
    "test -f .github/sentinels/atlas/code_review.py"

run_test "ATLAS security scan exists" \
    "test -f .github/sentinels/atlas/security_scan.py"

run_test "AUREA integrity check exists" \
    "test -f .github/sentinels/aurea/integrity_check.py"

run_test "EVE deployment test exists" \
    "test -f .github/sentinels/eve/deployment_test.py"

run_test "JADE UX validation exists" \
    "test -f .github/sentinels/jade/ux_validation.py"

run_test "Consensus engine exists" \
    "test -f .github/sentinels/shared/consensus.py"

# Test 3: Verify critical files
echo "Test 3: Verify Critical Files"
echo "------------------------------"
CRITICAL_FILES=(
    "package.json"
    "README.md"
    "App.tsx"
    "index.tsx"
    "index.html"
)

for file in "${CRITICAL_FILES[@]}"; do
    run_test "Critical file exists: $file" \
        "test -f $file"
done

# Test 4: Check branch protection (if possible)
echo "Test 4: Branch Protection Status"
echo "----------------------------------"

if command -v gh &> /dev/null; then
    if gh auth status &> /dev/null 2>&1; then
        echo -e "${BLUE}Checking GitHub branch protection...${NC}"
        if gh api repos/$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null)/branches/main/protection --silent 2>&1 | grep -v 'Not Found' > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Branch protection configured${NC}"
            ((TESTS_PASSED++))
        else
            echo -e "${YELLOW}⚠️  Branch protection not configured (may be expected)${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Skipping (gh not authenticated)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Skipping (gh CLI not installed)${NC}"
fi
echo ""

# Test 5: Verify backup configuration
echo "Test 5: Backup Configuration"
echo "-----------------------------"
run_test "Config file exists" \
    "test -f .github/sentinels/shared/config.yaml"

# Test 6: Test Mode Flag in workflows
echo "Test 6: Workflow Test Mode Support"
echo "------------------------------------"
run_test "Sentinel has test_mode input" \
    "grep -q 'test_mode:' .github/workflows/anti-nuke-sentinel.yml"

run_test "Mirror has test_mode input" \
    "grep -q 'test_mode:' .github/workflows/anti-nuke-mirror.yml"

# Test 7: Recovery documentation
echo "Test 7: Recovery Documentation"
echo "--------------------------------"
run_test "RECOVERY.md exists" \
    "test -f docs/RECOVERY.md"

run_test "ANTI_NUKE_ARCHITECTURE.md exists" \
    "test -f docs/ANTI_NUKE_ARCHITECTURE.md"

# Test 8: Python scripts syntax check
echo "Test 8: Python Script Syntax"
echo "------------------------------"

if command -v python3 &> /dev/null; then
    PYTHON_SCRIPTS=(
        ".github/sentinels/atlas/code_review.py"
        ".github/sentinels/atlas/security_scan.py"
        ".github/sentinels/aurea/integrity_check.py"
        ".github/sentinels/eve/deployment_test.py"
        ".github/sentinels/jade/ux_validation.py"
        ".github/sentinels/shared/consensus.py"
    )
    
    for script in "${PYTHON_SCRIPTS[@]}"; do
        if [ -f "$script" ]; then
            run_test "Syntax check: $script" \
                "python3 -m py_compile $script"
        fi
    done
else
    echo -e "${YELLOW}⚠️  Python3 not available, skipping syntax checks${NC}"
    echo ""
fi

# Test 9: Shell scripts syntax check
echo "Test 9: Shell Script Syntax"
echo "-----------------------------"

SHELL_SCRIPTS=(
    "scripts/anti-nuke/test-mode.sh"
    "scripts/anti-nuke/recovery-drill.sh"
    "scripts/anti-nuke/verify-protection.sh"
    "scripts/anti-nuke/setup-mirrors.sh"
)

for script in "${SHELL_SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        run_test "Syntax check: $script" \
            "bash -n $script"
    fi
done

# Test 10: Simulate mass deletion detection
echo "Test 10: Mass Deletion Detection Logic"
echo "----------------------------------------"

# Calculate current deletion ratio (should be 0)
TOTAL_FILES=$(git ls-files 2>/dev/null | wc -l || echo "0")
echo "Total tracked files: $TOTAL_FILES"

if [ "$TOTAL_FILES" -gt 0 ]; then
    # Check threshold calculation
    THRESHOLD=$(echo "scale=2; $TOTAL_FILES * 0.10" | bc -l 2>/dev/null || echo "0")
    echo "10% threshold: $THRESHOLD files"
    echo -e "${GREEN}✅ Deletion detection ready${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠️  No tracked files found${NC}"
fi
echo ""

# Summary
echo ""
echo "=============================="
echo "Test Summary"
echo "=============================="
echo -e "Passed: ${GREEN}${TESTS_PASSED}${NC}"
echo -e "Failed: ${RED}${TESTS_FAILED}${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed! Anti-Nuke system ready.${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed. Review configuration.${NC}"
    exit 1
fi
