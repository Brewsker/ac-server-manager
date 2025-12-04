# Install Git Hooks
# Run this after cloning the repository to set up automatic version bumping

$ErrorActionPreference = 'Stop'

$hooksSource = Join-Path $PSScriptRoot "git-hooks"
$hooksTarget = Join-Path $PSScriptRoot ".." ".git" "hooks"

Write-Host "`n=== Installing Git Hooks ===" -ForegroundColor Cyan

# Copy pre-commit hook
$preCommitSrc = Join-Path $hooksSource "pre-commit"
$preCommitDst = Join-Path $hooksTarget "pre-commit"
Copy-Item $preCommitSrc $preCommitDst -Force
Write-Host "[OK] pre-commit hook installed" -ForegroundColor Green

# Copy commit-msg hook
$commitMsgSrc = Join-Path $hooksSource "commit-msg"
$commitMsgDst = Join-Path $hooksTarget "commit-msg"
Copy-Item $commitMsgSrc $commitMsgDst -Force
Write-Host "[OK] commit-msg hook installed" -ForegroundColor Green

Write-Host "`nGit hooks installed successfully!" -ForegroundColor Green
Write-Host "Version bumping will now happen automatically on commit." -ForegroundColor Gray
Write-Host ""
Write-Host "Commit types and version bumps:" -ForegroundColor Yellow
Write-Host "  feat:     -> MINOR bump (0.1.0 -> 0.2.0)" -ForegroundColor Gray
Write-Host "  feat!:    -> MAJOR bump (0.1.0 -> 1.0.0)" -ForegroundColor Gray
Write-Host "  fix:      -> PATCH bump (0.1.0 -> 0.1.1)" -ForegroundColor Gray
Write-Host "  refactor: -> PATCH bump" -ForegroundColor Gray
Write-Host "  perf:     -> PATCH bump" -ForegroundColor Gray
Write-Host "  chore:    -> no bump" -ForegroundColor Gray
Write-Host "  docs:     -> no bump" -ForegroundColor Gray
Write-Host ""
