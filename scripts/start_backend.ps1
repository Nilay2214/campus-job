$ErrorActionPreference = "Stop"
$rootDir = "c:/Users/Nilay_bhamare/OneDrive/Desktop/Resume Project"
$backendDir = "$rootDir/backend"
Set-Location $backendDir

# Load .env into process env (no printing of secrets)
$envMap = @{}
Get-Content "$rootDir/.env" | ForEach-Object {
    if ($_ -match '^\s*([^#=]+)=(.*)$') { $envMap[$matches[1].Trim()] = $matches[2].Trim() }
}
foreach ($k in $envMap.Keys) { [Environment]::SetEnvironmentVariable($k, $envMap[$k], "Process") }

# Also set dev profile
[Environment]::SetEnvironmentVariable("SPRING_PROFILES_ACTIVE", "dev", "Process")

$jar = "$backendDir/target/placement-management-1.0.0.jar"
$outLog = "$backendDir/live_run.log"
$errLog = "$backendDir/live_run_err.log"

Write-Output "Starting backend (dev profile) on :8080 ..."
$p = Start-Process -FilePath "java" -ArgumentList "-jar `"$jar`" --server.port=8080" `
    -WorkingDirectory $backendDir `
    -RedirectStandardOutput $outLog -RedirectStandardError $errLog -PassThru

Write-Output "Started PID=$($p.Id)"


