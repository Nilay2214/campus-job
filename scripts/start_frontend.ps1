$ErrorActionPreference = "Stop"
$front = "c:/Users/Nilay_bhamare/OneDrive/Desktop/Resume Project/frontend"
Set-Location $front
if (Test-Path "$front/node_modules") {
    Write-Output "node_modules PRESENT"
} else {
    Write-Output "node_modules MISSING - installing..."
    & npm install 2>&1 | Out-Null
    Write-Output "npm install exit=$LASTEXITCODE"
}
# Start Vite dev server in background on port 3000
$log = "$front/vite_e2e.log"
Start-Process -FilePath "npm.cmd" -ArgumentList "run","dev" -WorkingDirectory $front -RedirectStandardOutput $log -RedirectStandardError "$front/vite_e2e.err.log" -WindowStyle Hidden
Write-Output "Vite dev server starting on :3000 (log: $log)"
