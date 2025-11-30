# AC Server Manager - Cleanup Script
# Stops all node processes and cleans up ports

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  AC Server Manager - Cleanup" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Kill all node processes
Write-Host "Stopping all Node.js processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    $count = ($nodeProcesses | Measure-Object).Count
    Write-Host "Found $count node process(es)" -ForegroundColor Gray
    
    foreach ($proc in $nodeProcesses) {
        try {
            Write-Host "  - Stopping PID $($proc.Id)..." -ForegroundColor Gray
            Stop-Process -Id $proc.Id -Force -ErrorAction Stop
        } catch {
            Write-Host "    Could not stop PID $($proc.Id) - may need admin rights" -ForegroundColor Red
        }
    }
    
    Start-Sleep -Seconds 2
    
    # Check if any remain
    $remaining = Get-Process -Name node -ErrorAction SilentlyContinue
    if ($remaining) {
        Write-Host ""
        Write-Host "Warning: Some node processes could not be stopped" -ForegroundColor Yellow
        Write-Host "Try running this script as Administrator or close VS Code terminals manually" -ForegroundColor Yellow
    } else {
        Write-Host ""
        Write-Host "All node processes stopped successfully!" -ForegroundColor Green
    }
} else {
    Write-Host "No node processes found" -ForegroundColor Green
}

# Check for processes using our ports
Write-Host ""
Write-Host "Checking ports..." -ForegroundColor Yellow

$ports = @(3001, 5174, 9600, 8081)
$portsInUse = @()

foreach ($port in $ports) {
    $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connection) {
        $portsInUse += $port
        $processId = $connection.OwningProcess | Select-Object -First 1
        Write-Host "  Port $port in use by PID $processId" -ForegroundColor Gray
        
        try {
            Stop-Process -Id $processId -Force -ErrorAction Stop
            Write-Host "    Stopped process using port $port" -ForegroundColor Green
        } catch {
            Write-Host "    Could not stop process - may need admin rights" -ForegroundColor Red
        }
    }
}

if ($portsInUse.Count -eq 0) {
    Write-Host "All required ports are free (3001, 5174, 9600, 8081)" -ForegroundColor Green
}

Write-Host ""
Write-Host "Cleanup complete!" -ForegroundColor Cyan
Write-Host "You can now run: .\start.ps1" -ForegroundColor Cyan
Write-Host ""
