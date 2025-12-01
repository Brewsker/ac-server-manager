# Auto-Version Commit System

This project uses an automated version bumping system based on conventional commits.

## Usage

Instead of using `git commit` directly, use the provided commit script:

```powershell
.\commit.ps1 "type: your commit message"
```

## Commit Types & Version Bumping

| Commit Type | Version Bump            | Example                                 |
| ----------- | ----------------------- | --------------------------------------- |
| `feat:`     | Minor (0.13.0 → 0.14.0) | `.\commit.ps1 "feat: add new feature"`  |
| `fix:`      | Patch (0.13.3 → 0.13.4) | `.\commit.ps1 "fix: resolve bug"`       |
| `refactor:` | Patch (0.13.3 → 0.13.4) | `.\commit.ps1 "refactor: improve code"` |
| `perf:`     | Patch (0.13.3 → 0.13.4) | `.\commit.ps1 "perf: optimize query"`   |
| `chore:`    | No bump                 | `.\commit.ps1 "chore: update deps"`     |
| `docs:`     | No bump                 | `.\commit.ps1 "docs: update README"`    |
| `style:`    | No bump                 | `.\commit.ps1 "style: format code"`     |
| `test:`     | No bump                 | `.\commit.ps1 "test: add tests"`        |

## What Gets Updated

The script automatically updates:

- `backend/package.json` - version field
- `frontend/package.json` - version field
- `frontend/src/components/Layout.jsx` - sidebar version display

These files are automatically staged before the commit.

## Manual Version Bump

If you need to manually bump the version without committing:

```powershell
.\scripts\bump-version.ps1 "feat: some feature"
```

Then commit manually:

```powershell
git add -A
git commit -m "feat: some feature"
```

## Current Version

Current version: **0.13.3**

## Semantic Versioning

This project follows [Semantic Versioning](https://semver.org/):

- **MAJOR** version (0.x.x): Breaking changes (currently 0 for pre-release)
- **MINOR** version (x.13.x): New features (backwards compatible)
- **PATCH** version (x.x.3): Bug fixes and improvements
