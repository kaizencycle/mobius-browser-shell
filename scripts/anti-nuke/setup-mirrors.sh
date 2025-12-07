#!/bin/bash
# Interactive setup for mirror repositories

echo "🔧 Mirror Setup Assistant"
echo "========================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "This script will help you set up mirror repositories for the"
echo "Mobius Browser Shell Anti-Nuke backup system."
echo ""
echo -e "${YELLOW}Note: You will need to create accounts and generate tokens${NC}"
echo -e "${YELLOW}on each platform before proceeding.${NC}"
echo ""

# GitLab
echo -e "${BLUE}=== GitLab Mirror ===${NC}"
read -p "Set up GitLab mirror? (y/n): " -n 1 -r REPLY || REPLY="n"
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cat << EOF

GitLab Setup Instructions:
1. Go to https://gitlab.com/projects/new
2. Create project: mobius-systems/mobius-browser-shell
3. Go to Settings → Access Tokens
4. Create a token with:
   - Name: anti-nuke-mirror
   - Expiration: 1 year (or no expiration)
   - Scopes: write_repository
5. Copy the token

Then add to GitHub Secrets:
   Secret name: GITLAB_MIRROR_TOKEN
   Value: glpat-xxxxxxxxxxxx

EOF
    read -p "Press Enter when complete..." || true
    echo ""
fi

# Codeberg
echo -e "${BLUE}=== Codeberg Mirror ===${NC}"
read -p "Set up Codeberg mirror? (y/n): " -n 1 -r REPLY || REPLY="n"
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cat << EOF

Codeberg Setup Instructions:
1. Create account at https://codeberg.org
2. Go to https://codeberg.org/repo/create
3. Create repository: mobius-systems/mobius-browser-shell
4. Go to Settings → Applications
5. Generate a token with repo scope

Then add to GitHub Secrets:
   Secret name: CODEBERG_MIRROR_TOKEN
   Value: xxxxxxxxxxxx

EOF
    read -p "Press Enter when complete..." || true
    echo ""
fi

# Pinata IPFS
echo -e "${BLUE}=== IPFS Pinning (Pinata) ===${NC}"
read -p "Set up IPFS pinning? (y/n): " -n 1 -r REPLY || REPLY="n"
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cat << EOF

Pinata IPFS Setup Instructions:
1. Sign up at https://pinata.cloud (free tier: 1GB)
2. Go to API Keys → New Key
3. Create a key with:
   - Name: anti-nuke-archive
   - Permissions: pinFileToIPFS, pinJSONToIPFS
4. Copy the JWT token

Then add to GitHub Secrets:
   Secret name: PINATA_JWT
   Value: eyJhbGc...xxxx

EOF
    read -p "Press Enter when complete..." || true
    echo ""
fi

# Cloudflare R2
echo -e "${BLUE}=== Cloudflare R2 Cold Storage ===${NC}"
read -p "Set up Cloudflare R2? (y/n): " -n 1 -r REPLY || REPLY="n"
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cat << EOF

Cloudflare R2 Setup Instructions:
1. Go to Cloudflare Dashboard → R2
2. Create bucket: mobius-backups
3. Create R2 API token:
   - Go to Manage R2 API Tokens
   - Create token with Object Read & Write
4. Note the Account ID and token details

Then add to GitHub Secrets:
   R2_ACCESS_KEY_ID: xxxxxxxxxxxx
   R2_SECRET_ACCESS_KEY: xxxxxxxxxxxx
   R2_ENDPOINT_URL: https://xxxxxxxxx.r2.cloudflarestorage.com

EOF
    read -p "Press Enter when complete..." || true
    echo ""
fi

# Discord Webhook
echo -e "${BLUE}=== Discord Notifications ===${NC}"
read -p "Set up Discord webhook? (y/n): " -n 1 -r REPLY || REPLY="n"
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cat << EOF

Discord Webhook Setup Instructions:
1. Go to your Discord server
2. Server Settings → Integrations → Webhooks
3. Create webhook:
   - Name: Mobius Anti-Nuke
   - Channel: Choose appropriate channel
4. Copy the Webhook URL

Then add to GitHub Secrets:
   Secret name: DISCORD_WEBHOOK
   Value: https://discord.com/api/webhooks/xxxxx/xxxxx

EOF
    read -p "Press Enter when complete..." || true
    echo ""
fi

# Arweave (Optional)
echo -e "${BLUE}=== Arweave Permanent Storage (Optional) ===${NC}"
read -p "Set up Arweave permanent storage? (y/n): " -n 1 -r REPLY || REPLY="n"
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cat << EOF

Arweave Setup Instructions:
1. Create Arweave wallet at https://arweave.app
2. Fund wallet with AR tokens (small amount needed, ~\$0.01/MB)
3. Export wallet keyfile (JSON format)
4. Base64 encode the keyfile:
   cat wallet.json | base64 -w0

Then add to GitHub Secrets:
   Secret name: ARWEAVE_WALLET_KEY
   Value: (base64 encoded wallet JSON)

EOF
    read -p "Press Enter when complete..." || true
    echo ""
fi

# Summary
echo ""
echo "=============================="
echo -e "${GREEN}Mirror Setup Complete!${NC}"
echo "=============================="
echo ""
echo "Required GitHub Secrets:"
echo "------------------------"
echo "  GITLAB_MIRROR_TOKEN     - GitLab access token"
echo "  CODEBERG_MIRROR_TOKEN   - Codeberg access token"
echo "  PINATA_JWT              - Pinata IPFS JWT"
echo "  R2_ACCESS_KEY_ID        - Cloudflare R2 access key"
echo "  R2_SECRET_ACCESS_KEY    - Cloudflare R2 secret"
echo "  R2_ENDPOINT_URL         - Cloudflare R2 endpoint"
echo "  DISCORD_WEBHOOK         - Discord notification webhook"
echo ""
echo "Optional GitHub Secrets:"
echo "------------------------"
echo "  ARWEAVE_WALLET_KEY      - Arweave wallet (base64)"
echo "  ANTHROPIC_API_KEY       - For AI-powered sentinel reviews"
echo ""
echo "Next steps:"
echo "1. Add secrets to GitHub repository settings"
echo "2. Run test mode: ./scripts/anti-nuke/test-mode.sh"
echo "3. Trigger first backup: gh workflow run anti-nuke-mirror.yml"
echo "4. Run recovery drill: ./scripts/anti-nuke/recovery-drill.sh"
echo ""
