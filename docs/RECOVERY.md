# Mobius Browser Shell - Recovery Protocol

## 🚨 Emergency Recovery Procedures

If the GitHub repository is deleted, compromised, or inaccessible, follow these procedures to restore from backups.

### Quick Reference

| Recovery Source | Speed | Completeness | Difficulty |
|----------------|-------|--------------|------------|
| GitLab Mirror | < 5 min | 100% | Easy |
| Codeberg Mirror | < 5 min | 100% | Easy |
| IPFS Archive | < 15 min | 100% | Medium |
| R2 Cold Storage | < 30 min | 100% | Medium |

---

## Method 1: GitLab Mirror (Recommended)

### Prerequisites
- Git installed
- Network access to GitLab

### Steps

```bash
# Clone from GitLab mirror
git clone https://gitlab.com/mobius-systems/mobius-browser-shell.git

# Verify integrity
cd mobius-browser-shell
test -f .mobius-constitution && echo "✅ Constitution verified"
git log --oneline -10
```

### Restore to GitHub

```bash
# Create new GitHub repo (if needed)
gh repo create kaizencycle/mobius-browser-shell --public

# Push recovered code
git remote add github git@github.com:kaizencycle/mobius-browser-shell.git
git push github main --force
git push github --tags
```

---

## Method 2: Codeberg Mirror

### Steps

```bash
# Clone from Codeberg mirror
git clone https://codeberg.org/mobius-systems/mobius-browser-shell.git

# Continue with verification and restoration steps from Method 1
```

---

## Method 3: IPFS Archive

### Prerequisites
- IPFS installed OR access to IPFS gateway
- Latest IPFS hash from `.ipfs-archive-log.txt`

### Steps

```bash
# Get latest IPFS hash
# Check any mirror for .ipfs-archive-log.txt
IPFS_HASH="QmXXXXXX"  # Replace with actual hash

# Option A: Use IPFS gateway (no IPFS installation needed)
curl "https://gateway.pinata.cloud/ipfs/${IPFS_HASH}" -o mobius-archive.tar.gz
tar -xzf mobius-archive.tar.gz
cd mobius-browser-shell

# Option B: Use local IPFS
ipfs get "${IPFS_HASH}" -o mobius-archive.tar.gz
tar -xzf mobius-archive.tar.gz
cd mobius-browser-shell

# Verify and restore
test -f .mobius-constitution && echo "✅ Constitution verified"
```

---

## Method 4: R2 Cold Storage

### Prerequisites
- AWS CLI installed
- R2 credentials (Access Key ID, Secret Access Key, Endpoint URL)

### Steps

```bash
# Configure AWS CLI with R2 credentials
aws configure set aws_access_key_id $R2_ACCESS_KEY_ID
aws configure set aws_secret_access_key $R2_SECRET_ACCESS_KEY

# List available backups
aws s3 ls s3://mobius-backups/browser-shell/ \
  --endpoint-url $R2_ENDPOINT_URL

# Download latest backup
LATEST_BACKUP="mobius-browser-shell-20240312-143022.bundle"
aws s3 cp "s3://mobius-backups/browser-shell/${LATEST_BACKUP}" . \
  --endpoint-url $R2_ENDPOINT_URL

# Extract bundle
git clone "${LATEST_BACKUP}" mobius-browser-shell
cd mobius-browser-shell

# Verify and restore
test -f .mobius-constitution && echo "✅ Constitution verified"
```

---

## Integrity Verification

After recovery from any source, verify:

```bash
# Check constitution
test -f .mobius-constitution || echo "❌ Constitution missing!"

# Check critical files
CRITICAL_FILES=(
  "package.json"
  ".github/workflows/anti-nuke-sentinel.yml"
  ".github/workflows/anti-nuke-mirror.yml"
  "README.md"
  "App.tsx"
)

for file in "${CRITICAL_FILES[@]}"; do
  test -f "$file" || echo "❌ Missing: $file"
done

# Verify Git integrity
git fsck

# Check for suspicious commits
git log --all --oneline -20

# Verify no unauthorized changes
git diff HEAD .mobius-constitution
```

---

## Multi-Source Consensus

**Best Practice:** Compare multiple recovery sources

```bash
# Clone from multiple sources
git clone https://gitlab.com/mobius-systems/mobius-browser-shell.git gitlab-version
git clone https://codeberg.org/mobius-systems/mobius-browser-shell.git codeberg-version

# Compare commit hashes
cd gitlab-version && GITLAB_HASH=$(git rev-parse HEAD) && cd ..
cd codeberg-version && CODEBERG_HASH=$(git rev-parse HEAD) && cd ..

if [ "$GITLAB_HASH" = "$CODEBERG_HASH" ]; then
  echo "✅ Mirrors agree on canonical state"
else
  echo "⚠️  Mirror discrepancy detected - investigate"
fi
```

---

## Post-Recovery Checklist

### Infrastructure
- [ ] Repository accessible at canonical URL
- [ ] Branch protection rules re-enabled
- [ ] Required workflows active and passing
- [ ] Secrets and environment variables configured
- [ ] Collaborators re-added with correct permissions

### Security
- [ ] Review recent commits for tampering
- [ ] Verify all contributors are authorized
- [ ] Check for unauthorized access patterns
- [ ] Rotate potentially compromised credentials
- [ ] Review audit logs for incident timeline

### Communication
- [ ] Notify team of recovery
- [ ] Document incident in issue tracker
- [ ] Update recovery procedures if needed
- [ ] Conduct post-mortem review

### Testing
- [ ] Run anti-nuke test mode (`./scripts/anti-nuke/test-mode.sh`)
- [ ] Verify deployments work correctly
- [ ] Check all integrations (APIs, webhooks)
- [ ] Confirm automated backups resume

---

## Recovery Authority

Only the following can authorize canonical restoration:

1. **Michael (Founder)** - via GPG-signed commit with founder key
2. **Multi-Sentinel Consensus** - ATLAS + AUREA + EVE + JADE unanimous approval

### Founder Signature Verification

```bash
# Import founder's GPG key (if not already imported)
gpg --import founder-public-key.asc

# Verify signed commit
git verify-commit HEAD

# Should show:
# gpg: Good signature from "Michael [founder key]"
```

---

## Fork Detection Protocol

If multiple repositories claim to be "canonical":

1. **Check IPFS archive log** - source of truth for commit history
2. **Verify founder signature** - only founder can certify canonical state
3. **Run AUREA integrity validation** - constitutional compliance check
4. **Choose highest MII proof** - integrity-backed legitimacy

### Example

```bash
# Compare claimed canonical repos
git clone https://github.com/kaizencycle/mobius-browser-shell.git claimed1
git clone https://github.com/imposter/mobius-browser-shell.git claimed2

# Check for founder signature
cd claimed1 && git verify-commit HEAD && cd ..
cd claimed2 && git verify-commit HEAD && cd ..

# Only repo with valid founder signature is canonical
```

---

## Emergency Contacts

- **Discord:** mobius-systems server → #emergency-response
- **Email:** recovery@mobius.systems
- **Backup Admin:** [secondary contact details]

---

## Regular Maintenance

- **Monthly:** Verify all mirrors are syncing
- **Quarterly:** Run full recovery drill
- **After major updates:** Verify backups captured changes
- **Annually:** Review and update recovery procedures

---

## Simulation / Drill

To practice recovery without real emergency:

```bash
./scripts/anti-nuke/recovery-drill.sh
```

This simulates repository loss and walks through all recovery procedures.

---

**Last Updated:** December 2024
**Version:** 1.0
**Maintained By:** Mobius Sentinel System

*"We heal as we walk." — Mobius Systems*
