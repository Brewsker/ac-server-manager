param(
    [string]$HostIP = "192.168.1.199",
    [int]$ContainerId = 999,
    [string]$BackupName = "",
    [switch]$ListOnly
)

$ErrorActionPreference = "Stop"

# Get backups
$backups = ssh root@$HostIP "pct exec $ContainerId -- ls -1t /opt/ac-server-manager/backups 2>/dev/null"
if ([string]::IsNullOrWhiteSpace($backups)) {
    Write-Host "No backups found" -ForegroundColor Red
    exit 1
}

$backupList = $backups -split "`n" | Where-Object { $_ -match "backup-" }

if ($ListOnly) {
    Write-Host ""
    Write-Host "Available backups:" -ForegroundColor Yellow
    foreach ($b in $backupList) {
        Write-Host "  $b" -ForegroundColor Cyan
    }
    Write-Host ""
    exit 0
}

# Select backup
if ([string]::IsNullOrWhiteSpace($BackupName)) {
    $BackupName = $backupList[0]
    Write-Host "Using latest: $BackupName" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Rollback to: $BackupName" -ForegroundColor Cyan
$confirm = Read-Host "Continue? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "Cancelled" -ForegroundColor Gray
    exit 0
}

Write-Host ""
Write-Host "[1/2] Restoring..." -ForegroundColor Yellow
ssh root@$HostIP "pct exec $ContainerId -- rm -rf /opt/ac-server-manager/frontend/assets/* /opt/ac-server-manager/frontend/index.html" | Out-Null
ssh root@$HostIP "pct exec $ContainerId -- cp -r /opt/ac-server-manager/backups/$BackupName/* /opt/ac-server-manager/frontend/" | Out-Null
Write-Host "   Restored" -ForegroundColor Green

Write-Host "[2/2] Restarting..." -ForegroundColor Yellow
ssh root@$HostIP "pct exec $ContainerId -- pm2 restart ac-server-manager" 2>&1 | Out-Null
Write-Host "   Restarted" -ForegroundColor Green

Write-Host ""
Write-Host "Rollback complete!" -ForegroundColor Green
Write-Host ""
