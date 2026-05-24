Write-Host "Starting AMD Station Setup..." -ForegroundColor Cyan

# Check if node_modules exists
if (-not (Test-Path ".\amd-station\node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    cd amd-station
    npm install
    cd ..
}

# Start the application
Write-Host "Launching AMD Station..." -ForegroundColor Green
cd amd-station
npm run dev
