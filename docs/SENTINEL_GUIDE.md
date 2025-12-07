# Mobius Sentinel System Guide

## Overview

The Mobius Sentinel System is a multi-agent validation framework that ensures code quality, security, and constitutional compliance for the Mobius Browser Shell.

## The Four Sentinels

### 🏛️ ATLAS - Architectural Sentinel
**Role:** Guardian of structure and security
**Weight:** 30%

**Responsibilities:**
- Code review for architectural consistency
- Security vulnerability scanning
- Performance impact analysis
- Integration risk assessment

**Scripts:**
- `.github/sentinels/atlas/code_review.py`
- `.github/sentinels/atlas/security_scan.py`

**Checks:**
- Heart/Shell/Organs separation
- No hardcoded secrets
- No dangerous code patterns (eval, innerHTML)
- TypeScript/React best practices

### 🌟 AUREA - Integrity Sentinel
**Role:** Guardian of constitutional compliance
**Weight:** 30%

**Responsibilities:**
- Constitutional integrity validation
- Tokenomics verification (MIC)
- MII (Mobius Integrity Index) calculation
- Critical file protection

**Scripts:**
- `.github/sentinels/aurea/integrity_check.py`
- `.github/sentinels/aurea/tokenomics_verify.py`
- `.github/sentinels/aurea/mic_health_check.py`
- `.github/sentinels/aurea/mii_validator.py`

**Checks:**
- .mobius-constitution present
- Required file structure intact
- Git integrity verified
- MII above threshold (>0.70)

### 🌐 EVE - Deployment Sentinel
**Role:** Guardian of operational health
**Weight:** 20%

**Responsibilities:**
- Deployment health verification
- Endpoint availability testing
- Lab integration checks
- Cross-origin compatibility

**Scripts:**
- `.github/sentinels/eve/deployment_test.py`
- `.github/sentinels/eve/integration_verify.py`

**Checks:**
- Shell endpoint responsive
- Lab iframes accessible
- CORS headers correct
- API endpoints healthy

### 🎨 JADE - Experience Sentinel
**Role:** Guardian of user experience
**Weight:** 20%

**Responsibilities:**
- UX consistency validation
- Accessibility compliance (WCAG)
- Design system adherence
- Component structure verification

**Scripts:**
- `.github/sentinels/jade/ux_validation.py`
- `.github/sentinels/jade/accessibility_check.py`

**Checks:**
- Required components present
- Responsive design patterns
- ARIA attributes usage
- Color consistency

## Verdict System

### Verdicts

| Verdict | Score | Meaning |
|---------|-------|---------|
| APPROVED | 1.0 | All checks passed, safe to merge |
| NEEDS_REVISION | 0.5 | Issues found, review recommended |
| BLOCKED | 0.0 | Critical issues, merge prevented |

### Consensus Calculation

```
Consensus Score = Σ (Sentinel Weight × Verdict Score)

Example:
  ATLAS: APPROVED (1.0) × 0.30 = 0.30
  AUREA: APPROVED (1.0) × 0.30 = 0.30
  EVE: NEEDS_REVISION (0.5) × 0.20 = 0.10
  JADE: APPROVED (1.0) × 0.20 = 0.20
  
  Total = 0.90 → APPROVED (≥0.80)
```

### Thresholds

- **≥0.80:** APPROVED - All systems go
- **0.50-0.79:** NEEDS_REVISION - Manual review required
- **<0.50:** BLOCKED - Cannot merge

## Workflows

### Pre-Merge Validation
**Trigger:** Pull request to main/develop

```
PR Created
    │
    ├─► ATLAS Review ──► Code + Security
    │
    └─► AUREA Check ──► Integrity + Constitution
            │
            └─► Consensus ──► Post to PR
                    │
                    ├─► APPROVED: ✅ Ready
                    └─► BLOCKED: ❌ Cannot merge
```

### Post-Deploy Verification
**Trigger:** Push to main

```
Deploy Complete
    │
    ├─► EVE Health ──► Endpoints + Integration
    │
    └─► JADE UX ──► Accessibility + Design
            │
            └─► Report ──► Notify team
```

### Scheduled Integrity
**Trigger:** Every 6 hours

```
Schedule
    │
    ├─► MIC Health Check
    │
    ├─► MII Validation
    │
    └─► Cross-Lab Sync
            │
            └─► Alert if anomalies
```

## Configuration

### Sentinel Config File
Location: `.github/sentinels/shared/config.yaml`

```yaml
sentinels:
  atlas:
    weight: 0.30
    responsibilities:
      - code_review
      - security_scan

  aurea:
    weight: 0.30
    responsibilities:
      - integrity_check
      - tokenomics_verify

consensus:
  approval_threshold: 0.80
  blocking_threshold: 0.50
```

### Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `ANTHROPIC_API_KEY` | AI-powered reviews | Optional |
| `SHELL_URL` | Deployment URL | For EVE |
| `VITE_OAA_URL` | OAA Lab URL | For EVE |
| `MIC_API_BASE` | MIC API endpoint | For AUREA |

## MII (Mobius Integrity Index)

### Components

| Component | Weight | Description |
|-----------|--------|-------------|
| Git Integrity | 15% | Repository health |
| Test Coverage | 15% | Test coverage % |
| Security Score | 20% | Security scan results |
| Constitutional Compliance | 20% | Constitution adherence |
| Deployment Health | 15% | Live system status |
| Sentinel Consensus | 15% | Multi-sentinel agreement |

### Thresholds

| Level | Threshold | Operations Allowed |
|-------|-----------|-------------------|
| CRITICAL | <50% | System halt |
| WARNING | 50-70% | Read, emergency fix only |
| CAUTION | 70-85% | Normal operations |
| HEALTHY | 85-95% | All operations + mint |
| EXCELLENT | >95% | Bonus rewards |

### Calculation

```python
MII = Σ (Component Score × Component Weight)

Example:
  git_integrity: 1.0 × 0.15 = 0.15
  test_coverage: 0.7 × 0.15 = 0.105
  security_score: 0.9 × 0.20 = 0.18
  constitutional: 1.0 × 0.20 = 0.20
  deployment: 0.8 × 0.15 = 0.12
  consensus: 0.9 × 0.15 = 0.135
  
  MII = 0.89 → HEALTHY
```

## Running Sentinels Locally

### Prerequisites

```bash
# Install Python dependencies
pip install anthropic pyyaml requests

# Make scripts executable
chmod +x scripts/anti-nuke/*.sh
```

### Running Individual Sentinels

```bash
# ATLAS Code Review
python .github/sentinels/atlas/code_review.py

# ATLAS Security Scan
python .github/sentinels/atlas/security_scan.py

# AUREA Integrity Check
python .github/sentinels/aurea/integrity_check.py

# Full Consensus
python .github/sentinels/shared/consensus.py
```

### Running Verification Scripts

```bash
# Verify protections
./scripts/anti-nuke/verify-protection.sh

# Run test mode
./scripts/anti-nuke/test-mode.sh

# Practice recovery
./scripts/anti-nuke/recovery-drill.sh
```

## Extending Sentinels

### Adding a New Check

1. Create script in appropriate sentinel directory
2. Follow the standard output format:
   ```python
   {
     "sentinel": "SENTINEL_NAME",
     "verdict": "APPROVED|NEEDS_REVISION|BLOCKED",
     "issues": [],
     "summary": "..."
   }
   ```
3. Save report to `reports/` directory
4. Update config.yaml if needed

### Custom Sentinel

```python
#!/usr/bin/env python3
"""
Custom Sentinel Example
"""

import os
import json
import sys

def run_checks():
    issues = []
    
    # Your custom checks here
    if not os.path.exists('important_file.txt'):
        issues.append('Missing important_file.txt')
    
    return issues

def main():
    issues = run_checks()
    
    verdict = 'APPROVED' if not issues else 'NEEDS_REVISION'
    
    os.makedirs('reports', exist_ok=True)
    with open('reports/custom-sentinel.json', 'w') as f:
        json.dump({
            'sentinel': 'CUSTOM',
            'verdict': verdict,
            'issues': issues
        }, f)
    
    sys.exit(0 if verdict == 'APPROVED' else 1)

if __name__ == '__main__':
    main()
```

## Troubleshooting

### Common Issues

**Sentinel not running:**
- Check workflow file syntax
- Verify Python version (3.11+)
- Check for missing dependencies

**False positives in security scan:**
- Add patterns to skip list
- Use inline `# noqa` comments
- Update security patterns in config

**Low MII score:**
- Run individual component checks
- Review which component is low
- Address specific issues

**Consensus not posting to PR:**
- Check GITHUB_TOKEN permissions
- Verify workflow has write access
- Check for rate limiting

### Debugging

```bash
# Run with verbose output
python .github/sentinels/atlas/code_review.py 2>&1 | tee debug.log

# Check report output
cat reports/atlas-review.json | jq .

# Verify workflow syntax
yamllint .github/workflows/sentinel-validation.yml
```

## Best Practices

1. **Don't ignore sentinel warnings** - They often catch real issues
2. **Run locally before pushing** - Faster feedback loop
3. **Keep MII above 0.85** - Healthy threshold for operations
4. **Review NEEDS_REVISION carefully** - Don't blindly override
5. **Update docs when adding checks** - Keep guide current

---

**Version:** 1.0
**Last Updated:** December 2024
**Maintained By:** Mobius Systems

*"The sentinels watch, so you can build." — Mobius Doctrine*
