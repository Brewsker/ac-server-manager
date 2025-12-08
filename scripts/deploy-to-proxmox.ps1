param(
    [string]$HostIP = "192.168.1.199",
    [int]$ContainerId = 999,
    [switch]$SkipBuild,
    [switch]$SkipBackup
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " AC Server Manager Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Host:      $HostIP" -ForegroundColor Gray
Write-Host "Container: $ContainerId" -ForegroundColor Gray
Write-Host ""

# Step 1: Build
if (-not $SkipBuild) {
    Write-Host "[1/6] Building frontend..." -ForegroundColor Yellow
    Push-Location frontend
    $buildOutput = npm run build 2>&1
    if ($LASTEXITCODE -ne 0) {
        Pop-Location
        Write-Host "   Build failed!" -ForegroundColor Red
        Write-Host $buildOutput
        exit 1
    }
    Pop-Location
    
    # Show build size
    $distSize = [math]::Round((Get-ChildItem frontend/dist -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB, 2)
    Write-Host "   Built (${distSize}MB)" -ForegroundColor Green
} else {
    Write-Host "[1/6] Skipping build" -ForegroundColor Gray
}

# Step 2: Backup
if (-not $SkipBackup) {
    Write-Host "[2/6] Creating backup..." -ForegroundColor Yellow
    $backupName = "backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    
    # Create backup using tar (fast, atomic, compressed)
    ssh root@$HostIP "pct exec $ContainerId -- bash -c 'cd /opt/ac-server-manager && tar -czf backups/$backupName.tar.gz frontend/dist backend/src backend/data/default_config.ini 2>/dev/null || true'" 2>&1 | Out-Null
    
    Write-Host "   Backed up: $backupName.tar.gz" -ForegroundColor Green
} else {
    Write-Host "[2/6] Skipping backup" -ForegroundColor Gray
}

# Step 3: Clean
Write-Host "[3/6] Cleaning old files..." -ForegroundColor Yellow
ssh root@$HostIP "pct exec $ContainerId -- rm -rf /opt/ac-server-manager/frontend/dist" 2>&1 | Out-Null
Write-Host "   Cleaned" -ForegroundColor Green

# Step 4: Upload (use tar for bulk transfer - much faster than individual scp)
Write-Host "[4/6] Uploading..." -ForegroundColor Yellow
$tempArchive = "ac-deploy-$(Get-Date -Format 'yyyyMMddHHmmss').tar.gz"

# Remove readonly attribute from frontend/dist before archiving (Windows compatibility)
attrib -r frontend\dist /s /d 2>&1 | Out-Null

# Create tar archive with --dereference to follow OneDrive reparse points
# This ensures actual file content is archived, not just placeholders
tar --dereference -czf $tempArchive `
    frontend/dist `
    backend/src `
    backend/data/default_config.ini `
    backend/package.json `
    backend/ecosystem.config.cjs `
    frontend/package.json 2>&1 | Out-Null

# Single scp of archive (much faster than multiple scps)
scp $tempArchive root@${HostIP}:/tmp/ 2>&1 | Out-Null

Write-Host "   Uploaded" -ForegroundColor Green

# Step 5: Deploy (extract tar directly in container - single operation)
Write-Host "[5/6] Deploying..." -ForegroundColor Yellow

# Stop server to prevent 404s during deployment
ssh root@$HostIP "pct exec $ContainerId -- pm2 stop ac-server-manager" 2>&1 | Out-Null

# Push tar into container and extract in place (suppress tar warnings about extended attributes)
ssh root@$HostIP "pct push $ContainerId /tmp/$tempArchive /tmp/$tempArchive && pct exec $ContainerId -- bash -c 'cd /opt/ac-server-manager && tar -xzf /tmp/$tempArchive 2>/dev/null && chmod -R 755 frontend/dist && rm /tmp/$tempArchive' && rm /tmp/$tempArchive" 2>&1 | Out-Null

# Clean up local archive
Remove-Item $tempArchive -ErrorAction SilentlyContinue

Write-Host "   Deployed" -ForegroundColor Green

# Step 6: Restart
Write-Host "[6/6] Restarting..." -ForegroundColor Yellow
ssh root@$HostIP "pct exec $ContainerId -- pm2 restart ac-server-manager" 2>&1 | Out-Null

# Verify deployment
$assetCount = ssh root@$HostIP "pct exec $ContainerId -- ls -1 /opt/ac-server-manager/frontend/dist/assets/ 2>/dev/null | wc -l"
$pmStatus = ssh root@$HostIP "pct exec $ContainerId -- pm2 jlist" | ConvertFrom-Json
$appStatus = $pmStatus | Where-Object { $_.name -eq 'ac-server-manager' }

if ($appStatus.pm2_env.status -eq 'online') {
    Write-Host "   Restarted ($assetCount assets, PID: $($appStatus.pid))" -ForegroundColor Green
} else {
    Write-Host "   Warning: App status is $($appStatus.pm2_env.status)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Complete! http://${HostIP}:3001" -ForegroundColor Green
Write-Host ""
