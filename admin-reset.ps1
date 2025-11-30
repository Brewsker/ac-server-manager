# Super Hard Reset - Run as Administrator
# Right-click -> Run with PowerShell as Administrator

Write-Host "`n================================================" -ForegroundColor Red
Write-Host "  ADMINISTRATOR RESET" -ForegroundColor Red
Write-Host "================================================`n" -ForegroundColor Red

# Check if running as admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "⚠ NOT RUNNING AS ADMINISTRATOR!" -ForegroundColor Yellow
    Write-Host "Right-click this script and select 'Run with PowerShell'" -ForegroundColor Yellow
    Write-Host "Then right-click the PowerShell icon and 'Run as Administrator'`n" -ForegroundColor Yellow
    pause
    exit
}

Write-Host "✓ Running with Administrator privileges`n" -ForegroundColor Green

# Kill everything
Write-Host "Killing all Node.js processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name "nodemon" -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "✓ Done`n" -ForegroundColor Green

# Release ports
Write-Host "Releasing ports 3001, 5173, 5174..." -ForegroundColor Yellow
@(3001, 5173, 5174) | ForEach-Object {
    $conn = Get-NetTCPConnection -LocalPort $_ -ErrorAction SilentlyContinue
    if ($conn) {
        Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}
Write-Host "✓ Done`n" -ForegroundColor Green

Start-Sleep -Seconds 1

# Verify
Write-Host "Verifying cleanup..." -ForegroundColor Yellow
$nodeCount = (Get-Process -Name "node" -ErrorAction SilentlyContinue | Measure-Object).Count
$portCount = (@(3001, 5173, 5174) | ForEach-Object { Get-NetTCPConnection -LocalPort $_ -ErrorAction SilentlyContinue } | Measure-Object).Count

if ($nodeCount -eq 0 -and $portCount -eq 0) {
    Write-Host "✓ All clean! No node processes, all ports free`n" -ForegroundColor Green
} else {
    Write-Host "⚠ Still found $nodeCount node processes and $portCount port conflicts`n" -ForegroundColor Red
}

Write-Host "================================================" -ForegroundColor Green
Write-Host "  CLEANUP COMPLETE" -ForegroundColor Green
Write-Host "================================================`n" -ForegroundColor Green

pause
