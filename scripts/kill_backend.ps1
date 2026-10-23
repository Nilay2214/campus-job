$conn = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue
if ($conn) {
    $conn | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
    Write-Output "Killed backend listener on 8080"
} else {
    Write-Output "Port 8080 already free"
}
Start-Sleep -Seconds 2
