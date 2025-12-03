#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Deploy AC Server Manager to Proxmox LXC container
.DESCRIPTION
    Builds the frontend, deploys all files to the Proxmox container, and restarts PM2
.PARAMETER HostIP
    Proxmox host IP address (default: 192.168.1.199)
.PARAMETER ContainerId
    LXC container ID (default: 999)
.PARAMETER SkipBuild
    Skip frontend build step
.EXAMPLE
    .\scripts\deploy-to-proxmox.ps1
.EXAMPLE
    .\scripts\deploy-to-proxmox.ps1 -SkipBuild
#>

param(
    [string]$HostIP = "192.168.1.199",
    [int]$ContainerId = 999,
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

Write-Host "=== AC Server Manager Deployment ===" -ForegroundColor Cyan
Write-Host "Host: $HostIP" -ForegroundColor Gray
Write-Host "Container: $ContainerId" -ForegroundColor Gray
Write-Host ""

# Step 1: Build frontend
if (-not $SkipBuild) {
    Write-Host "[1/5] Building frontend..." -ForegroundColor Yellow
    Push-Location frontend
    try {
        npm run build
        if ($LASTEXITCODE -ne 0) {
            throw "Frontend build failed"
        }
        Write-Host "✓ Frontend built successfully" -ForegroundColor Green
    } finally {
        Pop-Location
    }
} else {
    Write-Host "[1/5] Skipping frontend build" -ForegroundColor Gray
}

# Step 2: Deploy frontend files to host /tmp
Write-Host "[2/5] Uploading frontend files to host..." -ForegroundColor Yellow

# Create temp directory on host
ssh root@$HostIP "rm -rf /tmp/ac-frontend-deploy"
ssh root@$HostIP "mkdir -p /tmp/ac-frontend-deploy/assets"

# Upload all files
scp frontend/dist/index.html root@${HostIP}:/tmp/ac-frontend-deploy/
scp frontend/dist/vite.svg root@${HostIP}:/tmp/ac-frontend-deploy/ 2>$null
scp frontend/dist/assets/* root@${HostIP}:/tmp/ac-frontend-deploy/assets/

Write-Host "✓ Files uploaded to host" -ForegroundColor Green

# Step 3: Push files to container
Write-Host "[3/5] Deploying to container $ContainerId..." -ForegroundColor Yellow

ssh root@$HostIP @"
    pct exec $ContainerId -- rm -rf /opt/ac-server-manager/frontend/assets/*
    pct exec $ContainerId -- mkdir -p /opt/ac-server-manager/frontend/assets
    
    pct push $ContainerId /tmp/ac-frontend-deploy/index.html /opt/ac-server-manager/frontend/index.html
    
    for file in /tmp/ac-frontend-deploy/assets/*; do
        if [ -f `$file ]; then
            pct push $ContainerId `$file /opt/ac-server-manager/frontend/assets/`$(basename `$file)
        fi
    done
    
    if [ -f /tmp/ac-frontend-deploy/vite.svg ]; then
        pct push $ContainerId /tmp/ac-frontend-deploy/vite.svg /opt/ac-server-manager/frontend/vite.svg
    fi
    
    rm -rf /tmp/ac-frontend-deploy
"@

Write-Host "✓ Files deployed to container" -ForegroundColor Green

# Step 4: Verify deployment
Write-Host "[4/5] Verifying deployment..." -ForegroundColor Yellow

$assetCount = ssh root@$HostIP "pct exec $ContainerId -- ls -1 /opt/ac-server-manager/frontend/assets/ | wc -l"
$indexCheck = ssh root@$HostIP "pct exec $ContainerId -- test -f /opt/ac-server-manager/frontend/index.html; echo `$?"

if ($indexCheck -ne "0") {
    throw "index.html not found in container"
}

Write-Host "✓ Verified: index.html + $assetCount asset files" -ForegroundColor Green

# Step 5: Restart PM2
Write-Host "[5/5] Restarting PM2..." -ForegroundColor Yellow

ssh root@$HostIP "pct exec $ContainerId -- pm2 restart ac-server-manager"

Write-Host "✓ PM2 restarted" -ForegroundColor Green
Write-Host ""
Write-Host "=== Deployment Complete ===" -ForegroundColor Green
Write-Host "The application should be available at http://${HostIP}:3001" -ForegroundColor Cyan
Write-Host "Refresh your browser (Ctrl+F5) to see changes" -ForegroundColor Gray
