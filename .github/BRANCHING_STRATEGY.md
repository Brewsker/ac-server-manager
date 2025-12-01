# Branching Strategy

## Branch Structure

```
main (production releases only)
├── develop (integration branch)
│   ├── feature/* (new features)
│   ├── fix/* (bug fixes)
│   ├── chore/* (maintenance tasks)
│   └── docs/* (documentation updates)
```

## Branch Purposes

### `main`
- **Purpose**: Production-ready code only
- **Updates**: Only via merge from `develop` for releases
- **Protection**: Should be protected (no direct pushes)
- **Tags**: All releases tagged here (e.g., `v0.14.1`, `v0.15.0`)

### `develop`
- **Purpose**: Integration branch for completed features
- **Updates**: Merges from feature branches
- **State**: Should always be in working condition
- **Deployment**: Can be deployed to staging/test environments

### `feature/*`
- **Purpose**: New feature development
- **Naming**: `feature/feature-name` (e.g., `feature/multi-instance`)
- **Base**: Branch from `develop`
- **Merge**: Back to `develop` when complete
- **Cleanup**: Delete after merge

### `fix/*`
- **Purpose**: Bug fixes
- **Naming**: `fix/issue-description` (e.g., `fix/version-display`)
- **Base**: Branch from `develop` (or `main` for hotfixes)
- **Merge**: Back to source branch when complete
- **Cleanup**: Delete after merge

### `chore/*`
- **Purpose**: Maintenance tasks (refactoring, dependencies, cleanup)
- **Naming**: `chore/task-name` (e.g., `chore/installer-improvements`)
- **Base**: Branch from `develop`
- **Merge**: Back to `develop` when complete
- **Cleanup**: Delete after merge

### `docs/*`
- **Purpose**: Documentation-only changes
- **Naming**: `docs/description` (e.g., `docs/api-reference`)
- **Base**: Branch from `develop`
- **Merge**: Back to `develop` when complete
- **Cleanup**: Delete after merge

## Workflow Examples

### Creating a New Feature

```bash
# Start from develop
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/player-statistics

# Work on feature (commit as needed)
git add .
git commit -m "feat: Add player statistics tracking"

# Push to remote
git push -u origin feature/player-statistics

# When complete, merge to develop
git checkout develop
git merge feature/player-statistics

# Push develop
git push origin develop

# Delete feature branch
git branch -d feature/player-statistics
git push origin --delete feature/player-statistics
```

### Fixing a Bug

```bash
# Start from develop
git checkout develop
git pull origin develop

# Create fix branch
git checkout -b fix/config-parsing

# Work on fix
git add .
git commit -m "fix: Handle invalid config values gracefully"

# Push and merge
git push -u origin fix/config-parsing
git checkout develop
git merge fix/config-parsing
git push origin develop

# Cleanup
git branch -d fix/config-parsing
git push origin --delete fix/config-parsing
```

### Hotfix (Critical Production Bug)

```bash
# Start from main
git checkout main
git pull origin main

# Create hotfix branch
git checkout -b fix/critical-server-crash

# Work on fix
git add .
git commit -m "fix: Prevent server crash on invalid entry list"

# Merge to main
git checkout main
git merge fix/critical-server-crash

# Tag new version
git tag v0.14.2
git push origin main
git push origin v0.14.2

# Also merge to develop
git checkout develop
git merge fix/critical-server-crash
git push origin develop

# Cleanup
git branch -d fix/critical-server-crash
git push origin --delete fix/critical-server-crash
```

### Creating a Release

```bash
# Ensure develop is ready
git checkout develop
git pull origin develop

# Merge to main
git checkout main
git pull origin main
git merge develop

# Tag the release
git tag v0.15.0 -a -m "Release v0.15.0: Multi-instance support"

# Push everything
git push origin main
git push origin v0.15.0

# Update develop
git checkout develop
git merge main
git push origin develop
```

## Commit Message Convention

Use conventional commits format:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation only
- `chore:` Maintenance (deps, refactor, cleanup)
- `test:` Adding/updating tests
- `perf:` Performance improvement
- `ci:` CI/CD changes

Examples:
```
feat: Add player ban management system
fix: Resolve version display issue in sidebar
docs: Update API documentation for config endpoints
chore: Reorganize project directory structure
test: Add unit tests for config parser
perf: Optimize server status polling
ci: Add automated deployment to Proxmox
```

## Current State

- **main**: Production (v0.14.1 tagged)
- **develop**: Integration branch (just created from main)
- **multi-instance-manager**: Legacy branch (can be phased out or renamed)

## Migration Notes

Going forward:
1. Use `develop` for all integration work
2. Create feature branches from `develop`
3. Merge completed work to `develop`
4. Only merge `develop` to `main` for releases
5. Tag all releases on `main`

The existing `multi-instance-manager` branch can remain for historical reference or be gradually merged into the new structure.
