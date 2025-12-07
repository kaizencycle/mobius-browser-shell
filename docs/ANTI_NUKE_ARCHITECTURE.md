# Anti-Nuke System Architecture

## Overview

The Anti-Nuke system provides multi-layer protection against catastrophic repository loss through:
- Automated distributed backups
- Real-time monitoring and alerts
- Recovery procedures with <30 minute RTOs
- Constitutional integrity verification

## System Topology

```
┌─────────────────────────────────────────────────────┐
│           GitHub Repository (Primary)                │
│         kaizencycle/mobius-browser-shell            │
└─────────────┬───────────────────────────────────────┘
              │
              ├──────┬──────┬──────┬──────┬──────────┐
              │      │      │      │      │          │
         ┌────▼──┐ ┌─▼───┐ ┌▼────┐ ┌▼───┐ ┌▼────────┐
         │GitLab │ │Code │ │IPFS │ │ R2 │ │Sentinel │
         │Mirror │ │berg │ │Pin  │ │Cold│ │Monitor  │
         └───────┘ └─────┘ └─────┘ └────┘ └─────────┘
           Every    Every    Every   4hrs    Real-time
           push     push     push
```

## Defense Layers

### Layer 1: Branch Protection (Prevention)
- **Purpose:** Prevent unauthorized modifications
- **Mechanism:** GitHub branch protection rules
- **Coverage:** main branch
- **Bypass:** None (even admins must follow rules)

**Recommended Rules:**
- Require 2 PR approvals
- Require status checks (ATLAS + AUREA validation)
- Require signed commits
- No direct pushes allowed
- Conversation resolution required

### Layer 2: Real-time Monitoring (Detection)
- **Purpose:** Detect destructive operations as they happen
- **Mechanism:** Anti-Nuke Sentinel workflow
- **Triggers:**
  - Push to protected branches
  - Pull request creation
  - Branch deletion
  - Repository settings changes

**Detection Thresholds:**
- Mass deletion: >10% of files in single commit
- Critical file deletion: Any file in protected list
- Settings tampering: Branch protection disabled

**Response:**
- Block workflow immediately
- Create emergency issue
- Send alerts (Discord/Slack/email)
- Notify all maintainers

### Layer 3: Distributed Backups (Resilience)
- **Purpose:** Ensure recovery sources exist
- **Mechanism:** Anti-Nuke Mirror workflow
- **Frequency:** Every push + every 4 hours
- **Destinations:** 4 independent systems

#### Backup Destinations

| Destination | Type | Frequency | Retention | Access Speed |
|------------|------|-----------|-----------|--------------|
| GitLab Mirror | Git forge | Every push | Indefinite | < 5 min |
| Codeberg Mirror | Git forge | Every push | Indefinite | < 5 min |
| IPFS Archive | Content-addressed | Every push | Permanent | < 15 min |
| R2 Cold Storage | Object storage | Every 4hrs | Indefinite | < 30 min |

**Redundancy Strategy:**
- 2 Git mirrors (different providers)
- 1 censorship-resistant archive (IPFS)
- 1 cold storage (for disaster recovery)

### Layer 4: Recovery Procedures (Restoration)
- **Purpose:** Restore repository after catastrophic loss
- **Mechanism:** Documented procedures + automation
- **Authority:** Founder signature OR multi-sentinel consensus
- **Verification:** Constitutional integrity checks

## Workflow Specifications

### Sentinel Validation (Pre-merge)

```yaml
Trigger: Pull request opened/updated
Jobs:
  1. ATLAS Code Review
     - Architectural consistency
     - Security vulnerabilities
     - Performance implications

  2. AUREA Integrity Check
     - Constitutional compliance
     - Tokenomics validation (if applicable)

  3. Multi-Sentinel Consensus
     - Aggregate verdicts
     - Post results to PR
     - Block if not approved
```

### Mirror Workflow (Continuous Backup)

```yaml
Trigger: Push to main/develop OR every 4 hours
Jobs:
  1. Mirror to GitLab
     - Full history push
     - All branches + tags

  2. Mirror to Codeberg
     - Full history push
     - All branches + tags

  3. Archive to IPFS
     - Create tar.gz archive
     - Pin to Pinata
     - Record hash in log

  4. Backup to R2
     - Create git bundle
     - Upload to cold storage
     - Timestamped archives

  5. Notify Results
     - Success/failure status
     - Posted to Discord/Slack
```

### Nuclear Failsafe (Monthly Snapshot)

```yaml
Trigger: Monthly schedule OR manual dispatch
Jobs:
  1. Create Permanent Archive
     - Full repository tar.gz
     - Include all history

  2. Upload to Arweave
     - Pay once, store forever
     - Immutable, permanent record
     - Record transaction ID
```

## Security Considerations

### Threat Model

| Threat | Mitigation | Recovery |
|--------|-----------|----------|
| Accidental deletion | Branch protection | Git mirror < 5min |
| Compromised credentials | Sentinel monitoring | Rollback from backup |
| Malicious insider | Multi-approval + signed commits | Founder-verified restore |
| Supply chain attack | Sentinel code review | IPFS canonical state |
| Platform compromise | Distributed mirrors | R2 cold storage |
| Legal takedown | IPFS permanent archive | Censorship resistance |

### Access Control

**GitHub Secrets Required:**
- `GITLAB_MIRROR_TOKEN` - GitLab API access
- `CODEBERG_MIRROR_TOKEN` - Codeberg API access
- `PINATA_JWT` - IPFS pinning service
- `R2_ACCESS_KEY_ID` - Cloudflare R2 access
- `R2_SECRET_ACCESS_KEY` - Cloudflare R2 secret
- `R2_ENDPOINT_URL` - Cloudflare R2 endpoint
- `DISCORD_WEBHOOK` - Alert notifications
- `ANTHROPIC_API_KEY` - Sentinel AI validation

**Principle:** Least privilege
- Each secret has minimal necessary permissions
- Secrets rotated on compromise
- No secret grants repository deletion rights

### Integrity Verification

Every recovery must verify:
1. `.mobius-constitution` file present
2. Critical workflows intact
3. Git history continuous (no gaps)
4. Founder signature present
5. AUREA integrity validation passes

**Fork Detection:**
If multiple "canonical" repositories exist:
1. Check IPFS archive log (immutable history)
2. Verify founder GPG signature
3. Run AUREA constitutional compliance
4. Choose repository with highest MII proof

## Testing & Drills

### Test Mode
All workflows support `test_mode` input:
- Simulates actions without real execution
- Logs what would happen
- Validates logic without side effects

**Usage:**
```bash
gh workflow run anti-nuke-sentinel.yml -f test_mode=true
gh workflow run anti-nuke-mirror.yml -f test_mode=true
```

### Recovery Drills
Quarterly practice of recovery procedures:
- Simulates catastrophic loss
- Practices restoration from each source
- Verifies integrity checks
- Updates documentation with learnings

**Script:**
```bash
./scripts/anti-nuke/recovery-drill.sh
```

### Verification Script
Quick health check of protections:
```bash
./scripts/anti-nuke/verify-protection.sh
```

## Performance & Costs

### Resource Usage

| Component | Cost | Storage | Bandwidth |
|-----------|------|---------|-----------|
| GitHub Actions | Free (within limits) | N/A | N/A |
| GitLab Mirror | Free | Unlimited | Unlimited |
| Codeberg Mirror | Free | Unlimited | Unlimited |
| Pinata IPFS | Free | 1 GB | 1 GB/month |
| Cloudflare R2 | Free | 10 GB | 10 GB/month |
| **Total** | **$0/mo** | **>11 GB** | **>11 GB/mo** |

### Backup Sizes
- Typical repository: ~50 MB
- Git bundle: ~40 MB
- Tar.gz archive: ~30 MB
- IPFS storage: ~30 MB per snapshot

### Recovery Time Objectives (RTO)

| Source | RTO | Notes |
|--------|-----|-------|
| Git Mirror | < 5 minutes | Simple git clone |
| IPFS Archive | < 15 minutes | HTTP download + extract |
| R2 Cold Storage | < 30 minutes | AWS CLI setup + download |

### Recovery Point Objectives (RPO)

| Component | RPO | Explanation |
|-----------|-----|-------------|
| Git Mirrors | 0 (real-time) | Every push mirrored |
| IPFS Archive | 0 (real-time) | Every push archived |
| R2 Cold Storage | 4 hours | Scheduled backups |

## Maintenance

### Daily
- Automated monitoring (no manual action)
- Sentinel workflows run automatically

### Weekly
- Review alert logs
- Verify backup completions

### Monthly
- Run recovery drill
- Verify all mirrors accessible
- Check IPFS pins active
- Review R2 storage usage

### Quarterly
- Full recovery drill with team
- Review and update procedures
- Rotate secrets if needed
- Test all recovery paths

### Annually
- Comprehensive security review
- Update threat model
- Review cost/benefit of backup destinations
- Update documentation

## Integration Points

### With Main Mobius-Systems Repo
- Same sentinel patterns
- Shared constitutional framework
- Coordinated multi-repo recovery

### With Deployment System
- Blocks deploys if sentinel fails
- Verifies integrity before release
- Creates deployment snapshots

### With MIC System (Future)
- Validates tokenomics changes
- Ensures mint/burn rules intact
- Protects founder reserve

## Failure Modes & Responses

### Scenario 1: GitHub Down
- **Detection:** Sentinel can't reach API
- **Response:** All mirrors remain accessible
- **Recovery:** Wait for GitHub OR restore to new forge

### Scenario 2: Single Mirror Fails
- **Detection:** Mirror workflow reports failure
- **Response:** Alert sent, other mirrors continue
- **Recovery:** Fix failed mirror, backfill if needed

### Scenario 3: All External Services Down
- **Detection:** Cannot reach any mirror
- **Response:** Emergency alert + R2 cold storage
- **Recovery:** Restore from most recent R2 bundle

### Scenario 4: Compromised Maintainer Account
- **Detection:** Sentinel detects mass deletion attempt
- **Response:** Block immediately + alert all
- **Recovery:** Rollback from mirror, revoke access

## Evolution & Future Work

### Planned Enhancements
- [ ] Automated founder signature verification
- [ ] Multi-signature recovery authorization
- [ ] Decentralized mirror discovery (DHT)
- [ ] End-to-end encrypted backups
- [ ] Integration with MIC integrity proofs
- [ ] Cross-repository coordination
- [ ] Community mirror program

### Research Questions
- Can we use zero-knowledge proofs for recovery authorization?
- How to verify integrity without centralized authority?
- Can mirrors self-heal if they detect divergence?

---

**Version:** 1.0
**Last Updated:** December 2024
**Maintained By:** Mobius Sentinel System
