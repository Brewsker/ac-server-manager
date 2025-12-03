# Setup Git Hooks for Version Management
# Run this once to enable automatic version validation

Write-Host "`nSetting up Git hooks..." -ForegroundColor Cyan

# Create hooks directory if it doesn't exist
$hooksDir = ".git\hooks"
if (-not (Test-Path $hooksDir)) {
    New-Item -ItemType Directory -Path $hooksDir | Out-Null
}

# Copy pre-commit hook
$sourceHook = ".githooks\pre-commit"
$targetHook = ".git\hooks\pre-commit"

if (Test-Path $sourceHook) {
    Copy-Item $sourceHook $targetHook -Force
    Write-Host "[OK] Pre-commit hook installed" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Pre-commit hook source not found" -ForegroundColor Red
    exit 1
}

# Make hook executable (for Unix systems, doesn't hurt on Windows)
if ($IsLinux -or $IsMacOS) {
    chmod +x $targetHook
}

Write-Host "`n[OK] Git hooks configured successfully!" -ForegroundColor Green
Write-Host "`nThe following hooks are now active:" -ForegroundColor Cyan
Write-Host "  • pre-commit: Validates version consistency before each commit" -ForegroundColor Gray
Write-Host "`nTo disable hooks temporarily, use: git commit --no-verify`n" -ForegroundColor Yellow
