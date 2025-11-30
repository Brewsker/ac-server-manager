# AC Server Manager - Startup Script
# Starts backend and frontend development servers

param(
    [switch]$CleanStart
)

$ErrorActionPreference = "Stop"

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  AC Server Manager - Startup" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Clean up if requested
if ($CleanStart) {
    Write-Host "Running cleanup first..." -ForegroundColor Yellow
    & "$PSScriptRoot\cleanup.ps1"
    Write-Host ""
}

# Check if ports are available
Write-Host "Checking port availability..." -ForegroundColor Yellow
$port3001 = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
$port5174 = Get-NetTCPConnection -LocalPort 5174 -ErrorAction SilentlyContinue

if ($port3001 -or $port5174) {
    Write-Host "Error: Required ports are in use!" -ForegroundColor Red
    if ($port3001) { Write-Host "  - Port 3001 (Backend) is in use" -ForegroundColor Red }
    if ($port5174) { Write-Host "  - Port 5174 (Frontend) is in use" -ForegroundColor Red }
    Write-Host ""
    Write-Host "Run with -CleanStart parameter to clean up first:" -ForegroundColor Yellow
    Write-Host "  .\start.ps1 -CleanStart" -ForegroundColor Cyan
    exit 1
}

Write-Host "Ports are available!" -ForegroundColor Green
Write-Host ""

# Start Backend
Write-Host "Starting backend server..." -ForegroundColor Yellow
$backendPath = Join-Path $PSScriptRoot "backend"
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; npm run dev" -WindowStyle Normal

Write-Host "Waiting for backend to start..." -ForegroundColor Gray
Start-Sleep -Seconds 5

# Check if backend is running
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3001/health" -ErrorAction Stop
    Write-Host "Backend is running! " -ForegroundColor Green -NoNewline
    Write-Host "($($health.status))" -ForegroundColor Gray
} catch {
    Write-Host "Warning: Backend may not have started properly" -ForegroundColor Yellow
    Write-Host "Check the backend terminal window for errors" -ForegroundColor Yellow
}

Write-Host ""

# Start Frontend
Write-Host "Starting frontend server..." -ForegroundColor Yellow
$frontendPath = Join-Path $PSScriptRoot "frontend"
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Servers Starting!" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend:  " -NoNewline -ForegroundColor Yellow
Write-Host "http://localhost:3001" -ForegroundColor Cyan
Write-Host "Frontend: " -NoNewline -ForegroundColor Yellow
Write-Host "http://localhost:5174" -ForegroundColor Cyan
Write-Host ""
Write-Host "Check the new terminal windows for server output" -ForegroundColor Gray
Write-Host "Press Ctrl+C in those windows to stop the servers" -ForegroundColor Gray
Write-Host ""
