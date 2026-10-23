$ErrorActionPreference = "Stop"
$base = "http://localhost:8080"
$results = @()
$pass = "Password@123"

function Add-Result($name, $ok, $detail) {
    $script:results += [PSCustomObject]@{ Step = $name; Status = $(if ($ok) {"PASS"} else {"FAIL"}); Detail = $detail }
    Write-Output ("[{0}] {1} - {2}" -f $(if ($ok) {"PASS"} else {"FAIL"}), $name, $detail)
}

function Invoke-ApiOnly($method, $path, $bodyObj, $token) {
    $headers = @{}
    if ($token) { $headers["Authorization"] = "Bearer $token" }
    $params = @{ Uri = "$base$path"; Method = $method; Headers = $headers; TimeoutSec = 20 }
    if ($bodyObj -ne $null) { $params["ContentType"] = "application/json"; $params["Body"] = ($bodyObj | ConvertTo-Json -Depth 10) }
    try {
        $resp = Invoke-WebRequest @params -UseBasicParsing
        return $resp.StatusCode
    } catch {
        if ($_.Exception.Response) { return [int]$_.Exception.Response.StatusCode.value__ }
        return -1
    }
}

# Login helper - returns token or $null
function Login-User($email, $password) {
    try {
        $r = Invoke-RestMethod -Uri "$base/api/auth/login" -Method Post -ContentType "application/json" `
            -Body (@{ email=$email; password=$password } | ConvertTo-Json) -TimeoutSec 20
        return $r.token
    } catch { return $null }
}

# 1. Create a recruiter and student pair for cross-tenant tests
$r1Email = "sec_r1_" + (Get-Random -Maximum 9999999) + "@example.com"
Invoke-RestMethod -Uri "$base/api/auth/register" -Method Post -ContentType "application/json" -Body (@{ email=$r1Email; password=$pass; role="RECRUITER"; name="Sec R1" } | ConvertTo-Json) -TimeoutSec 20 | Out-Null
$r1Tok = Login-User $r1Email $pass
Add-Result "SEC-A1. Recruiter 1 login" ($null -ne $r1Tok) "token=$([bool]$r1Tok)"

# 2. Recruiter 2 (unrelated)
$r2Email = "sec_r2_" + (Get-Random -Maximum 9999999) + "@example.com"
Invoke-RestMethod -Uri "$base/api/auth/register" -Method Post -ContentType "application/json" -Body (@{ email=$r2Email; password=$pass; role="RECRUITER"; name="Sec R2" } | ConvertTo-Json) -TimeoutSec 20 | Out-Null
$r2Tok = Login-User $r2Email $pass
Add-Result "SEC-A2. Recruiter 2 login" ($null -ne $r2Tok) "token=$([bool]$r2Tok)"

$compId = $null; $jobId = $null
if ($r1Tok) {
    $comp = Invoke-RestMethod -Uri "$base/api/recruiters/companies" -Method Post -ContentType "application/json" `
        -Headers @{ Authorization = "Bearer $r1Tok" } -Body (@{ name=("SecCo " + (Get-Random)); industry="IT"; website="https://s.com"; location="Pune"; description="x" } | ConvertTo-Json) -TimeoutSec 20
    $compId = $comp.id

    $deadline = (Get-Date).AddDays(30).ToString("yyyy-MM-ddTHH:mm:ss")
    $job = Invoke-RestMethod -Uri "$base/api/recruiters/jobs" -Method Post -ContentType "application/json" `
        -Headers @{ Authorization = "Bearer $r1Tok" } -Body (@{ title="Sec Job"; description="d"; eligibility="UG"; requiredSkills="Java"; location="Pune"; salaryMin=100000; salaryMax=200000; employmentType="FULL_TIME"; workMode="HYBRID"; experience="0-2"; deadline=$deadline; companyId=$compId; status="ACTIVE" } | ConvertTo-Json) -TimeoutSec 20
    $jobId = $job.id
}

# 3. Recruiter 2 tries to access Recruiter 1's job -> 404 (ownership hiding)
if ($jobId -and $r2Tok) {
    $j = Invoke-ApiOnly "GET" "/api/recruiters/jobs/$jobId" $null $r2Tok
    Add-Result "SEC-B. Unrelated recruiter <-> other's job = 404" ($j -eq 404) "actual=$j (ownership hidden)"
}

# 4. Disabled-account login blocked.
# Create a user then disable it via admin (only way to disable). Use seeded admin.
$adminTok = Login-User "admin@placement.com" "admin123"
$stuEmail = "sec_dis_" + (Get-Random -Maximum 9999999) + "@example.com"
Invoke-RestMethod -Uri "$base/api/auth/register" -Method Post -ContentType "application/json" -Body (@{ email=$stuEmail; password=$pass; role="STUDENT"; name="Disable Me" } | ConvertTo-Json) -TimeoutSec 20 | Out-Null
if ($adminTok) {
    # Find the user id in admin list
    $users = Invoke-RestMethod -Uri "$base/api/admin/users" -Method Get -Headers @{ Authorization = "Bearer $adminTok" } -TimeoutSec 20
    $target = $users | Where-Object { $_.email -eq $stuEmail } | Select-Object -First 1
    if ($target) {
        # Disable via PATCH to admin users status endpoint
        $dis = Invoke-ApiOnly "PATCH" "/api/admin/users/$($target.id)/status" @{ enabled = $false } $adminTok
        if ($dis -eq 200) {
            $loginAfterDisable = Login-User $stuEmail $pass
            Add-Result "SEC-C. Disabled account login blocked" ($null -eq $loginAfterDisable) "disabled via admin API; login returns no token"
        } else {
            Add-Result "SEC-C. Disabled account login blocked" $false "disable endpoint returned $dis (could not disable - check admin API)"
        }
    } else {
        Add-Result "SEC-C. Disabled account login blocked" $false "could not find target user to disable"
    }
} else {
    Add-Result "SEC-C. Disabled account login blocked" $false "admin login unavailable"
}

# 5. Student A cannot withdraw Student B's application
$stA = "sec_sa_" + (Get-Random -Maximum 9999999) + "@example.com"
Invoke-RestMethod -Uri "$base/api/auth/register" -Method Post -ContentType "application/json" -Body (@{ email=$stA; password=$pass; role="STUDENT"; name="Sec SA" } | ConvertTo-Json) -TimeoutSec 20 | Out-Null
$stATok = Login-User $stA $pass
$stB = "sec_sb_" + (Get-Random -Maximum 9999999) + "@example.com"
Invoke-RestMethod -Uri "$base/api/auth/register" -Method Post -ContentType "application/json" -Body (@{ email=$stB; password=$pass; role="STUDENT"; name="Sec SB" } | ConvertTo-Json) -TimeoutSec 20 | Out-Null
$stBTok = Login-User $stB $pass

if ($stBTok -and $jobId) {
    $app = $null
    try {
        $app = Invoke-RestMethod -Uri "$base/api/applications/$jobId" -Method Post -Headers @{ Authorization = "Bearer $stBTok" } -TimeoutSec 20
    } catch { $app = $null }
    if ($app) {
        $appId = $app.id
        # Student A tries to withdraw B's application -> should be 403/404
        $w = Invoke-ApiOnly "DELETE" "/api/applications/$appId" $null $stATok
        Add-Result "SEC-D. Student A withdraw Student B's app = 403/404" (($w -eq 403) -or ($w -eq 404)) "actual=$w"
    } else {
        Add-Result "SEC-D. Student A withdraw Student B's app" $false "could not create B's application"
    }
} else {
    Add-Result "SEC-D. Student A withdraw Student B's app" $false "missing student B token or job id"
}

Write-Output ""
Write-Output "=== ADDITIONAL SECURITY LIVE SUMMARY ==="
$passC = ($results | Where-Object { $_.Status -eq "PASS" }).Count
$failC = ($results | Where-Object { $_.Status -eq "FAIL" }).Count
Write-Output "PASS: $passC FAIL: $failC TOTAL: $($results.Count)"
$results | Format-Table -AutoSize
