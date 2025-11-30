# AC Server Manager - Quick Start Script
# Run this to start both backend and frontend servers

Write-Host "🏁 Starting AC Server Manager..." -ForegroundColor Cyan
Write-Host ""

# Check if backend is already running
$backendRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    $backendRunning = $true
    Write-Host "✅ Backend already running on port 3001" -ForegroundColor Green
} catch {
    Write-Host "⏳ Backend not running yet" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📝 IMPORTANT: Configure your AC paths first!" -ForegroundColor Yellow
Write-Host "   Edit: backend\.env" -ForegroundColor Yellow
Write-Host ""
Write-Host "🚀 To start the servers:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Terminal 1 (Backend):" -ForegroundColor White
Write-Host "   cd backend; npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "   Terminal 2 (Frontend):" -ForegroundColor White
Write-Host "   cd frontend; npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "🌐 Access the app:" -ForegroundColor Cyan
Write-Host "   Frontend:  http://localhost:5173" -ForegroundColor White
Write-Host "   Backend:   http://localhost:3001" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "   START_HERE.md - Quick start guide" -ForegroundColor White
Write-Host "   docs/GETTING_STARTED.md - Detailed guide" -ForegroundColor White
Write-Host "   docs/AGENT_GUIDE.md - AI assistant integration" -ForegroundColor White
Write-Host ""

if (-not $backendRunning) {
    Write-Host "Starting backend server..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\Users\brook\OneDrive\Documents\Claude Projects\AC Server Manager\backend'; npm run dev"
    Start-Sleep -Seconds 3
}

Write-Host "Starting frontend server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\Users\brook\OneDrive\Documents\Claude Projects\AC Server Manager\frontend'; npm run dev"

Write-Host ""
Write-Host "✨ Servers starting in new windows!" -ForegroundColor Green
Write-Host "   Wait a few seconds, then open: http://localhost:5173" -ForegroundColor White
Write-Host ""
