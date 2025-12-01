# Auto-increment version based on staged commit message
# Usage: Run before committing with: .\scripts\bump-version.ps1 "feat: your commit message"

param(
    [Parameter(Mandatory=$false)]
    [string]$CommitMessage
)

# If no commit message provided, try to read from git commit template or staged files
if (-not $CommitMessage) {
    Write-Host "Usage: .\scripts\bump-version.ps1 `"type: commit message`"" -ForegroundColor Yellow
    Write-Host "Examples:" -ForegroundColor Cyan
    Write-Host "  feat: add new feature    -> bumps minor (0.13.3 -> 0.14.0)" -ForegroundColor Gray
    Write-Host "  fix: fix bug             -> bumps patch (0.13.3 -> 0.13.4)" -ForegroundColor Gray
    Write-Host "  refactor: improve code   -> bumps patch (0.13.3 -> 0.13.4)" -ForegroundColor Gray
    Write-Host "  chore: update deps       -> no version bump" -ForegroundColor Gray
    exit 0
}

# Extract commit type from message
if ($CommitMessage -match "^(feat|fix|refactor|perf|chore|docs|style|test):") {
    $commitType = $Matches[1]
} else {
    Write-Host "No recognized commit type found in message. No version bump." -ForegroundColor Yellow
    exit 0
}

# Get current version from backend package.json
$backendPkgPath = ".\backend\package.json"
$backendPkg = Get-Content $backendPkgPath | ConvertFrom-Json
$currentVersion = $backendPkg.version

# Split version into parts
$versionParts = $currentVersion.Split('.')
$major = [int]$versionParts[0]
$minor = [int]$versionParts[1]
$patch = [int]$versionParts[2]

# Determine version bump based on commit type
$shouldBump = $true
switch ($commitType) {
    "feat" {
        # Feature = bump minor
        $minor++
        $patch = 0
        Write-Host "Feature commit detected - bumping minor version" -ForegroundColor Green
    }
    "fix" {
        # Fix = bump patch
        $patch++
        Write-Host "Fix commit detected - bumping patch version" -ForegroundColor Green
    }
    "refactor" {
        # Refactor = bump patch
        $patch++
        Write-Host "Refactor commit detected - bumping patch version" -ForegroundColor Green
    }
    "perf" {
        # Performance = bump patch
        $patch++
        Write-Host "Performance commit detected - bumping patch version" -ForegroundColor Green
    }
    default {
        # Other types = no version bump
        $shouldBump = $false
        Write-Host "Non-version commit type ($commitType) - no version bump" -ForegroundColor Yellow
    }
}

if ($shouldBump) {
    $newVersion = "$major.$minor.$patch"
    
    Write-Host "Version bump: $currentVersion -> $newVersion" -ForegroundColor Cyan
    
    # Update backend package.json
    $backendPkg.version = $newVersion
    $backendPkg | ConvertTo-Json -Depth 100 | Set-Content $backendPkgPath
    
    # Update frontend package.json
    $frontendPkgPath = ".\frontend\package.json"
    $frontendPkg = Get-Content $frontendPkgPath | ConvertFrom-Json
    $frontendPkg.version = $newVersion
    $frontendPkg | ConvertTo-Json -Depth 100 | Set-Content $frontendPkgPath
    
    # Update Layout.jsx
    $layoutPath = ".\frontend\src\components\Layout.jsx"
    $layoutContent = Get-Content $layoutPath -Raw
    $layoutContent = $layoutContent -replace 'v\d+\.\d+\.\d+', "v$newVersion"
    Set-Content $layoutPath $layoutContent -NoNewline
    
    # Stage the version files
    git add backend/package.json frontend/package.json frontend/src/components/Layout.jsx
    
    Write-Host "Version files updated and staged!" -ForegroundColor Green
    Write-Host "Ready to commit with: git commit -m `"$CommitMessage`"" -ForegroundColor Cyan
} else {
    Write-Host "No version changes made." -ForegroundColor Gray
}
