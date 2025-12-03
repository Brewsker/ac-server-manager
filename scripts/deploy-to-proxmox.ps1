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
    npm run build 2>&1 | Out-Null
    Pop-Location
    Write-Host "   Built" -ForegroundColor Green
} else {
    Write-Host "[1/6] Skipping build" -ForegroundColor Gray
}

# Step 2: Backup
if (-not $SkipBackup) {
    Write-Host "[2/6] Creating backup..." -ForegroundColor Yellow
    $backupName = "backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    ssh root@$HostIP "pct exec $ContainerId -- mkdir -p /opt/ac-server-manager/backups" 2>&1 | Out-Null
    $hasFiles = ssh root@$HostIP "pct exec $ContainerId -- test -d /opt/ac-server-manager/frontend/assets; echo `$?"
    if ($hasFiles -eq "0") {
        ssh root@$HostIP "pct exec $ContainerId -- cp -r /opt/ac-server-manager/frontend /opt/ac-server-manager/backups/$backupName" 2>&1 | Out-Null
        Write-Host "   Backup: $backupName" -ForegroundColor Green
    }
} else {
    Write-Host "[2/6] Skipping backup" -ForegroundColor Gray
}

# Step 3: Clean
Write-Host "[3/6] Cleaning old files..." -ForegroundColor Yellow
ssh root@$HostIP "pct exec $ContainerId -- rm -rf /opt/ac-server-manager/frontend/assets/* /opt/ac-server-manager/frontend/index.html 2>/dev/null; exit 0" | Out-Null
Write-Host "   Cleaned" -ForegroundColor Green

# Step 4: Upload
Write-Host "[4/6] Uploading..." -ForegroundColor Yellow
ssh root@$HostIP "rm -rf /tmp/ac-deploy; mkdir -p /tmp/ac-deploy" | Out-Null
scp -r frontend/dist/* root@${HostIP}:/tmp/ac-deploy/ 2>&1 | Out-Null
scp backend/package.json root@${HostIP}:/tmp/ac-deploy/backend-package.json 2>&1 | Out-Null
scp frontend/package.json root@${HostIP}:/tmp/ac-deploy/frontend-package.json 2>&1 | Out-Null
Write-Host "   Uploaded" -ForegroundColor Green

# Step 5: Deploy
Write-Host "[5/6] Deploying..." -ForegroundColor Yellow
ssh root@$HostIP "pct exec $ContainerId -- mkdir -p /opt/ac-server-manager/frontend/assets" 2>&1 | Out-Null
ssh root@$HostIP "cd /tmp/ac-deploy && for f in assets/*; do pct push $ContainerId `"`$f`" /opt/ac-server-manager/frontend/`"`$f`"; done && pct push $ContainerId index.html /opt/ac-server-manager/frontend/index.html && pct push $ContainerId backend-package.json /opt/ac-server-manager/backend/package.json && pct push $ContainerId frontend-package.json /opt/ac-server-manager/frontend/package.json && rm -rf /tmp/ac-deploy" 2>&1 | Out-Null
Write-Host "   Deployed" -ForegroundColor Green

# Step 6: Restart
Write-Host "[6/6] Restarting..." -ForegroundColor Yellow
$assetCount = ssh root@$HostIP "pct exec $ContainerId -- ls -1 /opt/ac-server-manager/frontend/assets/ 2>/dev/null | wc -l"
ssh root@$HostIP "pct exec $ContainerId -- pm2 restart ac-server-manager" 2>&1 | Out-Null
Write-Host "   Restarted ($assetCount assets)" -ForegroundColor Green

Write-Host ""
Write-Host "Complete! http://${HostIP}:3001" -ForegroundColor Green
Write-Host ""
