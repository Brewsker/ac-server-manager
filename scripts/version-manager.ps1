# Bulletproof Version Management System
# Ensures version consistency across all files and prevents deployment breakage

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('bump', 'validate', 'sync', 'info')]
    [string]$Action = 'info',
    
    [Parameter(Mandatory=$false)]
    [ValidateSet('major', 'minor', 'patch')]
    [string]$BumpType = 'patch',
    
    [Parameter(Mandatory=$false)]
    [string]$CommitMessage
)

$ErrorActionPreference = 'Stop'

# Version file locations
$FILES = @{
    BackendPackage   = ".\backend\package.json"
    FrontendPackage  = ".\frontend\package.json"
    CursorRules      = ".\.cursorrules"
}

# ANSI colors for better visibility
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Error { Write-Host $args -ForegroundColor Red }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Info { Write-Host $args -ForegroundColor Cyan }

# Get version from a file
function Get-VersionFromFile {
    param([string]$FilePath, [string]$Pattern)
    
    if (-not (Test-Path $FilePath)) {
        Write-Error "File not found: $FilePath"
        return $null
    }
    
    $content = Get-Content $FilePath -Raw
    if ($content -match $Pattern) {
        return $Matches[1]
    }
    return $null
}

# Get all current versions
function Get-CurrentVersions {
    $versions = @{}
    
    # Backend package.json
    $backendPkg = Get-Content $FILES.BackendPackage | ConvertFrom-Json
    $versions['backend'] = $backendPkg.version
    
    # Frontend package.json
    $frontendPkg = Get-Content $FILES.FrontendPackage | ConvertFrom-Json
    $versions['frontend'] = $frontendPkg.version
    
    # .cursorrules (case-insensitive match for "Current version:")
    $cursorVersion = Get-VersionFromFile $FILES.CursorRules '(?mi)^.*Current version:.*?(\d+\.\d+\.\d+)'
    $versions['cursorrules'] = $cursorVersion
    
    return $versions
}

# Validate version consistency
function Test-VersionConsistency {
    $versions = Get-CurrentVersions
    
    Write-Info "`n=== Version Consistency Check ==="
    Write-Host "Backend Package:   v$($versions.backend)"
    Write-Host "Frontend Package:  v$($versions.frontend)"
    Write-Host "Cursor Rules:      v$($versions.cursorrules)"
    
    $uniqueVersions = $versions.Values | Select-Object -Unique
    
    if ($uniqueVersions.Count -eq 1) {
        $matchedVersion = $uniqueVersions | Select-Object -First 1
        Write-Success "`n[OK] All versions match: v$matchedVersion"
        return $true
    } else {
        Write-Error "`n[ERROR] Version mismatch detected!"
        return $false
    }
}

# Sync all versions to backend package.json (source of truth)
function Sync-Versions {
    $backendPkg = Get-Content $FILES.BackendPackage | ConvertFrom-Json
    $sourceVersion = $backendPkg.version
    
    Write-Info "`n=== Syncing all versions to v$sourceVersion ==="
    
    # Update frontend package.json
    $frontendPkg = Get-Content $FILES.FrontendPackage | ConvertFrom-Json
    $frontendPkg.version = $sourceVersion
    $frontendPkg | ConvertTo-Json -Depth 100 | Set-Content $FILES.FrontendPackage
    Write-Success "[OK] Frontend package.json updated"
    
    # Update .cursorrules (case-insensitive match)
    $cursorContent = Get-Content $FILES.CursorRules -Raw
    $cursorContent = $cursorContent -replace '(?mi)^.*Current version:.*?(\*\*)?(\d+\.\d+\.\d+)(\*\*)?', "- Current version: **$sourceVersion**"
    Set-Content $FILES.CursorRules $cursorContent -NoNewline
    Write-Success "[OK] .cursorrules updated"
    
    Write-Success "`n[OK] All versions synced to v$sourceVersion"
    
    # Stage the files
    git add $FILES.BackendPackage $FILES.FrontendPackage $FILES.CursorRules
    Write-Info "[OK] Version files staged for commit"
}

# Bump version based on type or commit message
function Update-Version {
    param(
        [string]$Type,
        [string]$Message
    )
    
    # Get current version
    $backendPkg = Get-Content $FILES.BackendPackage | ConvertFrom-Json
    $currentVersion = $backendPkg.version
    
    # Parse current version
    $versionParts = $currentVersion.Split('.')
    $major = [int]$versionParts[0]
    $minor = [int]$versionParts[1]
    $patch = [int]$versionParts[2]
    
    # Determine bump type from commit message if provided
    if ($Message) {
        if ($Message -match '^(feat|feature)!:') {
            $Type = 'major'
        } elseif ($Message -match '^(feat|feature):') {
            $Type = 'minor'
        } elseif ($Message -match '^(fix|refactor|perf):') {
            $Type = 'patch'
        } elseif ($Message -match '^(chore|docs|style|test):') {
            Write-Warning "Commit type doesn't warrant version bump. No changes made."
            return
        }
    }
    
    # Apply version bump
    switch ($Type) {
        'major' {
            $major++
            $minor = 0
            $patch = 0
            Write-Info "Breaking change detected - bumping major version"
        }
        'minor' {
            $minor++
            $patch = 0
            Write-Info "Feature detected - bumping minor version"
        }
        'patch' {
            $patch++
            Write-Info "Fix/refactor detected - bumping patch version"
        }
    }
    
    $newVersion = "$major.$minor.$patch"
    
    Write-Info "`n=== Version Bump ==="
    Write-Host "Old: v$currentVersion"
    Write-Host "New: v$newVersion" -ForegroundColor Green
    
    # Update backend package.json
    $backendPkg.version = $newVersion
    $backendPkg | ConvertTo-Json -Depth 100 | Set-Content $FILES.BackendPackage
    
    # Sync to other files
    Sync-Versions
    
    Write-Success "`n[OK] Version bumped to v$newVersion and synced across all files"
}

# Display version info
function Show-VersionInfo {
    $versions = Get-CurrentVersions
    
    Write-Info "`n========================================="
    Write-Info "   AC Server Manager Version Info"
    Write-Info "========================================="
    Write-Host ""
    Write-Host "  Backend Package:   " -NoNewline
    Write-Host "v$($versions.backend)" -ForegroundColor Cyan
    Write-Host "  Frontend Package:  " -NoNewline
    Write-Host "v$($versions.frontend)" -ForegroundColor Cyan
    Write-Host "  Cursor Rules:      " -NoNewline
    Write-Host "v$($versions.cursorrules)" -ForegroundColor Cyan
    Write-Host ""
    
    $isConsistent = Test-VersionConsistency
    
    if (-not $isConsistent) {
        Write-Host ""
        Write-Warning "WARNING: Run '.\scripts\version-manager.ps1 -Action sync' to fix inconsistencies"
    }
    
    Write-Host ""
}

# Main execution
switch ($Action) {
    'bump' {
        if ($CommitMessage) {
            Update-Version -Message $CommitMessage
        } else {
            Update-Version -Type $BumpType
        }
    }
    'validate' {
        $isValid = Test-VersionConsistency
        if (-not $isValid) {
            exit 1
        }
    }
    'sync' {
        Sync-Versions
    }
    'info' {
        Show-VersionInfo
    }
}
