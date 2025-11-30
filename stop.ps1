# AC Server Manager - Stop Script
# Gracefully stops all AC Server Manager processes

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  AC Server Manager - Stop" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Stopping development servers..." -ForegroundColor Yellow
Write-Host ""

# Find and stop processes using our ports
$ports = @(
    @{Port=3001; Name="Backend API"},
    @{Port=5174; Name="Frontend Dev Server"}
)

foreach ($portInfo in $ports) {
    $port = $portInfo.Port
    $name = $portInfo.Name
    
    $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connection) {
        $processId = $connection.OwningProcess | Select-Object -First 1
        Write-Host "$name (Port $port):" -ForegroundColor Yellow -NoNewline
        
        try {
            Stop-Process -Id $processId -Force -ErrorAction Stop
            Write-Host " Stopped" -ForegroundColor Green
        } catch {
            Write-Host " Failed (PID: $processId)" -ForegroundColor Red
        }
    } else {
        Write-Host "$name (Port $port):" -ForegroundColor Gray -NoNewline
        Write-Host " Not running" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Servers stopped!" -ForegroundColor Cyan
Write-Host ""
