# AC Server Manager - Quick Install Script
# Run this to install and start the application

Write-Host "🏎️  AC Server Manager - Quick Install" -ForegroundColor Cyan
Write-Host "=========================================`n" -ForegroundColor Cyan

# Check Node.js
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found!" -ForegroundColor Red
    Write-Host "   Please install from: https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version
    Write-Host "✅ npm found: v$npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found!" -ForegroundColor Red
    exit 1
}

Write-Host "`n📦 Installing dependencies...`n" -ForegroundColor Yellow

# Install backend dependencies
Write-Host "Installing backend dependencies..." -ForegroundColor Cyan
Push-Location backend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend installation failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location
Write-Host "✅ Backend dependencies installed" -ForegroundColor Green

# Install frontend dependencies
Write-Host "`nInstalling frontend dependencies..." -ForegroundColor Cyan
Push-Location frontend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend installation failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location
Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green

# Create .env file if it doesn't exist
if (-not (Test-Path "backend\.env")) {
    Write-Host "`n📝 Creating default .env file..." -ForegroundColor Yellow
    Copy-Item "backend\.env.example" "backend\.env"
    Write-Host "✅ Created backend\.env (will be configured via Setup Wizard)" -ForegroundColor Green
}

Write-Host "`n✨ Installation complete!" -ForegroundColor Green
Write-Host "`n🚀 Starting AC Server Manager...`n" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "Backend will start on:  http://localhost:3001" -ForegroundColor White
Write-Host "Frontend will start on: http://localhost:5173" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray

Write-Host "Opening 2 terminal windows..." -ForegroundColor Yellow
Write-Host "Press Ctrl+C in each terminal to stop the servers`n" -ForegroundColor Gray

# Start backend in new terminal
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; Write-Host '🔧 Starting Backend Server...' -ForegroundColor Cyan; npm run dev"

# Wait a moment for backend to start
Start-Sleep -Seconds 2

# Start frontend in new terminal
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; Write-Host '🎨 Starting Frontend Dev Server...' -ForegroundColor Cyan; npm run dev"

Write-Host "✅ Servers starting in separate windows..." -ForegroundColor Green
Write-Host "`n📖 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Wait for both servers to finish starting" -ForegroundColor White
Write-Host "   2. Open http://localhost:5173 in your browser" -ForegroundColor White
Write-Host "   3. Complete the Setup Wizard to configure AC paths" -ForegroundColor White
Write-Host "`n   To stop: Press Ctrl+C in each terminal window`n" -ForegroundColor Gray

# Wait a bit then try to open browser
Start-Sleep -Seconds 5
Write-Host "🌐 Opening browser..." -ForegroundColor Cyan
Start-Process "http://localhost:5173"

Write-Host "`n✨ Happy racing! 🏁`n" -ForegroundColor Green
