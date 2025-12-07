#!/bin/bash
# Verify environment configuration for deployment

echo "🔍 Environment Verification"
echo "============================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PASSED=0
FAILED=0
WARNINGS=0

check_var() {
    local var_name=$1
    local required=$2
    
    if [ -n "${!var_name:-}" ]; then
        echo -e "${GREEN}✅${NC} $var_name is set"
        ((PASSED++))
    elif [ "$required" = "required" ]; then
        echo -e "${RED}❌${NC} $var_name is NOT set (required)"
        ((FAILED++))
    else
        echo -e "${YELLOW}⚠️${NC}  $var_name is not set (optional)"
        ((WARNINGS++))
    fi
}

echo "Required Environment Variables:"
echo "--------------------------------"
check_var "VITE_OAA_URL" "required"
check_var "VITE_REFLECTIONS_URL" "required"
check_var "VITE_CITIZEN_SHIELD_URL" "required"

echo ""
echo "Optional Environment Variables:"
echo "--------------------------------"
check_var "VITE_MIC_API_BASE" "optional"
check_var "VITE_WALLET_URL" "optional"
check_var "VITE_HIVE_URL" "optional"
check_var "VITE_ECHO_URL" "optional"

echo ""
echo "Build Configuration:"
echo "--------------------"

# Check Node version
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✅${NC} Node.js: $NODE_VERSION"
    ((PASSED++))
else
    echo -e "${RED}❌${NC} Node.js not installed"
    ((FAILED++))
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✅${NC} npm: $NPM_VERSION"
    ((PASSED++))
else
    echo -e "${RED}❌${NC} npm not installed"
    ((FAILED++))
fi

# Check package.json
if [ -f "package.json" ]; then
    echo -e "${GREEN}✅${NC} package.json found"
    ((PASSED++))
else
    echo -e "${RED}❌${NC} package.json not found"
    ((FAILED++))
fi

# Check for .env files
echo ""
echo "Environment Files:"
echo "------------------"

if [ -f ".env" ]; then
    echo -e "${GREEN}✅${NC} .env file found"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️${NC}  .env file not found"
    ((WARNINGS++))
fi

if [ -f ".env.local" ]; then
    echo -e "${GREEN}✅${NC} .env.local file found"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️${NC}  .env.local file not found (may be OK for CI)"
    ((WARNINGS++))
fi

if [ -f ".env.local.example" ]; then
    echo -e "${GREEN}✅${NC} .env.local.example found (template available)"
    ((PASSED++))
fi

echo ""
echo "=============================="
echo "Verification Summary"
echo "=============================="
echo -e "Passed:   ${GREEN}${PASSED}${NC}"
echo -e "Warnings: ${YELLOW}${WARNINGS}${NC}"
echo -e "Failed:   ${RED}${FAILED}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ Environment verified - ready for deployment${NC}"
    exit 0
else
    echo -e "${RED}❌ Environment issues detected - fix before deploying${NC}"
    exit 1
fi
