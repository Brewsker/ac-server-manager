# Safe Commit Workflow with Version Management and Pre-deployment Validation
# This script ensures version consistency and validates changes before committing

param(
    [Parameter(Mandatory=$true)]
    [string]$Message,
    
    [switch]$SkipValidation,
    [switch]$SkipVersionBump,
    [switch]$AutoPush,
    [switch]$Deploy
)

$ErrorActionPreference = 'Stop'

Write-Host "`n=========================================" -ForegroundColor Cyan
Write-Host "   Safe Commit & Deploy Workflow" -ForegroundColor Cyan
Write-Host "=========================================`n" -ForegroundColor Cyan

# Step 1: Validate version consistency
if (-not $SkipValidation) {
    Write-Host "[1/6] Validating version consistency..." -ForegroundColor Yellow
    $validationResult = .\scripts\version-manager.ps1 -Action validate
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Version validation failed!" -ForegroundColor Red
        Write-Host "Run: .\scripts\version-manager.ps1 -Action sync" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "[OK] Version consistency validated`n" -ForegroundColor Green
} else {
    Write-Host "[1/6] Skipping validation`n" -ForegroundColor Gray
}

# Step 2: Bump version based on commit message
if (-not $SkipVersionBump) {
    Write-Host "[2/6] Checking version bump..." -ForegroundColor Yellow
    .\scripts\version-manager.ps1 -Action bump -CommitMessage $Message
    Write-Host ""
} else {
    Write-Host "[2/6] Skipping version bump`n" -ForegroundColor Gray
}

# Step 3: Run linting/formatting (if tools exist)
Write-Host "[3/6] Checking staged files..." -ForegroundColor Yellow
$stagedFiles = git diff --cached --name-only
if ($stagedFiles) {
    Write-Host "Staged files:" -ForegroundColor Cyan
    $stagedFiles | ForEach-Object { Write-Host "  - $_" -ForegroundColor Gray }
} else {
    Write-Host "  No files staged" -ForegroundColor Yellow
}
Write-Host ""

# Step 4: Commit
Write-Host "[4/6] Creating commit..." -ForegroundColor Yellow
git commit -m $Message
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Commit failed!" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Commit created`n" -ForegroundColor Green

# Show commit info
$commitInfo = git log -1 --oneline
Write-Host "Commit: $commitInfo" -ForegroundColor Cyan

# Step 5: Push (optional)
if ($AutoPush) {
    Write-Host "`n[5/6] Pushing to origin..." -ForegroundColor Yellow
    $branch = git branch --show-current
    git push origin $branch
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Push failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "[OK] Pushed to origin/$branch`n" -ForegroundColor Green
} else {
    Write-Host "`n[5/6] Skipping push (use -AutoPush to enable)`n" -ForegroundColor Gray
}

# Step 6: Deploy (optional)
if ($Deploy) {
    Write-Host "[6/6] Deploying to production..." -ForegroundColor Yellow
    
    # Build frontend
    Write-Host "  Building frontend..." -ForegroundColor Cyan
    Set-Location frontend
    npm run build
    Set-Location ..
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Build failed!" -ForegroundColor Red
        exit 1
    }
    
    # Deploy
    Write-Host "  Deploying to server..." -ForegroundColor Cyan
    .\scripts\deploy-to-proxmox.ps1 -SkipBuild
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Deployment failed!" -ForegroundColor Red
        Write-Host "To rollback: .\scripts\rollback-deployment.ps1" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "[OK] Deployed successfully`n" -ForegroundColor Green
} else {
    Write-Host "[6/6] Skipping deployment (use -Deploy to enable)`n" -ForegroundColor Gray
}

# Summary
Write-Host "=========================================" -ForegroundColor Green
Write-Host "   Workflow Complete!" -ForegroundColor Green
Write-Host "=========================================`n" -ForegroundColor Green

# Get current version
$backendPkg = Get-Content ".\backend\package.json" | ConvertFrom-Json
Write-Host "Current version: v$($backendPkg.version)" -ForegroundColor Cyan

if (-not $AutoPush) {
    Write-Host "`nNext steps:" -ForegroundColor Yellow
    Write-Host "  git push origin $(git branch --show-current)" -ForegroundColor Gray
}

if (-not $Deploy) {
    Write-Host "  .\scripts\deploy-to-proxmox.ps1" -ForegroundColor Gray
}

Write-Host ""
