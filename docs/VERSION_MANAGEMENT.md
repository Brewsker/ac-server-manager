# Version Management & Deployment Guide

## 🎯 Overview

This project uses a bulletproof version management system that ensures consistency across all version declarations and prevents breaking deployments.

## 📦 Version Locations

Versions are tracked in three places (must always match):

1. `backend/package.json` - **Source of truth**
2. `frontend/package.json`
3. `.cursorrules` (Current Version field)

## 🛠️ Tools

### 1. Version Manager (`scripts/version-manager.ps1`)

Central version management tool with four actions:

```powershell
# Show current versions across all files
.\scripts\version-manager.ps1

# Validate version consistency
.\scripts\version-manager.ps1 -Action validate

# Sync all versions to backend package.json
.\scripts\version-manager.ps1 -Action sync

# Bump version manually
.\scripts\version-manager.ps1 -Action bump -BumpType patch  # or minor, major

# Bump version from commit message
.\scripts\version-manager.ps1 -Action bump -CommitMessage "feat: new feature"
```

**Bump rules:**

- `feat!:` or `feature!:` → **Major** (1.0.0 → 2.0.0) - Breaking changes
- `feat:` or `feature:` → **Minor** (1.0.0 → 1.1.0) - New features
- `fix:`, `refactor:`, `perf:` → **Patch** (1.0.0 → 1.0.1) - Fixes/improvements
- `chore:`, `docs:`, `style:`, `test:` → **No bump** - Non-functional changes

### 2. Safe Commit (`scripts/safe-commit.ps1`)

Automated commit workflow with built-in safeguards:

```powershell
# Basic commit (validates + bumps version + commits)
.\scripts\safe-commit.ps1 "feat: add new feature"

# Commit + push
.\scripts\safe-commit.ps1 "fix: bug fix" -AutoPush

# Commit + push + deploy
.\scripts\safe-commit.ps1 "feat: major update" -AutoPush -Deploy

# Skip version bump (for non-code changes)
.\scripts\safe-commit.ps1 "docs: update README" -SkipVersionBump

# Skip all validation (not recommended)
.\scripts\safe-commit.ps1 "emergency fix" -SkipValidation
```

**Workflow steps:**

1. ✓ Validates version consistency
2. ✓ Bumps version based on commit message
3. ✓ Shows staged files
4. ✓ Creates commit
5. ✓ Pushes to origin (if `-AutoPush`)
6. ✓ Deploys to production (if `-Deploy`)

### 3. Git Hooks

Pre-commit validation to prevent version mismatches:

```powershell
# One-time setup
.\scripts\setup-hooks.ps1

# Bypass hook if needed (not recommended)
git commit --no-verify -m "message"
```

The pre-commit hook automatically:

- Validates version consistency before every commit
- Blocks commits if versions don't match
- Provides fix instructions

## 🚀 Recommended Workflows

### Daily Development

```powershell
# Make your changes
# Stage files
git add .

# Safe commit with automatic version bump
.\scripts\safe-commit.ps1 "feat: your feature"

# Push when ready
git push origin develop
```

### Quick Deploy

```powershell
# Commit and deploy in one command
.\scripts\safe-commit.ps1 "fix: critical bug" -AutoPush -Deploy
```

### Emergency Fix

```powershell
# If versions are mismatched, sync them
.\scripts\version-manager.ps1 -Action sync

# Then commit
.\scripts\safe-commit.ps1 "fix: version sync"
```

## 🔍 Version Validation

### Manual Check

```powershell
.\scripts\version-manager.ps1

# Output:
# ╔════════════════════════════════════════╗
# ║   AC Server Manager Version Info      ║
# ╚════════════════════════════════════════╝
#
#   Backend Package:   v0.16.0
#   Frontend Package:  v0.16.0
#   Cursor Rules:      v0.16.0
#
# ✓ All versions match: v0.16.0
```

### Automated (GitHub Actions)

On every push/PR to `main` or `develop`:

- ✓ Validates version consistency
- ✓ Checks package-lock.json freshness
- ✓ Builds frontend
- ✓ Reports any issues

## 🐛 Troubleshooting

### Versions Don't Match

```powershell
# Check current state
.\scripts\version-manager.ps1

# Sync to backend version (source of truth)
.\scripts\version-manager.ps1 -Action sync

# Commit the sync
git add -A
git commit -m "chore: sync versions"
```

### Forgot to Bump Version

```powershell
# Bump version manually
.\scripts\version-manager.ps1 -Action bump -BumpType patch

# Amend last commit
git add -A
git commit --amend --no-edit
```

### Pre-commit Hook Blocking

```powershell
# Fix the version mismatch first
.\scripts\version-manager.ps1 -Action sync
git add -A

# Then retry commit
git commit -m "your message"

# Or bypass (emergency only)
git commit --no-verify -m "emergency fix"
```

## 📋 Best Practices

### ✅ DO

- Use `safe-commit.ps1` for all commits
- Follow conventional commit format (`type: message`)
- Let the system auto-bump versions
- Validate before committing (`version-manager.ps1 -Action validate`)
- Deploy after major changes (`-Deploy` flag)

### ❌ DON'T

- Manually edit version numbers
- Skip validation without good reason
- Use `--no-verify` regularly
- Forget to build frontend before deploying
- Deploy without testing locally first

## 🔄 Migration from Old System

If you have commits using the old `bump-version.ps1` or `commit.ps1`:

```powershell
# 1. Ensure versions are synced
.\scripts\version-manager.ps1 -Action sync

# 2. Install git hooks
.\scripts\setup-hooks.ps1

# 3. Use new workflow going forward
.\scripts\safe-commit.ps1 "your commit message"
```

## 📊 Version History

View version changes:

```powershell
# See commits with version bumps
git log --grep="feat:" --grep="fix:" --oneline

# See version in specific commit
git show <commit>:backend/package.json | ConvertFrom-Json | Select-Object version
```

## 🚨 Emergency Procedures

### Rollback Deployed Version

```powershell
# List available backups
.\scripts\rollback-deployment.ps1 -ListOnly

# Rollback to previous version
.\scripts\rollback-deployment.ps1

# Or specific backup
.\scripts\rollback-deployment.ps1 -BackupName "backup-20251203-013246"
```

### Force Version Reset

```powershell
# Reset to specific version (e.g., 0.15.0)
$version = "0.15.0"

# Update all files
$backend = Get-Content ".\backend\package.json" | ConvertFrom-Json
$backend.version = $version
$backend | ConvertTo-Json -Depth 100 | Set-Content ".\backend\package.json"

$frontend = Get-Content ".\frontend\package.json" | ConvertFrom-Json
$frontend.version = $version
$frontend | ConvertTo-Json -Depth 100 | Set-Content ".\frontend\package.json"

$cursor = Get-Content ".\.cursorrules" -Raw
$cursor = $cursor -replace 'Current Version: \d+\.\d+\.\d+', "Current Version: $version"
Set-Content ".\.cursorrules" $cursor -NoNewline

# Commit
git add -A
git commit -m "chore: reset version to $version"
```

## 🎓 Examples

### Feature Development

```powershell
# Day 1: New feature
.\scripts\safe-commit.ps1 "feat: add user authentication"
# Version: 0.16.0 → 0.17.0

# Day 2: Bug fix
.\scripts\safe-commit.ps1 "fix: login validation"
# Version: 0.17.0 → 0.17.1

# Day 3: Deploy
.\scripts\safe-commit.ps1 "feat: complete auth system" -AutoPush -Deploy
# Version: 0.17.1 → 0.18.0
```

### Hotfix

```powershell
# Critical bug found in production
.\scripts\safe-commit.ps1 "fix: critical memory leak" -AutoPush -Deploy
# Commits, pushes, and deploys immediately
```

### Documentation Update

```powershell
# No version bump needed
.\scripts\safe-commit.ps1 "docs: update API documentation" -SkipVersionBump
# Version stays the same
```
