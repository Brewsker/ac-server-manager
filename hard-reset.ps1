# Hard Reset Script - Kills everything and starts fresh
# Run this when things get stuck

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "  AC Server Manager - HARD RESET" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

# Step 1: Kill all node processes
Write-Host "[1/6] Killing all Node.js processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $nodeProcesses | ForEach-Object {
        try {
            Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
            Write-Host "  ✓ Killed node process (PID: $($_.Id))" -ForegroundColor Green
        } catch {
            Write-Host "  ⚠ Could not kill PID $($_.Id) - may need admin rights" -ForegroundColor Red
        }
    }
} else {
    Write-Host "  ✓ No node processes found" -ForegroundColor Green
}

Start-Sleep -Milliseconds 500

# Step 2: Kill all nodemon processes
Write-Host "`n[2/6] Killing all nodemon processes..." -ForegroundColor Yellow
$nodemonProcesses = Get-Process -Name "nodemon" -ErrorAction SilentlyContinue
if ($nodemonProcesses) {
    $nodemonProcesses | ForEach-Object {
        try {
            Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
            Write-Host "  ✓ Killed nodemon process (PID: $($_.Id))" -ForegroundColor Green
        } catch {
            Write-Host "  ⚠ Could not kill PID $($_.Id)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "  ✓ No nodemon processes found" -ForegroundColor Green
}

Start-Sleep -Milliseconds 500

# Step 3: Release ports 3001 and 5173/5174
Write-Host "`n[3/6] Releasing ports..." -ForegroundColor Yellow
$ports = @(3001, 5173, 5174)
foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connections) {
        $connections | ForEach-Object {
            $pid = $_.OwningProcess
            if ($pid -gt 0) {
                try {
                    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                    Write-Host "  ✓ Released port $port (killed PID: $pid)" -ForegroundColor Green
                } catch {
                    Write-Host "  ⚠ Could not release port $port (PID: $pid)" -ForegroundColor Red
                }
            }
        }
    } else {
        Write-Host "  ✓ Port $port is free" -ForegroundColor Green
    }
}

Start-Sleep -Milliseconds 500

# Step 4: Close all VS Code terminals
Write-Host "`n[4/6] Closing all VS Code terminals..." -ForegroundColor Yellow
try {
    # This will be called via VS Code command
    Write-Host "  → Please run this from VS Code using the task for full terminal cleanup" -ForegroundColor Cyan
    Write-Host "  ℹ Manual terminal cleanup: Close all terminal tabs in VS Code" -ForegroundColor Gray
} catch {
    Write-Host "  ⚠ Could not close terminals automatically" -ForegroundColor Red
}

# Step 5: Verify ports are free
Write-Host "`n[5/6] Verifying ports are free..." -ForegroundColor Yellow
$allClear = $true
foreach ($port in $ports) {
    $check = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($check) {
        Write-Host "  ✗ Port $port is still occupied!" -ForegroundColor Red
        $allClear = $false
    } else {
        Write-Host "  ✓ Port $port is free" -ForegroundColor Green
    }
}

Start-Sleep -Milliseconds 500

# Step 6: Start services
if ($allClear) {
    Write-Host "`n[6/6] Starting services..." -ForegroundColor Yellow
    
    # Start backend
    Write-Host "`n  Starting backend on port 3001..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm run dev" -WindowStyle Normal
    Start-Sleep -Seconds 3
    
    # Verify backend
    try {
        $health = Invoke-RestMethod "http://localhost:3001/health" -TimeoutSec 3 -ErrorAction Stop
        Write-Host "  ✓ Backend is running!" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠ Backend may still be starting..." -ForegroundColor Yellow
    }
    
    # Start frontend
    Write-Host "`n  Starting frontend..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev" -WindowStyle Normal
    Start-Sleep -Seconds 3
    
    Write-Host "`n================================================" -ForegroundColor Green
    Write-Host "  RESET COMPLETE!" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Green
    Write-Host "`n  Backend: http://localhost:3001" -ForegroundColor Cyan
    Write-Host "  Frontend: http://localhost:5173 (or 5174)" -ForegroundColor Cyan
    Write-Host "`n  Check the new PowerShell windows for service logs" -ForegroundColor Gray
    Write-Host "`n"
} else {
    Write-Host "`n================================================" -ForegroundColor Red
    Write-Host "  ⚠ PORTS STILL OCCUPIED!" -ForegroundColor Red
    Write-Host "================================================" -ForegroundColor Red
    Write-Host "`n  Some ports could not be freed." -ForegroundColor Yellow
    Write-Host "  You may need to:" -ForegroundColor Yellow
    Write-Host "  1. Run this script as Administrator" -ForegroundColor Yellow
    Write-Host "  2. Manually identify and close the offending processes" -ForegroundColor Yellow
    Write-Host "  3. Restart your computer if all else fails`n" -ForegroundColor Yellow
}
