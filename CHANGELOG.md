# Changelog

All notable changes to Mobius Browser Shell will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0-beta.1] - 2026-01-31

### Release: ATLAS Beta Release

This is the first official Beta release of the Mobius Browser Shell, marking the transition from alpha development to a production-ready state.

### Added

#### Core Shell
- **Unified Tab Navigation** - Seamless switching between all Mobius Labs
- **Omnibar Search** - Global search and command interface
- **Responsive Design** - Full mobile and desktop support
- **Authentication System** - User login via magic link / email
- **Wallet Integration** - MIC balance display and wallet management

#### Labs Integration
- **OAA Learning Hub** - AI-powered STEM tutoring system
- **Reflections Lab** - Journaling and self-reflection tools
- **Citizen Shield Lab** - Digital safety and privacy tools
- **HIVE Lab** - Governance simulation and character creation
- **Wallet Lab** - MIC economy interface
- **JADE Lab** - User experience and accessibility testing
- **Knowledge Graph Lab** - Visual knowledge exploration with timeline

#### Sentinel System
- **ATLAS Sentinel** - Architectural review and security scanning
- **AUREA Sentinel** - Integrity checking and constitutional compliance
- **EVE Sentinel** - Deployment verification and health checks
- **JADE Sentinel** - UX validation and accessibility checking
- **Multi-Sentinel Consensus** - Weighted voting for merge decisions

#### Anti-Nuke Protection
- Distributed mirror backups (GitLab, Codeberg)
- IPFS/Arweave archival support
- Mass deletion detection and prevention
- Recovery drill scripts

#### Infrastructure
- GitHub Actions workflows for CI/CD
- Sentinel validation on pull requests
- Deployment verification pipeline
- Integrity monitoring (scheduled)

### Security
- Environment-based configuration (no hardcoded secrets)
- Content Security Policy compliance
- iframe isolation for Lab security
- Branch protection via sentinel consensus

### Architecture
- Heart/Shell/Organs separation pattern
- Lab autonomy with Shell coordination
- MIC/MII integrity tracking
- Constitutional governance framework

### Documentation
- Complete README with setup instructions
- ARCHITECTURE.md design documentation
- SENTINEL_GUIDE.md for maintainers
- ANTI_NUKE_ARCHITECTURE.md protection docs
- RECOVERY.md disaster recovery procedures

---

## Pre-Release History

### [0.1.0] - 2024-12-XX (Alpha)
- Initial development version
- Core shell architecture established
- Basic Lab embedding via iframes
- Prototype sentinel system

---

## Versioning

- **Major (X.0.0)**: Breaking changes to Shell API or architecture
- **Minor (0.X.0)**: New features, new Labs, enhanced functionality
- **Patch (0.0.X)**: Bug fixes, security patches, documentation updates

## Release Stages

| Stage | Stability | Audience |
|-------|-----------|----------|
| Alpha | Experimental | Internal testing |
| **Beta** | **Feature complete** | **Early adopters** |
| RC | Production ready | Final testing |
| Stable | Fully stable | General availability |

---

*"We heal as we walk." — Mobius Systems*
